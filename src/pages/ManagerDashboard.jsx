import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, Download, FileText, AlertTriangle,
  History, Inbox, Sun, BarChart2, ClipboardList,
  CheckCircle2, X, TrendingUp,
} from 'lucide-react';
import SumCard from '../components/ui/SumCard';
import ApprovalList from '../components/ui/ApprovalList';
import GanttChart from '../components/ui/GanttChart';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';
import { getBusinessDays } from '../utils/dateUtils';
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
    try {
      const { data: pendingReqs, error: reqError } = await supabase
        .from('leave_requests')
        .select('*, profiles!leave_requests_user_id_fkey(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
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

      const { data: profilesData } = await supabase.from('profiles').select('*');
      const profiles = profilesData || [];

      const { data: approvedData } = await supabase
        .from('leave_requests')
        .select('start_date, end_date, type, description, profiles!leave_requests_user_id_fkey(full_name, department)')
        .eq('status', 'approved')
        .order('start_date', { ascending: true });
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
        .in('status', ['approved', 'rejected']);
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
    } catch {
      showToast(m('approveError'), 'error');
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-7 max-w-[1240px] mx-auto pb-20"
    >
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
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-primary-light uppercase tracking-widest">Gestão</p>
          <h2 className="text-2xl font-bold text-text text-gradient">{m('title')}</h2>
          <p className="text-sm text-text-muted">{m('subtitle')}</p>
        </div>
        <button
          onClick={exportMapaAnual}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-radius-sm text-sm font-semibold hover:bg-bg hover:border-primary/20 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Download size={15} />
          {m('exportReport')}
        </button>
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
        <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <History size={15} />
              {m('approvalRequests')}
              {stats.pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {stats.pendingCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/manager-calendar')}
              className="text-xs font-semibold text-primary-light hover:underline cursor-pointer"
            >
              {m('viewAll')}
            </button>
          </div>
          <div className="p-5 flex-1">
            <ApprovalList requests={requests} onApprove={handleApprove} onReject={handleReject} />

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
          <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Calendar size={15} />
                {m('whoIsOff')}
              </div>
              <span className="text-xs text-text-muted font-medium">
                {format(new Date(), 'd MMM yyyy', { locale: dateLocale })}
              </span>
            </div>
            <div className="space-y-2">
              {offTodayList.length > 0 ? (
                offTodayList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-bg rounded-radius-sm hover:bg-bg/80 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                      {item.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text leading-tight truncate">{item.name}</div>
                      {item.department && item.department !== '—' && (
                        <div className="text-[10px] text-text-muted mt-0.5">{item.department}</div>
                      )}
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      {m('onLeave')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-text-muted bg-bg/30 border border-dashed border-border rounded-radius-sm">
                  {m('noOneAbsent')}
                </div>
              )}
            </div>
          </motion.div>

          {/* Team stats */}
          <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm p-5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={15} />
              {m('avgTeamBalance')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-primary/5 rounded-radius-sm text-center border border-primary/10">
                <div className="text-2xl font-bold text-primary">{loading ? '…' : stats.avgBalance}</div>
                <div className="text-xs text-text-muted mt-1">{m('avgAvailableDays')}</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-radius-sm text-center border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-600">{loading ? '…' : `${stats.approvalRate}%`}</div>
                <div className="text-xs text-text-muted mt-1">{m('approvalRate')}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gantt Chart */}
      <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Calendar size={15} />
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
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <FileText size={15} />
          {m('complianceTitle')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ReportCard
            icon={<BarChart2 className="w-6 h-6" />}
            iconColor="text-primary-light bg-blue-50"
            title="Mapa de Férias Anual"
            desc={`${approvedReqs.length} pedidos aprovados — ficheiro CSV pronto para afixação e envio à DGT.`}
            btnText="Exportar CSV"
            onAction={exportMapaAnual}
            disabled={loading || approvedReqs.length === 0}
          />
          <ReportCard
            icon={<ClipboardList className="w-6 h-6" />}
            iconColor="text-violet-600 bg-violet-50"
            title="Relatório DGT"
            desc={`${approvedReqs.filter(r => r.start_date >= '2026-01-01' && r.start_date <= '2026-04-30').length} pedidos Jan–Abr 2026 para a Direção Geral do Trabalho.`}
            btnText="Exportar DGT"
            onAction={exportDGT}
            disabled={loading}
          />
          <ReportCard
            icon={<AlertTriangle className="w-6 h-6" />}
            iconColor="text-amber-600 bg-amber-50"
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
    </motion.div>
  );
};

const ReportCard = ({ icon, iconColor = 'text-primary-light bg-blue-50', title, desc, btnText, btnColor = 'primary', onAction, disabled }) => (
  <div className="bg-white border border-border rounded-radius p-5 hover:shadow-md transition-all group flex flex-col">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 ${iconColor}`}>
      {icon}
    </div>
    <h4 className="text-sm font-bold text-text mb-1.5 group-hover:text-primary-light transition-colors">{title}</h4>
    <p className="text-xs text-text-muted leading-relaxed mb-5 flex-1">{desc}</p>
    <button
      onClick={onAction}
      disabled={disabled}
      className={`w-full py-2.5 rounded-radius-sm text-xs font-bold text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${btnColor === 'accent' ? 'bg-accent hover:bg-accent-hover' : 'bg-primary hover:bg-primary-light'}`}
    >
      {btnText}
    </button>
  </div>
);

export default ManagerDashboard;
