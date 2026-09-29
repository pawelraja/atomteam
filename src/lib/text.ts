// Pure text helpers shared by build-time code and browser scripts (no copy files imported).
export const LANGS = ['pl', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'pl';

/* ---------- Polish typography ---------- */

const NBSP = '\u00A0';

/**
 * Polish typesetting: keep one-letter words ("w", "i", "z", "o", "a", "u") and numbers
 * attached to the following word with a non-breaking space ("w 2027", "i U23", "20 zawodniczek").
 */
export function typographyPl(s: string): string {
  // Lookbehind (not a captured group), so consecutive one-letter words ("i w domu") all bind.
  return s
    .replace(/(?<=^|[\s(„"])([aiouwzAIOUWZ])\s+/g, `$1${NBSP}`)
    .replace(/(\d)\s+(?=[\p{L}{])/gu, `$1${NBSP}`);
}

export function deepMap<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === 'string') return fn(value) as T;
  if (Array.isArray(value)) return value.map((v) => deepMap(v, fn)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepMap(v, fn)])) as T;
  }
  return value;
}

/** Applies the language's typography to text that comes from data files. */
export function typo(lang: Lang, s: string): string {
  return lang === 'pl' ? typographyPl(s) : s;
}

/** Picks the language's version of a `{ "pl": "…", "en": "…" }` data value. */
export function pick(lang: Lang, value: { pl: string; en: string }): string {
  return typo(lang, value[lang]);
}

type Vars = Record<string, string | number>;

/** Replaces {name} placeholders. Throws on a missing variable so broken copy fails the build. */
export function fill(template: string, vars: Vars = {}, lang?: Lang): string {
  const out = template.replace(/\{(\w+)\}/g, (_, k: string) => {
    if (!(k in vars)) throw new Error(`Copy placeholder {${k}} has no value in "${template}"`);
    return String(vars[k]);
  });
  return lang ? typo(lang, out) : out;
}

export type PluralForms = Record<string, string>;

/**
 * Picks an exact form ("0", "1") first, then the CLDR plural category for the language
 * (Polish: one / few / many / other), e.g. 2 dni, 5 dni, 22 zawodniczki, 25 zawodniczek.
 */
export function plural(forms: PluralForms, n: number, lang: Lang, vars: Vars = {}): string {
  const category = new Intl.PluralRules(lang).select(n);
  const form = forms[String(n)] ?? forms[category] ?? forms.other;
  return fill(form, { n, ...vars }, lang);
}

export function otherLang(lang: Lang): Lang {
  return lang === 'pl' ? 'en' : 'pl';
}

/** "/" for Polish, "/en/" for English. */
export function homePath(lang: Lang): string {
  return lang === DEFAULT_LANG ? '/' : `/${lang}/`;
}
