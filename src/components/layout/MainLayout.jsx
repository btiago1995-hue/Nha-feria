import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { CompanyProvider, useCompany } from '../../lib/CompanyContext';
import CompanySetupModal from '../ui/CompanySetupModal';
import BottomNav from './BottomNav';
import { AlertTriangle } from 'lucide-react';

const MainLayout = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let initialUserId = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        initialUserId = session.user.id;
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Skip if getSession already fetched this user's profile
        if (session.user.id === initialUserId) { initialUserId = null; return; }
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      // Network errors (e.g. timeout, offline) are silent — don't pollute console
      if (err?.code && err.code !== 'PGRST116') {
        console.error('Error fetching profile:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-light/10 rounded-full"></div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="absolute inset-0 w-16 h-16 border-4 border-primary-light border-t-transparent rounded-full"
            ></motion.div>
          </div>
          <div className="space-y-1 text-center">
            <h3 className="text-lg font-bold font-display text-text">Nha Féria</h3>
            <p className="text-xs text-text-muted font-medium animate-pulse">Sincronizando os teus dados...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine Title based on path
  const getTitle = () => {
    if (location.pathname.includes('dashboard')) return `Olá, ${profile?.full_name?.split(' ')[0] || 'Utilizador'} 👋`;
    if (location.pathname.includes('team')) return 'Gestão de Equipa';
    if (location.pathname.includes('calendar')) return 'Mapa de Férias Global';
    if (location.pathname.includes('leaves')) return 'As Minhas Férias';
    if (location.pathname.includes('compliance') || location.pathname.includes('reports')) return 'Relatórios e Conformidade';
    if (location.pathname === '/profile') return 'O Teu Perfil';
    if (location.pathname === '/settings') return 'Definições';
    return 'Nha Féria';
  };

  // Route guard: only managers and admins can access /manager-dashboard
  if (profile && location.pathname === '/manager-dashboard' && profile.role !== 'manager' && profile.role !== 'admin') {
    return <Navigate to="/worker-dashboard" replace />;
  }

  return (
    <CompanyProvider profile={profile}>
      <AppShell
        profile={profile}
        session={session}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        getTitle={getTitle}
        location={location}
      />
    </CompanyProvider>
  );
};

// Inner component so it can access CompanyContext
const AppShell = ({ profile, session, sidebarOpen, setSidebarOpen, getTitle, location }) => {
  const { company, isSubscriptionActive, refetch } = useCompany();
  const navigate = useNavigate();
  const needsSetup = profile?.role === 'admin' && company !== null && !company?.sector;
  const showSubBanner = profile?.role === 'admin' && !isSubscriptionActive && company?.plan !== 'starter';

  return (
    <div className="min-h-screen bg-bg flex">
      {needsSetup && (
        <CompanySetupModal profile={profile} onComplete={refetch} />
      )}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar profile={profile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:ml-[240px] flex flex-col">
        <TopBar title={getTitle()} user={session.user} profile={profile} onMenuClick={() => setSidebarOpen(true)} />
        {showSubBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-semibold flex-1">
              A subscrição expirou. Algumas funcionalidades podem estar limitadas.
            </p>
            <button
              onClick={() => navigate('/upgrade')}
              className="text-xs font-bold text-amber-800 border border-amber-300 rounded-lg px-3 py-1 hover:bg-amber-100 transition-colors flex-shrink-0"
            >
              Renovar plano →
            </button>
          </div>
        )}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Outlet context={{ profile, session }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav profile={profile} />
    </div>
  );
};

export default MainLayout;
