import React, { useState, useEffect } from 'react';
import {
  FileText, Download, ShieldCheck, AlertTriangle, CheckCircle2,
  Calendar, Users, TrendingDown, RefreshCw, Award, ClipboardList,
  Printer, ChevronDown,
} from 'lucide-react';
import { useCompany } from '../lib/CompanyContext';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { getBusinessDays } from '../utils/dateUtils';
import { motion } from 'framer-motion';

const CHECKLIST_KEY = 'nha-feria-checklist-2026';
const DEFAULT_CHECKLIST = [
  { id: 'mapa',      label: 'Mapa de Férias Afixado',         auto: true  },
  { id: 'dgt-q1',   label: 'Envio à DGT (1º Quadrimestre)',   auto: false },
  { id: 'acordo',   label: 'Acordo de Manutenção de Saldo',   auto: false },
  { id: 'subsidio', label: 'Pagamento Subsídio de Férias',    auto: false },
  { id: 'dgt-q2',   label: 'Envio à DGT (2º Quadrimestre)',   auto: false },
];

const Compliance = () => {
  const { company } = useCompany() || {};
  const [workers,   setWorkers]   = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [auditLog,  setAuditLog]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [quadroMenu, setQuadroMenu] = useState(false);
  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false }));
    } catch { return DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false })); }
  });

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (!quadroMenu) return;
    const close = () => setQuadroMenu(false);
    document.addEventListener('click', close, { once: true });
    return () => document.removeEventListener('click', close);
  }, [quadroMenu]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: profiles }, { data: reqs }, { data: logs }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, department, vacation_balance, role, nif, cni, hire_date, job_title, island, gender, birth_date, inps_number, education_level, employment_status, base_salary, food_allowance, weekly_hours, last_promotion_date'),
        supabase
          .from('leave_requests')
          .select('id, user_id, start_date, end_date, status, type, description, profiles!leave_requests_user_id_fkey(full_name, department, nif, cni, hire_date, job_title)')
          .order('start_date', { ascending: true }),
        supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      setWorkers(profiles || []);
      setRequests(reqs || []);
      setAuditLog(logs || []);
    } catch (err) {
      console.error('Compliance fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Computed ─────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const approved = requests.filter(r => r.status === 'approved');

  const approvedByUser = approved.reduce((acc, r) => {
    if (!acc[r.user_id]) acc[r.user_id] = [];
    acc[r.user_id].push(r);
    return acc;
  }, {});

  const totalApprovedDays   = approved.reduce((s, r) => s + getBusinessDays(r.start_date, r.end_date), 0);
  const workersWithNoLeave  = workers.filter(w => !approvedByUser[w.id]).length;

  // Accumulation: workers with vacation_balance > 25 → risk of hitting 44-day legal limit
  const accumAlerts = workers.filter(w => w.vacation_balance > 25);

  // Mandatory consecutive days: workers with approved leaves but none ≥ 11 working days
  const mandatoryAlerts = workers.filter(w => {
    const userReqs = approvedByUser[w.id] || [];
    if (userReqs.length === 0) return false;
    return !userReqs.some(r => getBusinessDays(r.start_date, r.end_date) >= 11);
  });

  const hasAnyApproved = approved.length > 0;

  // Checklist: 'mapa' item is auto-checked when there are approved leaves
  const effectiveChecklist = checklist.map(item =>
    item.id === 'mapa' ? { ...item, checked: hasAnyApproved } : item
  );
  const checkedCount = effectiveChecklist.filter(i => i.checked).length;

  const toggleChecklist = (id) => {
    const updated = checklist.map(item =>
      item.id === id && !item.auto ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(updated));
  };

  // ── Quadro de Pessoal exports ─────────────────────────────────────────────
  const fmtDate = (d) => {
    if (!d) return '—';
    try { return format(parseISO(d), 'dd/MM/yyyy', { locale: pt }); } catch { return d; }
  };
  const fmtCurrency = (v) => v != null ? Number(v).toLocaleString('pt-CV', { minimumFractionDigits: 2 }) + ' CVE' : '—';

  const buildQuadroRows = () => {
    const approved = requests.filter(r => r.status === 'approved');
    const leaveByUser = approved.reduce((acc, r) => {
      if (!acc[r.user_id]) acc[r.user_id] = [];
      acc[r.user_id].push(r);
      return acc;
    }, {});

    return workers.map((w, i) => {
      const leaves = leaveByUser[w.id] || [];
      const periods = leaves.map(r => `${fmtDate(r.start_date)} a ${fmtDate(r.end_date)}`).join(' / ') || '—';
      return {
        linha: i + 1,
        nome: w.full_name || '—',
        cargo: w.job_title || '—',
        situacao: w.employment_status || '—',
        habilitacao: w.education_level || '—',
        inps: w.inps_number || '—',
        sexo: w.gender || '—',
        nascimento: fmtDate(w.birth_date),
        admissao: fmtDate(w.hire_date),
        progressao: fmtDate(w.last_promotion_date),
        ilha: w.island || '—',
        salario: fmtCurrency(w.base_salary),
        subsidio: fmtCurrency(w.food_allowance),
        horas: w.weekly_hours ? `${w.weekly_hours}h/semana` : '—',
        ferias: periods,
      };
    });
  };

  const exportQuadroCsv = () => {
    const rows = buildQuadroRows();
    const header = [
      'Linha','Nome','Cargo Profissional','Situação na Profissão','Habilitação',
      'Nº INPS','Sexo','Data Nascimento','Data Admissão','Última Progressão',
      'Ilha','Remuneração Base','Subsídio Alimentação','Horas Semanais','Períodos de Férias',
    ];
    const data = rows.map(r => [
      r.linha, r.nome, r.cargo, r.situacao, r.habilitacao,
      r.inps, r.sexo, r.nascimento, r.admissao, r.progressao,
      r.ilha, r.salario, r.subsidio, r.horas, r.ferias,
    ]);
    downloadCsv([header, ...data], 'quadro-pessoal-dgt-2026.csv');
  };

  const exportQuadroPdf = () => {
    const rows = buildQuadroRows();
    const companyName = company?.name || 'Empresa';
    const companyNif  = company?.nif  || '';
    const today2 = format(new Date(), 'dd/MM/yyyy', { locale: pt });

    const tableRows = rows.map((r, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#f9fafb' : '#fff'}">
        <td>${r.linha}</td>
        <td>${r.nome}</td>
        <td>${r.cargo}</td>
        <td>${r.cargo}</td>
        <td>${r.situacao}</td>
        <td>${r.habilitacao}</td>
        <td>${r.inps}</td>
        <td>${r.sexo}</td>
        <td>${r.nascimento}</td>
        <td>${r.admissao}</td>
        <td>${r.progressao}</td>
        <td>${r.ilha}</td>
        <td>${r.salario}</td>
        <td>${r.subsidio}</td>
        <td>${r.horas}</td>
        <td>${r.ferias}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <title>Quadro de Pessoal DGT 2026 — ${companyName}</title>
  <style>
    @page { size: A3 landscape; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 8px; color: #111; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .header h1 { font-size: 13px; margin: 0 0 4px; }
    .header p  { font-size: 8px; color: #555; margin: 0; }
    .meta { text-align: right; font-size: 8px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a5f; color: #fff; padding: 5px 4px; text-align: center; font-size: 7px; border: 1px solid #ccc; }
    td { padding: 4px 3px; border: 1px solid #ddd; text-align: center; vertical-align: middle; }
    td:nth-child(2) { text-align: left; }
    .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 8px; color: #555; }
    .sign-box { border-top: 1px solid #888; width: 200px; padding-top: 4px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Quadro de Pessoal — ${companyName}</h1>
      <p>NIF: ${companyNif} &nbsp;|&nbsp; Referente ao ano de 2026 &nbsp;|&nbsp; Emitido em ${today2}</p>
      <p>Direção Geral do Trabalho — Código Laboral CV, Art. 158.º-A</p>
    </div>
    <div class="meta">Nha Féria &bull; nhaferia.cv</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Linha</th>
        <th>Nome</th>
        <th>Cargo Profissional</th>
        <th>Profissão</th>
        <th>Situação na Profissão</th>
        <th>Habilitação</th>
        <th>Nº INPS</th>
        <th>Sexo</th>
        <th>Nascimento</th>
        <th>Admissão</th>
        <th>Progressão</th>
        <th>Ilha</th>
        <th>Remun. Base</th>
        <th>Sub. Alimentação</th>
        <th>Horas/Semana</th>
        <th>Período de Férias</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    <div class="sign-box">Responsável pela Empresa / Gerência</div>
    <div class="sign-box">Carimbo da Empresa</div>
    <div class="sign-box">Chefe da Repartição — DGT</div>
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  // ── CSV exports ───────────────────────────────────────────────────────────
  const downloadCsv = (rows, filename) => {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildRows = (data) => {
    const header = [
      'Colaborador', 'NIF', 'CNI', 'Função', 'Departamento',
      'Data Admissão', 'Início Férias', 'Fim Férias', 'Tipo', 'Dias Úteis', 'Estado',
    ];
    const rows = data.map(r => [
      r.profiles?.full_name  || '—',
      r.profiles?.nif        || '—',
      r.profiles?.cni        || '—',
      r.profiles?.job_title  || '—',
      r.profiles?.department || '—',
      r.profiles?.hire_date  || '—',
      r.start_date,
      r.end_date,
      r.type || '—',
      getBusinessDays(r.start_date, r.end_date),
      r.status,
    ]);
    return [header, ...rows];
  };

  const exportMapaAnual      = () => downloadCsv(buildRows(requests), 'mapa-ferias-2026.csv');
  const exportQuadrimestral  = () => downloadCsv(
    buildRows(requests.filter(r => r.start_date >= '2026-01-01' && r.start_date <= '2026-04-30')),
    'dgt-quadrimestral-q1-2026.csv'
  );
  const exportGozadas = () => downloadCsv(
    buildRows(approved.filter(r => r.end_date <= today)),
    'ferias-gozadas-2026.csv'
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const q1Count   = requests.filter(r => r.start_date >= '2026-01-01' && r.start_date <= '2026-04-30').length;
  const pastCount = approved.filter(r => r.end_date <= today).length;
  const alertTotal = accumAlerts.length + mandatoryAlerts.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1200px] mx-auto pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text text-gradient">Relatórios e Conformidade</h2>
          <p className="text-sm text-text-muted">
            Documentos obrigatórios e alertas legais — Código Laboral de Cabo Verde.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-radius-sm text-sm font-semibold hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatMini label="Colaboradores"       value={loading ? '…' : workers.length}        icon={<Users size={16} />} />
        <StatMini label="Dias Aprovados 2026" value={loading ? '…' : totalApprovedDays}     icon={<Calendar size={16} />} />
        <StatMini label="Sem Férias Marcadas" value={loading ? '…' : workersWithNoLeave}    icon={<TrendingDown size={16} />} warn={workersWithNoLeave > 0} />
        <StatMini label="Alertas Legais"      value={loading ? '…' : alertTotal}            icon={<AlertTriangle size={16} />} warn={alertTotal > 0} />
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column ── 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Mapa Anual card */}
          <div className="bg-white rounded-radius border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-5 items-center">
            <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
              <FileText size={26} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Documento Obrigatório</div>
              <h3 className="text-base font-bold text-text mb-1">Mapa Anual de Férias 2026</h3>
              <p className="text-xs text-text-muted mb-4 max-w-sm leading-relaxed">
                Todos os colaboradores, períodos aprovados e dias úteis. Pronto para afixação e submissão à DGT.
              </p>
              <button
                onClick={exportMapaAnual}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-light transition-all text-xs shadow-sm shadow-primary/20 disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} /> Exportar CSV
              </button>
            </div>
            {!loading && (
              <div className="text-center flex-shrink-0 px-2">
                <div className="text-3xl font-bold text-primary leading-tight">{requests.length}</div>
                <div className="text-[10px] text-text-muted font-medium uppercase tracking-wide">pedidos</div>
              </div>
            )}
          </div>

          {/* Quadro de Pessoal DGT card */}
          <div className="bg-white rounded-radius border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-5 items-center">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Users size={26} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Documento Obrigatório DGT</div>
              <h3 className="text-base font-bold text-text mb-1">Quadro de Pessoal 2026</h3>
              <p className="text-xs text-text-muted mb-4 max-w-sm leading-relaxed">
                Todos os colaboradores com dados completos para entrega à Direção Geral do Trabalho. Escolhe o formato de exportação.
              </p>
              <div className="relative inline-block">
                <button
                  onClick={() => setQuadroMenu(o => !o)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Download size={14} /> Exportar
                  <ChevronDown size={13} className={`transition-transform ${quadroMenu ? 'rotate-180' : ''}`} />
                </button>
                {quadroMenu && (
                  <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-border rounded-radius-sm shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => { exportQuadroPdf(); setQuadroMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-xs font-semibold text-text hover:bg-bg transition-colors"
                    >
                      <Printer size={14} className="text-primary" /> Exportar PDF
                    </button>
                    <div className="border-t border-border" />
                    <button
                      onClick={() => { exportQuadroCsv(); setQuadroMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-xs font-semibold text-text hover:bg-bg transition-colors"
                    >
                      <FileText size={14} className="text-emerald-600" /> Exportar CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
            {!loading && (
              <div className="text-center flex-shrink-0 px-2">
                <div className="text-3xl font-bold text-emerald-600 leading-tight">{workers.length}</div>
                <div className="text-[10px] text-text-muted font-medium uppercase tracking-wide">colaboradores</div>
              </div>
            )}
          </div>

          {/* DGT section */}
          <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-slate-50/60 flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-500" />
              <span className="text-sm font-bold text-text">DGT — Direção Geral do Trabalho</span>
            </div>
            <div className="p-4 space-y-3">
              <ReportRow
                title="Relatório Quadrimestral (Jan–Abr 2026)"
                subtitle={`${q1Count} pedido${q1Count !== 1 ? 's' : ''} no período`}
                onExport={exportQuadrimestral}
                loading={loading}
              />
              <ReportRow
                title="Férias Gozadas (períodos concluídos)"
                subtitle={`${pastCount} registo${pastCount !== 1 ? 's' : ''} aprovados e concluídos`}
                onExport={exportGozadas}
                loading={loading}
              />
            </div>
          </div>

          {/* Workers balance table */}
          {!loading && workers.length > 0 && (
            <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-slate-50/60 flex items-center gap-2">
                <Users size={15} className="text-primary" />
                <span className="text-sm font-bold text-text">Saldos por Colaborador</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bg/60">
                      <th className="text-left px-4 py-2.5 font-semibold text-text-muted">Nome</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-text-muted hidden md:table-cell">Função</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-text-muted hidden sm:table-cell">NIF</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-text-muted hidden lg:table-cell">CNI</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-text-muted">Saldo</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-text-muted">Gozados</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-text-muted">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map(w => {
                      const userApproved = approvedByUser[w.id] || [];
                      const gozados = userApproved.reduce((s, r) => s + getBusinessDays(r.start_date, r.end_date), 0);
                      const atRisk = w.vacation_balance > 25;
                      return (
                        <tr key={w.id} className="border-t border-border/40 hover:bg-bg/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-text">
                            <div>{w.full_name}</div>
                            {w.hire_date && <div className="text-[10px] text-text-muted">Admissão: {w.hire_date}</div>}
                          </td>
                          <td className="px-4 py-3 text-text-muted hidden md:table-cell">{w.job_title || '—'}</td>
                          <td className="px-4 py-3 text-text-muted font-mono text-xs hidden sm:table-cell">
                            {w.nif || <span className="text-amber-500 text-[10px] font-sans">Em falta</span>}
                          </td>
                          <td className="px-4 py-3 text-text-muted font-mono text-xs hidden lg:table-cell">
                            {w.cni || <span className="text-amber-500 text-[10px] font-sans">Em falta</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold text-sm ${atRisk ? 'text-red-600' : 'text-text'}`}>
                              {w.vacation_balance}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-text">{gozados}</td>
                          <td className="px-4 py-3 text-center">
                            {atRisk ? (
                              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 rounded-full px-2 py-0.5 font-bold text-[10px]">
                                <AlertTriangle size={9} /> Risco
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 font-bold text-[10px]">
                                <CheckCircle2 size={9} /> OK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Audit Log */}
          <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-slate-50/60 flex items-center gap-2">
              <ClipboardList size={15} className="text-primary" />
              <span className="text-sm font-bold text-text">Log de Auditoria</span>
              <span className="ml-auto text-[10px] text-text-muted">Últimas 50 ações</span>
            </div>
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : auditLog.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">Nenhuma ação registada ainda.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {auditLog.map(entry => {
                  const actionLabel = {
                    leave_approved:  { label: 'Férias aprovadas',  color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                    leave_rejected:  { label: 'Férias recusadas',  color: 'text-red-700 bg-red-50 border-red-200' },
                    profile_updated: { label: 'Perfil atualizado', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                  }[entry.action] || { label: entry.action, color: 'text-text-muted bg-bg border-border' };
                  return (
                    <div key={entry.id} className="px-5 py-3 flex items-start gap-3 hover:bg-bg/40 transition-colors">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${actionLabel.color}`}>
                        {actionLabel.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text font-medium truncate">
                          por <strong>{entry.actor_name || 'Sistema'}</strong>
                        </p>
                        {entry.details && (
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {entry.details.start_date && `${entry.details.start_date} → ${entry.details.end_date}`}
                            {entry.details.role_to && entry.details.role_from !== entry.details.role_to && ` cargo: ${entry.details.role_from} → ${entry.details.role_to}`}
                            {entry.details.balance_to !== undefined && entry.details.balance_from !== entry.details.balance_to && ` saldo: ${entry.details.balance_from} → ${entry.details.balance_to} dias`}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted flex-shrink-0">
                        {format(parseISO(entry.created_at), 'd MMM HH:mm', { locale: pt })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar ── 1/3 */}
        <div className="space-y-5">

          {/* Alertas */}
          <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-red-50/70 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-600" />
              <span className="text-xs font-bold text-red-800 flex-1">Alertas de Risco Legal</span>
              {!loading && alertTotal > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {alertTotal}
                </span>
              )}
            </div>
            <div className="p-4">
              {loading ? (
                <div className="py-8 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : alertTotal === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Sem alertas activos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accumAlerts.map(w => (
                    <AlertItem
                      key={w.id}
                      title="Acumulação de Saldo"
                      desc={`${w.full_name.split(' ')[0]} tem ${w.vacation_balance} dias disponíveis — risco de ultrapassar o limite legal de 44 dias.`}
                      color="red"
                    />
                  ))}
                  {mandatoryAlerts.map(w => (
                    <AlertItem
                      key={w.id + '-m'}
                      title="Gozo Obrigatório"
                      desc={`${w.full_name.split(' ')[0]} não tem nenhum período aprovado de 11+ dias consecutivos em 2026.`}
                      color="amber"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-radius border border-border shadow-sm p-5">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">
              Checklist 2026
            </h4>
            <div className="space-y-2.5">
              {effectiveChecklist.map(item => (
                <CheckItem
                  key={item.id}
                  label={item.label}
                  checked={item.checked}
                  auto={item.auto}
                  onToggle={() => toggleChecklist(item.id)}
                />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-text-muted">Progresso</span>
                <span className="text-xs font-bold text-primary">{checkedCount}/{effectiveChecklist.length}</span>
              </div>
              <div className="bg-bg rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(checkedCount / effectiveChecklist.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Legal reference */}
          <div className="bg-slate-50 rounded-radius border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} className="text-primary" />
              <span className="text-[10px] font-bold text-text uppercase tracking-wider">
                Código Laboral CV
              </span>
            </div>
            <ul className="space-y-2 text-[11px] text-text-muted leading-relaxed">
              <li className="flex justify-between">
                <span>Férias mínimas</span>
                <strong className="text-text">22 dias úteis/ano</strong>
              </li>
              <li className="flex justify-between">
                <span>Gozo obrigatório</span>
                <strong className="text-text">11 dias seguidos</strong>
              </li>
              <li className="flex justify-between">
                <span>Acumulação máxima</span>
                <strong className="text-text">44 dias</strong>
              </li>
              <li className="flex justify-between">
                <span>Subsídio de férias</span>
                <strong className="text-text">antes do gozo</strong>
              </li>
              <li className="flex justify-between">
                <span>Mapa afixado até</span>
                <strong className="text-text">30 de Março</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatMini = ({ label, value, icon, warn }) => (
  <div className={`p-4 rounded-radius border shadow-sm ${warn ? 'bg-red-50 border-red-100' : 'bg-white border-border'}`}>
    <div className={`mb-2 ${warn ? 'text-red-500' : 'text-primary'}`}>{icon}</div>
    <div className={`text-2xl font-bold leading-tight ${warn ? 'text-red-700' : 'text-text'}`}>{value}</div>
    <div className="text-[10px] text-text-muted font-medium uppercase tracking-wide mt-1 leading-tight">{label}</div>
  </div>
);

const ReportRow = ({ title, subtitle, onExport, loading }) => (
  <div className="flex items-center justify-between p-3.5 bg-bg rounded-xl border border-border/60 gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <FileText className="text-text-muted flex-shrink-0" size={15} />
      <div className="min-w-0">
        <div className="text-xs font-semibold text-text truncate">{title}</div>
        <div className="text-[10px] text-text-muted mt-0.5">{subtitle}</div>
      </div>
    </div>
    <button
      onClick={onExport}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary border border-primary/20 rounded-lg text-[11px] font-bold hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
    >
      <Download size={11} /> Exportar
    </button>
  </div>
);

const AlertItem = ({ title, desc, color }) => {
  const styles = {
    red:   'bg-red-50   border-red-200   text-red-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
  };
  return (
    <div className={`p-3 rounded-lg border ${styles[color]}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide mb-1">{title}</div>
      <p className="text-[11px] leading-relaxed">{desc}</p>
    </div>
  );
};

const CheckItem = ({ label, checked, auto, onToggle }) => (
  <button
    onClick={onToggle}
    disabled={auto}
    className="flex items-center gap-3 w-full text-left group disabled:cursor-default"
  >
    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
      checked
        ? 'bg-emerald-500 border-emerald-500 text-white'
        : 'border-slate-300 bg-white group-hover:border-primary/50'
    }`}>
      {checked && <CheckCircle2 size={11} strokeWidth={3} />}
    </div>
    <span className={`text-xs flex-1 transition-all ${
      checked ? 'text-text-muted line-through decoration-emerald-400' : 'text-text'
    }`}>
      {label}
    </span>
    {auto && (
      <span className="text-[9px] text-text-muted bg-bg border border-border rounded px-1.5 py-0.5 flex-shrink-0">
        auto
      </span>
    )}
  </button>
);

export default Compliance;
