// Markdown versions of the key pages and the llms.txt files, for AI assistants and agents that
// prefer plain text. Built from the same data and copy as the HTML pages, so they never disagree.
import { getData } from './data';
import { visible, wheelMentionsOn, wheelPodiums } from './equipment';
import { factVars, teamFacts } from './facts';
import { faqItems } from './faq';
import { copy, fill, homePath, otherLang, pick, plural, type Lang } from './i18n';
import { raceSummary, raceWhere } from './pageld';
import { racePath, riderPath, route, ROUTES, type PageKey } from './routes';
import { monthName, pickPartners, raceName } from './season';
import { TEAM } from './team';
import { officialRosterView, profileRiders, racePages } from './view';

/** Markdown version of a page, per language. */
export const MARKDOWN: Partial<Record<PageKey, Record<Lang, string>>> = {
  team: { pl: '/zespol.md', en: '/team.md' },
  calendar: { pl: '/wyscigi.md', en: '/races.md' },
  equipment: { pl: '/sprzet.md', en: '/equipment.md' },
  faq: { pl: '/pytania.md', en: '/faq.md' },
};

const abs = (p: string) => new URL(p, TEAM.website).href;
/** Plain spaces instead of the no-break spaces of Polish typography; one trailing newline. */
const finish = (lines: string[]) => lines.join('\n').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim() + '\n';

function header(lang: Lang, title: string, page: PageKey, summary: string): string[] {
  const tm = copy(lang).markdown;
  const md = MARKDOWN[page];
  return [
    `# ${title}`,
    '',
    `> ${summary}`,
    '',
    `${tm.source}: ${abs(ROUTES[page][lang])} · ${fill(tm.asOf, factVars(lang))}${md ? ` · ${tm.otherLang}: ${abs(md[otherLang(lang)])}` : ''}`,
    '',
  ];
}

/* ---------- team ---------- */

function teamFactsMd(lang: Lang): string[] {
  const t = copy(lang);
  const tm = t.markdown;
  return [
    `## ${tm.facts}`,
    '',
    `- ${tm.name}: ${TEAM.name}`,
    `- ${tm.alsoKnown}: ${TEAM.alternateNames.join(', ')}`,
    `- ${tm.uciStatus}: ${TEAM.uciStatus.label}`,
    `- ${tm.founded}: ${fill(tm.foundedValue, { founded: TEAM.founded })}`,
    `- ${tm.website}: ${abs(homePath(lang))}`,
    `- ${tm.email}: ${TEAM.contact.email}`,
    `- ${tm.social}: ${Object.values(TEAM.social).join(', ')}`,
    '',
  ];
}

function rosterMd(lang: Lang): string[] {
  const t = copy(lang);
  const roster = officialRosterView();
  const { staff } = getData();
  const slugs = new Map(profileRiders().map((p) => [p.rider.name, p.slug]));
  const f = teamFacts();
  const out = [`## ${fill(t.markdown.roster, { season: roster.season ?? '' })}`, '', fill(t.teamPage.lead, factVars(lang), lang), ''];
  for (const cat of ['Elite', 'U23', 'U19'] as const) {
    const riders = roster.items.filter((r) => r.category === cat);
    if (!riders.length) continue;
    out.push(`### ${t.rider.category[cat]}`, '');
    for (const r of riders) {
      const ig = r.instagram ? ` · Instagram @${r.instagram}` : '';
      const country = (t.calendar.countryNames as Record<string, string>)[r.nat] ?? r.nat;
      out.push(`- [${r.name}](${abs(riderPath(lang, slugs.get(r.name)!))}): ${t.rider.squad[r.squad]}, ${t.rider.category[r.category]}, ${country}${ig}`);
    }
    out.push('');
  }
  const crew = staff.filter((s) => roster.season !== null && s.seasons.includes(roster.season));
  if (crew.length) out.push(`### ${t.markdown.staff} (${f.roster.staff})`, '', ...crew.map((s) => `- ${s.name}: ${pick(lang, s.role)}`), '');
  return out;
}

export function teamMarkdown(lang: Lang): string {
  const t = copy(lang);
  return finish([...header(lang, fill(t.markdown.teamTitle, {}), 'team', fill(t.hero.summary, factVars(lang), lang)), ...teamFactsMd(lang), ...rosterMd(lang)]);
}

/* ---------- races ---------- */

