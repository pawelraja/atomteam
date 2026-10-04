// Builds tests/fixtures/complete/: a FAKE "everything confirmed" data set used only to preview
// and screenshot the site as it will look mid-2027. Never copy these files into src/data.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const out = 'tests/fixtures/complete';
mkdirSync(`${out}/calendar`, { recursive: true });
mkdirSync(`${out}/results`, { recursive: true });
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const lines = (arr) => '[\n' + arr.map((o) => '  ' + JSON.stringify(o)).join(',\n') + '\n]\n';
const shift = (iso, days) => new Date(Date.parse(iso + 'T00:00:00Z') + days * 864e5).toISOString().slice(0, 10);

// 2027: the 2026 team-calendar races one year on (364 days keeps the weekday). A few stay TBC,
// one is cancelled. Events keep ids F01… so the fake 2027 results can refer to them.
const y2026 = read('src/data/calendar/2026.json');
const y2027 = y2026
  .filter((e) => e.type !== 'training' && e.onTeamCalendar !== false)
  .map((e, i) => {
    const { id, start, end, note, verify, ...rest } = e;
    const fid = `F${String(i + 1).padStart(2, '0')}`;
    if (i % 11 === 5) return { id: fid, month: Number(start.slice(5, 7)), ...rest, status: 'tbc' };
    const moved = { id: fid, ...rest, start: shift(start, 364), end: shift(end, 364), status: i === 8 ? 'cancelled' : 'confirmed' };
    if (!moved.start.startsWith('2027')) return { id: fid, ...rest, month: 1, status: 'tbc' };
    return moved;
  });
y2027.push({ id: 'training-camp-cro-2027', start: '2027-02-06', end: '2027-02-21', name: 'Obóz treningowy', name_en: 'Training camp', location: null, country: 'CRO', discipline: 'ROAD', class: null, status: 'confirmed', type: 'training' });
writeFileSync(`${out}/calendar/2027.json`, lines(y2027));

// Archive with a result line filled in.
writeFileSync(
  `${out}/calendar/2026.json`,
  lines(y2026.map((e) => (e.id === 'E20' ? { ...e, result: 'Etap 5 · 1. miejsce — S. Ungerová' } : e))),
);

// A few signed-off 2027 results, so the off-season scenario reviews 2027.
const byName = (n) => y2027.find((e) => e.name === n && e.status === 'confirmed');
const ev = (n) => byName(n)?.id;
const r2027 = [
  { eventId: ev('Szosowe Mistrzostwa Polski'), date: byName('Szosowe Mistrzostwa Polski')?.start, stage: 'ITT', category: 'U23', rider: 'Maja Tracka', position: 1, featured: true },
  { eventId: ev('Szosowe Mistrzostwa Polski'), date: byName('Szosowe Mistrzostwa Polski')?.start, stage: 'Road race', category: 'U19', rider: 'Zofia Glinka', position: 2, featured: true },
  { eventId: ev('Tour de Pologne Women'), date: byName('Tour de Pologne Women')?.end, stage: 'General classification (final)', category: 'Elite', rider: 'Olga Wankiewicz', position: 6, featured: true },
  { eventId: ev('Sowiogórski Tour'), date: byName('Sowiogórski Tour')?.end, stage: 'General classification (final)', category: 'Elite', rider: 'Martyna Szczęsna', position: 1, featured: true },
]
  .filter((r) => r.eventId)
  .map((r) => ({ ...r, status: 'Classified', note: '[fixture]', source: 'https://example.com/results', verify: false }));
writeFileSync(`${out}/results/2027.json`, lines(r2027));

const riders = read('src/data/riders.json').map((r, i) => (i === 3 || i === 17 ? r : { ...r, seasons: [2026, 2027] }));
riders.push(
  { name: 'Nowa Zawodniczka', nat: 'POL', squad: 'continental', category: 'U23', instagram: null, photo: 'new-rider-1.jpg', seasons: [2027], new: true },
  { name: 'Druga Nowa', nat: 'CZE', squad: 'junior', category: 'U19', instagram: null, photo: 'new-rider-2.jpg', seasons: [2027], new: true },
);
writeFileSync(`${out}/riders.json`, lines(riders));
writeFileSync(`${out}/staff.json`, lines(read('src/data/staff.json').map((s) => ({ ...s, seasons: [2026, 2027] }))));

const partners = read('src/data/partners.json').map((p, i) => (i === 12 ? p : { ...p, seasons: [2026, 2027] }));
partners.push({ name: 'Nowy Partner', url: 'https://example.com/', tier: 'technical', logo: 'nowy-partner.svg', seasons: [2027] });
writeFileSync(`${out}/partners.json`, lines(partners));

writeFileSync(`${out}/highlights-2026.json`, JSON.stringify(read('src/data/highlights-2026.json').map(({ verify, ...h }) => h), null, 2) + '\n');

const contact = (name, role) => ({ name, role, phone: '+48 600 000 000', email: 'kontakt@atomteam.pl', photo: null });
writeFileSync(
  `${out}/site.json`,
  JSON.stringify(
    {
      currentSeason: 2027,
      phase: 'preseason',
      rosterConfirmed: true,
      calendarConfirmed: true,
      partnersConfirmed: true,
      teamPresentation: { date: '2027-01-20', place: 'Wrocław, Hala Stulecia', url: null },
      statusLine: { pl: 'Sezon 2027 · Kalendarz potwierdzony · Skład ogłoszony', en: 'Season 2027 · Calendar confirmed · Roster announced' },
      statusLink: { label: { pl: 'Kalendarz 2027', en: '2027 calendar' }, href: 'calendar' },
      pressContact: { ...contact('[Fixture] Jan Przykładowy', { pl: 'Rzecznik prasowy', en: 'Press officer' }), responseTime: { pl: 'w ciągu 1 dnia roboczego', en: 'within 1 working day' } },
    },
    null,
    2,
  ) + '\n',
);
console.log(`fixtures written to ${out}`);
