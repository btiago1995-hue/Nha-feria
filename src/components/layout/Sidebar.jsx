import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Palmtree,
  Users,
  FileText,
  User,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/LanguageContext';

const Sidebar = ({ profile, isOpen, onClose }) => {
  const role = profile?.role;
  const { t } = useLanguage();
  const n = (key) => t('nav', key);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const menuItems = (role === 'manager' || role === 'admin')
    ? [
        { name: n('dashboard'),     icon: <LayoutDashboard size={18} />, path: '/manager-dashboard' },
        { name: n('leaveCalendar'), icon: <Palmtree size={18} />,        path: '/manager-calendar'  },
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
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-primary text-xl">
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
        <div className="px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Principal
        </div>
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
                    transition={{ type: "spring", stiffness: 300, damping: 300 }}
                  />
                )}
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:translate-x-1'}`}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}

        <div className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-white/40 mt-4">
          Conta
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
                    layoutId="activeNav"
                    className="absolute inset-y-0 left-0 w-1 bg-accent rounded-r-full"
                  />
                )}
                <span className={isActive ? 'scale-110' : 'group-hover:translate-x-1'}>{item.icon}</span>
                <span className="flex-1">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-danger hover:bg-white/5 transition-all border-l-[3px] border-transparent mt-5"
        >
          <LogOut size={18} />
          Sair
        </button>
      </nav>

      <div className="p-4 border-t border-white/10 bg-black/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/50 to-primary-light/50 border border-white/10 flex items-center justify-center text-white text-xs font-bold shadow-lg overflow-hidden">
            {(() => {
              const emoji = profile?.id ? localStorage.getItem(`nha_feria_avatar_${profile.id}`) : null;
              return emoji
                ? <span className="text-xl leading-none">{emoji}</span>
                : (profile?.full_name?.charAt(0) || 'U');
            })()}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{profile?.full_name || 'Usuário'}</div>
            <div className="text-[10px] text-white/40 truncate capitalize">{profile?.role || 'Colaborador'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
