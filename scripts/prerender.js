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
  {
    path: '/contacto', out: 'dist/contacto/index.html',
    title: 'Contacto — Nha Féria',
    description: 'Entre em contacto com a equipa Nha Féria. Suporte técnico, vendas e questões comerciais sobre gestão de férias em Cabo Verde.',
  },
  {
    path: '/privacy',  out: 'dist/privacy/index.html',
    title: 'Política de Privacidade — Nha Féria',
    description: 'Política de privacidade e proteção de dados pessoais da plataforma Nha Féria, software de gestão de férias para empresas em Cabo Verde.',
  },
  {
    path: '/terms',    out: 'dist/terms/index.html',
    title: 'Termos de Uso — Nha Féria',
    description: 'Termos e condições de uso da plataforma Nha Féria, software de gestão de férias e licenças para empresas em Cabo Verde.',
  },
  {
    path: '/ilhas',
    out: 'dist/ilhas/index.html',
    title: 'Gestão de Férias por Ilha em Cabo Verde — Nha Féria',
    description: 'Software de gestão de férias para empresas em todas as ilhas de Cabo Verde. Santiago, São Vicente, Sal, Boavista e mais. Grátis até 5 colaboradores.',
  },
  { path: '/ilhas/santiago',    out: 'dist/ilhas/santiago/index.html',    title: 'Gestão de Férias em Santiago — Nha Féria',      description: 'Software de gestão de férias para empresas em Santiago e Praia. Conformidade com o Código Laboral de Cabo Verde. Grátis até 5 colaboradores.' },
  { path: '/ilhas/sao-vicente', out: 'dist/ilhas/sao-vicente/index.html', title: 'Gestão de Férias em São Vicente — Nha Féria',   description: 'Software de gestão de férias para empresas em São Vicente e Mindelo. Pedidos online, aprovações e calendário em tempo real. Grátis até 5 colaboradores.' },
  { path: '/ilhas/sal',         out: 'dist/ilhas/sal/index.html',         title: 'Gestão de Férias no Sal — Nha Féria',           description: 'Leave management software for hotels and businesses in Sal island, Cape Verde. Online requests, one-click approvals. Free up to 5 employees.' },
  { path: '/ilhas/boavista',    out: 'dist/ilhas/boavista/index.html',    title: 'Gestão de Férias na Boavista — Nha Féria',      description: 'Leave management software for hotels and tourism businesses in Boavista, Cape Verde. Real-time team calendar. Free up to 5 employees.' },
  { path: '/ilhas/fogo',        out: 'dist/ilhas/fogo/index.html',        title: 'Gestão de Férias no Fogo — Nha Féria',          description: 'Software de gestão de férias para empresas no Fogo e São Filipe. Conformidade com o Código Laboral. Grátis até 5 colaboradores.' },
  { path: '/ilhas/santo-antao', out: 'dist/ilhas/santo-antao/index.html', title: 'Gestão de Férias em Santo Antão — Nha Féria',   description: 'Software de gestão de férias para empresas em Santo Antão. Feriados por ilha, calendário de equipa e conformidade legal. Grátis até 5 colaboradores.' },
  { path: '/ilhas/sao-nicolau', out: 'dist/ilhas/sao-nicolau/index.html', title: 'Gestão de Férias em São Nicolau — Nha Féria',   description: 'Software de gestão de férias para empresas em São Nicolau. Pedidos online e aprovações com um clique. Grátis até 5 colaboradores.' },
  { path: '/ilhas/maio',        out: 'dist/ilhas/maio/index.html',        title: 'Gestão de Férias no Maio — Nha Féria',          description: 'Software de gestão de férias para empresas no Maio. Calendário de equipa em tempo real e conformidade com a lei cabo-verdiana. Grátis até 5 colaboradores.' },
  { path: '/ilhas/brava',       out: 'dist/ilhas/brava/index.html',       title: 'Gestão de Férias na Brava — Nha Féria',         description: 'Software de gestão de férias para empresas na Brava. Pedidos online, aprovações e saldo automático de férias. Grátis até 5 colaboradores.' },
  {
    path: '/blog',
    out: 'dist/blog/index.html',
    title: 'Blog — Gestão de RH e Férias em Cabo Verde | Nha Féria',
    description: 'Guias sobre gestão de férias, Código Laboral de Cabo Verde e melhores práticas de RH para empresas cabo-verdianas.',
  },
  { path: '/blog/gestao-ferias-cabo-verde', out: 'dist/blog/gestao-ferias-cabo-verde/index.html', title: 'Gestão de Férias em Cabo Verde: Guia Completo — Nha Féria', description: 'Guia completo sobre gestão de férias para empresas em Cabo Verde. Código Laboral, feriados por ilha e software de gestão.' },
  { path: '/blog/codigo-laboral-cabo-verde-ferias', out: 'dist/blog/codigo-laboral-cabo-verde-ferias/index.html', title: 'Código Laboral de Cabo Verde: Direito a Férias — Nha Féria', description: 'Tudo sobre o direito a férias no Código Laboral de Cabo Verde (Lei n.º 41/VIII/2013): 22 dias úteis, feriados e obrigações legais.' },
  { path: '/blog/gestao-ferias-empresas-praia-santiago', out: 'dist/blog/gestao-ferias-empresas-praia-santiago/index.html', title: 'Gestão de Férias para Empresas em Praia, Santiago — Nha Féria', description: 'Como gerir férias e licenças na capital de Cabo Verde. Soluções digitais para PMEs em Praia e Santiago.' },
  { path: '/blog/software-rh-mindelo-sao-vicente', out: 'dist/blog/software-rh-mindelo-sao-vicente/index.html', title: 'Software de RH para Empresas em Mindelo, São Vicente — Nha Féria', description: 'Software de gestão de férias para empresas em Mindelo e São Vicente. Sazonalidade do Carnaval e gestão de equipas.' },
  { path: '/blog/ferias-hoteis-turismo-sal-boavista', out: 'dist/blog/ferias-hoteis-turismo-sal-boavista/index.html', title: 'Gestão de Férias em Hotéis no Sal e Boavista — Nha Féria', description: 'Leave management for hotels and resorts in Sal and Boavista, Cape Verde. Manage seasonal staff and holiday requests easily.' },
  { path: '/blog/ferias-equipas-distribuidas-ilhas-cabo-verde', out: 'dist/blog/ferias-equipas-distribuidas-ilhas-cabo-verde/index.html', title: 'Férias com Equipas Distribuídas pelas Ilhas — Nha Féria', description: 'Como gerir férias de colaboradores distribuídos pelas ilhas de Cabo Verde. Feriados por ilha, visibilidade e aprovação à distância.' },
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
      let output = template.replace(
        '<div id="root"></div>',
        `<div id="root">${html}</div>`
      );

      // Inject per-page <title> and <meta description> so sub-pages
      // are indexed with unique metadata instead of the homepage defaults.
      if (route.title) {
        output = output.replace(
          /<title>[^<]*<\/title>/,
          `<title>${route.title}</title>`
        );
      }
      if (route.description) {
        output = output.replace(
          /(<meta name="description" content=")[^"]*(")/,
          `$1${route.description}$2`
        );
      }
      if (route.path !== '/') {
        output = output.replace(
          /<link rel="canonical" href="[^"]*"\/>/,
          `<link rel="canonical" href="https://nhaferia.cv${route.path}"/>`
        );
      }

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
