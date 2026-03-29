/**
 * Prerender script — runs after `vite build`.
 * Renders LandingPage to HTML and injects it into dist/index.html
 * so Google can index content without executing JavaScript.
 */
import { createServer } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

async function prerender() {
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [react(), tailwindcss()],
    // Suppress CSS output noise during SSR
    logLevel: 'error',
  });

  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
    const html = render();

    const distHtml = resolve(root, 'dist/index.html');
    const template = readFileSync(distHtml, 'utf-8');
    const output = template.replace(
      '<div id="root"></div>',
      `<div id="root">${html}</div>`
    );
    writeFileSync(distHtml, output);
    console.log('✓ Landing page prerendered into dist/index.html');
  } finally {
    await vite.close();
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
