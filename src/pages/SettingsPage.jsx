import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 focus:outline-none
      ${checked ? 'bg-primary' : 'bg-slate-200'}`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200
        ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

const SettingsPage = () => {
  const { session } = useOutletContext();
  const { lang, switchLang, t } = useLanguage();

  const [notifPedidos,  setNotifPedidos]  = useState(true);
  const [notifAprov,    setNotifAprov]    = useState(true);
  const [notifLembrete, setNotifLembrete] = useState(false);
  const [resetSent,     setResetSent]     = useState(false);
  const [resetLoading,  setResetLoading]  = useState(false);

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

  const s = (key, vars) => t('settings', key, vars);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto pb-20"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text text-gradient">{s('title')}</h2>
        <p className="text-sm text-text-muted mt-1">{s('subtitle')}</p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Bell size={15} className="text-text-muted" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{s('notifications')}</span>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: s('newPending'),     sub: s('newPendingDesc'),     val: notifPedidos,  set: setNotifPedidos },
            { label: s('approvalStatus'), sub: s('approvalStatusDesc'), val: notifAprov,    set: setNotifAprov   },
            { label: s('balanceReminder'), sub: s('balanceReminderDesc'), val: notifLembrete, set: setNotifLembrete },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
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
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{s('language')}</span>
        </div>
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text">{s('interfaceLanguage')}</div>
          </div>
          <div className="flex gap-1 bg-bg border border-border rounded-lg p-1 flex-shrink-0">
            {['pt', 'en'].map((l) => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer
                  ${lang === l ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
              >
                {l === 'pt' ? '🇵🇹 PT' : '🇬🇧 EN'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Lock size={15} className="text-text-muted" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{s('security')}</span>
        </div>
        <div className="px-6 py-4">
          <div className="text-sm font-semibold text-text">{s('changePassword')}</div>
          <div className="text-xs text-text-muted mt-0.5 mb-4">{s('changePasswordDesc')}</div>
          {resetSent ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-radius-sm">
              ✓ {s('emailSent')} {session?.user?.email}
            </div>
          ) : (
            <button
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="px-4 py-2.5 text-sm font-semibold border border-border rounded-radius-sm hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
            >
              {resetLoading ? s('sending') : s('sendReset')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
