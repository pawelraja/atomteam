// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.atomteam.pl',
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
