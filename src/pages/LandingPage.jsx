import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Users, Bell, CheckCircle2, ArrowRight,
  LayoutDashboard, FileText, Shield, Zap, Star, ChevronDown,
  MessageSquare,
} from 'lucide-react';

const NAV_LINKS = ['Funcionalidades', 'Como Funciona', 'Preços', 'FAQ'];

const FEATURES = [
  {
    icon: <CalendarDays size={22} />,
    color: 'bg-blue-50 text-blue-600',
    title: 'Calendário de Equipa',
    desc: 'Vê quem está de férias, quem está disponível e planifica os recursos sem conflitos.',
  },
  {
    icon: <CheckCircle2 size={22} />,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Aprovação Instantânea',
    desc: 'Gestores aprovam ou recusam pedidos com um clique. Colaboradores recebem notificação imediata.',
  },
  {
    icon: <Bell size={22} />,
    color: 'bg-amber-50 text-amber-600',
    title: 'Notificações em Tempo Real',
    desc: 'Alertas em tempo real para novos pedidos, aprovações e atualizações de estado.',
  },
  {
    icon: <Users size={22} />,
    color: 'bg-violet-50 text-violet-600',
    title: 'Diretório de Equipa',
    desc: 'Gestão centralizada de colaboradores com onboarding por link de convite.',
  },
  {
    icon: <FileText size={22} />,
    color: 'bg-rose-50 text-rose-600',
    title: 'Relatórios de Conformidade',
    desc: 'Exporta mapas anuais de férias e relatórios de conformidade com a legislação cabo-verdiana.',
  },
  {
    icon: <Shield size={22} />,
    color: 'bg-slate-50 text-slate-600',
    title: 'Segurança & Privacidade',
    desc: 'Dados alojados na Europa, protegidos com encriptação e controlo de acesso por função.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'O gestor convida a equipa',
    desc: 'Cria um perfil para cada colaborador e envia o link de convite por WhatsApp ou email. Eles criam a conta em menos de 1 minuto.',
  },
  {
    num: '02',
    title: 'O colaborador pede férias',
    desc: 'Escolhe as datas num calendário visual, vê automaticamente os dias úteis e o saldo disponível, e submete o pedido.',
  },
  {
    num: '03',
    title: 'O gestor aprova (ou não)',
    desc: 'Recebe uma notificação em tempo real, verifica sobreposições com a equipa e aprova ou recusa com um clique.',
  },
  {
    num: '04',
    title: 'Tudo registado automaticamente',
    desc: 'O saldo é atualizado, o calendário sincronizado e o historial disponível para relatórios de conformidade.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: '0',
    period: '/mês',
    desc: 'Para equipas a começar',
    features: ['Até 5 colaboradores', 'Calendário de equipa', 'Aprovação de pedidos', 'Suporte por email'],
    cta: 'Começar Grátis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '29',
    period: '/mês',
    desc: 'Para empresas em crescimento',
    features: ['Até 50 colaboradores', 'Relatórios de conformidade', 'Notificações em tempo real', 'Convites por link', 'Suporte prioritário'],
    cta: 'Iniciar Período de Prova',
    highlight: true,
    badge: 'Mais popular',
  },
  {
    name: 'Enterprise',
    price: '99',
    period: '/mês',
    desc: 'Para grandes organizações',
    features: ['Colaboradores ilimitados', 'SSO / LDAP', 'API dedicada', 'SLA garantido', 'Gerente de conta'],
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
    q: 'Posso importar a equipa que já tenho?',
    a: 'Podes adicionar colaboradores manualmente ou usar o sistema de convites. A importação em massa via CSV está no roteiro e chegará brevemente.',
  },
  {
    q: 'Os dados ficam guardados onde?',
    a: 'Todos os dados são armazenados na Europa (Frankfurt) em infraestrutura Supabase com backups diários e encriptação em repouso e em trânsito.',
  },
  {
    q: 'Existe período de prova gratuito?',
    a: 'O plano Starter é gratuito para sempre até 5 colaboradores. O plano Pro inclui 14 dias de prova gratuita sem necessidade de cartão de crédito.',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white text-text font-sans">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-primary text-base shadow shadow-accent/20">
              🌴
            </div>
            <span className="font-display font-bold text-base text-text">
              Nha <span className="text-accent">Féria</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-text-muted hover:text-text transition-colors font-medium">
                {l}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-text-muted hover:text-text transition-colors hidden sm:block"
            >
              Iniciar Sessão
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-radius-sm hover:bg-primary-light transition-all shadow-sm active:scale-95"
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#1e3a5f] to-primary-light text-white">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80 mb-6">
            <Zap size={12} className="text-accent" />
            Feito para Cabo Verde
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-5">
            Gestão de Férias{' '}
            <span className="text-accent">Simples</span>{' '}
            para a Tua Equipa
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Acabou a confusão de emails e folhas de cálculo. Pedidos, aprovações e conformidade — tudo num só lugar, em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-accent text-primary text-sm font-bold rounded-radius-sm hover:bg-accent-hover transition-all shadow-lg active:scale-95"
            >
              Começa Grátis — Sem Cartão
              <ArrowRight size={16} />
            </button>
            <a
              href="#como-funciona"
              className="text-sm font-semibold text-white/70 hover:text-white transition-colors flex items-center gap-1"
            >
              Ver como funciona <ChevronDown size={14} />
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="fill-accent text-accent" />
            ))}
            <span className="ml-2 text-sm text-white/60">Usado por equipas em Cabo Verde</span>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="max-w-4xl mx-auto px-6 pb-0 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-t-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-3 h-3 bg-red-400/70 rounded-full" />
              <span className="w-3 h-3 bg-amber-400/70 rounded-full" />
              <span className="w-3 h-3 bg-emerald-400/70 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Pedidos Pendentes', value: '3', color: 'bg-amber-400/20 text-amber-200' },
                { label: 'Aprovados Hoje',   value: '7', color: 'bg-emerald-400/20 text-emerald-200' },
                { label: 'Equipa de Férias', value: '2', color: 'bg-blue-400/20 text-blue-200' },
              ].map(card => (
                <div key={card.label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-white/50 mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="py-24 bg-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-primary-light uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text">Tudo o que precisas para gerir a equipa</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-radius p-6 shadow-card border border-border hover:shadow-md transition-all hover:-translate-y-0.5 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-text mb-2">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-primary-light uppercase tracking-widest mb-3">Como Funciona</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text">Em 4 passos simples</h2>
          </div>

          <div className="space-y-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/5 border-2 border-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{s.num}</span>
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-text mb-1">{s.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="preços" className="py-24 bg-bg">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-primary-light uppercase tracking-widest mb-3">Preços</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text">Simples e transparente</h2>
            <p className="text-text-muted mt-3 text-sm">Sem comissões ocultas. Cancela quando quiseres.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div
                key={p.name}
                className={`rounded-radius p-6 flex flex-col border ${
                  p.highlight
                    ? 'bg-primary text-white border-primary shadow-2xl scale-[1.03]'
                    : 'bg-white border-border shadow-card'
                }`}
              >
                {p.badge && (
                  <span className="self-start mb-3 text-[10px] font-bold px-2.5 py-1 bg-accent text-primary rounded-full uppercase tracking-wider">
                    {p.badge}
                  </span>
                )}
                <h3 className={`font-bold text-lg mb-0.5 ${p.highlight ? 'text-white' : 'text-text'}`}>{p.name}</h3>
                <p className={`text-xs mb-4 ${p.highlight ? 'text-white/60' : 'text-text-muted'}`}>{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${p.highlight ? 'text-white' : 'text-text'}`}>€{p.price}</span>
                  <span className={`text-sm ${p.highlight ? 'text-white/60' : 'text-text-muted'}`}>{p.period}</span>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={15} className={p.highlight ? 'text-accent' : 'text-emerald-500'} />
                      <span className={p.highlight ? 'text-white/80' : 'text-text-muted'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-radius-sm text-sm font-bold transition-all active:scale-95 ${
                    p.highlight
                      ? 'bg-accent text-primary hover:bg-accent-hover'
                      : 'border border-border text-text hover:bg-bg'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary-light uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-text">Perguntas frequentes</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-border rounded-radius-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg transition-colors"
                >
                  <span className="font-semibold text-text text-sm pr-4">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-text-muted transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed border-t border-border bg-bg/40">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para simplificar a gestão de férias?
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-xl mx-auto">
            Junta-te às empresas cabo-verdianas que já gerem as férias da equipa de forma profissional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-accent text-primary text-sm font-bold rounded-radius-sm hover:bg-accent-hover transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              Começar Agora — É Grátis
              <ArrowRight size={16} />
            </button>
            <a
              href="https://wa.me/2389XXXXXXX"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            >
              <MessageSquare size={16} /> Falar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0f2540] text-white/40 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌴</span>
            <span className="font-bold text-white/80 text-sm">Nha Féria</span>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} Nha Féria. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6 text-xs">
            <a href="#" className="hover:text-white/70 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white/70 transition-colors">Termos</a>
            <a href="#" className="hover:text-white/70 transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
