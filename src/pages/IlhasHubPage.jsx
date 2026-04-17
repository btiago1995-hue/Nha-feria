import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ILHAS } from '../data/ilhas'
import { MapPin, ArrowRight, ChevronDown, Menu, X, Clock } from 'lucide-react'

// ─── Logo mark (same as LandingPage) ─────────────────────────────────────────
const LogoMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#1A3A5C" />
    <path d="M16 6C16 6 10 10 10 16C10 20 12.5 22 16 22C19.5 22 22 20 22 16C22 10 16 6 16 6Z" fill="#F59E0B" opacity="0.9" />
    <path d="M16 22V27M13 27H19" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 16H22" stroke="white" strokeWidth="1" opacity="0.3" />
  </svg>
)

const REGIONAL_FAQS = [
  {
    q: 'Como gerir férias de colaboradores em ilhas diferentes de Cabo Verde?',
    a: 'A Nha Féria foi desenhada para equipas distribuídas pelo arquipélago. Cada colaborador tem o seu perfil com a ilha correspondente, e os feriados municipais são aplicados automaticamente — seja em Santiago, São Vicente ou Sal. Gestor e colaboradores acedem à plataforma de qualquer ilha, em qualquer dispositivo.',
  },
  {
    q: 'Os feriados de cada ilha são calculados automaticamente?',
    a: 'Sim. A Nha Féria tem integrada a base de dados completa de feriados nacionais e municipais de Cabo Verde, actualizada por ilha. O sistema calcula automaticamente os dias úteis de férias sem contar feriados da ilha do colaborador.',
  },
  {
    q: 'A Nha Féria serve empresas com sede em Praia mas colaboradores em outras ilhas?',
    a: 'Sim. Muitas empresas cabo-verdianas têm sede em Santiago ou São Vicente mas têm colaboradores noutras ilhas. A Nha Féria gere esta dispersão geograficamente — cada colaborador pertence à sua ilha, e o calendário de equipa mostra todas as ausências em tempo real, independentemente da localização.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://nhaferia.cv' },
        { '@type': 'ListItem', position: 2, name: 'Ilhas', item: 'https://nhaferia.cv/ilhas' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: REGIONAL_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    },
  ],
}

export default function IlhasHubPage() {
  const navigate = useNavigate()
  const [mobileNav, setMobileNav] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(jsonLd)
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [])

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
            <Link to="/ilhas" className="text-sm text-text font-semibold transition-colors">
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
            <Link to="/ilhas" onClick={() => setMobileNav(false)} className="block text-sm font-semibold text-text py-2">
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

      {/* ── BREADCRUMB ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
          <Link to="/" className="hover:text-text transition-colors">Início</Link>
          <span>/</span>
          <span className="text-text font-medium">Ilhas</span>
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
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-6">
            <MapPin size={13} className="text-primary" />
            <span className="text-xs font-semibold text-primary">Cabo Verde — 9 Ilhas</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-text mb-5">
            Gestão de Férias por Ilha em Cabo Verde
          </h1>
          <p className="text-lg text-text-muted mb-4 leading-relaxed">
            Cabo Verde é um arquipélago de 9 ilhas habitadas, cada uma com os seus feriados municipais,
            empresas e equipas distribuídas. Gerir ausências neste contexto exige uma ferramenta que
            entende a realidade do arquipélago.
          </p>
          <p className="text-base text-text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
            A Nha Féria foi construída especificamente para Cabo Verde — com feriados por ilha integrados,
            conformidade com o Código Laboral e acesso de qualquer dispositivo, em qualquer ilha.
            Escolhe a tua ilha para saber mais.
          </p>
          <button
            onClick={() => navigate('/login?signup=true', { replace: true })}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-light transition-colors shadow-lg cursor-pointer active:scale-95"
          >
            Começa grátis
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── GRID DE ILHAS ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-3">Arquipélago</p>
            <h2 className="text-2xl md:text-3xl font-bold text-text">As 9 ilhas de Cabo Verde</h2>
            <p className="text-text-muted mt-2 text-sm max-w-lg mx-auto">
              Cada ilha tem os seus feriados municipais. A Nha Féria aplica-os automaticamente para cada colaborador.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ILHAS.map((ilha) => (
              <Link
                key={ilha.slug}
                to={`/ilhas/${ilha.slug}`}
                className="group block rounded-2xl border border-border p-6 bg-white hover:border-primary hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{ilha.emoji}</div>
                <h2 className="text-lg font-bold text-text mb-0.5">{ilha.name}</h2>
                <p className="text-sm text-text-muted mb-3">{ilha.cidade}</p>
                <p className="text-sm text-text-muted mb-4 leading-relaxed">{ilha.descricao}</p>
                <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver solução <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ REGIONAL ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-2xl font-bold text-text">Perguntas sobre gestão multi-ilha</h2>
          </div>

          <div className="space-y-2.5">
            {REGIONAL_FAQS.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg transition-colors cursor-pointer"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-text text-sm pr-4 leading-snug">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-text-muted leading-relaxed border-t border-border bg-bg/50">
                    <p className="pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
            🌴
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Gere a tua equipa em todo o arquipélago
          </h2>
          <p className="text-white/60 text-sm mb-10 max-w-lg mx-auto leading-relaxed">
            De Santiago a Brava, a Nha Féria aplica automaticamente os feriados de cada ilha
            e mantém toda a equipa sincronizada. Começa grátis hoje.
          </p>
          <button
            onClick={() => navigate('/login?signup=true', { replace: true })}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-primary text-sm font-bold rounded-lg hover:bg-accent-hover transition-colors shadow-lg cursor-pointer active:scale-95"
          >
            Começa grátis — Sem Cartão
            <ArrowRight size={15} />
          </button>
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
