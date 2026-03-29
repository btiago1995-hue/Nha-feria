import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Palmtree, CalendarDays,
  Users, User, Briefcase, UserCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../lib/LanguageContext';

const BottomNav = ({ profile }) => {
  const role = profile?.role;
  const isManager = role === 'manager' || role === 'admin';
  const { t } = useLanguage();
  const n = (key) => t('nav', key);
  const navigate = useNavigate();

  const storageKey = profile?.id ? `nha_feria_view_mode_${profile.id}` : 'nha_feria_view_mode';
  const [viewMode, setViewMode] = useState(() =>
    isManager ? (localStorage.getItem(storageKey) || 'manager') : 'worker'
  );
  const [showModeSwitch, setShowModeSwitch] = useState(false);

  const effectiveRole = isManager ? viewMode : 'worker';

  const managerItems = [
    { name: n('dashboard'),     icon: LayoutDashboard, path: '/manager-dashboard' },
    { name: n('leaveCalendar'), icon: CalendarDays,    path: '/manager-calendar'  },
    { name: n('team'),          icon: Users,           path: '/team'              },
    { name: n('profile'),       icon: User,            path: '/profile'           },
  ];

  const workerItems = [
    { name: n('dashboard'), icon: LayoutDashboard, path: '/worker-dashboard' },
    { name: n('myLeaves'),  icon: Palmtree,        path: '/worker-leaves'    },
    { name: n('profile'),   icon: User,            path: '/profile'          },
  ];

  const items = effectiveRole === 'manager' ? managerItems : workerItems;

  const switchMode = (next) => {
    setViewMode(next);
    localStorage.setItem(storageKey, next);
    navigate(next === 'manager' ? '/manager-dashboard' : '/worker-dashboard');
    setShowModeSwitch(false);
  };

  return (
    <>
      {/* Mode switch sheet */}
      <AnimatePresence>
        {showModeSwitch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowModeSwitch(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-24 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mudar vista</p>
              </div>
              <button
                onClick={() => switchMode('manager')}
                className={`w-full flex items-center gap-4 px-5 py-4 transition-colors ${viewMode === 'manager' ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${viewMode === 'manager' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Briefcase size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">Modo Gestor</p>
                  <p className="text-xs text-slate-400">Aprovações, equipa e relatórios</p>
                </div>
                {viewMode === 'manager' && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
              </button>
              <button
                onClick={() => switchMode('worker')}
                className={`w-full flex items-center gap-4 px-5 py-4 transition-colors ${viewMode === 'worker' ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${viewMode === 'worker' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <UserCircle2 size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">Modo Colaborador</p>
                  <p className="text-xs text-slate-400">As minhas férias e saldo</p>
                </div>
                {viewMode === 'worker' && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavDot"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Mode toggle for managers */}
        {isManager && (
          <button
            onClick={() => setShowModeSwitch(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-slate-400 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              {viewMode === 'manager'
                ? <Briefcase size={13} className="text-primary" />
                : <UserCircle2 size={13} className="text-primary" />
              }
            </div>
            <span className="text-[10px] font-semibold leading-none text-slate-400">Modo</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default BottomNav;
