// Validates every JSON-LD block in the built site against the schema.org vocabulary the site
// uses. Runs at the end of `astro build` (see astro.config.mjs), so invalid structured data fails
// the build and never reaches the live site. Also usable on its own:
//   node scripts/check-jsonld.mjs [--dir dist]
//
// Checks: valid JSON; @context is schema.org; every @type is known; every property belongs to
// its type (or a parent type); required properties for rich results are present; dates are
// ISO 8601; URLs are absolute; enumeration values are schema.org URLs; every {"@id"} reference
// resolves inside the same page; no "[VERIFY]" placeholder or unconfirmed value leaks out.
//
// This is an offline check. After deploying, also paste a few URLs into
// https://validator.schema.org/ and https://search.google.com/test/rich-results.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** schema.org types used on the site: parent type and own properties (from schema.org). */
const VOCAB = {
  Thing: { parent: null, props: ['name', 'alternateName', 'description', 'url', 'sameAs', 'image', 'identifier', 'mainEntityOfPage', 'subjectOf'] },
  Intangible: { parent: 'Thing', props: [] },
  Organization: {
    parent: 'Thing',
    props: ['legalName', 'logo', 'email', 'telephone', 'foundingDate', 'foundingLocation', 'location', 'address', 'member', 'memberOf', 'sponsor', 'employee', 'founder', 'brand', 'contactPoint', 'areaServed', 'parentOrganization', 'subOrganization', 'knowsAbout', 'makesOffer', 'slogan', 'award'],
  },
  SportsOrganization: { parent: 'Organization', props: ['sport'] },
  SportsTeam: { parent: 'SportsOrganization', props: ['athlete', 'coach', 'gender'] },
  Person: {
    parent: 'Thing',
    props: ['givenName', 'familyName', 'gender', 'nationality', 'birthDate', 'affiliation', 'memberOf', 'jobTitle', 'sponsor', 'worksFor', 'knowsAbout', 'award', 'homeLocation'],
  },
  Place: { parent: 'Thing', props: ['address', 'geo', 'containedInPlace'] },
  AdministrativeArea: { parent: 'Place', props: [] },
  Country: { parent: 'AdministrativeArea', props: [] },
  StructuredValue: { parent: 'Intangible', props: [] },
  ContactPoint: { parent: 'StructuredValue', props: ['contactType', 'email', 'telephone', 'availableLanguage', 'areaServed'] },
  PostalAddress: { parent: 'ContactPoint', props: ['addressLocality', 'addressRegion', 'addressCountry', 'postalCode', 'streetAddress'] },
  PropertyValue: { parent: 'StructuredValue', props: ['propertyID', 'value'] },
  Event: {
    parent: 'Thing',
    props: ['startDate', 'endDate', 'location', 'eventStatus', 'eventAttendanceMode', 'organizer', 'performer', 'sponsor', 'subEvent', 'superEvent', 'about', 'offers', 'attendee', 'inLanguage'],
  },
  SportsEvent: { parent: 'Event', props: ['competitor', 'sport', 'homeTeam', 'awayTeam'] },
  CreativeWork: {
    parent: 'Thing',
    props: ['inLanguage', 'publisher', 'author', 'about', 'mentions', 'datePublished', 'dateModified', 'headline', 'isPartOf', 'license', 'keywords', 'text', 'mainEntity', 'creator', 'copyrightHolder', 'encodingFormat', 'contentUrl', 'creditText', 'copyrightNotice', 'acquireLicensePage'],
  },
  WebSite: { parent: 'CreativeWork', props: ['potentialAction'] },
  WebPage: { parent: 'CreativeWork', props: ['breadcrumb', 'primaryImageOfPage', 'lastReviewed'] },
  FAQPage: { parent: 'WebPage', props: [] },
  AboutPage: { parent: 'WebPage', props: [] },
  ContactPage: { parent: 'WebPage', props: [] },
  CollectionPage: { parent: 'WebPage', props: [] },
  Comment: { parent: 'CreativeWork', props: ['upvoteCount'] },
  Question: { parent: 'Comment', props: ['acceptedAnswer', 'answerCount', 'suggestedAnswer'] },
  Answer: { parent: 'Comment', props: [] },
  Article: { parent: 'CreativeWork', props: ['articleBody', 'wordCount', 'articleSection'] },
  NewsArticle: { parent: 'Article', props: ['dateline'] },
  MediaObject: { parent: 'CreativeWork', props: ['width', 'height', 'contentSize', 'uploadDate'] },
  ImageObject: { parent: 'MediaObject', props: ['caption'] },
  Dataset: { parent: 'CreativeWork', props: ['distribution', 'temporalCoverage', 'spatialCoverage', 'variableMeasured', 'includedInDataCatalog'] },
  DataDownload: { parent: 'MediaObject', props: [] },
  ItemList: { parent: 'Intangible', props: ['itemListElement', 'numberOfItems', 'itemListOrder'] },
  BreadcrumbList: { parent: 'ItemList', props: [] },
  ListItem: { parent: 'Intangible', props: ['position', 'item', 'nextItem', 'previousItem'] },
  // Role wraps a property value and may carry that same property (schema.org "Role" pattern).
  Role: { parent: 'Intangible', props: ['roleName', 'startDate', 'endDate', 'sponsor', 'memberOf', 'athlete', 'member', 'competitor'] },
  OrganizationRole: { parent: 'Role', props: ['numberedPosition'] },
  Brand: { parent: 'Intangible', props: ['logo', 'slogan'] },
  Product: { parent: 'Thing', props: ['brand', 'manufacturer', 'model', 'category', 'material', 'color', 'additionalProperty', 'isRelatedTo', 'audience'] },
  ProductModel: { parent: 'Product', props: [] },
  Audience: { parent: 'Intangible', props: ['audienceType'] },
  SearchAction: { parent: 'Intangible', props: ['target', 'query-input'] },
};

