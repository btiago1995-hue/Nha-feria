import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, Download, Info } from 'lucide-react';
import GanttChart from '../components/ui/GanttChart';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { getBusinessDays } from '../utils/dateUtils';
import { format, parseISO, isAfter } from 'date-fns';
import { pt, enGB } from 'date-fns/locale';
import { motion } from 'framer-motion';

const ManagerCalendar = () => {
  const { t, lang } = useLanguage();
  const m = (key, vars) => t('managerDashboard', key, vars);
  const dateLocale = lang === 'en' ? enGB : pt;

  const [ganttData, setGanttData]   = useState([]);
  const [teamSize, setTeamSize]     = useState(0);
  const [offToday, setOffToday]     = useState(0);
  const [nextLeave, setNextLeave]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [viewMode, setViewMode]     = useState('annual');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Approved requests with worker name
      const { data: reqs } = await supabase
        .from('leave_requests')
        .select('start_date, end_date, profiles!leave_requests_user_id_fkey(full_name)')
        .eq('status', 'approved')
        .order('start_date', { ascending: true });

      // Team size
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      setTeamSize(count || 0);

      const today = new Date().toISOString().split('T')[0];

      // Group by worker for Gantt
      const grouped = (reqs || []).reduce((acc, r) => {
        const name = r.profiles?.full_name || 'Utilizador';
        if (!acc[name]) acc[name] = { name, avatar: name.charAt(0), requests: [] };
        acc[name].requests.push({ startDate: r.start_date, endDate: r.end_date });
        return acc;
      }, {});
      const rows = Object.values(grouped);
      setGanttData(rows);

      // Off today
      const offCount = rows.filter(u =>
        u.requests.some(r => today >= r.startDate && today <= r.endDate)
      ).length;
      setOffToday(offCount);

      // Next upcoming leave (first request starting after today)
      const upcoming = (reqs || []).find(r => r.start_date > today);
      if (upcoming) {
        setNextLeave({
          name: upcoming.profiles?.full_name || '—',
          date: upcoming.start_date,
        });
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const rows = [['Colaborador', 'Início', 'Fim', 'Dias Úteis']];
    ganttData.forEach(worker =>
      worker.requests.forEach(r =>
        rows.push([worker.name, r.startDate, r.endDate, getBusinessDays(r.startDate, r.endDate)])
      )
    );
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mapa-ferias-2026.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const availabilityRate = teamSize > 0
    ? Math.round((1 - offToday / teamSize) * 100)
    : 100;

  const nextLeaveLabel = nextLeave
    ? `${nextLeave.name.split(' ')[0]} (${format(parseISO(nextLeave.date), 'd MMM', { locale: dateLocale })})`
    : m('noUpcoming');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1240px] mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text text-gradient">{m('globalLeaveMap')}</h2>
          <p className="text-sm text-text-muted">Visualização cronológica das ausências de toda a organização.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-radius-sm text-sm font-semibold hover:bg-bg transition-colors cursor-pointer">
            <Filter size={15} /> Filtros
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-radius-sm text-sm font-semibold hover:bg-primary-light transition-colors cursor-pointer active:scale-95"
          >
            <Download size={15} /> Exportar Mapa
          </button>
        </div>
      </div>

      {/* Gantt card */}
      <div className="bg-white rounded-radius border border-border shadow-sm p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-text">{m('yearView')}</div>
              <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">{m('cvHolidays')}</div>
            </div>
          </div>
          <div className="flex bg-bg p-1 rounded-lg border border-border">
            {[['monthly', m('monthly')], ['quarterly', m('quarterly')], ['annual', m('annual')]].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  viewMode === mode
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-text-muted">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            A carregar mapa…
          </div>
        ) : (
          <GanttChart data={ganttData} viewMode={viewMode} />
        )}

        <div className="mt-8 p-4 bg-slate-50 border border-border rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="text-primary-light flex-shrink-0 mt-0.5" size={18} />
            <p className="text-[12px] text-text-muted leading-relaxed">{m('ganttTip')}</p>
          </div>
        </div>
      </div>

      {/* Stat summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
        <StatCard
          label={m('absentsToday')}
          value={loading ? '…' : String(offToday)}
          color="blue"
        />
        <StatCard
          label={m('nextLeave')}
          value={loading ? '…' : nextLeaveLabel}
          color="amber"
        />
        <StatCard
          label={m('availabilityRate')}
          value={loading ? '…' : `${availabilityRate}%`}
          color="emerald"
        />
      </div>
    </motion.div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colors = {
    blue:    'border-blue-200    bg-blue-50    text-blue-700',
    amber:   'border-amber-200   bg-amber-50   text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <div className={`p-5 border rounded-radius ${colors[color]} flex flex-col gap-1 shadow-sm`}>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</span>
      <span className="text-lg font-bold truncate">{value}</span>
    </div>
  );
};

export default ManagerCalendar;
