import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Mail, Building2, Calendar, Sun, Smile, Pencil, MapPin, Check, Loader2 } from 'lucide-react';
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

  const [island, setIsland]             = useState(profile?.island || '');
  const [islandSaving, setIslandSaving]   = useState(false);
  const [islandSaved, setIslandSaved]     = useState(false);
  const [islandOpen, setIslandOpen]       = useState(() => !profile?.island);

  const handleSaveIsland = async (val) => {
    setIsland(val);
    setIslandSaving(true);
    setIslandSaved(false);
    try {
      await supabase.from('profiles').update({ island: val }).eq('id', profile.id);
      setIslandSaved(true);
      setTimeout(() => {
        setIslandSaved(false);
        setIslandOpen(false);
      }, 800);
    } catch (err) {
      console.error('Island save error:', err);
    } finally {
      setIslandSaving(false);
    }
  };

  const avatarKey = profile?.id ? `nha_feria_avatar_${profile.id}` : null;
  const [selectedEmoji, setSelectedEmoji] = useState(
    () => (avatarKey ? localStorage.getItem(avatarKey) : null) || null
  );
  const [pickerOpen, setPickerOpen] = useState(() => !localStorage.getItem(avatarKey));

  const handleSelectEmoji = (emoji) => {
    setSelectedEmoji(emoji);
    if (avatarKey) localStorage.setItem(avatarKey, emoji);
    // Auto-close picker after a short delay so user sees the selection
    setTimeout(() => setPickerOpen(false), 350);
  };

  const handleRemoveEmoji = () => {
    setSelectedEmoji(null);
    if (avatarKey) localStorage.removeItem(avatarKey);
    setPickerOpen(true);
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