/** Properties required for the site's use of each type (Google rich-result requirements where they exist). */
const REQUIRED = {
  SportsTeam: ['name', 'url'],
  SportsOrganization: ['name'],
  Organization: ['name'],
  Person: ['name'],
  WebSite: ['name', 'url'],
  SportsEvent: ['name', 'startDate', 'location'],
  Event: ['name', 'startDate', 'location'],
  Place: ['address'],
  BreadcrumbList: ['itemListElement'],
  ListItem: ['position', 'name'],
  FAQPage: ['mainEntity'],
  Question: ['name', 'acceptedAnswer'],
  Answer: ['text'],
  NewsArticle: ['headline', 'datePublished', 'author'],
  Product: ['name'],
  Brand: ['name'],
  Role: ['roleName'],
  Dataset: ['name', 'description'],
};

const ENUMS = {
  eventStatus: ['EventScheduled', 'EventCancelled', 'EventPostponed', 'EventRescheduled', 'EventMovedOnline'],
  eventAttendanceMode: ['OfflineEventAttendanceMode', 'OnlineEventAttendanceMode', 'MixedEventAttendanceMode'],
};
const DATE_PROPS = new Set(['startDate', 'endDate', 'foundingDate', 'datePublished', 'dateModified', 'birthDate', 'uploadDate', 'lastReviewed']);
const URL_PROPS = new Set(['url', 'sameAs', 'logo', 'image', 'item', 'contentUrl', 'license', 'acquireLicensePage']);
const ISO_DATE = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?)?)?)?$/;

function allowed(type) {
  const out = new Set();
  for (let t = type; t; t = VOCAB[t].parent) for (const p of VOCAB[t].props) out.add(p);
  return out;
}

const isAbsUrl = (v) => typeof v === 'string' && /^https?:\/\/[^\s]+$/.test(v);

