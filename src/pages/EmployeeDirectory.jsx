import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Pencil, History as HistoryIcon, Filter, X, ChevronDown, Check, CalendarDays, Clock } from 'lucide-react';
import ProgressBar from '../components/ui/ProgressBar';
import InviteModal from '../components/ui/InviteModal';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { getBusinessDays } from '../utils/dateUtils';
import { useCompany } from '../lib/CompanyContext';

const ROLE_LABELS = { employee: 'Colaborador', manager: 'Gestor', admin: 'Administrador' };

const STATUS_STYLE = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:  'bg-amber-50  text-amber-700  border-amber-200',
  rejected: 'bg-red-50    text-red-700    border-red-200',
};
const STATUS_LABEL = { approved: 'Aprovado', pending: 'Pendente', rejected: 'Recusado' };

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden:  { y: 10, opacity: 0 },
  visible: { y: 0,  opacity: 1 },
};

// ─── Edit Modal ──────────────────────────────────────────────────────────────
const EditEmployeeModal = ({ worker, departments, onClose, onSaved }) => {
  const [form, setForm]     = useState({
    full_name:        worker.name,
    department:       worker.department,
    role:             worker.role,
    vacation_balance: worker.balance,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name:        form.full_name,
        department:       form.department,
        role:             form.role,
        vacation_balance: Number(form.vacation_balance),
        updated_at:       new Date().toISOString(),
      })
      .eq('id', worker.id);

    setSaving(false);
    if (err) { setError('Erro ao guardar. Verifica as tuas permissões.'); return; }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="bg-white w-full max-w-md rounded-radius shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-text">Editar Colaborador</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">Nome Completo</label>
            <input
              type="text" required
              className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Departamento</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
              >
                {(departments || []).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Cargo</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="employee">Colaborador</option>
                <option value="manager">Gestor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">Saldo de Férias (dias)</label>
            <input
              type="number" min="0" max="60"
              className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={form.vacation_balance}
              onChange={e => setForm({ ...form, vacation_balance: e.target.value })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text hover:bg-bg rounded-radius-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-radius-sm hover:bg-primary-light shadow-sm transition-all active:scale-95 disabled:opacity-60">
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── History Modal ────────────────────────────────────────────────────────────
const HistoryModal = ({ worker, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', worker.id)
        .order('start_date', { ascending: false });
      setRequests(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, [worker.id]);

  const fmtDate = (d) => {
    try { return format(parseISO(d), 'd MMM yyyy', { locale: pt }); } catch { return d; }
  };

  const typeLabel = (t) => ({ férias: 'Férias', justificação: 'Justificada', falta: 'Folga', formação: 'Formação' }[t] || t);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="bg-white w-full max-w-lg rounded-radius shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {worker.avatar}
            </div>
            <div>
              <h2 className="font-bold text-text text-sm">{worker.name}</h2>
              <p className="text-[11px] text-text-muted">Histórico de ausências</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="py-10 text-center">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-text-muted">A carregar…</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarDays className="w-8 h-8 text-border mx-auto mb-2" />
              <p className="text-sm text-text-muted">Sem pedidos de ausência.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="border border-border rounded-radius-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-text">{typeLabel(r.type)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                        <Clock size={10} />
                        {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
                      </div>
                      {r.description && (
                        <p className="mt-1.5 text-[11px] text-text-muted italic">"{r.description}"</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-primary leading-tight">
                        {getBusinessDays(r.start_date, r.end_date)}
                      </div>
                      <div className="text-[10px] text-text-muted">dias úteis</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const EmployeeDirectory = () => {
  const { departments, company }      = useCompany() || {};
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [deptFilter,    setDeptFilter]    = useState('');
  const [showFilters,   setShowFilters]   = useState(false);
  const [editWorker,    setEditWorker]    = useState(null);
  const [historyWorker, setHistoryWorker] = useState(null);
  const [team,          setTeam]          = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => { fetchTeamData(); }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', company?.id || '')
        .order('full_name', { ascending: true });

      const { data: approvedReqs } = await supabase
        .from('leave_requests')
        .select('user_id, start_date, end_date')
        .eq('status', 'approved');

      const usedDaysMap = (approvedReqs || []).reduce((acc, r) => {
        acc[r.user_id] = (acc[r.user_id] || 0) + getBusinessDays(r.start_date, r.end_date);
        return acc;
      }, {});

      const tenureMap = (profiles || []).reduce((acc, p) => {
        const months = p.created_at
          ? Math.floor((Date.now() - new Date(p.created_at)) / (1000 * 60 * 60 * 24 * 30))
          : 0;
        acc[p.id] = months;
        return acc;
      }, {});

      setTeam((profiles || []).map(p => ({
        id:           p.id,
        name:         p.full_name,
        role:         p.role,
        department:   p.department || 'Geral',
        avatar:       p.full_name?.charAt(0)?.toUpperCase() || 'U',
        balance:      p.vacation_balance || 22,
        used:         usedDaysMap[p.id] || 0,
        tenureMonths: tenureMap[p.id] || 0,
      })));
    } catch (err) {
      console.error('Error fetching team data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Departments present in the current team (for filter options)
  const presentDepts = [...new Set(team.map(w => w.department))].sort();

  const filteredTeam = team.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || w.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-[1200px] mx-auto"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold font-display text-text text-gradient">Diretório de Equipa</h2>
          <p className="text-sm text-text-muted">Gere os colaboradores e visualiza os saldos de férias individuais.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-light hover:bg-blue-700 text-white font-bold rounded-radius-sm shadow-md transition-all active:scale-95"
        >
          <UserPlus size={18} /> Adicionar Colaborador
        </button>
      </motion.div>

      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden animate-fade-up">
        {/* Search + Filter bar */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 text-text-light w-4 h-4" />
            <input
              type="text"
              placeholder="Procurar por nome ou departamento…"
              className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter button + dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowFilters(o => !o)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-bg transition-colors ${
                deptFilter ? 'border-primary text-primary bg-primary/5' : 'border-border text-text-muted'
              }`}
            >
              <Filter size={16} />
              {deptFilter || 'Filtros'}
              {deptFilter && (
                <span
                  onClick={(e) => { e.stopPropagation(); setDeptFilter(''); }}
                  className="ml-1 text-primary hover:text-primary-light cursor-pointer"
                >
                  <X size={13} />
                </span>
              )}
              {!deptFilter && <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />}
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-white border border-border rounded-radius-sm shadow-lg z-20 overflow-hidden"
                >
                  <button
                    onClick={() => { setDeptFilter(''); setShowFilters(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-bg transition-colors ${!deptFilter ? 'font-bold text-primary' : 'text-text-muted'}`}
                  >
                    Todos {!deptFilter && <Check size={13} />}
                  </button>
                  <div className="border-t border-border" />
                  {presentDepts.map(d => (
                    <button
                      key={d}
                      onClick={() => { setDeptFilter(d); setShowFilters(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-bg transition-colors ${deptFilter === d ? 'font-bold text-primary' : 'text-text'}`}
                    >
                      {d} {deptFilter === d && <Check size={13} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Active filter chip */}
        {deptFilter && (
          <div className="px-6 py-2 border-b border-border bg-primary/5 flex items-center gap-2 text-xs text-primary font-semibold">
            <Filter size={12} />
            Departamento: {deptFilter}
            <button onClick={() => setDeptFilter('')} className="ml-1 hover:text-primary-light">
              <X size={12} />
            </button>
            <span className="ml-auto text-text-muted font-normal">{filteredTeam.length} resultado(s)</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg/50 border-b border-border">
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Colaborador</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Departamento</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Antiguidade</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider w-[240px]">Saldo de Férias</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-text-muted">A carregar equipa…</p>
                  </td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                filteredTeam.map((worker) => (
                  <motion.tr
                    variants={itemVariants}
                    key={worker.id}
                    className="hover:bg-bg/40 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-primary/5">
                          {worker.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-text leading-tight">{worker.name}</div>
                          <div className="text-[11px] text-text-muted">{ROLE_LABELS[worker.role] || worker.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full">
                        {worker.department}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-text-muted font-medium">
                      {worker.tenureMonths} meses
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-text-muted">Gozados: <strong className="text-text">{worker.used}</strong></span>
                        <span className="text-text-muted">Total: <strong className="text-text">{worker.balance}</strong></span>
                      </div>
                      <ProgressBar value={worker.used} max={worker.balance} />
                      <div className="text-[11px] font-bold text-primary mt-2">
                        {Math.max(0, worker.balance - worker.used)} dias úteis disponíveis
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditWorker(worker)}
                          title="Editar colaborador"
                          className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors border border-transparent hover:border-primary/10"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setHistoryWorker(worker)}
                          title="Ver histórico"
                          className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors border border-transparent hover:border-primary/10"
                        >
                          <HistoryIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editWorker && (
          <EditEmployeeModal
            worker={editWorker}
            departments={departments}
            onClose={() => setEditWorker(null)}
            onSaved={fetchTeamData}
          />
        )}
        {historyWorker && (
          <HistoryModal
            worker={historyWorker}
            onClose={() => setHistoryWorker(null)}
          />
        )}
      </AnimatePresence>

      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={fetchTeamData}
      />
    </motion.div>
  );
};

export default EmployeeDirectory;
