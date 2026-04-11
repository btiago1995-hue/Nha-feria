/**
 * Prerender script — runs after `vite build`.
 * Renders each public page to HTML and writes it into dist/ so crawlers
 * (Google, ChatGPT, Perplexity) receive real content without executing JS.
 *
 * Pages rendered:
 *   /           → dist/index.html         (replaces the empty SPA shell)
 *   /contacto   → dist/contacto/index.html
 *   /privacy    → dist/privacy/index.html
 *   /terms      → dist/terms/index.html
 */
import { createServer } from 'vite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const ROUTES = [
  { path: '/',         out: 'dist/index.html' },
  { path: '/contacto', out: 'dist/contacto/index.html' },
  { path: '/privacy',  out: 'dist/privacy/index.html' },
  { path: '/terms',    out: 'dist/terms/index.html' },
];

async function prerender() {
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [react(), tailwindcss()],
    logLevel: 'error',
  });

  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');

    // Read the built index.html as the base template for all pages
    const template = readFileSync(resolve(root, 'dist/index.html'), 'utf-8');

    for (const route of ROUTES) {
      const html = render(route.path);
      const output = template.replace(
        '<div id="root"></div>',
        `<div id="root">${html}</div>`
      );

      const outPath = resolve(root, route.out);
      // Ensure the directory exists (e.g. dist/contacto/)
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, output);
      console.log(`✓ Prerendered ${route.path} → ${route.out}`);
    }
  } finally {
    await vite.close();
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
