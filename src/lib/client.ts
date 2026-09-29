// Browser helpers shared by section scripts.
import type { Lang } from './text';
import { todayISO } from './season';

/** Today in Warsaw — or the MADW_TODAY override baked into <body data-today> for previews. */
export function clientToday(): string {
  return document.body.dataset.today ?? todayISO();
}

export function clientLang(): Lang {
  return (document.body.dataset.lang as Lang) ?? 'pl';
}

export function readJSON<T>(id: string): T {
  return JSON.parse(document.getElementById(id)!.textContent!) as T;
}
