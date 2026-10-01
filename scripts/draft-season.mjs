// Drafts next season's calendar from this season's: every race on the team calendar (not
// training, not races ridden outside the team calendar) is copied with its month and
// "status": "tbc" and NO dates — dates are never invented. Workbook ids (E01…), notes and
// "verify" flags stay with the old season.
//   node scripts/draft-season.mjs 2027 2028
// Refuses to overwrite an existing file unless you add --force.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const [from, to] = process.argv.slice(2).map(Number);
if (!from || !to) {
  console.error('Usage: node scripts/draft-season.mjs <fromYear> <toYear>   e.g. 2027 2028');
  process.exit(1);
}
const src = `src/data/calendar/${from}.json`;
const out = `src/data/calendar/${to}.json`;
if (existsSync(out) && !process.argv.includes('--force')) {
  console.error(`${out} already exists. Add --force to overwrite it.`);
  process.exit(1);
}
const entries = JSON.parse(readFileSync(src, 'utf8'));
const draft = entries
  .filter((e) => e.type !== 'training' && e.status !== 'cancelled' && e.onTeamCalendar !== false)
  .map((e) => {
    // eslint-disable-next-line no-unused-vars
    const { id, start, end, status, result, month, note, verify, url, onTeamCalendar, ...rest } = e;
    // Edition numbers change every year ("4. Przełaj…" → 5th), so they are dropped, not guessed.
    const noEdition = (n) => n && n.replace(/^\d+\.\s+/, '').replace(/^\d+(st|nd|rd|th)\s+/i, '');
    const names = { name: noEdition(rest.name), ...(rest.name_en ? { name_en: noEdition(rest.name_en) } : {}) };
    return { month: start ? Number(start.slice(5, 7)) : month, ...rest, ...names, status: 'tbc' };
  });
writeFileSync(out, '[\n' + draft.map((o) => '  ' + JSON.stringify(o)).join(',\n') + '\n]\n');
console.log(`Wrote ${draft.length} TBC entries to ${out}. Add real dates and "status": "confirmed" as organisers publish them.`);
