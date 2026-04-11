import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Mail, Building2, Calendar, Sun, Smile, Pencil, MapPin, Check, Loader2, Hash, CreditCard, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase';

const CV_ISLANDS = [
  'Santiago','São Vicente','Santo Antão','Fogo',
  'Sal','Boa Vista','Maio','São Nicolau','Brava',
];

const EMOJI_OPTIONS = [
  '😀','😊','🥰','😎','🤩','😇','🤓','🥳','😸','🦸',
  '🦁','🐯','🦊','🐺','🐻','🐼','🐨','🦋','🐸','🦄',
  '🌈','🚀','⭐','🎨','🎸','🏄','⚽','🌴','🌊','🍀',
  '🌺','🦜','🐠','🦩','🦒','🐬','🦅','🌙','🔥','💎',
];

const roleColor = (role) => {
  switch (role) {
    case 'manager': return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'admin':   return 'bg-red-100 text-red-700 border-red-200';
    default:        return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

const ProfilePage = () => {
  const { profile } = useOutletContext();
  const { t, lang } = useLanguage();
  const p = (key) => t('profile', key);

  const [nif, setNif]                   = useState(profile?.nif || '');
  const [nifEditing, setNifEditing]     = useState(false);
  const [nifSaving, setNifSaving]       = useState(false);
  const [nifSaved, setNifSaved]         = useState(false);
  const [nifError, setNifError]         = useState(null);

  const handleSaveNif = async (e) => {
    e.preventDefault();
    setNifSaving(true);
    setNifSaved(false);
    setNifError(null);
    try {
      await supabase.from('profiles').update({ nif: nif.trim() || null }).eq('id', profile.id);
      setNifSaved(true);
      setTimeout(() => { setNifSaved(false); setNifEditing(false); }, 800);
    } catch (err) {
      console.error('NIF save error:', err);
      setNifError('Não foi possível guardar o NIF. Tenta novamente.');
    } finally {
      setNifSaving(false);
    }
  };

  const [dgtEditing, setDgtEditing]   = useState(false);
  const [dgtSaving, setDgtSaving]     = useState(false);
  const [dgtSaved, setDgtSaved]       = useState(false);
  const [dgtError, setDgtError]       = useState(null);
  const [cni, setCni]                 = useState(profile?.cni || '');
  const [hireDate, setHireDate]       = useState(profile?.hire_date || '');
  const [jobTitle, setJobTitle]       = useState(profile?.job_title || '');

  const handleSaveDgt = async (e) => {
    e.preventDefault();
    setDgtSaving(true);
    setDgtSaved(false);
    setDgtError(null);
    try {
      await supabase.from('profiles').update({
        cni:       cni.trim()      || null,
        hire_date: hireDate        || null,
        job_title: jobTitle.trim() || null,
      }).eq('id', profile.id);
      setDgtSaved(true);
      setTimeout(() => { setDgtSaved(false); setDgtEditing(false); }, 800);
    } catch (err) {
      console.error('DGT fields save error:', err);
      setDgtError('Não foi possível guardar os dados. Tenta novamente.');
    } finally {
      setDgtSaving(false);
    }
  };

  const [island, setIsland]             = useState(profile?.island || '');
  const [islandSaving, setIslandSaving]   = useState(false);
  const [islandSaved, setIslandSaved]     = useState(false);
  const [islandError, setIslandError]     = useState(null);
  const [islandOpen, setIslandOpen]       = useState(() => !profile?.island);

  const handleSaveIsland = async (val) => {
    setIsland(val);
    setIslandSaving(true);
    setIslandSaved(false);
    setIslandError(null);
    try {
      await supabase.from('profiles').update({ island: val }).eq('id', profile.id);
      setIslandSaved(true);
      setTimeout(() => {
        setIslandSaved(false);
        setIslandOpen(false);
      }, 800);
    } catch (err) {
      console.error('Island save error:', err);
      setIslandError('Não foi possível guardar a ilha. Tenta novamente.');
    } finally {
      setIslandSaving(false);
    }
  };

  const [selectedEmoji, setSelectedEmoji] = useState(() => profile?.avatar_emoji || null);
  const [pickerOpen, setPickerOpen] = useState(() => !profile?.avatar_emoji);

  const handleSelectEmoji = async (emoji) => {
    setSelectedEmoji(emoji);
    setTimeout(() => setPickerOpen(false), 350);
    await supabase.from('profiles').update({ avatar_emoji: emoji }).eq('id', profile.id);
  };

  const handleRemoveEmoji = async () => {
    setSelectedEmoji(null);
    setPickerOpen(true);
    await supabase.from('profiles').update({ avatar_emoji: null }).eq('id', profile.id);
  };

  const roleName = (role) => {
    switch (role) {
      case 'manager': return p('roleManager');
      case 'admin':   return p('roleAdmin');
      default:        return p('roleEmployee');
    }
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pt-PT', { year: 'numeric', month: 'long' })
    : '—';

  const fields = [
    { icon: <User size={15} />,      label: p('fullName'),     value: profile?.full_name  || '—' },
    { icon: <Mail size={15} />,      label: p('email'),        value: profile?.email      || '—' },
    { icon: <Building2 size={15} />, label: p('department'),   value: profile?.department || '—' },
    { icon: <Sun size={15} />,       label: p('leaveBalance'), value: profile ? `${profile.vacation_balance ?? 22} ${p('workingDays')}` : '—' },
    { icon: <Calendar size={15} />,  label: p('memberSince'),  value: memberSince },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto pb-20"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text text-gradient">{p('title')}</h2>
        <p className="text-sm text-text-muted mt-1">{p('subtitle')}</p>
      </div>

      {/* Avatar + role */}
      <div className="bg-gradient-to-br from-primary to-primary-light rounded-radius p-6 mb-5 flex items-center gap-5 shadow-lg">
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0">
          {selectedEmoji ? (
            <span className="text-3xl leading-none">{selectedEmoji}</span>
          ) : (
            <span className="text-2xl font-bold text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{profile?.full_name || '—'}</div>
          <span className={`mt-1.5 inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleColor(profile?.role)}`}>
            {roleName(profile?.role)}
          </span>
        </div>
      </div>

      {/* Emoji picker */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden mb-5">
        <button
          onClick={() => setPickerOpen(o => !o)}
          className="w-full px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-bg/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Smile size={15} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{p('chooseAvatar')}</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedEmoji && (
              <span className="text-base">{selectedEmoji}</span>
            )}
            <Pencil size={13} className="text-text-muted" />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {pickerOpen && (
            <motion.div
              key="picker"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-5 pt-1 border-t border-border">
                <p className="text-xs text-text-muted mb-3">{p('avatarHint')}</p>
                <div className="grid grid-cols-10 gap-1.5">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectEmoji(emoji)}
                      className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer
                        ${selectedEmoji === emoji
                          ? 'bg-primary/10 ring-2 ring-primary scale-110'
                          : 'hover:bg-bg hover:scale-110'
                        }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {selectedEmoji && (
                  <button
                    onClick={handleRemoveEmoji}
                    className="mt-3 text-xs text-text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    {p('removeAvatar')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NIF pessoal */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden mb-5">
        <button
          onClick={() => setNifEditing(o => !o)}
          className="w-full px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-bg/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Hash size={15} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">NIF Pessoal</span>
          </div>
          <div className="flex items-center gap-2">
            {nifSaving && <Loader2 size={13} className="animate-spin text-text-muted" />}
            {nifSaved && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={12} /> Guardado
              </span>
            )}
            {nif && !nifSaving && !nifSaved && (
              <span className="text-xs font-mono font-semibold text-primary">{nif}</span>
            )}
            <Pencil size={13} className="text-text-muted" />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {nifEditing && (
            <motion.div
              key="nif-editor"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSaveNif} className="px-6 pb-5 pt-3 border-t border-border space-y-3">
                <p className="text-xs text-text-muted">Necessário para a folha de salários e declarações fiscais à DNRE.</p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 200123456"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={nif}
                  onChange={e => setNif(e.target.value)}
                />
                {nifError && <p className="text-xs text-red-600">{nifError}</p>}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNifEditing(false)}
                    className="text-xs font-semibold text-text-muted hover:text-text transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={nifSaving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50"
                  >
                    {nifSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {nifSaving ? 'A guardar…' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dados DGT — CNI, Admissão, Função */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden mb-5">
        <button
          onClick={() => setDgtEditing(o => !o)}
          className="w-full px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-bg/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Dados para Mapa DGT</span>
          </div>
          <div className="flex items-center gap-2">
            {dgtSaving && <Loader2 size={13} className="animate-spin text-text-muted" />}
            {dgtSaved && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={12} /> Guardado
              </span>
            )}
            {(cni || hireDate || jobTitle) && !dgtSaving && !dgtSaved && (
              <span className="text-[11px] text-emerald-600 font-semibold">Preenchido</span>
            )}
            {!cni && !hireDate && !jobTitle && !dgtSaving && !dgtSaved && (
              <span className="text-[11px] text-amber-600 font-semibold">Incompleto</span>
            )}
            <Pencil size={13} className="text-text-muted" />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {dgtEditing && (
            <motion.div
              key="dgt-editor"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSaveDgt} className="px-6 pb-5 pt-3 border-t border-border space-y-4">
                <p className="text-xs text-text-muted">Necessário para o Mapa Anual de Férias enviado à DGT (prazo: 30 de Abril).</p>
                {dgtError && <p className="text-xs text-red-600">{dgtError}</p>}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={12} /> CNI
                    <span className="font-normal text-[10px] text-text-muted normal-case tracking-normal">(Cartão Nacional de Identificação)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: A123456"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={cni}
                    onChange={e => setCni(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text uppercase tracking-wider">Data de Admissão</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={hireDate}
                      onChange={e => setHireDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1">
                      <Briefcase size={11} /> Função
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Técnico de TI"
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDgtEditing(false)}
                    className="text-xs font-semibold text-text-muted hover:text-text transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={dgtSaving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50"
                  >
                    {dgtSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {dgtSaving ? 'A guardar…' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Island selector */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden mb-5">
        <button
          onClick={() => setIslandOpen(o => !o)}
          className="w-full px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-bg/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Ilha de Residência</span>
          </div>
          <div className="flex items-center gap-2">
            {islandSaving && <Loader2 size={13} className="animate-spin text-text-muted" />}
            {islandSaved && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={12} /> Guardado
              </span>
            )}
            {island && !islandSaving && !islandSaved && (
              <span className="text-xs font-semibold text-primary">{island}</span>
            )}
            <Pencil size={13} className="text-text-muted" />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {islandOpen && (
            <motion.div
              key="island-picker"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 border-t border-border">
                <p className="text-xs text-text-muted mb-3 pt-2">Usada para mostrar os feriados locais da tua ilha.</p>
                {islandError && <p className="text-xs text-red-600 mb-2">{islandError}</p>}
                <div className="grid grid-cols-3 gap-2">
                  {CV_ISLANDS.map(isl => (
                    <button
                      key={isl}
                      type="button"
                      onClick={() => handleSaveIsland(isl)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all text-left ${
                        island === isl
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/30 text-text-muted'
                      }`}
                    >
                      {isl}
                      {island === isl && <Check size={11} className="inline ml-1" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
        {fields.map((f, i) => (
          <div key={i} className={`flex items-center gap-4 px-6 py-4 ${i < fields.length - 1 ? 'border-b border-border' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-text-muted flex-shrink-0">
              {f.icon}
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{f.label}</div>
              <div className="text-sm font-semibold text-text mt-0.5">{f.value}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProfilePage;
