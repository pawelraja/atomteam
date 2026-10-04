// @ts-check
import { defineConfig } from 'astro/config';
import team from './src/data/team.json' with { type: 'json' };

export default defineConfig({
  // The address comes from src/data/team.json ("website").
  site: team.website,
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
