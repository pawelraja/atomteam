// The team's identity facts, from src/data/team.json (the single source for name, UCI status,
// founding year, city, contact and profile links). Values marked "verify": true are kept in the
// data but never returned by these helpers, so nothing unconfirmed reaches a page or JSON-LD.
import raw from '../data/team.json';
import { teamSchema, type Team } from './schemas';

function parse(): Team {
  const r = teamSchema.safeParse(raw);
  if (r.success) return r.data;
  const problems = r.error.issues.map((i) => `  - field "${i.path.join('.')}": ${i.message}`);
  throw new Error(`Problem in src/data/team.json:\n${problems.join('\n')}`);
}

export const TEAM: Team = parse();

/** The UCI team code, or null while it is unconfirmed. */
export function uciCode(team: Team = TEAM): string | null {
  return team.uciCode.verify ? null : team.uciCode.value;
}

/** The registered name, or null while its exact form is unconfirmed. */
export function legalName(team: Team = TEAM): string | null {
  return team.officialName.verify ? null : team.officialName.value;
}

/** Confirmed external profile URLs (Wikipedia, Wikidata, ProCyclingStats, FirstCycling, UCI). */
export function teamProfiles(team: Team = TEAM): string[] {
  return Object.values(team.profiles)
    .filter((p) => !p.verify && p.url)
    .map((p) => p.url!);
}

/** Every confirmed URL that identifies the team elsewhere: social accounts and profile pages. */
export function teamSameAs(team: Team = TEAM): string[] {
  return [...Object.values(team.social), ...teamProfiles(team)];
}

/**
 * Global tokens that copy strings may use without the caller passing them:
 * {TEAM} → "Mat Atom Deweloper Wrocław", {UCI_STATUS} → "UCI Continental", {EMAIL} → contact e-mail.
 * Uppercase so they never collide with the per-call {placeholders} that fill() checks.
 */
export const COPY_TOKENS: Record<string, string> = {
  TEAM: TEAM.name,
  UCI_STATUS: TEAM.uciStatus.label,
  EMAIL: TEAM.contact.email,
};

/** "atomteam.pl": used for calendar UIDs. */
export const teamDomain = new URL(TEAM.website).hostname.replace(/^www\./, '');
