import React, { useEffect, useState } from 'react';
import { Sun, CheckCircle2, Clock, Plane, History, CalendarDays } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import VacationBalanceCard from '../components/ui/VacationBalanceCard';
import TeamCalendar from '../components/ui/TeamCalendar';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { pt, enGB } from 'date-fns/locale';
import { getBusinessDays } from '../utils/dateUtils';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }
};

/** Expands leave request date ranges into individual {date, name} absence entries */
const expandAbsences = (leaveRequests) => {
  const absences = [];
  leaveRequests.forEach((req) => {
    const start = parseISO(req.start_date);
    const end   = parseISO(req.end_date);
    eachDayOfInterval({ start, end }).forEach((day) => {
      absences.push({
        date: format(day, 'yyyy-MM-dd'),
        name: req.profiles?.full_name || 'Colega',
      });
    });
  });
  return absences;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const WorkerDashboard = () => {
  const { profile } = useOutletContext();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const d = (key, vars) => t('workerDashboard', key, vars);
  const dateLocale = lang === 'en' ? enGB : pt;

  const [requests, setRequests]       = useState([]);
  const [nextHoliday, setNextHoliday] = useState(null);
  const [teamAbsences, setTeamAbsences] = useState([]);
  const [holidays, setHolidays]       = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (profile) fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. My requests
      const { data: reqs, error: reqError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false });
      if (reqError) throw reqError;
      setRequests(reqs || []);

      // 2. Next national holiday
      const { data: holidaysData } = await supabase
        .from('holidays_cv')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      const national = (holidaysData || []).filter(h => h.scope === 'national');

      // Also include island-specific holidays for the user's island
      const userIsland = profile?.island;
      const islandHolidays = userIsland
        ? (holidaysData || []).filter(h => h.scope === 'island' && h.island === userIsland)
        : [];

      const relevantHolidays = [...national, ...islandHolidays].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setHolidays(relevantHolidays);
      if (relevantHolidays.length) setNextHoliday(relevantHolidays[0]);

      // 3. Team absences (all approved requests from colleagues)
      const { data: teamReqs } = await supabase
        .from('leave_requests')
        .select('start_date, end_date, profiles!leave_requests_user_id_fkey(full_name)')
        .eq('status', 'approved')
        .neq('user_id', profile.id);

      setTeamAbsences(expandAbsences(teamReqs || []));


    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const sumDays = (reqs) =>
    reqs.reduce((total, r) => total + getBusinessDays(r.start_date, r.end_date), 0);

  const stats = {
    available: profile?.vacation_balance || 22,
    used:    sumDays(requests.filter(r => r.status === 'approved')),
    pending: sumDays(requests.filter(r => r.status === 'pending')),
  };

  const firstName = profile?.full_name?.split(' ')[0] || '';

  const getStatusBadge = (status) => {
    const label = t('status', status);
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            {label}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            {label}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-100">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            {label}
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-7 max-w-[1200px] mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-primary-light uppercase tracking-widest">{getGreeting()}{firstName ? `, ${firstName}` : ''} 👋</p>
        <h2 className="text-2xl font-bold text-text text-gradient">{d('title')}</h2>
        <p className="text-sm text-text-muted">{d('subtitle')}</p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Sun className="w-5 h-5" />}          value={stats.available} label={d('availableDays')} color="blue" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} value={stats.used}      label={d('daysTaken')}    color="green" />
        <StatCard icon={<Clock className="w-5 h-5" />}        value={stats.pending}   label={d('pendingDays')}  color="yellow" />
      </motion.div>

      {/* Balance + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <VacationBalanceCard profile={profile} pendingDays={stats.pending} usedDays={stats.used} />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-primary border border-primary-light/20 rounded-radius p-6 shadow-lg relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full -ml-8 -mb-8 pointer-events-none" />
            <div className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Plane className="w-3.5 h-3.5" />
              {d('quickAction')}
            </div>
            <p className="text-sm text-white/75 mb-5 relative z-10">{d('quickActionDesc')}</p>
            <button
              onClick={() => navigate('/worker-leaves')}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-radius-sm shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 text-sm relative z-10 cursor-pointer"
            >
              <Plane className="w-4 h-4" />
              {d('requestLeave')}
            </button>
          </motion.div>

          {/* Next Holiday */}
          {nextHoliday ? (
            <div className="bg-white border border-border rounded-radius p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="w-12 h-14 bg-violet-50 rounded-radius-sm flex flex-col items-center justify-center flex-shrink-0 border border-violet-100">
                <div className="text-2xl font-bold text-violet-700 leading-none">
                  {format(parseISO(nextHoliday.date), 'd')}
                </div>
                <div className="text-[10px] text-violet-500 font-bold uppercase mt-0.5">
                  {format(parseISO(nextHoliday.date), 'MMM', { locale: dateLocale })}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-0.5">
                  {nextHoliday.scope === 'national' ? d('nextHoliday') : `${d('islandHoliday')} — ${nextHoliday.island}`}
                </div>
                <div className="text-sm font-bold text-text">{nextHoliday.name}</div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-border rounded-radius p-5 text-center text-xs text-text-muted">
              {d('noHolidays')}
            </div>
          )}
        </motion.div>
      </div>

      {/* Team Calendar + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-10">
        <motion.div variants={itemVariants}>
          <TeamCalendar
            teamAbsences={teamAbsences}
            holidays={holidays}
            myLeaves={requests
              .filter(r => r.status === 'approved')
              .flatMap(r => {
                const s = parseISO(r.start_date);
                const e = parseISO(r.end_date);
                return eachDayOfInterval({ start: s, end: e }).map(d => format(d, 'yyyy-MM-dd'));
              })}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4" />
              {d('recentHistory')}
            </div>
            <button onClick={() => navigate('/worker-leaves', { state: { tab: 'history' } })} className="text-xs font-semibold text-primary-light hover:underline cursor-pointer">{d('viewAll')}</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg text-xs font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">{d('period')}</th>
                  <th className="px-5 py-3">{d('type')}</th>
                  <th className="px-4 py-3 text-center">{d('days')}</th>
                  <th className="px-6 py-3 text-right">{d('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.length > 0 ? requests.map((item) => (
                  <tr key={item.id} className="hover:bg-bg/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-text text-sm">
                      {format(parseISO(item.start_date), 'd MMM', { locale: dateLocale })} – {format(parseISO(item.end_date), 'd MMM yyyy', { locale: dateLocale })}
                    </td>
                    <td className="px-5 py-4 text-text-muted capitalize text-sm">{item.type}</td>
                    <td className="px-4 py-4 text-center font-semibold text-primary text-sm">{getBusinessDays(item.start_date, item.end_date)}</td>
                    <td className="px-6 py-4 text-right">{getStatusBadge(item.status)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-text-muted">
                      <CalendarDays className="w-8 h-8 text-border mx-auto mb-2" />
                      {d('noRequests')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WorkerDashboard;
