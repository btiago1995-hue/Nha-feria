import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAllPosts } from '../data/blog'
import { Clock, ArrowRight, Menu, X, MapPin } from 'lucide-react'

// ─── JSON-LD ──────────────────────────────────────────────────────────────────
function buildJsonLd(posts) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://nhaferia.cv' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://nhaferia.cv/blog' },
        ],
      },
      {
        '@type': 'Blog',
        name: 'Blog — Nha Féria',
        url: 'https://nhaferia.cv/blog',
        description: 'Guias, legislação laboral e melhores práticas para empresas cabo-verdianas.',
        blogPost: posts.map((p) => ({
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.description,
          datePublished: p.date,
          url: `https://nhaferia.cv/blog/${p.slug}`,
        })),
      },
    ],
  }
}

export default function BlogPage() {
  const navigate = useNavigate()
  const [mobileNav, setMobileNav] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const posts = getAllPosts()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(buildJsonLd(posts))
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [posts])

  return (
    <main className="min-h-screen bg-white text-text font-sans">

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white shadow-sm border-b border-border' : 'bg-white/95 backdrop-blur-sm'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-xl shadow-md shadow-accent/25 flex-shrink-0">
              🌴
            </div>
            <span className="font-display font-bold text-[15px] text-text tracking-tight">
              Nha <span className="text-accent">Féria</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
            <Link to="/" className="text-sm text-text-muted hover:text-text transition-colors font-medium">
              Início
            </Link>
            <Link to="/ilhas" className="text-sm text-text-muted hover:text-text transition-colors font-medium">
              Ilhas
            </Link>
            <Link to="/blog" className="text-sm text-text font-semibold transition-colors">
              Blog
            </Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="text-sm font-semibold text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              Iniciar Sessão
            </button>
            <button
              onClick={() => navigate('/login?signup=true', { replace: true })}
              className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-light transition-colors cursor-pointer active:scale-95 shadow-sm"
            >
              Começar Grátis
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNav((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-bg transition-colors cursor-pointer"
            aria-label="Menu de navegação"
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileNav && (
          <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setMobileNav(false)} className="block text-sm font-medium text-text-muted hover:text-text transition-colors py-2">
              Início
            </Link>
            <Link to="/ilhas" onClick={() => setMobileNav(false)} className="block text-sm font-medium text-text-muted hover:text-text transition-colors py-2">
              Ilhas
            </Link>
            <Link to="/blog" onClick={() => setMobileNav(false)} className="block text-sm font-semibold text-text py-2">
              Blog
            </Link>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-2.5 text-sm font-semibold text-text border border-border rounded-lg hover:bg-bg transition-colors cursor-pointer"
              >
                Iniciar Sessão
              </button>
              <button
                onClick={() => navigate('/login?signup=true', { replace: true })}
                className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-light transition-colors cursor-pointer active:scale-95"
              >
                Começar Grátis
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── BREADCRUMB ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
          <Link to="/" className="hover:text-text transition-colors">Início</Link>
          <span>/</span>
          <span className="text-text font-medium">Blog</span>
        </nav>
      </div>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-10 pb-16">
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#1A3A5C 1px, transparent 1px), linear-gradient(90deg, #1A3A5C 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-light/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-text mb-5">
            Blog — Gestão de Recursos Humanos em Cabo Verde
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
            Guias, legislação laboral e melhores práticas para empresas cabo-verdianas.
          </p>
        </div>
      </section>

      {/* ── GRID DE ARTIGOS ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-border p-6 bg-white hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock size={11} />
                    {post.readTime}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-text mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-text-muted mb-4 leading-relaxed">{post.description}</p>
                <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ler artigo <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LINK PARA ILHAS ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-5">
            <MapPin size={13} className="text-primary" />
            <span className="text-xs font-semibold text-primary">Cabo Verde — 9 Ilhas</span>
          </div>
          <h2 className="text-2xl font-bold text-text mb-3">
            A Nha Féria serve todas as ilhas de Cabo Verde
          </h2>
          <p className="text-sm text-text-muted mb-6 leading-relaxed max-w-lg mx-auto">
            Feriados municipais por ilha, equipas distribuídas e conformidade com o Código Laboral
            — tudo tratado automaticamente.
          </p>
          <Link
            to="/ilhas"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            Ver soluções por ilha <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0d2238] text-white/40 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-lg shadow-md shadow-accent/20 flex-shrink-0">
                  🌴
                </div>
                <span className="font-display font-bold text-sm text-white">
                  Nha <span className="text-accent">Féria</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed max-w-xs">
                Gestão de férias e licenças para empresas cabo-verdianas.
                Simples, conforme e em tempo real.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
              <Link to="/" className="hover:text-white/70 transition-colors py-0.5">Início</Link>
              <Link to="/ilhas" className="hover:text-white/70 transition-colors py-0.5">Ilhas</Link>
              <Link to="/blog" className="hover:text-white/70 transition-colors py-0.5">Blog</Link>
              <Link to="/privacy" className="hover:text-white/70 transition-colors py-0.5">Privacidade</Link>
              <Link to="/terms" className="hover:text-white/70 transition-colors py-0.5">Termos</Link>
              <Link to="/contacto" className="hover:text-white/70 transition-colors py-0.5">Contacto</Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>© {new Date().getFullYear()} Nha Féria by Servyx Labs. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1.5">
              <Clock size={11} /> Feito com <span className="text-white/60">♥</span> em Cabo Verde
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
