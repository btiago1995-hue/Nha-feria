import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const STATES = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    title: 'Pagamento confirmado!',
    getMessage: (plan) =>
      `O teu plano ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ''} foi activado com sucesso. A tua empresa pode agora utilizar todas as funcionalidades incluídas.`,
    cta: 'Ir para o painel',
    ctaPath: '/manager-dashboard',
  },
  cancelled: {
    icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'Pagamento cancelado',
    getMessage: () => 'Cancelaste o pagamento. A tua subscrição não foi alterada. Podes tentar novamente quando quiseres.',
    cta: 'Voltar à subscrição',
    ctaPath: '/upgrade',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    title: 'Pagamento não processado',
    getMessage: (_, reason) => {
      if (reason === 'security') return 'Ocorreu um problema de segurança na validação do pagamento. Contacta o suporte.';
      if (reason === 'declined') return 'O pagamento foi recusado pelo banco. Verifica os dados do cartão e tenta novamente.';
      return 'Ocorreu um erro inesperado. Se o valor foi debitado, contacta-nos em suporte@nhaferia.cv.';
    },
    cta: 'Tentar novamente',
    ctaPath: '/upgrade',
  },
};

const PaymentResult = () => {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const status     = params.get('status') ?? 'failed';
  const plan       = params.get('plan');
  const reason     = params.get('reason');
  const state      = STATES[status] ?? STATES.failed;
  const Icon       = state.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl border border-border max-w-md w-full p-10 text-center"
      >
        <div className={`w-20 h-20 ${state.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon size={40} className={state.color} />
        </div>

        <h1 className="text-xl font-bold text-text mb-3">{state.title}</h1>
        <p className="text-sm text-text-muted leading-relaxed mb-8">
          {state.getMessage(plan, reason)}
        </p>

        <button
          onClick={() => navigate(state.ctaPath)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-light transition-all active:scale-95 shadow-sm text-sm"
        >
          {state.cta} <ArrowRight size={15} />
        </button>

        {status === 'failed' && (
          <p className="mt-6 text-xs text-text-muted">
            Precisas de ajuda?{' '}
            <a href="mailto:suporte@nhaferia.cv" className="text-primary hover:underline font-semibold">
              suporte@nhaferia.cv
            </a>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentResult;
