import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays, Users, Bell, CheckCircle2, ArrowRight,
  FileText, Shield, Zap, ChevronDown, Menu, X,
  Clock, TrendingUp, Award, MessageSquare, MapPin, Phone, Mail,
} from 'lucide-react';

// ─── Logo SVG ─────────────────────────────────────────────────────────────────
const LogoMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#1A3A5C" />
    <path d="M16 6C16 6 10 10 10 16C10 20 12.5 22 16 22C19.5 22 22 20 22 16C22 10 16 6 16 6Z" fill="#F59E0B" opacity="0.9" />
    <path d="M16 22V27M13 27H19" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 16H22" stroke="white" strokeWidth="1" opacity="0.3" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Como Funciona',   href: '#como-funciona'   },
  { label: 'Preços',          href: '#precos'           },
  { label: 'FAQ',             href: '#faq'              },
];

const STATS = [
  { value: '22', label: 'Dias de férias garantidos por lei', unit: 'dias' },
  { value: '100%', label: 'Conforme com o código laboral CV', unit: '' },
  { value: '< 1min', label: 'Para submeter um pedido', unit: '' },
];

const FEATURES = [
  {
    icon: CalendarDays,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: 'Calendário de Equipa',
    desc: 'Vê quem está de férias, quem está disponível e planifica sem conflitos — em tempo real.',
  },
  {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Aprovação com Um Clique',
    desc: 'Gestores aprovam ou recusam pedidos instantaneamente. Notificação automática ao colaborador.',
  },
  {
    icon: Bell,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Notificações em Tempo Real',
    desc: 'Alertas imediatos para novos pedidos, mudanças de estado e lembretes automáticos.',
  },
  {
    icon: Users,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Diretório de Colaboradores',
    desc: 'Gestão centralizada da equipa com onboarding por link de convite — via email ou WhatsApp.',
  },
  {
    icon: FileText,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    title: 'Relatórios de Conformidade',
    desc: 'Exporta mapas anuais de férias alinhados com a legislação cabo-verdiana.',
  },
  {
    icon: Shield,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    title: 'Dados Seguros',
    desc: 'Alojamento europeu, encriptação total e controlo de acesso por função.',
  },
];

const STEPS = [
  {
    num: '01',
    icon: Users,
    title: 'O gestor convida a equipa',
    desc: 'Cria os perfis dos colaboradores e envia o link de convite por WhatsApp ou email. Conta criada em menos de 1 minuto.',
  },
  {
    num: '02',
    icon: CalendarDays,
    title: 'O colaborador pede férias',
    desc: 'Escolhe as datas num calendário visual. Os dias úteis e o saldo disponível calculam-se automaticamente.',
  },
  {
    num: '03',
    icon: CheckCircle2,
    title: 'O gestor aprova',
    desc: 'Recebe uma notificação, verifica sobreposições e aprova ou recusa com um clique.',
  },
  {
    num: '04',
    icon: TrendingUp,
    title: 'Tudo registado',
    desc: 'Saldo atualizado, calendário sincronizado e historial disponível para auditoria e conformidade.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Grátis',
    period: 'para sempre',
    desc: 'Para equipas a começar',
    features: [
      'Até 5 colaboradores',
      'Calendário de equipa',
      'Aprovação de pedidos',
      'Suporte por email',
    ],
    cta: 'Começar Grátis',
    highlight: false,
    free: true,
  },
  {
    name: 'Pro',
    price: '3.200$',
    period: '/mês',
    desc: 'Para empresas em crescimento',
    features: [
      'Até 50 colaboradores',
      'Relatórios de conformidade',
      'Notificações em tempo real',
      'Convites por link',
      'Suporte prioritário',
    ],
    cta: 'Iniciar 14 Dias Grátis',
    highlight: true,
    badge: 'Mais Popular',
  },
  {
    name: 'Enterprise',
    price: '10.900$',
    period: '/mês',
    desc: 'Para grandes organizações',
    features: [
      'Colaboradores ilimitados',
      'SSO / LDAP (Em breve)',
      'API dedicada (Em breve)',
      'SLA garantido',
      'Gerente de conta dedicado',
    ],
    cta: 'Falar com Vendas',
    highlight: false,
  },
];