/** Problems in one parsed JSON-LD document (one <script> block). */
export function checkGraph(doc) {
  const problems = [];
  if (!doc || typeof doc !== 'object') return ['not a JSON object'];
  if (doc['@context'] !== 'https://schema.org') problems.push(`@context must be "https://schema.org" (is ${JSON.stringify(doc['@context'])})`);
  const top = Array.isArray(doc['@graph']) ? doc['@graph'] : [doc];
  const defined = new Map();
  const refs = [];

  const walk = (node, path) => {
    if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${path}[${i}]`));
    if (!node || typeof node !== 'object') return;
    const keys = Object.keys(node).filter((k) => k !== '@context');
    if (keys.length === 1 && keys[0] === '@id') {
      refs.push({ id: node['@id'], path });
      return;
    }
    const types = [node['@type']].flat();
    if (!node['@type']) {
      problems.push(`${path}: object without @type`);
      return;
    }
    for (const t of types) if (!VOCAB[t]) problems.push(`${path}: unknown @type "${t}"`);
    if (node['@id']) {
      if (!isAbsUrl(node['@id'])) problems.push(`${path}: @id must be an absolute URL (${node['@id']})`);
      const prev = defined.get(node['@id']);
      if (prev && prev !== types.join(',')) problems.push(`${path}: @id ${node['@id']} is both ${prev} and ${types.join(',')}`);
      defined.set(node['@id'], types.join(','));
    }
    const ok = new Set(types.filter((t) => VOCAB[t]).flatMap((t) => [...allowed(t)]));
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('@')) continue;
      if (!ok.has(k)) problems.push(`${path}: "${k}" is not a property of ${types.join('/')}`);
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0 && k !== 'sameAs')) problems.push(`${path}.${k}: empty value`);
      if (typeof v === 'string' && /\[VERIFY\]/i.test(v)) problems.push(`${path}.${k}: unconfirmed "[VERIFY]" value`);
      if (DATE_PROPS.has(k) && !(typeof v === 'string' && ISO_DATE.test(v))) problems.push(`${path}.${k}: "${v}" is not an ISO 8601 date`);
      if (URL_PROPS.has(k)) for (const u of [v].flat()) if (typeof u === 'string' && !isAbsUrl(u)) problems.push(`${path}.${k}: "${u}" is not an absolute URL`);
      if (ENUMS[k] && !ENUMS[k].some((e) => v === `https://schema.org/${e}`)) problems.push(`${path}.${k}: "${v}" is not a schema.org ${k} value`);
      if (k === 'addressCountry' && !(typeof v === 'string' && /^[A-Z]{2}$/.test(v))) problems.push(`${path}.${k}: "${v}" must be an ISO 3166-1 alpha-2 code`);
      walk(v, `${path}.${k}`);
    }
    for (const t of types) for (const req of REQUIRED[t] ?? []) if (!(req in node)) problems.push(`${path}: ${t} needs "${req}"`);
    if (types.includes('Event') || types.includes('SportsEvent')) {
      if (node.startDate && node.endDate && node.endDate < node.startDate) problems.push(`${path}: endDate is before startDate`);
    }
  };
  top.forEach((n, i) => walk(n, `@graph[${i}]`));
  for (const r of refs) if (!defined.has(r.id)) problems.push(`${r.path}: reference to ${r.id} is not defined on this page`);
  return problems;
}

/** Extracts and checks the JSON-LD of one HTML page. */
export function checkHtml(html) {
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const problems = [];
  for (const b of blocks) {
    let doc;
    try {
      doc = JSON.parse(b);
    } catch (err) {
      problems.push(`invalid JSON: ${err.message}`);
      continue;
    }
    problems.push(...checkGraph(doc));
  }
  return { count: blocks.length, problems };
}

function htmlFiles(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}

/** Checks a built site. Returns problems as "page: problem" strings, and the number of blocks checked. */
export function checkDir(dir) {
  const problems = [];
  let blocks = 0;
  let pages = 0;
  for (const file of htmlFiles(dir)) {
    const html = readFileSync(file, 'utf8');
    const { count, problems: p } = checkHtml(html);
    blocks += count;
    pages++;
    const page = '/' + relative(dir, file).replace(/\\/g, '/').replace(/index\.html$/, '');
    const indexable = !/<meta name="robots" content="noindex"/.test(html);
    if (indexable && count === 0) problems.push(`${page}: no JSON-LD`);
    problems.push(...p.map((x) => `${page}: ${x}`));
  }
  return { problems, blocks, pages };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf('--dir');
  const dir = i > -1 ? process.argv[i + 1] : 'dist';
  if (!existsSync(dir)) {
    console.error(`No build in ${dir}. Run npm run build first.`);
    process.exit(1);
  }
  const { problems, blocks, pages } = checkDir(dir);
  if (problems.length) {
    console.error(`JSON-LD: ${problems.length} problem(s):\n  - ${problems.slice(0, 50).join('\n  - ')}`);
    process.exit(1);
  }
  console.log(`JSON-LD: ${blocks} block(s) on ${pages} page(s) valid.`);
}
