// The FAQ: questions and answers from the copy files, filled with facts computed from data.
import { factVars, teamFacts } from './facts';
import { copy, fill, type Lang } from './i18n';
import { resolveHref } from './routes';

export interface FaqItem {
  id: string;
  q: string;
  a: string;
  link: { label: string; href: string } | null;
}

export function faqItems(lang: Lang): FaqItem[] {
  const t = copy(lang);
  const vars = factVars(lang);
  const facts = teamFacts();
  return t.faq.items
    // Without a reviewed season there are no titles to report.
    .filter((it) => it.id !== 'results' || facts.honours)
    .map((it) => ({
      id: it.id,
      q: fill(it.q, vars, lang),
      a: fill(it.a, vars, lang),
      link: it.link ? { label: fill(it.link.label, vars, lang), href: resolveHref(lang, it.link.href) } : null,
    }));
}
