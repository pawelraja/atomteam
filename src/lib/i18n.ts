import pl from '../content/copy.pl.json';
import en from '../content/copy.en.json';

import { COPY_TOKENS, TEAM } from './team';
import { deepMap, typographyPl, type Lang } from './text';

export * from './text';

/** The team block every component reads; built from src/data/team.json, not typed into the copy files. */
function teamCopy(dict: typeof pl) {
  return {
    ...dict.team,
    name: TEAM.name,
    wordmarkLead: TEAM.wordmark.lead,
    wordmarkA: TEAM.wordmark.a,
    wordmarkB: TEAM.wordmark.b,
    email: TEAM.contact.email,
    hashtag: TEAM.hashtag,
    social: TEAM.social,
  };
}

/** copy.pl.json is the source; copy.en.json must have exactly the same keys. */
export type Copy = Omit<typeof pl, 'team'> & { team: ReturnType<typeof teamCopy> };

/** Replaces the global {TEAM}, {UCI_STATUS} and {EMAIL} tokens with the values from team.json. */
export function applyTokens(s: string): string {
  return s.replace(/\{([A-Z_]+)\}/g, (m, k: string) => COPY_TOKENS[k] ?? m);
}

function build(dict: typeof pl, lang: Lang): Copy {
  const mapped = deepMap(dict, (s) => {
    const t = applyTokens(s);
    return lang === 'pl' && !/^(https?:|\/|mailto:)/.test(t) ? typographyPl(t) : t;
  });
  return { ...mapped, team: teamCopy(dict) };
}

/* ---------- key parity ---------- */

function shape(value: unknown, path: string, out: Map<string, string>) {
  if (Array.isArray(value)) {
    out.set(path, `array(${value.length})`);
    value.forEach((v, i) => shape(v, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    out.set(path, 'object');
    for (const [k, v] of Object.entries(value)) shape(v, path ? `${path}.${k}` : k, out);
  } else {
    out.set(path, typeof value);
  }
}

/** Lists every key that exists in one language but not the other (or has a different type). */
export function copyParityProblems(dicts: Record<string, unknown>): string[] {
  const shapes = Object.entries(dicts).map(([lang, d]) => {
    const m = new Map<string, string>();
    shape(d, '', m);
    return [lang, m] as const;
  });
  const problems: string[] = [];
  for (const [lang, m] of shapes) {
    for (const [otherLang, other] of shapes) {
      if (lang === otherLang) continue;
      for (const [key, type] of other) {
        if (!key) continue;
        if (!m.has(key)) problems.push(`copy.${lang}.json is missing "${key}" (present in copy.${otherLang}.json)`);
        else if (m.get(key) !== type && lang < otherLang)
          problems.push(`"${key}" is ${m.get(key)} in copy.${lang}.json but ${type} in copy.${otherLang}.json`);
      }
    }
  }
  return [...new Set(problems)];
}

const parity = copyParityProblems({ pl, en });
if (parity.length) {
  throw new Error(`Copy files are out of sync:\n  - ${parity.join('\n  - ')}`);
}

const dictionaries: Record<Lang, Copy> = {
  pl: build(pl, 'pl'),
  en: build(en as typeof pl, 'en'),
};

export function copy(lang: Lang): Copy {
  return dictionaries[lang];
}

