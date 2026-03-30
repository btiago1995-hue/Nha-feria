import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Pencil, History as HistoryIcon, Filter, X, ChevronDown, Check, CalendarDays, Clock, Trash2, AlertTriangle } from 'lucide-react';
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

const ISLANDS = ['Santiago','São Vicente','Santo Antão','Fogo','Sal','Boa Vista','Maio','São Nicolau','Brava','Santa Luzia'];
const inp = 'w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';
const Section = ({ label, children }) => (
  <div>
    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{label}</p>
    <div className="grid grid-cols-2 gap-3">{children}</div>
  </div>
);
const Field = ({ label, children, span }) => (
  <div className={`space-y-1 ${span === 2 ? 'col-span-2' : ''}`}>
    <label className="text-[11px] font-semibold text-text-muted">{label}</label>
    {children}
  </div>
);
const EDUCATION_LEVELS = ['Sem habilitação','Ensino Básico','Ensino Secundário','Bacharelato','Licenciatura','Mestrado','Doutoramento'];
const EMPLOYMENT_STATUSES = ['Permanente','Contrato a Prazo','Contrato de Trabalho Temporário','Prestação de Serviços','Estágio','Outro'];

// ─── Edit Modal ──────────────────────────────────────────────────────────────
const EditEmployeeModal = ({ worker, departments, onClose, onSaved }) => {
  const [form, setForm]         = useState({
    full_name:            worker.name,
    department:           worker.department,
    role:                 worker.role,
    vacation_balance:     worker.balance,
    nif:                  worker.nif || '',
    cni:                  worker.cni || '',
    job_title:            worker.job_title || '',
    hire_date:            worker.hire_date || '',
    island:               worker.island || '',
    gender:               worker.gender || '',
    birth_date:           worker.birth_date || '',
    inps_number:          worker.inps_number || '',
    education_level:      worker.education_level || '',
    employment_status:    worker.employment_status || '',
    base_salary:          worker.base_salary || '',
    food_allowance:       worker.food_allowance || '',
    weekly_hours:         worker.weekly_hours || 40,
    last_promotion_date:  worker.last_promotion_date || '',
  });
  const [saving,    setSaving]   = useState(false);
  const [deleting,  setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState('');
  const [showDel,   setShowDel]  = useState(false);
  const [error,     setError]    = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name:            form.full_name,
        department:           form.department,
        role:                 form.role,
        vacation_balance:     Number(form.vacation_balance),
        nif:                  form.nif.trim() || null,
        cni:                  form.cni.trim() || null,
        job_title:            form.job_title.trim() || null,
        hire_date:            form.hire_date || null,
        island:               form.island || null,
        gender:               form.gender || null,
        birth_date:           form.birth_date || null,
        inps_number:          form.inps_number.trim() || null,
        education_level:      form.education_level || null,
        employment_status:    form.employment_status || null,
        base_salary:          form.base_salary !== '' ? Number(form.base_salary) : null,
        food_allowance:       form.food_allowance !== '' ? Number(form.food_allowance) : null,
        weekly_hours:         form.weekly_hours ? Number(form.weekly_hours) : 40,
        last_promotion_date:  form.last_promotion_date || null,
        updated_at:           new Date().toISOString(),
      })
      .eq('id', worker.id);

    setSaving(false);
    if (err) { setError('Erro ao guardar. Verifica as tuas permissões.'); return; }
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    if (confirmDel !== worker.name) return;
    setDeleting(true);
    const { error: err } = await supabase.rpc('gdpr_delete_user', { p_target_user_id: worker.id });
    setDeleting(false);
    if (err) { setError('Erro ao apagar: ' + err.message); setShowDel(false); return; }
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

        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* ── Dados gerais ── */}
          <Section label="Dados Gerais">
            <Field label="Nome Completo" span={2}>
              <input type="text" required className={inp} value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </Field>
            <Field label="Departamento">
              <select className={inp} value={form.department} onChange={e => set('department', e.target.value)}>
                {(departments || []).map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Perfil de acesso">
              <select className={inp} value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="employee">Colaborador</option>
                <option value="manager">Gestor</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
            <Field label="Saldo de Férias (dias)" span={2}>
              <input type="number" min="0" max="60" className={inp} value={form.vacation_balance} onChange={e => set('vacation_balance', e.target.value)} />
            </Field>
          </Section>

          {/* ── Identificação ── */}
          <Section label="Identificação">
            <Field label="NIF">
              <input type="text" className={inp} placeholder="000000000" value={form.nif} onChange={e => set('nif', e.target.value)} />
            </Field>
            <Field label="CNI / BI">
              <input type="text" className={inp} value={form.cni} onChange={e => set('cni', e.target.value)} />
            </Field>
            <Field label="Nº INPS (Previdência)">
              <input type="text" className={inp} placeholder="Nº beneficiário" value={form.inps_number} onChange={e => set('inps_number', e.target.value)} />
            </Field>
            <Field label="Sexo">
              <select className={inp} value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">—</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </Field>
            <Field label="Data de Nascimento" span={2}>
              <input type="date" className={inp} value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </Field>
          </Section>

          {/* ── Dados profissionais ── */}
          <Section label="Dados Profissionais (DGT)">
            <Field label="Função / Cargo Profissional" span={2}>
              <input type="text" className={inp} placeholder="Ex: Contabilista" value={form.job_title} onChange={e => set('job_title', e.target.value)} />
            </Field>
            <Field label="Situação na Profissão" span={2}>
              <select className={inp} value={form.employment_status} onChange={e => set('employment_status', e.target.value)}>
                <option value="">—</option>
                {EMPLOYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Habilitação Literária" span={2}>
              <select className={inp} value={form.education_level} onChange={e => set('education_level', e.target.value)}>
                <option value="">—</option>
                {EDUCATION_LEVELS.map(e => <option key={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="Data de Admissão">
              <input type="date" className={inp} value={form.hire_date} onChange={e => set('hire_date', e.target.value)} />
            </Field>
            <Field label="Última Progressão">
              <input type="date" className={inp} value={form.last_promotion_date} onChange={e => set('last_promotion_date', e.target.value)} />
            </Field>
            <Field label="Ilha">
              <select className={inp} value={form.island} onChange={e => set('island', e.target.value)}>
                <option value="">—</option>
                {ISLANDS.map(i => <option key={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Horas Semanais">
              <input type="number" min="1" max="60" className={inp} value={form.weekly_hours} onChange={e => set('weekly_hours', e.target.value)} />
            </Field>
          </Section>

          {/* ── Remuneração ── */}
          <Section label="Remuneração">
            <Field label="Remuneração Base (CVE)">
              <input type="number" min="0" step="0.01" className={inp} placeholder="0.00" value={form.base_salary} onChange={e => set('base_salary', e.target.value)} />
            </Field>
            <Field label="Subsídio Alimentação (CVE)">
              <input type="number" min="0" step="0.01" className={inp} placeholder="0.00" value={form.food_allowance} onChange={e => set('food_allowance', e.target.value)} />
            </Field>
          </Section>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text hover:bg-bg rounded-radius-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-radius-sm hover:bg-primary-light shadow-sm transition-all active:scale-95 disabled:opacity-60">
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>

        {/* RGPD — Delete section */}
        <div className="px-6 pb-5">
          {!showDel ? (
            <button
              onClick={() => setShowDel(true)}
              className="flex items-center gap-1.5 text-xs text-danger/70 hover:text-danger transition-colors mt-1"
            >
              <Trash2 size={13} /> Apagar colaborador (RGPD)
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-radius-sm p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-relaxed">
                  <strong>Ação irreversível.</strong> Apaga todos os dados pessoais e pedidos de férias de <strong>{worker.name}</strong>. Para confirmar, escreve o nome completo abaixo.
                </p>
              </div>
              <input
                type="text"
                placeholder={worker.name}
                className="w-full px-3 py-2 border border-red-300 rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                value={confirmDel}
                onChange={e => setConfirmDel(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowDel(false); setConfirmDel(''); }} className="flex-1 py-2 text-xs font-semibold border border-border rounded-radius-sm hover:bg-bg transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmDel !== worker.name || deleting}
                  className="flex-1 py-2 text-xs font-bold bg-danger text-white rounded-radius-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? 'A apagar…' : 'Apagar definitivamente'}
                </button>
              </div>
            </div>
          )}
        </div>
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
        .select('id, full_name, role, department, vacation_balance, created_at, nif, cni, job_title, hire_date, island, gender, birth_date, inps_number, education_level, employment_status, base_salary, food_allowance, weekly_hours, last_promotion_date')
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
        id:                  p.id,
        name:                p.full_name,
        role:                p.role,
        department:          p.department || 'Geral',
        avatar:              p.full_name?.charAt(0)?.toUpperCase() || 'U',
        balance:             p.vacation_balance || 22,
        used:                usedDaysMap[p.id] || 0,
        tenureMonths:        tenureMap[p.id] || 0,
        nif:                 p.nif || null,
        cni:                 p.cni || null,
        job_title:           p.job_title || null,
        hire_date:           p.hire_date || null,
        island:              p.island || null,
        gender:              p.gender || null,
        birth_date:          p.birth_date || null,
        inps_number:         p.inps_number || null,
        education_level:     p.education_level || null,
        employment_status:   p.employment_status || null,
        base_salary:         p.base_salary || null,
        food_allowance:      p.food_allowance || null,
        weekly_hours:        p.weekly_hours || 40,
        last_promotion_date: p.last_promotion_date || null,
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
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">NIF</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider hidden xl:table-cell">CNI</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Antiguidade</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider w-[200px]">Saldo de Férias</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-text-muted">A carregar equipa…</p>
                  </td>
                </tr>
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">
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
                    <td className="px-6 py-5 text-xs font-mono text-text-muted hidden lg:table-cell">
                      {worker.nif || <span className="text-amber-500 text-[10px] font-sans font-semibold">Em falta</span>}
                    </td>
                    <td className="px-6 py-5 text-xs font-mono text-text-muted hidden xl:table-cell">
                      {worker.cni || <span className="text-amber-500 text-[10px] font-sans font-semibold">Em falta</span>}
                    </td>
                    <td className="px-6 py-5 text-sm text-text-muted font-medium hidden md:table-cell">
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
