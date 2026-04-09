import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, Download, FileText, AlertTriangle,
  History, Inbox, Sun, BarChart2, ClipboardList,
  CheckCircle2, X, TrendingUp, UserPlus, ArrowRight,
} from 'lucide-react';
import SumCard from '../components/ui/SumCard';
import GanttChart from '../components/ui/GanttChart';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';
import { getBusinessDays } from '../utils/dateUtils';
import { sendEmail } from '../utils/sendEmail';
import { format, parseISO } from 'date-fns';
import { pt, enGB } from 'date-fns/locale';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const ManagerDashboard = () => {
  const { profile } = useOutletContext();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const m = (key, vars) => t('managerDashboard', key, vars);
  const dateLocale = lang === 'en' ? enGB : pt;

  const [requests, setRequests]         = useState([]);
  const [ganttData, setGanttData]       = useState([]);
  const [approvedReqs, setApprovedReqs] = useState([]);
  const [deptFilter, setDeptFilter]     = useState('');
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [stats, setStats] = useState({
    pendingCount: 0,
    offToday: 0,
    teamSize: 0,
    avgBalance: '—',
    approvalRate: 0,
    accumAlerts: [],
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchManagerData(); }, []);

  const fetchManagerData = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      // Hierarchy filter: managers see only their team's requests
      let teamMemberIds = null;
      if (profile?.role === 'manager') {
        const { data: teamMembers } = await supabase
          .from('profiles')
          .select('id')
          .eq('manager_id', profile.id);
        teamMemberIds = (teamMembers || []).map(p => p.id);
      }

      let pendingQuery = supabase
        .from('leave_requests')
        .select('*, profiles!leave_requests_user_id_fkey(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100);

      if (teamMemberIds !== null) {
        pendingQuery = teamMemberIds.length > 0
          ? pendingQuery.in('user_id', teamMemberIds)
          : pendingQuery.in('user_id', ['00000000-0000-0000-0000-000000000000']); // empty
      }

      const { data: pendingReqs, error: reqError } = await pendingQuery;
      if (reqError) throw reqError;

      const formattedRequests = (pendingReqs || []).map(r => ({
        id: r.id,
        workerName: r.profiles?.full_name || 'Desconhecido',
        avatar: r.profiles?.full_name?.charAt(0) || 'U',
        startDate: r.start_date,
        endDate: r.end_date,
        type: r.type,
        status: r.status,
        description: r.description,
        days: getBusinessDays(r.start_date, r.end_date),
      }));
      setRequests(formattedRequests);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id);
      const profiles = profilesData || [];

      const { data: approvedData } = await supabase
        .from('leave_requests')
        .select('start_date, end_date, type, description, profiles!leave_requests_user_id_fkey(full_name, department)')
        .eq('status', 'approved')
        .order('start_date', { ascending: true })
        .limit(500);
      setApprovedReqs(approvedData || []);

      const grouped = (approvedData || []).reduce((acc, r) => {
        const name = r.profiles?.full_name || 'Utilizador';
        const dept = r.profiles?.department || '—';
        if (!acc[name]) acc[name] = { name, department: dept, avatar: name.charAt(0), requests: [] };
        acc[name].requests.push({ startDate: r.start_date, endDate: r.end_date });
        return acc;
      }, {});
      const ganttRows = Object.values(grouped);
      setGanttData(ganttRows);

      const { data: decidedReqs } = await supabase
        .from('leave_requests')
        .select('status')
        .in('status', ['approved', 'rejected'])
        .limit(1000);
      const approvedCount = (decidedReqs || []).filter(r => r.status === 'approved').length;
      const approvalRate = decidedReqs?.length > 0
        ? Math.round(approvedCount / decidedReqs.length * 100)
        : 0;

      const today = new Date().toISOString().split('T')[0];
      const offToday = ganttRows.filter(u =>
        u.requests.some(r => today >= r.startDate && today <= r.endDate)
      ).length;
      const avgBalance = profiles.length > 0
        ? (profiles.reduce((sum, p) => sum + (p.vacation_balance || 0), 0) / profiles.length).toFixed(1)
        : '—';
      const accumAlerts = profiles.filter(p => (p.vacation_balance || 0) > 30);

      setStats({
        pendingCount: formattedRequests.length,
        offToday,
        teamSize: profiles.length,
        avgBalance,
        approvalRate,
        accumAlerts,
      });
    } catch (err) {
      console.error('Error fetching manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  const notifyWorker = async (req, status) => {
    const { data: workerProfile } = await supabase
      .from('profiles')
      .select('email, full_name, notify_on_leave_decided')
      .eq('id', req.user_id)
      .single();
    if (workerProfile?.email && workerProfile.notify_on_leave_decided !== false) {
      sendEmail({
        type: 'leave_decided',
        workerEmail: workerProfile.email,
        workerName: workerProfile.full_name || '',
        status,
        leaveType: req.type,
        startDate: req.start_date,
        endDate: req.end_date,
        dashboardUrl: `${window.location.origin}/worker-dashboard`,
      });
    }
  };

  const handleApprove = async (id) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved', approved_by: profile.id })
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('no permission');
      setRequests(prev => prev.filter(r => r.id !== id));
      showToast(m('approveSuccess'));
      fetchManagerData();
      notifyWorker(data[0], 'approved');
    } catch {
      showToast(m('approveError'), 'error');
    }
  };

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map(r => r.id)));
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = [...selectedIds];
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status, approved_by: profile.id })
        .in('id', ids)
        .select();
      if (error) throw error;
      (data || []).forEach(r => notifyWorker(r, status));
      showToast(status === 'approved' ? m('approveSuccess') : m('rejectSuccess'));
      fetchManagerData();
    } catch {
      showToast(status === 'approved' ? m('approveError') : m('rejectError'), 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected', approved_by: profile.id })
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('no permission');
      setRequests(prev => prev.filter(r => r.id !== id));
      showToast(m('rejectSuccess'));
      notifyWorker(data[0], 'rejected');
    } catch {
      showToast(m('rejectError'), 'error');
    }
  };

  const downloadCsv = (rows, filename) => {
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  const buildRow = r => [
    r.profiles?.full_name || '—',
    r.profiles?.department || '—',
    r.start_date, r.end_date,
    r.type || '—',
    getBusinessDays(r.start_date, r.end_date),
  ];
  const CSV_HEADER = ['Colaborador', 'Departamento', 'Início', 'Fim', 'Tipo', 'Dias Úteis'];

  const exportMapaAnual = () => {
    downloadCsv([CSV_HEADER, ...approvedReqs.map(buildRow)], 'mapa-ferias-2026.csv');
    showToast(m('exportDone'));
  };
  const exportDGT = () => {
    const q1 = approvedReqs.filter(r => r.start_date >= '2026-01-01' && r.start_date <= '2026-04-30');
    downloadCsv([CSV_HEADER, ...q1.map(buildRow)], 'dgt-quadrimestral-q1-2026.csv');
    showToast(m('exportDone'));
  };

  const today = new Date().toISOString().split('T')[0];
  const availableDepts = [...new Set(ganttData.map(w => w.department).filter(d => d && d !== '—'))].sort();
  const filteredGanttData = deptFilter ? ganttData.filter(w => w.department === deptFilter) : ganttData;

  const offTodayList = ganttData.filter(u =>
    u.requests.some(r => today >= r.startDate && today <= r.endDate)
  );

  // Breakdown by leave type
  const typeBreakdown = approvedReqs.reduce((acc, r) => {
    const type = r.type || 'outro';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const typeEntries = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]);
  const typeMax = typeEntries[0]?.[1] || 1;

  // Monthly trend (last 6 months of approved requests)
  const monthCounts = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthCounts[key] = 0;
  }
  approvedReqs.forEach(r => {
    const key = r.start_date?.slice(0, 7);
    if (key && key in monthCounts) monthCounts[key]++;
  });
  const monthEntries = Object.entries(monthCounts);
  const monthMax = Math.max(...Object.values(monthCounts), 1);

  // Onboarding banner: shown when admin/manager has no team yet (just signed up)
  const showOnboarding = !loading && stats.teamSize === 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-7 max-w-[1240px] mx-auto pb-20"
    >
      {/* Onboarding banner */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-gradient-to-r from-primary to-primary-light rounded-radius p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Bem-vindo à Nha Féria!</p>
                <p className="text-sm text-white/70 mt-0.5">A tua empresa ainda não tem colaboradores. Convida a tua equipa para começar.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/team')}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-primary text-sm font-bold rounded-radius-sm hover:bg-accent-hover transition-all shadow-md shadow-accent/20 whitespace-nowrap flex-shrink-0"
            >
              Convidar equipa <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-20 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-radius-sm shadow-lg border text-sm font-semibold
              ${toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'}`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 size={16} className="flex-shrink-0" />
              : <AlertTriangle size={16} className="flex-shrink-0" />}
            {toast.msg}
            <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100 cursor-pointer">
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-primary-light uppercase tracking-widest">Gestão</p>
          <h2 className="text-2xl font-bold text-text text-gradient">{m('title')}</h2>
          <p className="text-sm text-text-muted">{m('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-medium capitalize tabular-nums whitespace-nowrap hidden sm:block">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: dateLocale })}
          </span>
          <button
            onClick={exportMapaAnual}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-radius-sm text-sm font-semibold hover:bg-bg hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
          >
            <Download size={15} />
            {m('exportReport')}
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SumCard
          icon={<Inbox className="w-5 h-5" />}
          value={stats.pendingCount}
          label={m('pendingRequests')}
          trend={m('awaitingApproval')}
          trendColor="warn"
        />
        <SumCard
          icon={<Sun className="w-5 h-5" />}
          value={stats.offToday}
          label={m('onLeaveToday')}
          trend={m('synced')}
          trendColor="success"
        />
        <SumCard
          icon={<Users className="w-5 h-5" />}
          value={stats.teamSize}
          label={m('activeTeam')}
          trend={m('users')}
          trendColor="muted"
        />
        <SumCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={stats.accumAlerts.length}
          label={m('accumAlerts')}
          trend={stats.accumAlerts.length === 0 ? m('zeroRisk') : `${stats.accumAlerts.length} ${m('atRisk')}`}
          trendColor={stats.accumAlerts.length === 0 ? 'success' : 'warn'}
        />
      </motion.div>

      {/* Approvals + Who's Off + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Approval List */}
        <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm flex flex-col hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <History size={13} />
              {m('approvalRequests')}
              {stats.pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {stats.pendingCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/manager-calendar')}
              className="text-xs font-semibold text-primary-light hover:text-primary transition-colors cursor-pointer"
            >
              {m('viewAll')}
            </button>
          </div>
          <div className="p-5 flex-1">
            {/* Bulk action bar */}
            {requests.length > 0 && (
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === requests.length && requests.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 accent-primary cursor-pointer"
                  />
                  {selectedIds.size > 0 ? `${selectedIds.size} seleccionado(s)` : 'Seleccionar todos'}
                </label>
                {selectedIds.size > 0 && (
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleBulkAction('approved')}
                      disabled={bulkLoading}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 size={12} /> Aprovar
                    </button>
                    <button
                      onClick={() => handleBulkAction('rejected')}
                      disabled={bulkLoading}
                      className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X size={12} /> Rejeitar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Request list with selection */}
            {requests.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted flex flex-col items-center gap-2 bg-bg/30 border border-dashed border-border rounded-radius-sm">
                <CheckCircle2 size={18} className="text-emerald-400" />
                {m('noPending')}
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map(r => (
                  <div key={r.id} className={`flex items-center gap-3 p-3 rounded-radius-sm border transition-colors ${selectedIds.has(r.id) ? 'bg-primary/5 border-primary/20' : 'bg-bg border-transparent hover:bg-slate-50'}`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="w-3.5 h-3.5 accent-primary flex-shrink-0 cursor-pointer"
                    />
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {r.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{r.workerName}</p>
                      <p className="text-[10px] text-text-muted">{r.startDate} → {r.endDate} · {r.days}d úteis</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleApprove(r.id)} className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer" title="Aprovar">
                        <CheckCircle2 size={14} />
                      </button>
                      <button onClick={() => handleReject(r.id)} className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition-colors cursor-pointer" title="Rejeitar">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stats.accumAlerts.length > 0 && (
              <div className="mt-4 space-y-2">
                {stats.accumAlerts.map((p) => (
                  <div key={p.id} className="p-3 bg-amber-50 border border-amber-200 rounded-radius-sm flex gap-2.5 items-start">
                    <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={14} />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {m('accumWarning', { name: p.full_name, days: p.vacation_balance })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Who's Off + Stats */}
        <div className="space-y-5">
          {/* Who's off today */}
          <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Calendar size={13} />
                {m('whoIsOff')}
              </div>
              <span className="text-xs tabular-nums text-text-muted font-medium">
                {format(new Date(), 'd MMM yyyy', { locale: dateLocale })}
              </span>
            </div>
            <div className="space-y-2">
              {offTodayList.length > 0 ? (
                offTodayList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3 py-2.5 bg-bg rounded-radius-sm hover:bg-slate-100/70 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm ring-2 ring-white">
                      {item.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text leading-tight truncate">{item.name}</div>
                      {item.department && item.department !== '—' && (
                        <div className="text-[10px] text-text-light mt-0.5">{item.department}</div>
                      )}
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      {m('onLeave')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-text-muted flex flex-col items-center gap-2 bg-bg/30 border border-dashed border-border rounded-radius-sm">
                  <Users size={18} className="text-border" />
                  {m('noOneAbsent')}
                </div>
              )}
            </div>
          </motion.div>

          {/* Team stats */}
          <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={13} />
              {m('avgTeamBalance')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-primary/5 rounded-radius-sm text-center border border-primary/10 hover:bg-primary/8 transition-colors">
                <div className="text-2xl font-bold text-primary tabular-nums">{loading ? '…' : stats.avgBalance}</div>
                <div className="text-[11px] text-text-muted mt-1 leading-tight">{m('avgAvailableDays')}</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-radius-sm text-center border border-emerald-100 hover:bg-emerald-50/80 transition-colors">
                <div className="text-2xl font-bold text-emerald-600 tabular-nums">{loading ? '…' : `${stats.approvalRate}%`}</div>
                <div className="text-[11px] text-text-muted mt-1 leading-tight">{m('approvalRate')}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gantt Chart */}
      <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
            <Calendar size={13} />
            {m('globalLeaveMap')}
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="bg-bg border border-border rounded-radius-sm px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-light/30 cursor-pointer"
          >
            <option value="">{m('allDepts')}</option>
            {availableDepts.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="py-10 text-center text-xs text-text-muted">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              A carregar mapa…
            </div>
          ) : (
            <GanttChart data={filteredGanttData} />
          )}
        </div>
      </motion.div>

      {/* Compliance Reports */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
          <FileText size={13} />
          {m('complianceTitle')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ReportCard
            icon={<BarChart2 className="w-6 h-6" />}
            iconColor="text-primary-light bg-blue-50"
            iconRing="ring-blue-100"
            title="Mapa de Férias Anual"
            desc={`${approvedReqs.length} pedidos aprovados — ficheiro CSV pronto para afixação e envio à DGT.`}
            btnText="Exportar CSV"
            onAction={exportMapaAnual}
            disabled={loading || approvedReqs.length === 0}
          />
          <ReportCard
            icon={<ClipboardList className="w-6 h-6" />}
            iconColor="text-violet-600 bg-violet-50"
            iconRing="ring-violet-100"
            title="Relatório DGT"
            desc={`${approvedReqs.filter(r => r.start_date >= '2026-01-01' && r.start_date <= '2026-04-30').length} pedidos Jan–Abr 2026 para a Direção Geral do Trabalho.`}
            btnText="Exportar DGT"
            onAction={exportDGT}
            disabled={loading}
          />
          <ReportCard
            icon={<AlertTriangle className="w-6 h-6" />}
            iconColor="text-amber-600 bg-amber-50"
            iconRing="ring-amber-100"
            title="Alertas de Acumulação"
            desc={stats.accumAlerts.length === 0
              ? 'Nenhum colaborador em risco de acumulação.'
              : `${stats.accumAlerts.length} colaborador(es) próximo(s) do limite legal de 44 dias.`}
            btnText="Ver Relatórios"
            btnColor="accent"
            onAction={() => navigate('/compliance')}
          />
        </div>
      </motion.div>

      {/* Analytics */}
      {!loading && approvedReqs.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
            <BarChart2 size={13} />
            Análise de Ausências
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Leave type breakdown */}
            <div className="bg-white border border-border rounded-radius p-5 hover:shadow-md transition-shadow duration-200">
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Por Tipo</div>
              <div className="space-y-2.5">
                {typeEntries.map(([type, count]) => (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-text capitalize">{type}</span>
                      <span className="text-xs font-bold text-primary tabular-nums">{count}</span>
                    </div>
                    <div className="w-full bg-bg rounded-full h-1.5">
                      <div
                        className="bg-primary rounded-full h-1.5 transition-all duration-500"
                        style={{ width: `${(count / typeMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly trend */}
            <div className="bg-white border border-border rounded-radius p-5 hover:shadow-md transition-shadow duration-200">
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Tendência Mensal</div>
              <div className="flex items-end gap-1.5 h-24">
                {monthEntries.map(([month, count]) => {
                  const heightPct = (count / monthMax) * 100;
                  const label = new Date(month + '-01').toLocaleDateString('pt', { month: 'short' });
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-text tabular-nums">{count > 0 ? count : ''}</span>
                      <div className="w-full flex items-end" style={{ height: '64px' }}>
                        <div
                          className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all duration-500 cursor-default"
                          style={{ height: `${Math.max(heightPct, count > 0 ? 8 : 2)}%` }}
                          title={`${label}: ${count} pedidos`}
                        />
                      </div>
                      <span className="text-[9px] text-text-muted capitalize">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const ReportCard = ({ icon, iconColor = 'text-primary-light bg-blue-50', iconRing = 'ring-blue-100', title, desc, btnText, btnColor = 'primary', onAction, disabled }) => (
  <div className="bg-white border border-border rounded-radius p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 ring-4 ${iconColor} ${iconRing} group-hover:scale-105 transition-transform duration-200`}>
      {icon}
    </div>
    <h4 className="text-sm font-bold text-text mb-1.5 group-hover:text-primary-light transition-colors">{title}</h4>
    <p className="text-xs text-text-muted leading-relaxed mb-5 flex-1">{desc}</p>
    <button
      onClick={onAction}
      disabled={disabled}
      className={`w-full py-2.5 rounded-radius-sm text-xs font-bold text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${btnColor === 'accent' ? 'bg-accent hover:bg-accent-hover shadow-sm shadow-accent/20' : 'bg-primary hover:bg-primary-light shadow-sm shadow-primary/20'}`}
    >
      {btnText}
    </button>
  </div>
);

export default ManagerDashboard;
