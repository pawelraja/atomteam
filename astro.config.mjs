// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import team from './src/data/team.json' with { type: 'json' };
import { checkDir } from './scripts/check-jsonld.mjs';

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
