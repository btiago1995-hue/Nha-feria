import React, { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle2, X, Clock, Filter,
  Pencil, Save, AlertCircle, ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { getBusinessDays } from '../utils/dateUtils';
import { format, parseISO } from 'date-fns';
import { pt, enGB } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import DateRangePicker from '../components/ui/DateRangePicker';
import { sendEmail } from '../utils/sendEmail';

const TABS = [
  { key: 'pending',  label: 'Pendentes',  color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  { key: 'approved', label: 'Aprovados',  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'rejected', label: 'Rejeitados', color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200' },
  { key: 'all',      label: 'Todos',      color: 'text-text-muted',  bg: 'bg-bg',         border: 'border-border' },
];

const STATUS_BADGE = {
  pending:  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-full border border-amber-100"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />Pendente</span>,
  approved: <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-100"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Aprovado</span>,
  rejected: <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[11px] font-bold rounded-full border border-red-100"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />Rejeitado</span>,
};

const ManagerRequests = () => {
  const { profile } = useOutletContext();
  const { lang } = useLanguage();
  const dateLocale = lang === 'en' ? enGB : pt;

  const [tab, setTab]               = useState('pending');
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);
  const [deptFilter, setDeptFilter] = useState('');
  const [editModal, setEditModal]   = useState(null); // { req, newStart, newEnd }
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      let teamMemberIds = null;
      if (profile?.role === 'manager') {
        const { data: team } = await supabase
          .from('profiles').select('id').eq('manager_id', profile.id);
        teamMemberIds = (team || []).map(p => p.id);
      }

      let q = supabase
        .from('leave_requests')
        .select('*, profiles!leave_requests_user_id_fkey(full_name, department, email, notify_on_leave_decided)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (teamMemberIds !== null) {
        q = teamMemberIds.length > 0
          ? q.in('user_id', teamMemberIds)
          : q.in('user_id', ['00000000-0000-0000-0000-000000000000']);
      }

      const { data, error } = await q;
      if (error) throw error;
      setAllRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      showToast('Erro ao carregar pedidos. Verifica a tua ligação e tenta novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const notifyWorker = (req, status) => {
    const p = req.profiles;
    if (p?.email && p.notify_on_leave_decided !== false) {
      sendEmail({
        type: 'leave_decided',
        workerEmail: p.email,
        workerName: p.full_name || '',
        status,
        leaveType: req.type,
        startDate: req.start_date,
        endDate: req.end_date,
        dashboardUrl: `${window.location.origin}/worker-dashboard`,
      });
    }
  };

  const handleDecide = async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status, approved_by: profile.id })
        .eq('id', id)
        .select('*, profiles!leave_requests_user_id_fkey(full_name, email, notify_on_leave_decided)');
      if (error) throw error;
      if (data?.[0]) notifyWorker(data[0], status);
      showToast(status === 'approved' ? 'Pedido aprovado.' : 'Pedido rejeitado.');
      fetchAll();
    } catch {
      showToast('Erro ao processar pedido.', 'error');
    }
  };

  const handleBulkDecide = async (status) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = [...selectedIds];
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status, approved_by: profile.id })
        .in('id', ids)
        .select('*, profiles!leave_requests_user_id_fkey(full_name, email, notify_on_leave_decided)');
      if (error) throw error;
      (data || []).forEach(r => notifyWorker(r, status));
      showToast(status === 'approved' ? `${ids.length} pedidos aprovados.` : `${ids.length} pedidos rejeitados.`);
      fetchAll();
    } catch {
      showToast('Erro ao processar pedidos.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const openEdit = (req) => {
    setEditError('');
    setEditModal({ req, newStart: req.start_date, newEnd: req.end_date });
  };

  const handleEditSave = async () => {
    if (!editModal.newStart || !editModal.newEnd) {
      setEditError('Selecciona as datas de início e fim.');
      return;
    }
    if (editModal.newEnd < editModal.newStart) {
      setEditError('A data de fim não pode ser antes do início.');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ start_date: editModal.newStart, end_date: editModal.newEnd })
        .eq('id', editModal.req.id);
      if (error) throw error;
      showToast('Férias actualizadas.');
      setEditModal(null);
      fetchAll();
    } catch {
      setEditError('Erro ao guardar. Tenta novamente.');
    } finally {
      setEditSaving(false);
    }
  };

  // Derived data
  const depts = [...new Set(allRequests.map(r => r.profiles?.department).filter(Boolean))].sort();

  const filtered = allRequests.filter(r => {
    const statusMatch = tab === 'all' || r.status === tab;
    const deptMatch   = !deptFilter || r.profiles?.department === deptFilter;
    return statusMatch && deptMatch;
  });

  const counts = {
    pending:  allRequests.filter(r => r.status === 'pending').length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
    all:      allRequests.length,
  };

  const pendingFiltered = filtered.filter(r => r.status === 'pending');
  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every(r => selectedIds.has(r.id));

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingFiltered.map(r => r.id)));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1100px] mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text text-gradient">Pedidos de Ausência</h2>
          <p className="text-sm text-text-muted mt-0.5">Gestão completa de todos os pedidos da equipa.</p>
        </div>

        {/* Dept filter */}
        {depts.length > 0 && (
          <div className="relative">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-border rounded-radius-sm text-sm text-text bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">Todos os departamentos</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg p-1 rounded-xl border border-border w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedIds(new Set()); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t.key ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text'
            }`}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none font-bold ${
                tab === t.key ? 'bg-primary/10 text-primary' : 'bg-border text-text-muted'
              }`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk bar (pending only) */}
      <AnimatePresence>
        {tab === 'pending' && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-3 px-4 py-2.5 bg-white border border-border rounded-radius-sm"
          >
            <label className="flex items-center gap-2 text-xs font-semibold text-text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allPendingSelected}
                onChange={toggleSelectAll}
                className="w-3.5 h-3.5 accent-primary cursor-pointer"
              />
              {selectedIds.size > 0 ? `${selectedIds.size} seleccionado(s)` : 'Seleccionar todos'}
            </label>
            {selectedIds.size > 0 && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => handleBulkDecide('approved')}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={13} /> Aprovar {selectedIds.size}
                </button>
                <button
                  onClick={() => handleBulkDecide('rejected')}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X size={13} /> Rejeitar {selectedIds.size}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-text-muted">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            A carregar…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-muted flex flex-col items-center gap-2">
            <ClipboardList size={28} className="text-border" />
            Nenhum pedido encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  {tab === 'pending' && <th className="px-4 py-3 w-8" />}
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3 text-center">Dias úteis</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  {tab === 'pending' && <th className="px-4 py-3 text-right">Acção</th>}
                  {tab === 'approved' && <th className="px-4 py-3 text-right">Editar</th>}
                  {tab === 'all' && <th className="px-4 py-3 text-right">Acção</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => {
                  const days = getBusinessDays(r.start_date, r.end_date);
                  const name = r.profiles?.full_name || 'Desconhecido';
                  const dept = r.profiles?.department;
                  return (
                    <tr key={r.id} className={`hover:bg-bg/60 transition-colors ${selectedIds.has(r.id) ? 'bg-primary/5' : ''}`}>
                      {tab === 'pending' && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            className="w-3.5 h-3.5 accent-primary cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text">{name}</p>
                            {dept && <p className="text-[10px] text-text-muted">{dept}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text whitespace-nowrap">
                        {format(parseISO(r.start_date), 'd MMM yyyy', { locale: dateLocale })}
                        {' → '}
                        {format(parseISO(r.end_date), 'd MMM yyyy', { locale: dateLocale })}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-primary text-xs">{days}</td>
                      <td className="px-4 py-3 text-xs text-text-muted capitalize">{r.type}</td>
                      <td className="px-4 py-3">{STATUS_BADGE[r.status] || r.status}</td>
                      {(tab === 'pending' || (tab === 'all' && r.status === 'pending')) && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => handleDecide(r.id, 'approved')} className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer" title="Aprovar">
                              <CheckCircle2 size={14} />
                            </button>
                            <button onClick={() => handleDecide(r.id, 'rejected')} className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition-colors cursor-pointer" title="Rejeitar">
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                      {tab === 'approved' && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-text-muted hover:text-primary transition-colors cursor-pointer"
                            title="Editar datas"
                          >
                            <Pencil size={13} />
                          </button>
                        </td>
                      )}
                      {tab === 'all' && r.status !== 'pending' && (
                        <td className="px-4 py-3 text-right">
                          {r.status === 'approved' && (
                            <button
                              onClick={() => openEdit(r)}
                              className="p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-text-muted hover:text-primary transition-colors cursor-pointer"
                              title="Editar datas"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white w-full max-w-sm rounded-radius shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h3 className="font-bold text-text text-sm">Editar Férias</h3>
                  <p className="text-xs text-text-muted mt-0.5">{editModal.req.profiles?.full_name}</p>
                </div>
                <button onClick={() => setEditModal(null)} className="text-text-muted hover:text-text transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                <DateRangePicker
                  start={editModal.newStart}
                  end={editModal.newEnd}
                  onChange={(s, e) => setEditModal(prev => ({ ...prev, newStart: s, newEnd: e }))}
                />

                {editError && (
                  <p className="mt-3 text-xs text-danger flex items-center gap-1.5">
                    <AlertCircle size={13} /> {editError}
                  </p>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setEditModal(null)}
                    className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text hover:bg-bg rounded-radius-sm transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={editSaving || !editModal.newStart || !editModal.newEnd}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-bold rounded-radius-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {editSaving
                      ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Save size={14} />}
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-radius shadow-lg text-sm font-semibold flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-text text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManagerRequests;
