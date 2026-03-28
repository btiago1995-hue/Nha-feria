import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
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
      console.error('Error fetching profile:', err);
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
    if (location.pathname.includes('profile')) return 'O Teu Perfil';
    if (location.pathname.includes('settings')) return 'Configurações de Sistema';
    return 'Nha Féria';
  };

  // Route guard: only managers can access /manager-dashboard
  if (profile && location.pathname === '/manager-dashboard' && profile.role !== 'manager') {
    return <Navigate to="/worker-dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar profile={profile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:ml-[240px] flex flex-col">
        <TopBar title={getTitle()} user={session.user} profile={profile} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 md:p-8">
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
    </div>
  );
};

export default MainLayout;
