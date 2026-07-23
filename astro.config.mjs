import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.normacontabil.com',
  // Site estático + rotas sob demanda (/api/contato, /api/newsletter) rodam
  // como Pages Functions no Cloudflare.
  adapter: cloudflare(),
  // Inlina o CSS no <head> — elimina request render-blocking (melhora FCP/LCP).
  build: { inlineStylesheets: 'always' },
  // sitemap.xml automático (exclui as rotas de API, que não são páginas).
  integrations: [sitemap({ filter: (page) => !page.includes('/api/') })],
});
