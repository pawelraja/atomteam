// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import redirectList from './src/data/redirects.json' with { type: 'json' };
import team from './src/data/team.json' with { type: 'json' };
import { checkDir } from './scripts/check-jsonld.mjs';

/** @type {{ from: string; to: string }[]} */
const oldUrls = redirectList;

/**
 * Fails the build when any page's structured data is invalid (scripts/check-jsonld.mjs).
 * @type {import('astro').AstroIntegration}
 */
const jsonLdCheck = {
  name: 'madw-jsonld-check',
  hooks: {
    'astro:build:done': ({ dir, logger }) => {
      const { problems, blocks, pages } = checkDir(fileURLToPath(dir));
      if (problems.length) {
        throw new Error(`Invalid structured data (JSON-LD), ${problems.length} problem(s):\n  - ${problems.slice(0, 40).join('\n  - ')}`);
      }
      logger.info(`JSON-LD valid: ${blocks} block(s) on ${pages} page(s).`);
    },
  },
};

export default defineConfig({
  // The address comes from src/data/team.json ("website").
  site: team.website,
  integrations: [jsonLdCheck],
  // Old addresses (from the Wix site) → new pages: src/data/redirects.json, [{ "from": "/old", "to": "/new/" }].
  // Static output: each becomes a page that sends visitors and crawlers on at once (Google treats it
  // as a permanent redirect). scripts/check-site.mjs fails the build if a target doesn't exist.
  redirects: Object.fromEntries(oldUrls.map((r) => [r.from, { status: 301, destination: r.to }])),
  // Polish at "/", English at "/en/". No automatic redirects based on browser language.
  i18n: {
    defaultLocale: 'pl',
    locales: ['pl', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  image: {
    responsiveStyles: false,
  },
  scopedStyleStrategy: 'class',
  build: {
    inlineStylesheets: 'always',
  },
});
