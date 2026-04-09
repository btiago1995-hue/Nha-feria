import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';

const NotificationBell = ({ userId }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // ── Click-outside close ──
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Initial fetch ──
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchNotifications();
  }, [userId, fetchNotifications]);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-bell-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  // ── Mark single as read ──
  const markRead = useCallback(async (notif) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
    if (notif.data?.leave_request_id) {
      setOpen(false);
      navigate('/manager-calendar');
    }
  }, [navigate]);

  // ── Mark all as read ──
  const markAllRead = useCallback(async (e) => {
    e.stopPropagation();
    if (!userId || notifications.length === 0) return;
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    await supabase.from('notifications').update({ read: true }).in('id', ids);
  }, [userId, notifications]);

  const unreadCount = notifications.length;
  const hasNotifs = unreadCount > 0;

  const handleBellClick = () => setOpen((prev) => !prev);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleBellClick}
        className="w-9 h-9 rounded-radius-sm border border-border flex items-center justify-center text-text hover:bg-bg transition-all relative"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {hasNotifs && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white leading-none animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-panel"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white border border-border rounded-radius shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  Notificações
                </span>
                {hasNotifs && (
                  <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {unreadCount}
                  </span>
                )}
              </div>
              {hasNotifs && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition-colors cursor-pointer"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={12} />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Body */}
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
                  {notifications.map((n) => (
                    <motion.li
                      key={n.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          className="flex-1 text-left px-4 py-3 hover:bg-bg transition-colors cursor-pointer"
                          onClick={() => markRead(n)}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 bg-amber-400" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-text leading-tight">{n.title}</p>
                              {n.body && (
                                <p className="text-[11px] text-text-muted mt-0.5">{n.body}</p>
                              )}
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(n); }}
                          className="pr-3 text-text-muted hover:text-danger transition-colors cursor-pointer flex-shrink-0"
                          title="Marcar como lida"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
