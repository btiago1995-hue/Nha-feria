import React, { useEffect } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { getPostBySlug, getAllPosts } from '../data/blog'
import { Clock, ArrowLeft, ArrowRight, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function BlogPostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [mobileNav, setMobileNav] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const post = getPostBySlug(slug)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // JSON-LD Article schema
  useEffect(() => {
    if (!post) return
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://nhaferia.cv' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://nhaferia.cv/blog' },
            { '@type': 'ListItem', position: 3, name: post.title, item: `https://nhaferia.cv/blog/${post.slug}` },
          ],
        },
        {
          '@type': 'Article',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          url: `https://nhaferia.cv/blog/${post.slug}`,
          publisher: {
            '@type': 'Organization',
            name: 'Nha Féria',
            url: 'https://nhaferia.cv',
          },
          author: {
            '@type': 'Organization',
            name: 'Servyx Labs, Lda.',
          },
        },
      ],
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(jsonLd)
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [post])

  if (!post) return <Navigate to="/blog" replace />

  const allPosts = getAllPosts()
  const relatedPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 3)

  // Format date for display
  const formattedDate = new Date(post.date).toLocaleDateString('pt-CV', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

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
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted flex-wrap">
          <Link to="/" className="hover:text-text transition-colors">Início</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-text transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-text font-medium truncate max-w-[200px] sm:max-w-none">{post.title}</span>
        </nav>
      </div>

      {/* ── ARTIGO ──────────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-8 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Todos os artigos
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-xs text-text-muted flex items-center gap-1.5">
              <Clock size={12} />
              {post.readTime}
            </span>
            <span className="text-xs text-text-muted">{formattedDate}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-text leading-[1.15] tracking-tight mb-8">
            {post.title}
          </h1>

          {/* Content */}
          <div
            className="prose prose-slate max-w-none text-[15px] leading-relaxed
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-8 [&_h2]:mb-3
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-text [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:text-text-muted [&_p]:mb-4
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:text-text-muted
              [&_li]:mb-1
              [&_strong]:text-text [&_strong]:font-semibold
              [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
              [&_a:hover]:opacity-80"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA inline */}
          <div className="mt-12 rounded-2xl bg-primary/5 border border-primary/10 p-6 text-center">
            <p className="text-sm font-semibold text-text mb-1">Experimenta a Nha Féria gratuitamente</p>
            <p className="text-xs text-text-muted mb-4">Plano Starter gratuito para equipas até 5 pessoas. Sem cartão de crédito.</p>
            <button
              onClick={() => navigate('/login?signup=true', { replace: true })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-light transition-colors cursor-pointer active:scale-95 shadow-sm"
            >
              Começar Grátis <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── ARTIGOS RELACIONADOS ─────────────────────────────────────────────── */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-bg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-bold text-text mb-8">Outros artigos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedPosts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group block rounded-2xl border border-border p-6 bg-white hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={11} />
                      {p.readTime}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text mb-2 group-hover:text-primary transition-colors leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-sm text-text-muted mb-4 leading-relaxed line-clamp-2">{p.description}</p>
                  <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ler artigo <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
