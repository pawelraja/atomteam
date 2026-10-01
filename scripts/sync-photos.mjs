// Copies the team's photos and logos from the shared Google Drive folder into the site, right
// before a build. Drive is the single place photos are managed; nothing is hotlinked.
//
//   npm run sync-photos
//
// Environment (set in Vercel → Settings → Environment Variables, or in a local .env):
//   GOOGLE_SERVICE_ACCOUNT_JSON  the service account key — the JSON itself, or the JSON base64-encoded
//   DRIVE_FOLDER_ID              id of the "MADW Website" folder (the part after /folders/ in its URL)
// Without them the script prints a note and exits, so local builds still work.
//
// Expected folders inside "MADW Website" (names are case-insensitive):
//   hero/  photo-story/  highlights/  riders/  partners/  brand/  media/  media-files/
// media/ holds the press-library originals (at least 3000 px on the long side); media-files/
// holds the downloads listed in media.json (logo ZIP, team information PDF, …).
// File names follow src/assets/README.md. Case, spaces and Polish letters don't matter:
// "Eliza Rabażyńska.JPG" is saved as riders/eliza-rabazynska.jpg.
import { createHash, createSign } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

export const FOLDERS = {
  hero: { dir: 'src/assets/photos', kinds: ['image'] },
  'photo-story': { dir: 'src/assets/photos', kinds: ['image'] },
  highlights: { dir: 'src/assets/photos', kinds: ['image'] },
  riders: { dir: 'src/assets/riders', kinds: ['image'] },
  partners: { dir: 'public/partners', kinds: ['logo', 'pdf'] },
  brand: { dir: 'public/brand', kinds: ['logo'] },
  media: { dir: 'src/assets/media', kinds: ['image'] },
  'media-files': { dir: 'public/media', kinds: ['download'] },
};
const EXT = {
  image: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
  logo: ['.svg', '.png', '.webp'],
  pdf: ['.pdf'],
  download: ['.pdf', '.zip'],
};
const MAX_BYTES = 40 * 1024 * 1024;

export function slugStem(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Every file name the site uses, per Drive folder, read from the data files. */
export function expectedSlots(read = (p) => JSON.parse(readFileSync(p, 'utf8'))) {
  const highlights = readdirSafe('src/data')
    .filter((f) => /^highlights-\d{4}\.json$/.test(f))
    .flatMap((f) => read(`src/data/${f}`).map((h) => h.photo));
  return {
    hero: ['hero.jpg', 'hero-mobile.jpg'],
    'photo-story': read('src/data/gallery.json').map((g) => g.photo),
    highlights,
    riders: [...read('src/data/riders.json'), ...read('src/data/staff.json')].map((p) => p.photo),
    partners: read('src/data/partners.json').map((p) => p.logo),
    brand: ['logo.svg'],
    media: read('src/data/media.json').photos.map((p) => p.file),
    'media-files': read('src/data/media.json').files.flatMap((f) => (typeof f.file === 'string' ? [f.file] : [f.file.pl, f.file.en])),
  };
}

function readdirSafe(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

/**
 * Decides where a Drive file goes. Returns { target, warning } — target is the local file name
 * (slot stem + the Drive file's own extension) or null when the file is skipped.
 */
export function planFile(folder, driveName, slots) {
  const ext = extname(driveName).toLowerCase();
  const allowed = FOLDERS[folder].kinds.flatMap((k) => EXT[k]);
  if (!allowed.includes(ext)) return { target: null, warning: `${folder}/${driveName}: file type ${ext || '(none)'} is not used here — skipped` };
  const stem = slugStem(driveName);
  if (folder === 'partners' && ext === '.pdf') return { target: `${stem}.pdf`, warning: null };
  const slot = slots.find((s) => slugStem(s) === stem);
  if (!slot) return { target: `${stem}${ext}`, warning: `${folder}/${driveName}: no slot on the site uses this name (see src/assets/README.md) — copied, but not shown` };
  if (folder === 'partners' || folder === 'brand' || folder === 'media-files') {
    // Logos are referenced by their exact file name, extension included.
    if (extname(slot).toLowerCase() !== ext) {
      return { target: null, warning: `${folder}/${driveName}: the site expects "${slot}" — upload that format or change the file name in the data file` };
    }
    return { target: slot, warning: null };
  }
  return { target: `${slugStem(slot)}${ext}`, warning: null };
}

/* ---------- Google Drive (service account, no extra dependencies) ---------- */

function credentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const key = JSON.parse(json);
  if (!key.client_email || !key.private_key) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not a service account key (client_email / private_key missing)');
  return key;
}

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed (${res.status}): ${await res.text()}`);
  return (await res.json()).access_token;
}

async function listChildren(token, folderId) {
  const files = [];
  let pageToken;
  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.search = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, md5Checksum, size)',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      ...(pageToken ? { pageToken } : {}),
    }).toString();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Drive listing failed (${res.status}): ${await res.text()}`);
    const body = await res.json();
    files.push(...body.files);
    pageToken = body.nextPageToken;
  } while (pageToken);
  return files;
}

async function download(token, id) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

const md5 = (buf) => createHash('md5').update(buf).digest('hex');

async function main() {
  const key = credentials();
  const rootId = process.env.DRIVE_FOLDER_ID?.trim();
  if (!key || !rootId) {
    console.log('[sync-photos] GOOGLE_SERVICE_ACCOUNT_JSON / DRIVE_FOLDER_ID not set — skipping Drive sync (placeholders stay where photos are missing).');
    return;
  }
  const token = await accessToken(key);
  const slots = expectedSlots();
  const children = await listChildren(token, rootId);
  const folders = children.filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
  let copied = 0;
  let unchanged = 0;
  const warnings = [];

  for (const [name, { dir }] of Object.entries(FOLDERS)) {
    const folder = folders.find((f) => f.name.trim().toLowerCase() === name);
    if (!folder) {
      warnings.push(`folder "${name}/" not found in the Drive folder — nothing synced for it`);
      continue;
    }
    mkdirSync(dir, { recursive: true });
    for (const file of await listChildren(token, folder.id)) {
      if (file.mimeType.startsWith('application/vnd.google-apps.')) continue; // Google Docs, subfolders
      if (Number(file.size) > MAX_BYTES) {
        warnings.push(`${name}/${file.name}: larger than 40 MB — skipped; export a smaller JPG`);
        continue;
      }
      const { target, warning } = planFile(name, file.name, slots[name]);
      if (warning) warnings.push(warning);
      if (!target) continue;
      const local = join(dir, target);
      if (existsSync(local) && file.md5Checksum && md5(readFileSync(local)) === file.md5Checksum) {
        unchanged++;
        continue;
      }
      writeFileSync(local, await download(token, file.id));
      copied++;
    }
  }

  const missing = Object.entries(slots).flatMap(([folder, names]) =>
    names.filter((n) => {
      const dir = FOLDERS[folder].dir;
      const stem = slugStem(n);
      return !readdirSafe(dir).some((f) => slugStem(f) === stem);
    }).map((n) => `${folder}/${n}`),
  );
  console.log(`[sync-photos] ${copied} file(s) copied, ${unchanged} unchanged, ${missing.length} slot(s) still waiting for a photo.`);
  for (const w of warnings) console.warn(`[sync-photos] ⚠ ${w}`);
}

// Run only when called as a script (the tests import the helpers above).
if (process.argv[1]?.endsWith('sync-photos.mjs')) {
  main().catch((err) => {
    console.error(`[sync-photos] ✗ ${err.message}`);
    process.exit(1);
  });
}