function racesBody(lang: Lang): string[] {
  const t = copy(lang);
  const tm = t.markdown;
  const { site, calendars, today } = getData();
  const out: string[] = [];
  const current = (calendars.get(site.currentSeason) ?? []).filter((e) => !e.training);
  const pages = racePages();
  const pageOf = (season: number, id: string) => pages.find((p) => p.season === season && p.event.id === id);
  if (current.length) {
    out.push(`## ${fill(tm.calendar, { season: site.currentSeason })}`, '');
    for (const e of current) {
      const page = pageOf(site.currentSeason, e.id);
      const when = e.start ? (page ? '' : e.start) : `${monthName(e.month, t.meta.locale)} (${tm.tbc})`;
      const name = page ? `[${raceName(e, lang)}](${abs(racePath(lang, page.season, page.slug))})` : raceName(e, lang);
      const status = e.status === 'cancelled' ? ` (${tm.cancelled})` : '';
      out.push(`- ${[when, name].filter(Boolean).join(': ')}, ${raceWhere(e, lang)} · ${t.calendar.discipline[e.discipline]}${e.cls ? ` · ${e.cls}` : ''}${status}`);
    }
    out.push('');
  }
  const past = [...new Set(pages.map((p) => p.season))].filter((s) => s !== site.currentSeason).sort((a, b) => b - a);
  for (const season of past) {
    out.push(`## ${fill(tm.season, { season })}`, '');
    for (const p of pages.filter((x) => x.season === season)) {
      out.push(`- [${raceName(p.event, lang)}](${abs(racePath(lang, p.season, p.slug))}): ${raceSummary(p, lang, today)}`);
    }
    out.push('');
  }
  return out;
}

export function racesMarkdown(lang: Lang): string {
  const t = copy(lang);
  return finish([...header(lang, fill(t.markdown.racesTitle, {}), 'calendar', fill(t.calendarPage.lead, factVars(lang), lang)), ...racesBody(lang)]);
}

/* ---------- equipment ---------- */

function equipmentBody(lang: Lang): string[] {
  const t = copy(lang);
  const te = t.equipment;
  const { equipment, partners } = getData();
  const w = equipment.wheels;
  const partner = partners.find((p) => p.name === w.partner)!;
  // Markdown is public output: only confirmed items, even in preview builds.
  const confirmed = <T extends { verify: boolean }>(xs: T[]) => visible(xs).filter((x) => !x.verify);
  const out = [`## ${partner.name}`, '', pick(lang, w.about), ''];
  for (const f of confirmed(w.facts)) out.push(`- ${pick(lang, f.label)}: ${pick(lang, f.value)}`);
  out.push(`- ${t.markdown.website}: ${partner.url}`, '');
  const models = confirmed(w.models);
  if (models.length) {
    out.push(`### ${te.modelsTitle}`, '');
    for (const m of models) out.push(`- ${partner.name} ${m.name}: ${t.calendar.discipline[m.discipline]}${m.rimDepth ? `, ${fill(te.mm, { n: m.rimDepth })}` : ''} (${pick(lang, m.use)})`);
    out.push('');
  }
  const setup = confirmed(equipment.setup);
  out.push(`## ${t.markdown.setup}`, '', ...setup.map((s) => `- ${te.categories[s.category]}: ${s.partner}`), '', fill(te.partnersLead, { ...factVars(lang) }, lang), '');
  return out;
}

function equipmentLead(lang: Lang): string {
  const te = copy(lang).equipment;
  const { equipment } = getData();
  const vars = { ...factVars(lang), wheels: equipment.wheels.partner };
  const stats = wheelPodiums(Math.max(...equipment.wheels.seasons));
  return !getData().equipment.wheels.disciplinesVerify && wheelMentionsOn() && stats.podiums > 0
    ? fill(te.leadStats, { ...vars, wheelSeason: stats.season, wheelPodiums: plural(te.counts.podiums, stats.podiums, lang), wheelRaces: plural(te.counts.racesIn, stats.races, lang) }, lang)
    : fill(te.lead, vars, lang);
}

export function equipmentMarkdown(lang: Lang): string {
  const te = copy(lang).equipment;
  const title = fill(te.title, { wheels: getData().equipment.wheels.partner }, lang);
  return finish([...header(lang, title, 'equipment', equipmentLead(lang)), ...equipmentBody(lang)]);
}

/* ---------- FAQ, partners ---------- */

function faqBody(lang: Lang): string[] {
  return faqItems(lang).flatMap((it) => [`### ${it.q}`, '', it.a, '']);
}

