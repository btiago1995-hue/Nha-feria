import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Palmtree,
  CalendarDays,
  Users,
  FileText,
  User,
  Settings,
  LogOut,
  X,
  Briefcase,
  UserCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/LanguageContext';

const Sidebar = ({ profile, isOpen, onClose }) => {
  const role = profile?.role;
  const isManager = role === 'manager' || role === 'admin';
  const { t } = useLanguage();
  const n = (key) => t('nav', key);
  const navigate = useNavigate();

  const storageKey = profile?.id ? `nha_feria_view_mode_${profile.id}` : 'nha_feria_view_mode';
  const [viewMode, setViewMode] = useState(() =>
    isManager ? (localStorage.getItem(storageKey) || 'manager') : 'worker'
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const toggleViewMode = () => {
    const next = viewMode === 'manager' ? 'worker' : 'manager';
    setViewMode(next);
    localStorage.setItem(storageKey, next);
    navigate(next === 'manager' ? '/manager-dashboard' : '/worker-dashboard');
  };

  const effectiveRole = isManager ? viewMode : 'worker';

  const menuItems = effectiveRole === 'manager'
    ? [
        { name: n('dashboard'),     icon: <LayoutDashboard size={18} />, path: '/manager-dashboard' },
        { name: n('leaveCalendar'), icon: <CalendarDays size={18} />,    path: '/manager-calendar'  },
        { name: n('team'),          icon: <Users size={18} />,           path: '/team'              },
        { name: n('reports'),       icon: <FileText size={18} />,        path: '/compliance'        },
      ]
    : [
        { name: n('dashboard'), icon: <LayoutDashboard size={18} />, path: '/worker-dashboard' },
        { name: n('myLeaves'),  icon: <Palmtree size={18} />,        path: '/worker-leaves'    },
      ];

  const bottomItems = [
    { name: n('profile'),  icon: <User size={18} />,     path: '/profile'  },
    { name: n('settings'), icon: <Settings size={18} />, path: '/settings' },
  ];

  return (
    <aside className={`w-[240px] bg-primary h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-primary text-xl shadow-lg shadow-accent/20">
          🌴
        </div>
        <span className="font-display font-bold text-lg text-white flex-1">
          Nha <span className="text-accent">Féria</span>
        </span>
        <button onClick={onClose} className="md:hidden text-white/60 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Mode indicator badge (managers only) */}
        {isManager && (
          <div className="px-5 mb-3">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              viewMode === 'manager'
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-white/10 text-white/60 border border-white/10'
            }`}>
              {viewMode === 'manager'
                ? <><Briefcase size={10} /> Modo Gestor</>
                : <><UserCircle2 size={10} /> Modo Colaborador</>
              }
            </div>
          </div>
        )}

        <div className="px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {n('main')}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveRole}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
          >
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all group
                  ${isActive ? 'text-accent' : 'text-white/60 hover:text-white'}
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-y-0 left-0 w-1 bg-accent rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 300 }}
                      />
                    )}
                    <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:translate-x-0.5'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Mode toggle — managers only */}
        {isManager && (
          <div className="px-4 mt-4 mb-1">
            <button
              onClick={toggleViewMode}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/[0.18] border border-white/10 hover:border-white/20 transition-all text-white text-sm font-semibold group"
            >
              {viewMode === 'manager'
                ? <UserCircle2 size={15} className="flex-shrink-0 text-white/60 group-hover:text-white transition-colors" />
                : <Briefcase size={15} className="flex-shrink-0 text-white/60 group-hover:text-white transition-colors" />
              }
              <span className="flex-1 text-left text-white/80 group-hover:text-white transition-colors text-xs">
                {viewMode === 'manager' ? 'Mudar para Colaborador' : 'Mudar para Gestor'}
              </span>
            </button>
          </div>
        )}

        <div className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-white/40 mt-4">
          {n('account')}
        </div>
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all group
              ${isActive ? 'text-accent' : 'text-white/60 hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNavBottom"
                    className="absolute inset-y-0 left-0 w-1 bg-accent rounded-r-full"
                  />
                )}
                <span className={isActive ? 'scale-110' : 'group-hover:translate-x-0.5 transition-transform'}>{item.icon}</span>
                <span className="flex-1">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-danger/80 hover:text-danger hover:bg-white/5 transition-all mt-5"
        >
          <LogOut size={18} />
          {n('signOut')}
        </button>
      </nav>

      {/* User profile footer */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/50 to-primary-light/50 border-2 border-white/10 flex items-center justify-center text-white text-xs font-bold shadow-lg overflow-hidden flex-shrink-0">
            {(() => {
              const emoji = profile?.id ? localStorage.getItem(`nha_feria_avatar_${profile.id}`) : null;
              return emoji
                ? <span className="text-xl leading-none">{emoji}</span>
                : (profile?.full_name?.charAt(0) || 'U');
            })()}
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="text-xs font-bold text-white truncate">{profile?.full_name || 'Usuário'}</div>
            <div className="text-[10px] text-white/40 truncate capitalize">{profile?.role || 'Colaborador'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
