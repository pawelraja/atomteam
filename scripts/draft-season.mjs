// Drafts next season's calendar from this season's: every race (not training) is copied with
// its month and "status": "tbc" and NO dates — dates are never invented.
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
  .filter((e) => e.type !== 'training' && e.status !== 'cancelled')
  .map((e) => {
    const { start, end, status, result, month, ...rest } = e;
    return {
      ...(rest.id ? { id: rest.id } : {}),
      month: start ? Number(start.slice(5, 7)) : month,
      ...Object.fromEntries(Object.entries(rest).filter(([k]) => k !== 'id')),
      status: 'tbc',
    };
  });
writeFileSync(out, '[\n' + draft.map((o) => '  ' + JSON.stringify(o)).join(',\n') + '\n]\n');
console.log(`Wrote ${draft.length} TBC entries to ${out}. Add real dates and "status": "confirmed" as organisers publish them.`);
