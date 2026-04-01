import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, Award, Zap, Shield, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../lib/CompanyContext';
import { motion } from 'framer-motion';

// Approach B: 3.200 CVE base (15 employees) + 180 CVE per additional employee
const PRO_BASE_PRICE     = 3200;
const PRO_BASE_EMPLOYEES = 15;
const PRO_PRICE_PER_EXTRA = 180;
const ENTERPRISE_MONTHLY  = 10900;
const ANNUAL_DISCOUNT     = 0.10;

const calcProMonthly = (employees) =>
  PRO_BASE_PRICE + Math.max(0, employees - PRO_BASE_EMPLOYEES) * PRO_PRICE_PER_EXTRA;

const fmt = (n) => n.toLocaleString('pt-CV');

const UpgradePage = () => {
  const { profile } = useOutletContext();
  const { company } = useCompany() || {};

  const [annual, setAnnual]       = useState(false);
  const [employees, setEmployees] = useState(15);
  const [loading, setLoading]     = useState(null);
  const [error, setError]         = useState('');

  const currentPlan = company?.plan ?? 'starter';

  const proMonthly  = calcProMonthly(employees);
  const proPrice    = annual ? Math.round(proMonthly * 12 * (1 - ANNUAL_DISCOUNT)) : proMonthly;
  const entPrice    = annual ? Math.round(ENTERPRISE_MONTHLY * 12 * (1 - ANNUAL_DISCOUNT)) : ENTERPRISE_MONTHLY;
  const period      = annual ? '/ano' : '/mês';

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
          body: JSON.stringify({ plan: planId, billingPeriod: annual ? 'annual' : 'monthly', employees }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao iniciar pagamento');

      const container = document.createElement('div');
      container.innerHTML = data.formHtml;
      container.style.display = 'none';
      document.body.appendChild(container);
      const form = container.querySelector('form');
      if (!form) throw new Error('Form SISP não foi gerado');
      form.submit();
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
      <div className="flex items-center gap-3 mb-6">
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
          <span className="text-xs text-emerald-700 font-semibold">Poupa 2 meses por ano</span>
        )}
      </div>

      {/* Employee slider — affects Pro price */}
      <div className="bg-white border border-border rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Users size={15} className="text-primary-light" />
            Quantos colaboradores tens?
          </div>
          <span className="text-lg font-bold text-primary tabular-nums">{employees}</span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={employees}
          onChange={(e) => setEmployees(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-text-muted mt-1">
          <span>1</span>
          <span>15 incluídos no Pro</span>
          <span>50+</span>
        </div>
        {employees > PRO_BASE_EMPLOYEES && (
          <p className="text-xs text-primary-light font-semibold mt-2">
            {employees - PRO_BASE_EMPLOYEES} colaborador{employees - PRO_BASE_EMPLOYEES !== 1 ? 'es' : ''} extra
            · +{fmt((employees - PRO_BASE_EMPLOYEES) * PRO_PRICE_PER_EXTRA)} CVE/mês
          </p>
        )}
      </div>

      {error && (
        <p className="mb-6 text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Pro */}
        <div className="rounded-2xl p-7 flex flex-col border relative transition-shadow bg-primary border-primary shadow-xl ring-2 ring-primary/20">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 bg-accent text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              <Award size={10} /> Mais Popular
            </span>
          </div>
          <div className="text-xs font-bold uppercase tracking-wider mb-1 text-white/50">Pro</div>
          <div className="text-sm mb-5 text-white/60">Para empresas em crescimento</div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-4xl font-bold tracking-tight text-white">{fmt(proPrice)}</span>
            <span className="text-sm text-white/50">CVE{period}</span>
          </div>
          <p className="text-[11px] text-white/40 mb-6">
            Base {fmt(PRO_BASE_PRICE)} CVE · +{PRO_PRICE_PER_EXTRA} CVE/colaborador acima de {PRO_BASE_EMPLOYEES}
          </p>
          <ul className="space-y-3 mb-8 flex-1">
            {[
              `${employees} colaboradores incluídos`,
              'Relatórios de conformidade',
              'Notificações em tempo real',
              'Convites por link',
              'Suporte prioritário',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-accent" />
                <span className="text-white/80">{f}</span>
              </li>
            ))}
          </ul>
          {currentPlan === 'pro' ? (
            <div className="w-full py-3 rounded-lg text-sm font-bold text-center bg-white/10 text-white">
              Plano actual
            </div>
          ) : (
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loading !== null}
              className="w-full py-3 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-accent text-primary hover:bg-accent-hover shadow-md"
            >
              {loading === 'pro' ? (
                <><span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> A redirecionar…</>
              ) : (
                <><Zap size={14} /> Subscrever Pro</>
              )}
            </button>
          )}
        </div>

        {/* Enterprise */}
        <div className="rounded-2xl p-7 flex flex-col border relative transition-shadow bg-white border-border shadow-sm hover:shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider mb-1 text-text-muted">Enterprise</div>
          <div className="text-sm mb-5 text-text-muted">Para grandes organizações</div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-4xl font-bold tracking-tight text-text">{fmt(entPrice)}</span>
            <span className="text-sm text-text-muted">CVE{period}</span>
          </div>
          <p className="text-[11px] text-text-muted mb-6">Colaboradores ilimitados incluídos</p>
          <ul className="space-y-3 mb-8 flex-1">
            {[
              'Colaboradores ilimitados',
              'SSO / LDAP (Em breve)',
              'API dedicada (Em breve)',
              'SLA garantido',
              'Gerente de conta dedicado',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-emerald-500" />
                <span className="text-text-muted">{f}</span>
              </li>
            ))}
          </ul>
          {currentPlan === 'enterprise' ? (
            <div className="w-full py-3 rounded-lg text-sm font-bold text-center bg-bg text-text-muted border border-border">
              Plano actual
            </div>
          ) : (
            <button
              onClick={() => handleUpgrade('enterprise')}
              disabled={loading !== null}
              className="w-full py-3 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-border text-text hover:bg-bg"
            >
              {loading === 'enterprise' ? (
                <><span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> A redirecionar…</>
              ) : (
                <><Zap size={14} /> Subscrever Enterprise</>
              )}
            </button>
          )}
        </div>
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