const FAQS = [
  {
    q: 'A Nha Féria respeita a legislação cabo-verdiana?',
    a: 'Sim. A plataforma foi construída especificamente para Cabo Verde, respeitando o direito a 22 dias úteis de férias por ano e as regras de acumulação e acréscimo previstas na lei.',
  },
  {
    q: 'Como convido a minha equipa?',
    a: 'Basta criar os perfis dos teus colaboradores e partilhar o link de convite por WhatsApp ou email. A criação de conta é feita em menos de 1 minuto, sem burocracia.',
  },
  {
    q: 'Os dados ficam guardados onde?',
    a: 'Todos os dados são alojados na Europa (Frankfurt) em infraestrutura Supabase com backups diários e encriptação em repouso e em trânsito.',
  },
  {
    q: 'Existe período de prova gratuito?',
    a: 'O plano Starter é gratuito para sempre até 5 colaboradores. O plano Pro inclui 14 dias de prova sem necessidade de cartão de crédito.',
  },
  {
    q: 'Posso exportar os dados?',
    a: 'Sim. Podes exportar mapas anuais de férias em CSV a qualquer momento, para arquivo ou auditoria interna.',
  },
];

// ─── Mini Dashboard Mockup ─────────────────────────────────────────────────────
const DashboardMockup = () => (
  <div className="relative w-full max-w-2xl mx-auto select-none" aria-hidden="true">
    {/* Browser chrome */}
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Browser bar */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 bg-red-400 rounded-full" />
          <span className="w-3 h-3 bg-amber-400 rounded-full" />
          <span className="w-3 h-3 bg-emerald-400 rounded-full" />
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 text-[11px] text-slate-400 font-mono">
          app.nhaferia.cv/dashboard
        </div>
      </div>
      {/* Dashboard content */}
      <div className="p-5 bg-slate-50 min-h-[260px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] text-slate-400">Bom dia,</div>
            <div className="text-sm font-bold text-slate-800">João Silva 👋</div>
          </div>
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Bell size={12} className="text-white" />
          </div>
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            { label: 'Pedidos Pendentes', val: '3', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Aprovados Este Mês', val: '7', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Equipa de Férias', val: '2', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-2.5`}>
              <p className="text-[9px] text-slate-500 mb-1 leading-tight">{c.label}</p>
              <p className={`text-xl font-bold ${c.color}`}>{c.val}</p>
            </div>
          ))}
        </div>
        {/* Balance bar */}
        <div className="bg-white border border-slate-100 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-slate-600">Saldo de Férias</span>
            <span className="text-[10px] font-bold text-primary">15 / 22 dias</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '68%' }} />
          </div>
          <p className="text-[9px] text-slate-400 mt-1.5">7 dias restantes este ano</p>
        </div>
      </div>
    </div>
    {/* Floating approval card */}
    <div className="absolute -bottom-4 -right-4 bg-white rounded-xl border border-slate-200 shadow-xl p-3 w-40">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={11} className="text-emerald-600" />
        </div>
        <span className="text-[10px] font-bold text-slate-700">Aprovado!</span>
      </div>
      <p className="text-[9px] text-slate-400">Ana Lima — 5 dias</p>
      <p className="text-[9px] text-slate-400">12–18 Abr 2026</p>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
const ANNUAL_DISCOUNT = 0.10; // 10%

const getPrice = (monthlyRaw, annual) => {
  if (monthlyRaw === 'Grátis') return { display: 'Grátis', period: 'para sempre' };
  const monthly = parseInt(monthlyRaw.replace(/\D/g, ''), 10);
  if (annual) {
    const yearly = Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT));
    return { display: `${yearly.toLocaleString('pt-CV')}$`, period: '/ano' };
  }
  return { display: monthlyRaw, period: '/mês' };
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq]   = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-text font-sans">

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white shadow-sm border-b border-border' : 'bg-white/95 backdrop-blur-sm'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-xl shadow-md shadow-accent/25 flex-shrink-0">
              🌴
            </div>
            <span className="font-display font-bold text-[15px] text-text tracking-tight">
              Nha <span className="text-accent">Féria</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-text-muted hover:text-text transition-colors font-medium py-3 flex items-center"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              Iniciar Sessão
            </button>
            <button
              onClick={() => navigate('/login?signup=true')}
              className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-light transition-colors cursor-pointer active:scale-95 shadow-sm"
            >
              Começar Grátis
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNav(v => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-bg transition-colors cursor-pointer"
            aria-label="Menu de navegação"
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileNav && (
          <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileNav(false)}
                className="block text-sm font-medium text-text-muted hover:text-text transition-colors py-2"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 text-sm font-semibold text-text border border-border rounded-lg hover:bg-bg transition-colors cursor-pointer"
              >
                Iniciar Sessão
              </button>
              <button
                onClick={() => navigate('/login?signup=true')}
                className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-light transition-colors cursor-pointer active:scale-95"
              >
                Começar Grátis
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-16 pb-0">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#1A3A5C 1px, transparent 1px), linear-gradient(90deg, #1A3A5C 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Color accent blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-light/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto pb-16 pt-6">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-text mb-5">
              Chega de{' '}
              <span className="relative inline-block">
                <span className="relative z-10">emails e Excel</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-accent/20 -z-0 rounded" />
              </span>
              {' '}para gerir férias
            </h1>

            {/* Subheading */}
            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              A Nha Féria digitaliza toda a gestão de licenças e férias da tua empresa —
              pedidos, aprovações e conformidade com a lei cabo-verdiana, tudo num só lugar.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <button
                onClick={() => navigate('/login?signup=true')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-light transition-colors shadow-lg cursor-pointer active:scale-95"
              >
                Começar Grátis — Sem Cartão
                <ArrowRight size={15} />
              </button>
              <a
                href="#como-funciona"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 border border-border text-sm font-semibold text-text rounded-lg hover:bg-bg transition-colors cursor-pointer"
              >
                Ver como funciona
                <ChevronDown size={14} />
              </a>
            </div>

            {/* Trust micro-copy */}
            <p className="text-xs text-text-light flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Plano Grátis disponível</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> 14 dias Pro sem compromisso</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Conforme com o código laboral CV</span>
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative max-w-2xl mx-auto pb-0 px-4 sm:px-0">
            <DashboardMockup />
          </div>
        </div>

        {/* Wave separator */}
        <div className="mt-20 relative h-16 overflow-hidden">
          <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z" fill="#F1F5F9" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="bg-bg py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-primary mb-1">{s.value}</div>
                <div className="text-xs text-text-muted font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ───────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Before */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8">
              <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-red-300 inline-block" /> Antes
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-5">O caos do método antigo</h3>
              <ul className="space-y-3">
                {[
                  'Emails perdidos com pedidos de férias',
                  'Folhas de Excel desatualizadas e sem controlo',
                  'Conflitos de equipa por falta de visibilidade',
                  'Conformidade legal incerta — risco real',
                  'Gestor sobrecarregado com aprovações manuais',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <X size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-emerald-300 inline-block" /> Com a Nha Féria
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-5">Controlo total, em segundos</h3>
              <ul className="space-y-3">
                {[
                  'Pedidos feitos num calendário visual, em segundos',
                  'Aprovações com um clique, notificações imediatas',
                  'Visibilidade da equipa toda num só ecrã',
                  'Conformidade automática com o código laboral CV',
                  'Gestor focado na equipa, não na burocracia',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24" style={{ background: '#EEF3F8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text">Tudo o que a tua equipa precisa</h2>
            <p className="text-text-muted mt-3 text-sm max-w-lg mx-auto">
              Uma plataforma completa, desenhada para a realidade das empresas cabo-verdianas.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-12 gap-4 auto-rows-auto">

            {/* Card 1 — Calendário (large, 7 cols) */}
            <div className="col-span-12 md:col-span-7 bg-white rounded-3xl p-8 overflow-hidden" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.06)' }}>
              <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-1">Calendário de Equipa</p>
              <h3 className="text-lg font-bold text-text mb-1">Visão total das ausências</h3>
              <p className="text-sm text-text-muted mb-6 max-w-xs">Vê quem está de férias, quem está disponível e planifica sem conflitos.</p>
              {/* Mini calendar mockup */}
              <div className="bg-slate-50 rounded-2xl p-4 select-none" aria-hidden="true">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700">Abril 2026</span>
                  <div className="flex gap-1">
                    {['S','T','Q','Q','S','S','D'].map((d, i) => (
                      <span key={i} className="w-8 h-6 flex items-center justify-center text-[10px] font-semibold text-slate-400">{d}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {[...Array(4)].map((_, row) =>
                    [...Array(7)].map((_, col) => {
                      const day = row * 7 + col + 1;
                      const isRange = day >= 7 && day <= 11;
                      const isStart = day === 7;
                      const isEnd   = day === 11;
                      const isToday = day === 14;
                      if (day > 28) return <div key={`${row}-${col}`} className="w-8 h-8" />;
                      return (
                        <div
                          key={`${row}-${col}`}
                          className={`w-8 h-8 flex items-center justify-center text-[11px] font-medium rounded-full transition-colors
                            ${isStart || isEnd ? 'bg-primary text-white font-bold' : ''}
                            ${isRange && !isStart && !isEnd ? 'bg-primary/10 text-primary rounded-none' : ''}
                            ${isToday && !isRange ? 'border border-primary text-primary font-bold rounded-full' : ''}
                            ${!isRange && !isToday ? 'text-slate-500' : ''}
                          `}
                        >
                          {day}
                        </div>
                      );
                    })
                  )}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span className="text-[10px] text-slate-500">Ana Lima</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                    <span className="text-[10px] text-slate-500">João Silva</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 — Aprovação (5 cols) */}
            <div className="col-span-12 md:col-span-5 bg-white rounded-3xl p-8" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.06)' }}>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Aprovação Instantânea</p>
              <h3 className="text-lg font-bold text-text mb-1">Um clique, resolvido</h3>
              <p className="text-sm text-text-muted mb-6">Gestores aprovam pedidos em segundos. Notificação imediata ao colaborador.</p>
              {/* Approval card mockup */}
              <div className="space-y-3 select-none" aria-hidden="true">
                {[
                  { name: 'Ana Lima',    dates: '7–11 Abr', days: '5 dias', status: 'approved' },
                  { name: 'Pedro Costa', dates: '21–25 Abr', days: '5 dias', status: 'pending'  },
                ].map(req => (
                  <div key={req.name} className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-[11px] font-bold text-primary">
                        {req.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-700">{req.name}</div>
                        <div className="text-[10px] text-slate-400">{req.dates} · {req.days}</div>
                      </div>
                    </div>
                    {req.status === 'approved' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={10} /> Aprovado
                      </span>
                    ) : (
                      <div className="flex gap-1.5">
                        <button className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer">✓</button>
                        <button className="w-7 h-7 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs cursor-pointer">✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 — Notificações (4 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-4 bg-white rounded-3xl p-7" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.06)' }}>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Notificações</p>
              <h3 className="text-base font-bold text-text mb-1">Tempo real</h3>
              <p className="text-sm text-text-muted mb-5">Alertas instantâneos para pedidos, aprovações e lembretes.</p>
              <div className="space-y-2 select-none" aria-hidden="true">
                {[
                  { icon: '🔔', msg: 'Novo pedido de Ana Lima', time: 'agora' },
                  { icon: '✅', msg: 'Férias aprovadas — João Silva', time: '2m' },
                  { icon: '📅', msg: 'Lembrete: 3 pedidos pendentes', time: '1h' },
                ].map((n, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                    <span className="text-base flex-shrink-0">{n.icon}</span>
                    <span className="text-[11px] text-slate-600 flex-1 leading-tight">{n.msg}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4 — Saldo (4 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-4 bg-white rounded-3xl p-7" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.06)' }}>
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Saldo de Férias</p>
              <h3 className="text-base font-bold text-text mb-1">22 dias por lei</h3>
              <p className="text-sm text-text-muted mb-5">Cálculo automático de dias úteis conforme o código laboral cabo-verdiano.</p>
              <div className="select-none" aria-hidden="true">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-bold text-primary">15</span>
                  <span className="text-xs text-slate-400">/ 22 dias</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full" style={{ width: '68%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Usados: 7 dias</span>
                  <span>Restam: 15 dias</span>
                </div>
              </div>
            </div>

            {/* Card 5 — Relatórios + Segurança (4 cols) */}
            <div className="col-span-12 sm:col-span-12 md:col-span-4 bg-white rounded-3xl p-7" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.06)' }}>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Conformidade</p>
              <h3 className="text-base font-bold text-text mb-1">Relatórios prontos</h3>
              <p className="text-sm text-text-muted mb-5">Exporta mapas anuais alinhados com a legislação cabo-verdiana.</p>
              <div className="space-y-2.5 select-none" aria-hidden="true">
                {[
                  { label: 'Mapa Anual de Férias 2026', ext: 'CSV', color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Relatório de Conformidade', ext: 'PDF', color: 'text-rose-600 bg-rose-50' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${f.color}`}>{f.ext}</span>
                    <span className="text-[11px] text-slate-600 flex-1">{f.label}</span>
                    <ArrowRight size={12} className="text-slate-300" />
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <Shield size={12} className="text-slate-400" />
                  <span className="text-[10px] text-slate-400">Dados encriptados · Alojamento UE</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="como-funciona" className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-3">Como Funciona</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text">Pronto em 4 passos simples</h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[22px] top-10 bottom-10 w-px bg-border hidden sm:block" aria-hidden="true" />

            <div className="space-y-10">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.num} className="flex gap-6 items-start relative">
                    {/* Step number + icon */}
                    <div className="flex-shrink-0 z-10">
                      <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                        <Icon size={18} className="text-white" />
                      </div>
                    </div>
                    {/* Content */}
                    <div className="bg-bg rounded-xl p-5 flex-1 border border-border">
                      <div className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Passo {s.num}</div>
                      <h3 className="font-bold text-text mb-1.5 text-[15px]">{s.title}</h3>
                      <p className="text-sm text-text-muted leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="precos" className="bg-bg py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-3">Preços</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text">Simples e transparente</h2>
            <p className="text-text-muted mt-3 text-sm">Sem surpresas. Cancela quando quiseres.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 mt-6 bg-bg border border-border rounded-full px-2 py-1.5">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${!annual ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${annual ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
              >
                Anual
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">-10%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map(p => (
              <div
                key={p.name}
                className={`rounded-2xl p-7 flex flex-col border relative transition-shadow ${
                  p.highlight
                    ? 'bg-primary border-primary shadow-2xl ring-2 ring-primary/20 md:-translate-y-2'
                    : 'bg-white border-border shadow-sm hover:shadow-md'
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-accent text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      <Award size={10} /> {p.badge}
                    </span>
                  </div>
                )}

                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${p.highlight ? 'text-white/50' : 'text-text-muted'}`}>
                  {p.name}
                </div>
                <div className={`text-sm mb-5 ${p.highlight ? 'text-white/60' : 'text-text-muted'}`}>{p.desc}</div>

                {(() => {
                  const { display, period } = getPrice(p.price, annual);
                  return (
                    <div className="flex items-baseline gap-1.5 mb-6">
                      <span className={`text-4xl font-bold tracking-tight ${p.highlight ? 'text-white' : 'text-text'}`}>
                        {display}
                      </span>
                      <span className={`text-sm ${p.highlight ? 'text-white/50' : 'text-text-muted'}`}>{period}</span>
                    </div>
                  );
                })()}

                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 size={14} className={`flex-shrink-0 mt-0.5 ${p.highlight ? 'text-accent' : 'text-emerald-500'}`} />
                      <span className={p.highlight ? 'text-white/80' : 'text-text-muted'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (p.name === 'Enterprise') {
                      window.location.href = 'mailto:vendas@nhaferia.cv?subject=Plano%20Enterprise%20%E2%80%94%20Nha%20F%C3%A9ria';
                    } else {
                      navigate('/login?signup=true');
                    }
                  }}
                  className={`w-full py-3 rounded-lg text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                    p.highlight
                      ? 'bg-accent text-primary hover:bg-accent-hover shadow-md'
                      : 'border border-border text-text hover:bg-bg'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-text-light mt-6">
            Preços em Escudos Cabo-verdianos (CVE). Sem IVA incluído.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-white py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-text">Perguntas frequentes</h2>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, i) => (
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

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={22} className="text-accent fill-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Pronto para acabar com<br className="hidden sm:block" /> a confusão de férias?
          </h2>
          <p className="text-white/60 text-sm mb-10 max-w-lg mx-auto leading-relaxed">
            Junta-te às empresas cabo-verdianas que já gerem as férias da equipa de forma profissional.
            Começa grátis hoje — sem cartão de crédito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login?signup=true')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-accent text-primary text-sm font-bold rounded-lg hover:bg-accent-hover transition-colors shadow-lg cursor-pointer active:scale-95"
            >
              Começar Grátis Agora
              <ArrowRight size={15} />
            </button>
            <a
              href="https://wa.me/2385856003"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors py-3.5 px-6 border border-white/10 rounded-lg"
            >
              <MessageSquare size={15} /> Falar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#0d2238] text-white/40 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-white/10">
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
            <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-xs">
              {[
                { label: 'Funcionalidades', href: '#funcionalidades' },
                { label: 'Como Funciona',   href: '#como-funciona'   },
                { label: 'Preços',          href: '#precos'           },
                { label: 'FAQ',             href: '#faq'              },
              ].map(l => (
                <a key={l.label} href={l.href} className="hover:text-white/70 transition-colors py-0.5">
                  {l.label}
                </a>
              ))}
              {[
                { label: 'Privacidade', to: '/privacy'   },
                { label: 'Termos',      to: '/terms'     },
                { label: 'Contacto',    to: '/contacto'  },
              ].map(l => (
                <Link key={l.label} to={l.to} className="hover:text-white/70 transition-colors py-0.5">
                  {l.label}
                </Link>
              ))}
            </div>

            {/* NAP */}
            <address className="not-italic text-xs space-y-2">
              <div className="flex items-start gap-2">
                <MapPin size={12} className="mt-0.5 flex-shrink-0 text-accent/60" />
                <span>Villa Nova, Rua 2 Lote 10<br />São Vicente, Cabo Verde</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={12} className="flex-shrink-0 text-accent/60" />
                <a href="tel:+2385856003" className="hover:text-white/70 transition-colors">+238 585 6003</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={12} className="flex-shrink-0 text-accent/60" />
                <a href="mailto:suporte@nhaferia.cv" className="hover:text-white/70 transition-colors">suporte@nhaferia.cv</a>
              </div>
            </address>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>© {new Date().getFullYear()} Nha Féria by Servyx Labs. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1.5">
              <Clock size={11} /> Feito com <span className="text-white/60">♥</span> em Cabo Verde
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
