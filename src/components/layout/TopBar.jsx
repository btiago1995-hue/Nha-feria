import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Menu, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';

// ── localStorage helpers for dismissed notification IDs ──
const DISMISSED_KEY = 'nha_feria_dismissed_notif';
const getDismissed = () => {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')); }
  catch { return new Set(); }
};
const saveDismissed = (set) => {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
};

const fmtRange = (start, end) =>
  `${format(parseISO(start), 'd MMM', { locale: pt })} – ${format(parseISO(end), 'd MMM yyyy', { locale: pt })}`;

const TopBar = ({ title, user, profile, onMenuClick }) => {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  const isManager = profile?.role === 'manager' || profile?.role === 'admin';

  const [notifOpen, setNotifOpen]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [loaded, setLoaded]         = useState(false); // initial fetch done
  const panelRef = useRef(null);

  // ── Click-outside close ──
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // ── Initial fetch (runs once profile is available) ──
  const fetchNotifications = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const dismissed = getDismissed();
      let notifs = [];
      if (isManager) {
        const { data } = await supabase
          .from('leave_requests')
          .select('id, type, start_date, end_date, status, profiles!leave_requests_user_id_fkey(full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(15);
        notifs = (data || [])
          .filter(r => !dismissed.has(String(r.id)))
          .map(r => ({
            id: String(r.id),
            text: `${r.profiles?.full_name || 'Alguém'} pediu ${r.type}`,
            sub: fmtRange(r.start_date, r.end_date),
            dot: 'bg-amber-400',
          }));
      } else {
        const { data } = await supabase
          .from('leave_requests')
          .select('id, type, start_date, end_date, status')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(15);
        notifs = (data || [])
          .filter(r => !dismissed.has(String(r.id)))
          .map(r => ({
            id: String(r.id),
            text: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} – ${r.status === 'approved' ? 'Aprovada' : r.status === 'rejected' ? 'Recusada' : 'Pendente'}`,
            sub: fmtRange(r.start_date, r.end_date),
            dot: r.status === 'approved' ? 'bg-emerald-400' : r.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400',
          }));
      }
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [profile, isManager]);

  useEffect(() => {
    if (profile && !loaded) fetchNotifications();
  }, [profile, loaded, fetchNotifications]);

  // ── Supabase Realtime subscription ──
  useEffect(() => {
    if (!profile) return;

    const dismissed = getDismissed();

    const channel = supabase.channel(`topbar-notif-${profile.id}`);

    if (isManager) {
      // Managers: new pending requests from anyone
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leave_requests' },
        (payload) => {
          const r = payload.new;
          if (r.status !== 'pending') return;
          if (dismissed.has(String(r.id))) return;
          // Fetch the worker name asynchronously
          supabase
            .from('profiles')
            .select('full_name')
            .eq('id', r.user_id)
            .single()
            .then(({ data: p }) => {
              setNotifications(prev => [{
                id: String(r.id),
                text: `${p?.full_name || 'Alguém'} pediu ${r.type}`,
                sub: fmtRange(r.start_date, r.end_date),
                dot: 'bg-amber-400',
                isNew: true,
              }, ...prev.filter(n => n.id !== String(r.id))]);
            });
        }
      );
    } else {
      // Workers: status updates on their own requests
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leave_requests', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const r = payload.new;
          if (dismissed.has(String(r.id))) return;
          if (r.status !== 'approved' && r.status !== 'rejected') return;
          const statusLabel = r.status === 'approved' ? 'Aprovada ✓' : 'Recusada ✗';
          setNotifications(prev => [{
            id: String(r.id),
            text: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} – ${statusLabel}`,
            sub: fmtRange(r.start_date, r.end_date),
            dot: r.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400',
            isNew: true,
          }, ...prev.filter(n => n.id !== String(r.id))]);
        }
      );
    }

    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, [profile, isManager]);

  // ── Dismiss helpers ──
  const dismissNotif = (id, e) => {
    e.stopPropagation();
    const d = getDismissed();
    d.add(id);
    saveDismissed(d);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = (e) => {
    e.stopPropagation();
    const d = getDismissed();
    notifications.forEach(n => d.add(n.id));
    saveDismissed(d);
    setNotifications([]);
  };

  const handleNotifClick = () => {
    setNotifOpen(false);
    navigate(isManager ? '/manager-calendar' : '/worker-leaves', { state: isManager ? undefined : { tab: 'history' } });
  };

  const hasNotifs = notifications.length > 0;
  const newCount  = notifications.filter(n => n.isNew).length;

  // Mark all as not-new when panel opens
  const handleBellClick = () => {
    setNotifOpen(prev => !prev);
    if (notifications.some(n => n.isNew)) {
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    }
  };

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
        <div className="relative" ref={panelRef}>
          <button
            onClick={handleBellClick}
            className="w-9 h-9 rounded-radius-sm border border-border flex items-center justify-center text-text hover:bg-bg transition-all relative"
          >
            <Bell size={18} />
            {/* Realtime new-notification pulse */}
            {newCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white animate-pulse" />
            )}
            {/* Static unread dot */}
            {hasNotifs && newCount === 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-border rounded-radius shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Notificações</span>
                  {hasNotifs && (
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {hasNotifs && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-[11px] text-text-muted hover:text-danger transition-colors cursor-pointer"
                    title="Limpar todas"
                  >
                    <Trash2 size={12} />
                    Limpar
                  </button>
                )}
              </div>

              {loading ? (
                <div className="p-6 text-center text-xs text-text-muted">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  A carregar...
                </div>
              ) : !hasNotifs ? (
                <div className="p-8 text-center">
                  <Bell size={22} className="text-border mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Sem notificações.</p>
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {notifications.map(n => (
                      <motion.li
                        key={n.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.18 }}
                        className={n.isNew ? 'bg-primary/3' : ''}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            className="flex-1 text-left px-4 py-3 hover:bg-bg transition-colors cursor-pointer"
                            onClick={handleNotifClick}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.dot}`} />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-text leading-tight">{n.text}</p>
                                <p className="text-[11px] text-text-muted mt-0.5">{n.sub}</p>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={(e) => dismissNotif(n.id, e)}
                            className="pr-3 text-text-muted hover:text-danger transition-colors cursor-pointer flex-shrink-0"
                            title="Remover"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
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