export function faqMarkdown(lang: Lang): string {
  const t = copy(lang);
  return finish([...header(lang, t.faq.title.replace(/\.$/, ''), 'faq', fill(t.faq.lead, factVars(lang), lang)), ...faqBody(lang)]);
}

function partnersBody(lang: Lang): string[] {
  const t = copy(lang);
  const { site, partners } = getData();
  const pick2 = pickPartners(partners, site.currentSeason, site.partnersConfirmed);
  const out = [`## ${fill(t.markdown.partners, { season: pick2.season ?? '' })}`, ''];
  for (const tier of ['title', 'main', 'technical', 'institutional'] as const) {
    const list = pick2.items.filter((p) => p.tier === tier);
    if (!list.length) continue;
    out.push(`### ${t.partners.tiers[tier]}`, '', ...list.map((p) => `- ${p.label ? pick(lang, p.label) : p.name}: ${p.url}`), '');
  }
  return out;
}

/* ---------- llms.txt ---------- */

/** /llms.txt: a short summary and the key links (https://llmstxt.org). */
export function llmsTxt(lang: Lang = 'en'): string {
  const t = copy(lang);
  const tm = t.markdown;
  const link = (label: string, path: string, note = '') => `- [${label}](${abs(path)})${note ? `: ${note}` : ''}`;
  const md = (key: PageKey) => MARKDOWN[key]!;
  return finish([
    `# ${TEAM.name}`,
    '',
    `> ${fill(t.hero.summary, factVars(lang), lang)}`,
    '',
    `${tm.llmsIntro} ${fill(tm.asOf, factVars(lang))}. Polski: ${abs('/')} · English: ${abs('/en/')}`,
    '',
    `## ${tm.llmsPages}`,
    '',
    link(t.nav.team, route(lang, 'team'), fill(t.teamPage.lead, factVars(lang), lang)),
    link(t.nav.calendar, route(lang, 'calendar'), fill(t.calendarPage.lead, factVars(lang), lang)),
    link(t.equipment.eyebrow, route(lang, 'equipment'), equipmentLead(lang)),
    link(t.faq.title.replace(/\.$/, ''), route(lang, 'faq')),
    link(t.nav.partners, route(lang, 'partners')),
    link(t.nav.media, route(lang, 'media'), t.mediaPage.lead),
    '',
    `## ${tm.llmsMarkdown}`,
    '',
    link(`${t.nav.team} (EN)`, md('team').en),
    link(`${t.nav.calendar} (EN)`, md('calendar').en),
    link(`${t.equipment.eyebrow} (EN)`, md('equipment').en),
    link('FAQ (EN)', md('faq').en),
    link('Zespół (PL)', md('team').pl),
    link('Wyścigi (PL)', md('calendar').pl),
    link('Sprzęt (PL)', md('equipment').pl),
    link('Pytania i odpowiedzi (PL)', md('faq').pl),
    '',
    `## ${tm.llmsOptional}`,
    '',
    link('llms-full.txt', '/llms-full.txt', tm.llmsFull),
    link('sitemap.xml', '/sitemap.xml', tm.llmsSitemap),
    link('RSS', lang === 'en' ? '/en/rss.xml' : '/rss.xml', tm.llmsFeed),
  ]);
}

/** /llms-full.txt: everything in one plain-text file: team, roster, calendar, results, equipment, partners, FAQ. */
export function llmsFullTxt(lang: Lang = 'en'): string {
  const t = copy(lang);
  return finish([
    `# ${TEAM.name}`,
    '',
    `> ${fill(t.hero.summary, factVars(lang), lang)}`,
    '',
    `${t.markdown.source}: ${abs(homePath(lang))} · ${fill(t.markdown.asOf, factVars(lang))}`,
    '',
    ...teamFactsMd(lang),
    ...rosterMd(lang),
    `# ${fill(t.markdown.racesTitle, {})}`,
    '',
    ...racesBody(lang),
    `# ${fill(t.equipment.title, { wheels: getData().equipment.wheels.partner }, lang)}`,
    '',
    equipmentLead(lang),
    '',
    ...equipmentBody(lang),
    ...partnersBody(lang),
    `# ${t.faq.title.replace(/\.$/, '')}`,
    '',
    ...faqBody(lang),
  ]);
}

/** A static endpoint that serves Markdown or plain text. */
export function textRoute(body: () => string, type: 'text/markdown' | 'text/plain') {
  return () => new Response(body(), { headers: { 'Content-Type': `${type}; charset=utf-8` } });
}
