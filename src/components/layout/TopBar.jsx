import React from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../ui/NotificationBell';

const TopBar = ({ title, user, profile, onMenuClick }) => {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header className="bg-white border-b border-border px-7 flex items-center justify-between sticky top-0 z-40 shadow-sm" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)', paddingBottom: '0.75rem', minHeight: '4rem' }}>
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden text-text hover:text-primary transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-base font-semibold text-text leading-tight">{title}</h1>
          <p className="text-[11px] text-text-muted mt-0.5">{formattedDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell userId={profile?.id} />

        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-slate-200 border border-border flex items-center justify-center text-primary text-xs font-bold cursor-pointer hover:border-primary-light transition-all overflow-hidden"
          title="Ver perfil"
        >
          {(() => {
            if (profile?.avatar_emoji) return <span className="text-lg leading-none">{profile.avatar_emoji}</span>;
            if (user?.user_metadata?.avatar_url) return <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />;
            return <span>{profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</span>;
          })()}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
