import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, Globe, Lock, Building2, Check, Loader2, Pencil, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { useCompany } from '../lib/CompanyContext';
import { CV_SECTORS, getSectorLabel } from '../lib/sectors';

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

// ─── Organisation section (admin only) ───────────────────────────────────────
const OrganisationSection = ({ profile }) => {
  const { company, departments, refetch } = useCompany() || {};
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState('');
  const [sector, setSector]     = useState('');
  const [nif, setNif]           = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const startEdit = () => {
    setName(company?.name || '');
    setSector(company?.sector || '');
    setNif(company?.nif || '');
    setEditing(true);
    setSaved(false);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile.company_id) { setError('Empresa não associada ao perfil.'); return; }
    if (!name.trim()) { setError('O nome da empresa não pode estar vazio.'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('companies')
      .update({ name: name.trim(), sector, nif: nif.trim() || null })
      .eq('id', profile.company_id);
    setSaving(false);
    if (err) { setError('Erro ao guardar.'); return; }
    await refetch();
    setSaved(true);
    setEditing(false);
  };

  const currentSector = CV_SECTORS.find(s => s.key === (company?.sector));

  return (
    <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden mb-4">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-text-muted" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Organização</span>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-light transition-colors"
          >
            <Pencil size={12} /> Editar
          </button>
        )}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {!editing ? (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {currentSector?.icon || '🏢'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-text">{company?.name || 'A Minha Empresa'}</div>
                  <div className="text-sm text-primary font-semibold mt-0.5">
                    {currentSector ? currentSector.label : <span className="text-amber-600">Setor não configurado</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Hash size={12} className="text-text-light flex-shrink-0" />
                    {company?.nif
                      ? <span className="text-xs text-text-muted font-mono">{company.nif}</span>
                      : <span className="text-xs text-amber-600 font-semibold">NIF não configurado — necessário para faturação</span>
                    }
                  </div>
                  {departments && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {departments.map(d => (
                        <span key={d} className="text-[11px] px-2.5 py-1 bg-primary/5 text-primary rounded-full font-semibold border border-primary/10">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {saved && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-radius-sm mt-4">
                  <Check size={14} /> Guardado com sucesso.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.form
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSave}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text uppercase tracking-wider">Nome da Empresa</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Hotel Morabeza"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text uppercase tracking-wider">
                  NIF da Empresa
                  <span className="ml-1.5 text-[10px] font-normal text-text-light normal-case tracking-normal">(necessário para faturação electrónica)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full pl-9 pr-3 py-2.5 border border-border rounded-radius-sm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={nif}
                    onChange={e => setNif(e.target.value)}
                    placeholder="ex: 200123456"
                  />
                  <Hash size={14} className="absolute left-3 top-3 text-text-light" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text uppercase tracking-wider">Setor de Atividade</label>
                <div className="grid grid-cols-2 gap-2">
                  {CV_SECTORS.map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSector(s.key)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                        sector === s.key
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/30 text-text'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{s.icon}</span>
                      <span className="text-[12px] font-semibold leading-tight">{s.label}</span>
                      {sector === s.key && <Check size={13} className="ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !sector}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-bold rounded-radius-sm hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? 'A guardar…' : 'Guardar'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Main Settings Page ───────────────────────────────────────────────────────
const SettingsPage = () => {
  const { session, profile } = useOutletContext();
  const { lang, switchLang, t } = useLanguage();

  const [notifPedidos,  setNotifPedidos]  = useState(() => profile?.notify_on_leave_submitted ?? (localStorage.getItem('nha_feria_notif_pedidos')  !== 'false'));
  const [notifAprov,    setNotifAprov]    = useState(() => profile?.notify_on_leave_decided   ?? (localStorage.getItem('nha_feria_notif_aprov')    !== 'false'));
  const [notifLembrete, setNotifLembrete] = useState(() => localStorage.getItem('nha_feria_notif_lembrete') === 'true');

  const persist = (dbCol, key, setter) => async (val) => {
    setter(val);
    localStorage.setItem(key, String(val));
    if (session?.user?.id && dbCol) {
      await supabase.from('profiles').update({ [dbCol]: val }).eq('id', session.user.id);
    }
  };
  const [resetSent,     setResetSent]     = useState(false);
  const [resetLoading,  setResetLoading]  = useState(false);

  const handleResetPassword = async () => {
    if (!session?.user?.email) return;
    setResetLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(session.user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
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

      {/* Organisation — admin only */}
      {profile?.role === 'admin' && <OrganisationSection profile={profile} />}

      {/* Notifications */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Bell size={15} className="text-text-muted" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{s('notifications')}</span>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: s('newPending'),     sub: s('newPendingDesc'),     val: notifPedidos,  set: persist('notify_on_leave_submitted', 'nha_feria_notif_pedidos',  setNotifPedidos)  },
            { label: s('approvalStatus'), sub: s('approvalStatusDesc'), val: notifAprov,    set: persist('notify_on_leave_decided',   'nha_feria_notif_aprov',    setNotifAprov)    },
            { label: s('balanceReminder'), sub: s('balanceReminderDesc'), val: notifLembrete, set: persist(null,                      'nha_feria_notif_lembrete', setNotifLembrete) },
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
