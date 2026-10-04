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

/** A page name, a path, or a mailto: link whose subject is written plainly in the copy file. */
function href(lang: Lang, h: string): string {
  const mail = h.match(/^mailto:([^?]+)\?subject=(.+)$/);
  return mail ? `mailto:${mail[1]}?subject=${encodeURIComponent(mail[2])}` : resolveHref(lang, h);
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
      link: it.link ? { label: fill(it.link.label, vars, lang), href: href(lang, it.link.href) } : null,
    }));
}
