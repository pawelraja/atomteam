// Renders the site in every phase with incomplete (real) and complete (fixture) data, in PL and
// EN, screenshots each, and checks that nothing claims unconfirmed facts.
//   node scripts/scenarios.mjs [--widths 360,1280] [--only preseason-incomplete]
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const widths = arg('widths', '360,1280');
const only = arg('only', null);

const scenarios = [
  { name: 'preseason-incomplete', today: '2026-11-15', site: { phase: 'preseason' } },
  { name: 'racing-incomplete', today: '2027-04-10', site: { phase: 'racing' } },
  { name: 'offseason-incomplete', today: '2027-11-15', site: { phase: 'offseason' } },
  { name: 'preseason-complete', today: '2026-12-01', site: { phase: 'preseason' }, data: 'tests/fixtures/complete' },
  { name: 'racing-complete', today: '2027-04-10', site: { phase: 'racing' }, data: 'tests/fixtures/complete' },
  { name: 'offseason-complete', today: '2027-11-15', site: { phase: 'offseason' }, data: 'tests/fixtures/complete' },
].filter((s) => !only || s.name === only);

// Strings that must NOT appear while the matching fact is unconfirmed.
const forbiddenWhenIncomplete = {
  pl: ['Nasi partnerzy 2027.<', 'zawodniczek</dd>', 'Najbliższy</p>', 'Nowa w 2027'],
  en: ['Our 2027 partners.<', 'riders</dd>', 'Next race</p>', 'New for 2027'],
};

let failures = 0;
for (const s of scenarios) {
  const outDir = `dist-scenarios/${s.name}`;
  const env = {
    ...process.env,
    MADW_TODAY: s.today,
    MADW_SITE: JSON.stringify(s.site),
    ...(s.data ? { MADW_DATA_DIR: s.data } : {}),
  };
  console.log(`\n▶ ${s.name} (today ${s.today})`);
  execSync(`npx astro build --outDir ${outDir}`, { env, stdio: ['ignore', 'ignore', 'inherit'] });

  if (!s.data) {
    for (const [lang, file] of [['pl', 'index.html'], ['en', 'en/index.html']]) {
      const html = readFileSync(`${outDir}/${file}`, 'utf8');
      for (const bad of forbiddenWhenIncomplete[lang]) {
        if (html.includes(bad)) {
          failures++;
          console.error(`  ✗ ${lang}: page claims an unconfirmed fact: "${bad}"`);
        }
      }
    }
  }
  for (const [lang, path] of [['pl', '/'], ['en', 'en/']]) {
    try {
      execSync(
        `node scripts/screenshots.mjs --dir ${outDir} --out screenshots/scenarios --name ${s.name}-${lang} --widths ${widths} --full --path ${path}`,
        { stdio: 'inherit' },
      );
    } catch {
      failures++;
    }
  }
}
console.log(failures ? `\n${failures} problem(s) found` : '\nAll scenarios rendered without problems.');
process.exit(failures ? 1 : 0);
