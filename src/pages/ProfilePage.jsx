import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Mail, Building2, Calendar, Sun, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';

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

  const avatarKey = profile?.id ? `nha_feria_avatar_${profile.id}` : null;
  const [selectedEmoji, setSelectedEmoji] = useState(
    () => (avatarKey ? localStorage.getItem(avatarKey) : null) || null
  );

  const handleSelectEmoji = (emoji) => {
    const next = emoji === selectedEmoji ? null : emoji;
    setSelectedEmoji(next);
    if (avatarKey) {
      if (next) localStorage.setItem(avatarKey, next);
      else localStorage.removeItem(avatarKey);
    }
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
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Smile size={15} className="text-text-muted" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{p('chooseAvatar')}</span>
        </div>
        <div className="px-6 py-4">
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
              onClick={() => handleSelectEmoji(selectedEmoji)}
              className="mt-3 text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              {p('removeAvatar')}
            </button>
          )}
        </div>
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
