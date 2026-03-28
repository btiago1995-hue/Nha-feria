import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, Globe, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${checked ? 'bg-primary' : 'bg-slate-200'}`}
  >
    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

const SettingsPage = () => {
  const { session } = useOutletContext();

  const [notifPedidos, setNotifPedidos]   = useState(true);
  const [notifAprov,   setNotifAprov]     = useState(true);
  const [notifLembrete, setNotifLembrete] = useState(false);
  const [resetSent, setResetSent]         = useState(false);
  const [resetLoading, setResetLoading]   = useState(false);

  const handleResetPassword = async () => {
    if (!session?.user?.email) return;
    setResetLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(session.user.email, {
        redirectTo: `${window.location.origin}/login`,
      });
      setResetSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto pb-20"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text text-gradient">Definições</h2>
        <p className="text-sm text-text-muted mt-1">Preferências da tua conta.</p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Bell size={15} className="text-text-muted" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Notificações</span>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: 'Novos pedidos pendentes',    sub: 'Recebe alerta quando há pedidos a aprovar', val: notifPedidos,  set: setNotifPedidos },
            { label: 'Aprovação / recusa',          sub: 'Notificação quando o teu pedido é processado', val: notifAprov, set: setNotifAprov },
            { label: 'Lembrete de saldo',           sub: 'Aviso quando o saldo está abaixo de 5 dias',  val: notifLembrete, set: setNotifLembrete },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-sm font-semibold text-text">{item.label}</div>
                <div className="text-xs text-text-muted mt-0.5">{item.sub}</div>
              </div>
              <Toggle checked={item.val} onChange={item.set} />
            </div>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Globe size={15} className="text-text-muted" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Idioma</span>
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm font-semibold text-text">Língua da interface</div>
            <div className="text-xs text-text-muted mt-0.5">Português (Portugal)</div>
          </div>
          <ChevronRight size={16} className="text-text-muted" />
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Lock size={15} className="text-text-muted" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Segurança</span>
        </div>
        <div className="px-6 py-4">
          <div className="text-sm font-semibold text-text">Alterar palavra-passe</div>
          <div className="text-xs text-text-muted mt-0.5 mb-4">Receberás um email com as instruções.</div>
          {resetSent ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-radius-sm">
              ✓ Email enviado para {session?.user?.email}
            </div>
          ) : (
            <button
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="px-4 py-2.5 text-sm font-semibold border border-border rounded-radius-sm hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
            >
              {resetLoading ? 'A enviar...' : 'Enviar email de recuperação'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
