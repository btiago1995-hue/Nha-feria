import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const TopBar = ({ title, user, profile, onMenuClick }) => {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Capitalize first letter of weekday
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [fetched, setFetched] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const fetchNotifications = async () => {
    if (fetched || !profile) return;
    setLoadingNotif(true);
    try {
      if (profile.role === 'manager') {
        const { data } = await supabase
          .from('leave_requests')
          .select('id, type, start_date, end_date, status, profiles!leave_requests_user_id_fkey(full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);
        setNotifications((data || []).map(r => ({
          id: r.id,
          text: `${r.profiles?.full_name || 'Alguém'} pediu ${r.type}`,
          sub: `${format(parseISO(r.start_date), 'd MMM', { locale: pt })} – ${format(parseISO(r.end_date), 'd MMM yyyy', { locale: pt })}`,
          dot: 'bg-amber-400',
        })));
      } else {
        const { data } = await supabase
          .from('leave_requests')
          .select('id, type, start_date, end_date, status')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setNotifications((data || []).map(r => ({
          id: r.id,
          text: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} – ${r.status === 'approved' ? 'Aprovada' : r.status === 'rejected' ? 'Recusada' : 'Pendente'}`,
          sub: `${format(parseISO(r.start_date), 'd MMM', { locale: pt })} – ${format(parseISO(r.end_date), 'd MMM yyyy', { locale: pt })}`,
          dot: r.status === 'approved' ? 'bg-emerald-400' : r.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400',
        })));
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotif(false);
      setFetched(true);
    }
  };

  const handleBellClick = () => {
    setNotifOpen(prev => !prev);
    if (!fetched) fetchNotifications();
  };

  return (
    <header className="h-16 bg-white border-b border-border px-7 flex items-center justify-between sticky top-0 z-40 shadow-sm">
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
        <div className="relative" ref={panelRef}>
          <button
            onClick={handleBellClick}
            className="w-9 h-9 rounded-radius-sm border border-border flex items-center justify-center text-text hover:bg-bg transition-all relative"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white"></span>
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-border rounded-radius shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Notificações</span>
                <span className="text-[10px] text-text-muted">{notifications.length} {notifications.length === 1 ? 'item' : 'itens'}</span>
              </div>
              {loadingNotif ? (
                <div className="p-6 text-center text-xs text-text-muted">A carregar...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted">Sem notificações.</div>
              ) : (
                <ul className="divide-y divide-border max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <li key={n.id}>
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-bg transition-colors cursor-pointer"
                        onClick={() => {
                          setNotifOpen(false);
                          if (profile?.role === 'manager' || profile?.role === 'admin') {
                            navigate('/manager-calendar');
                          } else {
                            navigate('/worker-leaves', { state: { tab: 'history' } });
                          }
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.dot}`} />
                          <div>
                            <p className="text-xs font-semibold text-text">{n.text}</p>
                            <p className="text-[11px] text-text-muted mt-0.5">{n.sub}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-slate-200 border border-border flex items-center justify-center text-primary text-xs font-bold cursor-pointer hover:border-primary-light transition-all overflow-hidden"
          title="Ver perfil"
        >
          {(() => {
            const emoji = profile?.id ? localStorage.getItem(`nha_feria_avatar_${profile.id}`) : null;
            if (emoji) return <span className="text-lg leading-none">{emoji}</span>;
            if (user?.user_metadata?.avatar_url) return <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />;
            return <span>{profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</span>;
          })()}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
