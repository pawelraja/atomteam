// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.atomteam.pl',
  image: {
    responsiveStyles: false,
  },
  build: {
    inlineStylesheets: 'always',
  },
});
