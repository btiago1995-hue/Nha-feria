import React, { useState, useEffect } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { getIlhaBySlug, ILHAS } from '../data/ilhas'
import { ArrowLeft, CheckCircle2, CalendarDays, FileText, ChevronDown, ArrowRight, Menu, X, Clock } from 'lucide-react'

export default function IlhaSpokePage() {
  const { ilha: slug } = useParams()
  const navigate = useNavigate()
  const ilha = getIlhaBySlug(slug)

  const [mobileNav, setMobileNav] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const outrasIlhas = ILHAS.filter((i) => i.slug !== slug).slice(0, 3)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!ilha) return

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://nhaferia.cv' },
            { '@type': 'ListItem', position: 2, name: 'Ilhas', item: 'https://nhaferia.cv/ilhas' },
            { '@type': 'ListItem', position: 3, name: ilha.name, item: `https://nhaferia.cv/ilhas/${ilha.slug}` },
          ],
        },
        {
          '@type': 'LocalBusiness',
          name: 'Nha Féria',
          url: 'https://nhaferia.cv',
          areaServed: `${ilha.name}, Cabo Verde`,
        },
        {
          '@type': 'FAQPage',
          mainEntity: ilha.faq.map((faq) => ({
            '@type': 'Question',
            name: faq.question ?? faq.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer ?? faq.a,
            },
          })),
        },
      ],
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(jsonLd)
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [ilha])

  if (!ilha) return <Navigate to="/ilhas" replace />

  const BENEFICIOS = [
    {
      icon: CalendarDays,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      title: `Feriados de ${ilha.name} integrados`,
      desc: `A base de dados de feriados nacionais e municipais de ${ilha.name} está integrada na plataforma. Os dias úteis de férias são calculados automaticamente, sem esforço manual.`,
    },
    {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      title: 'Calendário de equipa em tempo real',
      desc: 'Visualiza todas as ausências da equipa num só ecrã. Aprova pedidos com um clique e evita conflitos de cobertura — de qualquer dispositivo, em qualquer ilha.',
    },
    {
      icon: FileText,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      title: 'Conformidade com o Código Laboral',
      desc: 'A Nha Féria foi construída para respeitar o Código Laboral de Cabo Verde — 22 dias úteis de férias por lei, cálculo automático de acréscimos e relatórios prontos para auditoria.',
    },
  ]

  return (
    <main className="min-h-screen bg-white text-text font-sans">

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
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

      {/* ── BREADCRUMB ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
          <Link to="/" className="hover:text-text transition-colors">Início</Link>
          <span>/</span>
          <Link to="/ilhas" className="hover:text-text transition-colors">Ilhas</Link>
          <span>/</span>
          <span className="text-text font-medium">{ilha.name}</span>
        </nav>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
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
          <div className="text-5xl mb-4" aria-hidden="true">{ilha.emoji}</div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-text mb-5">
            Gestão de Férias em {ilha.name} — {ilha.cidade}
          </h1>
          <p className="text-lg text-text-muted mb-4 leading-relaxed">
            {ilha.intro[0]}
          </p>
          <p className="text-base text-text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
            {ilha.intro[1]}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login?signup=true', { replace: true })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-light transition-colors shadow-lg cursor-pointer active:scale-95"
            >
              Experimenta grátis em {ilha.name}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── BENEFÍCIOS ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-2xl md:text-3xl font-bold text-text">
              O que a Nha Féria oferece em {ilha.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BENEFICIOS.map((b) => {
              const Icon = b.icon
              return (
                <div key={b.title} className="bg-white rounded-2xl p-7 border border-border" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
                  <div className={`w-10 h-10 ${b.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={20} className={b.color} />
                  </div>
                  <h3 className="font-bold text-text mb-2 text-[15px]">{b.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{b.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ LOCAL ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-2xl font-bold text-text">Perguntas sobre {ilha.name}</h2>
          </div>

          <div className="space-y-2.5">
            {ilha.faq.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg transition-colors cursor-pointer"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-text text-sm pr-4 leading-snug">{faq.question ?? faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-text-muted leading-relaxed border-t border-border bg-bg/50">
                    <p className="pt-4">{faq.answer ?? faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-4xl mb-6" aria-hidden="true">{ilha.emoji}</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Experimenta grátis em {ilha.name}
          </h2>
          <p className="text-white/60 text-sm mb-10 max-w-lg mx-auto leading-relaxed">
            Sem cartão de crédito. Sem burocracia. A Nha Féria aplica automaticamente os feriados de {ilha.name}
            e mantém a tua equipa sincronizada em tempo real.
          </p>
          <button
            onClick={() => navigate('/login?signup=true', { replace: true })}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-primary text-sm font-bold rounded-lg hover:bg-accent-hover transition-colors shadow-lg cursor-pointer active:scale-95"
          >
            Começar Grátis Agora
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── OUTRAS ILHAS ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-1">Arquipélago</p>
              <h2 className="text-xl font-bold text-text">Outras ilhas</h2>
            </div>
            <Link
              to="/ilhas"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft size={14} /> Ver todas as ilhas
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {outrasIlhas.map((outra) => (
              <Link
                key={outra.slug}
                to={`/ilhas/${outra.slug}`}
                className="group block rounded-2xl border border-border p-6 bg-white hover:border-primary hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{outra.emoji}</div>
                <h3 className="text-base font-bold text-text mb-0.5">{outra.name}</h3>
                <p className="text-sm text-text-muted mb-3">{outra.cidade}</p>
                <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver solução <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/ilhas"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text transition-colors"
            >
              <ArrowLeft size={14} /> Ver todas as ilhas
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
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
