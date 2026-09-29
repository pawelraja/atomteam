import pl from '../content/copy.pl.json';
import en from '../content/copy.en.json';

import { deepMap, typographyPl, type Lang } from './text';

export * from './text';

/** copy.pl.json is the source; copy.en.json must have exactly the same keys. */
export type Copy = typeof pl;

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
  pl: deepMap(pl, (s) => (/^(https?:|\/|mailto:)/.test(s) ? s : typographyPl(s))),
  en: en as Copy,
};

export function copy(lang: Lang): Copy {
  return dictionaries[lang];
}

