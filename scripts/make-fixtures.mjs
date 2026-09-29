// Builds tests/fixtures/complete/: a FAKE "everything confirmed" data set used only to preview
// and screenshot the site as it will look mid-2027. Never copy these files into src/data.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const out = 'tests/fixtures/complete';
mkdirSync(`${out}/calendar`, { recursive: true });
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const lines = (arr) => '[\n' + arr.map((o) => '  ' + JSON.stringify(o)).join(',\n') + '\n]\n';
const shift = (iso, days) => new Date(Date.parse(iso + 'T00:00:00Z') + days * 864e5).toISOString().slice(0, 10);

// 2027: the 2026 races one year on (364 days keeps the weekday). A few stay TBC, one is cancelled.
const y2026 = read('src/data/calendar/2026.json');
const y2027 = y2026
  .filter((e) => e.type !== 'training')
  .map((e, i) => {
    const { start, end, verify, ...rest } = e;
    if (i % 11 === 5) return { month: Number(start.slice(5, 7)), ...rest, status: 'tbc' };
    const moved = { ...rest, start: shift(start, 364), end: shift(end, 364), status: i === 8 ? 'cancelled' : 'confirmed' };
    if (!moved.start.startsWith('2027')) return { ...rest, month: 1, status: 'tbc' };
    return moved;
  });
y2027.push({ id: 'training-camp-cro-2027', start: '2027-02-06', end: '2027-02-21', name: 'Obóz treningowy', name_en: 'Training camp', location: null, country: 'CRO', discipline: 'ROAD', class: null, status: 'confirmed', type: 'training' });
writeFileSync(`${out}/calendar/2027.json`, lines(y2027));

// Archive with a couple of results filled in.
writeFileSync(
  `${out}/calendar/2026.json`,
  lines(y2026.map((e) => (e.name === 'Gracia' ? { ...e, result: 'Etap 2 · 3. miejsce — M. Szczęsna' } : e))),
);

const riders = read('src/data/riders.json').map((r, i) => (i === 3 || i === 17 ? r : { ...r, seasons: [2026, 2027] }));
riders.push(
  { name: 'Nowa Zawodniczka', nat: 'POL', squad: 'continental', instagram: null, photo: 'new-rider-1.jpg', seasons: [2027], new: true },
  { name: 'Druga Nowa', nat: 'CZE', squad: 'junior', instagram: null, photo: 'new-rider-2.jpg', seasons: [2027], new: true },
);
writeFileSync(`${out}/riders.json`, lines(riders));
writeFileSync(`${out}/staff.json`, lines(read('src/data/staff.json').map((s) => ({ ...s, seasons: [2026, 2027] }))));

const partners = read('src/data/partners.json').map((p, i) => (i === 12 ? p : { ...p, seasons: [2026, 2027] }));
partners.push({ name: 'Nowy Partner', url: 'https://example.com/', tier: 'technical', logo: 'nowy-partner.svg', seasons: [2027] });
writeFileSync(`${out}/partners.json`, lines(partners));

writeFileSync(`${out}/highlights-2026.json`, JSON.stringify(read('src/data/highlights-2026.json').map(({ verify, ...h }) => h), null, 2) + '\n');
writeFileSync(
  `${out}/highlights-2027.json`,
  JSON.stringify(
    [
      {
        title: { pl: '[Przykładowy sukces sezonu 2027].', en: '[Example 2027 highlight].' },
        text: { pl: 'Dane testowe do podglądu fazy „offseason”.', en: 'Test data for previewing the offseason phase.' },
        photo: 'highlight-2027-1.jpg',
        alt: { pl: 'Zdjęcie przykładowe', en: 'Example photo' },
      },
    ],
    null,
    2,
  ) + '\n',
);

writeFileSync(
  `${out}/site.json`,
  JSON.stringify(
    {
      currentSeason: 2027,
      foundedYear: 2016,
      phase: 'preseason',
      rosterConfirmed: true,
      calendarConfirmed: true,
      partnersConfirmed: true,
      teamPresentation: { date: '2027-01-20', place: 'Wrocław, Hala Stulecia', url: null },
    },
    null,
    2,
  ) + '\n',
);
console.log(`fixtures written to ${out}`);
