import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { CheckCircle2, Award, Zap, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../lib/CompanyContext';
import { motion } from 'framer-motion';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 3200,
    priceAnnual: 34560,
    desc: 'Para empresas em crescimento',
    highlight: true,
    badge: 'Mais Popular',
    features: [
      'Até 50 colaboradores',
      'Relatórios de conformidade',
      'Notificações em tempo real',
      'Convites por link',
      'Suporte prioritário',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 10900,
    priceAnnual: 117720,
    desc: 'Para grandes organizações',
    highlight: false,
    features: [
      'Colaboradores ilimitados',
      'SSO / LDAP (Em breve)',
      'API dedicada (Em breve)',
      'SLA garantido',
      'Gerente de conta dedicado',
    ],
  },
];

const UpgradePage = () => {
  const { profile } = useOutletContext();
  const { company } = useCompany() || {};
  const navigate = useNavigate();

  const [annual, setAnnual]     = useState(false);
  const [loading, setLoading]   = useState(null); // planId being processed
  const [error, setError]       = useState('');

  const currentPlan = company?.plan ?? 'starter';

  const handleUpgrade = async (planId) => {
    setError('');
    setLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payments-initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ plan: planId, billingPeriod: annual ? 'annual' : 'monthly' }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao iniciar pagamento');

      // Inject the SISP form into the DOM and submit it
      const container = document.createElement('div');
      container.innerHTML = data.formHtml;
      container.style.display = 'none';
      document.body.appendChild(container);
      const form = container.querySelector('form');
      if (!form) throw new Error('Form SISP não foi gerado');
      form.submit();
      // User is now redirected to SISP — no need to reset loading
    } catch (err) {
      setError(err.message ?? 'Erro inesperado. Tenta novamente.');
      setLoading(null);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-sm">
        Só os administradores podem gerir a subscrição.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto pb-20"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text text-gradient">Subscrição</h2>
        <p className="text-sm text-text-muted mt-1">
          Plano actual: <span className="font-bold text-text capitalize">{currentPlan}</span>
          {currentPlan === 'starter' && (
            <span className="ml-2 text-xs text-amber-600 font-semibold">· Grátis até 5 colaboradores</span>
          )}
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-3 mb-8">
        <div className="inline-flex items-center gap-3 bg-bg border border-border rounded-full px-2 py-1.5">
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
        {annual && (
          <span className="text-xs text-emerald-700 font-semibold">
            Poupa {annual ? '2 meses' : ''} por ano
          </span>
        )}
      </div>

      {error && (
        <p className="mb-6 text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {PLANS.map((p) => {
          const price  = annual ? p.priceAnnual : p.priceMonthly;
          const period = annual ? '/ano' : '/mês';
          const isActive = currentPlan === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-2xl p-7 flex flex-col border relative transition-shadow ${
                p.highlight
                  ? 'bg-primary border-primary shadow-xl ring-2 ring-primary/20'
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

              <div className="flex items-baseline gap-1.5 mb-6">
                <span className={`text-4xl font-bold tracking-tight ${p.highlight ? 'text-white' : 'text-text'}`}>
                  {price.toLocaleString('pt-CV')}$
                </span>
                <span className={`text-sm ${p.highlight ? 'text-white/50' : 'text-text-muted'}`}>{period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 size={14} className={`flex-shrink-0 mt-0.5 ${p.highlight ? 'text-accent' : 'text-emerald-500'}`} />
                    <span className={p.highlight ? 'text-white/80' : 'text-text-muted'}>{f}</span>
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div className={`w-full py-3 rounded-lg text-sm font-bold text-center ${p.highlight ? 'bg-white/10 text-white' : 'bg-bg text-text-muted border border-border'}`}>
                  Plano actual
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(p.id)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    p.highlight
                      ? 'bg-accent text-primary hover:bg-accent-hover shadow-md'
                      : 'border border-border text-text hover:bg-bg'
                  }`}
                >
                  {loading === p.id ? (
                    <><span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> A redirecionar…</>
                  ) : (
                    <><Zap size={14} /> Subscrever {p.name}</>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-text-muted">
        <Shield size={13} />
        Pagamento seguro via Vinti4 · SISP · Cabo Verde
      </div>

      <p className="text-center text-xs text-text-light mt-2">
        Preços em Escudos Cabo-verdianos (CVE) sem IVA.
      </p>
    </motion.div>
  );
};

export default UpgradePage;
