import React, { useState, useEffect } from 'react';
import {
  Plane,
  AlertCircle,
  Info,
  CheckCircle2,
  History,
  CalendarDays,
  Plus,
  XCircle,
} from 'lucide-react';
import DateRangePicker from '../components/ui/DateRangePicker';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { getBusinessDays } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { sendEmail } from '../utils/sendEmail';

const WorkerLeaves = () => {
  const { profile } = useOutletContext();
  const location = useLocation();
  const { t } = useLanguage();
  const w = (key, vars) => t('workerLeaves', key, vars);
  const st = (key) => t('status', key);

  // Default to 'history' when coming from "Ver Todos", else 'form'
  const [activeTab, setActiveTab] = useState(
    location.state?.tab === 'history' ? 'history' : 'form'
  );

  // ── Form state ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    type: 'férias',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [businessDays, setBusinessDays] = useState(0);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const availableBalance = profile?.vacation_balance || 22;

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start <= end) {
        const days = getBusinessDays(formData.startDate, formData.endDate);
        setBusinessDays(days);
        if (formData.type !== 'justificação' && days > availableBalance) {
          setFormError(w('insufficientBalance'));
        } else {
          setFormError(null);
        }
      } else {
        setBusinessDays(0);
        setFormError(w('invalidDates'));
      }
    } else {
      setBusinessDays(0);
      setFormError(null);
    }
  }, [formData, availableBalance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formError || businessDays === 0) return;
    const today = new Date().toISOString().split('T')[0];
    if (formData.startDate < today) {
      setFormError(w('pastDateError') || 'A data de início não pode ser no passado.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('leave_requests').insert([{
        user_id: profile.id,
        start_date: formData.startDate,
        end_date: formData.endDate,
        type: formData.type,
        description: formData.description,
        status: 'pending',
      }]);
      if (error) throw error;

      // Notify manager by email (best-effort)
      const { data: mgr } = await supabase
        .from('profiles')
        .select('email, full_name, notify_on_leave_submitted')
        .in('role', ['manager', 'admin'])
        .eq('company_id', profile.company_id)
        .limit(1)
        .single();
      if (mgr?.email && mgr.notify_on_leave_submitted !== false) {
        sendEmail({
          type: 'leave_submitted',
          managerEmail: mgr.email,
          managerName: mgr.full_name || '',
          workerName: profile.full_name || 'Colaborador',
          leaveType: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dashboardUrl: `${window.location.origin}/manager-dashboard`,
        });
      }

      setSuccessMsg(w('successMsg'));
      setFormData({ type: 'férias', startDate: '', endDate: '', description: '' });
      fetchRequests();

      setTimeout(() => {
        setSuccessMsg(null);
        setActiveTab('history');
      }, 2500);
    } catch (err) {
      console.error('Error submitting leave request:', err);
      setFormError(w('submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Holidays ─────────────────────────────────────────────
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    supabase
      .from('holidays_cv')
      .select('date')
      .then(({ data }) => {
        if (data) setHolidays(data.map(h => h.date));
      });
  }, []);

  // ── History state ────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const fetchRequests = async () => {
    if (!profile) return;
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setHistoryError('Erro ao carregar pedidos. Verifica a tua ligação e tenta novamente.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (profile) fetchRequests();
  }, [profile]);

  const [cancelling, setCancelling] = useState(null); // id of request being cancelled
  const [confirmingCancel, setConfirmingCancel] = useState(null); // id awaiting inline confirm

  const handleCancel = async (id) => {
    setConfirmingCancel(null);
    setCancelling(id);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('status', 'pending'); // safety: only cancel pending
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status) => {
    const label = st(status) || status;
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
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-semibold rounded-full border border-slate-200">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
            Cancelado
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto pb-20"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text text-gradient">{w('title')}</h2>
        <p className="text-sm text-text-muted mt-1">{w('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg border border-border rounded-radius-sm p-1 mb-6 w-fit max-w-full">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[6px] text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap
            ${activeTab === 'form' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
        >
          <Plus size={14} />
          {w('newRequest')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[6px] text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap
            ${activeTab === 'history' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
        >
          <History size={15} />
          {w('history')}
          {requests.length > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-radius-sm"
          >
            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
            <p className="text-sm font-semibold text-emerald-800">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Tab */}
      {activeTab === 'form' && (
        <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-gradient-to-br from-slate-50 to-white">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/30">
                <Plane size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">{w('requestAbsence')}</h3>
                <p className="text-sm text-text-muted">{w('autoCalc')}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Tipo de Ausência</label>
              <select
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-all"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="férias">{w('annualLeave')}</option>
                <option value="falta">{w('dayOff')}</option>
                <option value="justificação">{w('justifiedAbsence')}</option>
                <option value="formação">{w('training')}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">{w('startDate')} → {w('endDate')}</label>
              <div className="border border-border rounded-xl p-4 bg-bg/50">
                <DateRangePicker
                  start={formData.startDate}
                  end={formData.endDate}
                  onChange={(s, e) => setFormData({ ...formData, startDate: s, endDate: e })}
                  holidays={holidays}
                  existingRequests={requests}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                {formData.type === 'justificação' ? w('reason') : w('notes')}
              </label>
              <textarea
                rows="3"
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-all"
                placeholder={formData.type === 'justificação' ? w('reasonPlaceholder') : w('notesPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required={formData.type === 'justificação'}
              />
            </div>

            <AnimatePresence>
              {businessDays > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-xl flex gap-3 items-start overflow-hidden border ${formError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-primary/5 border-primary/10 text-primary'}`}
                >
                  {formError ? <AlertCircle className="flex-shrink-0 mt-0.5" size={18} /> : <Info className="flex-shrink-0 mt-0.5" size={18} />}
                  <div className="flex-1">
                    <div className="text-sm font-bold flex items-center justify-between">
                      <span>{formError ? w('warning') : w('periodSummary')}</span>
                      {!formError && (
                        <span className="bg-primary/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          {businessDays} {w('workingDays')}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed mt-1 opacity-90">
                      {formError || w('excl', { days: businessDays })}
                    </p>
                    {!formError && formData.type !== 'justificação' && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-primary bg-white px-3 py-1.5 rounded-lg border border-primary/5 shadow-sm w-fit">
                        <CalendarDays size={13} /> {w('balanceAfter')}: {availableBalance - businessDays} {w('days')}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={!isSubmitting && !formError && businessDays > 0 ? { scale: 1.01 } : {}}
              whileTap={!isSubmitting && !formError && businessDays > 0 ? { scale: 0.98 } : {}}
              type="submit"
              disabled={isSubmitting || !!formError || businessDays === 0}
              className={`w-full py-4 text-white font-bold rounded-radius shadow-lg transition-all flex items-center justify-center gap-2
                ${isSubmitting || !!formError || businessDays === 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-accent hover:bg-accent-hover shadow-accent/30'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {w('processing')}
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> {w('submit')}
                </>
              )}
            </motion.button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
          {loadingHistory ? (
            <div className="px-6 py-12 text-center text-sm text-text-muted">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              {w('loading')}
            </div>
          ) : historyError ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-7 h-7 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600 font-semibold mb-3">{historyError}</p>
              <button
                onClick={fetchRequests}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          ) : requests.length > 0 ? (<>
            {/* Mobile: card list */}
            <div className="divide-y divide-border sm:hidden">
              {requests.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">
                      {format(parseISO(item.start_date), 'd MMM')} – {format(parseISO(item.end_date), 'd MMM yyyy')}
                    </p>
                    <p className="text-xs text-text-muted capitalize mt-0.5">
                      {item.type} · <span className="font-semibold text-primary">{getBusinessDays(item.start_date, item.end_date)} dias</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(item.status)}
                    {item.status === 'pending' && (
                      confirmingCancel === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-text-muted">Cancelar?</span>
                          <button
                            onClick={() => handleCancel(item.id)}
                            className="text-[11px] font-semibold text-danger hover:underline cursor-pointer"
                          >Sim</button>
                          <button
                            onClick={() => setConfirmingCancel(null)}
                            className="text-[11px] font-semibold text-text-muted hover:underline cursor-pointer"
                          >Não</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingCancel(item.id)}
                          disabled={cancelling === item.id}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-danger transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {cancelling === item.id
                            ? <span className="w-3.5 h-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                            : <XCircle size={14} />}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg text-xs font-bold text-text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">{w('period')}</th>
                    <th className="px-5 py-3">{w('type')}</th>
                    <th className="px-4 py-3 text-center">{w('days')}</th>
                    <th className="px-5 py-3 text-center">{w('status')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((item) => (
                    <tr key={item.id} className="hover:bg-bg/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-text">
                        {format(parseISO(item.start_date), 'd MMM')} – {format(parseISO(item.end_date), 'd MMM yyyy')}
                      </td>
                      <td className="px-5 py-4 text-text-muted capitalize">{item.type}</td>
                      <td className="px-4 py-4 text-center font-semibold text-primary">
                        {getBusinessDays(item.start_date, item.end_date)}
                      </td>
                      <td className="px-5 py-4 text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-4 text-right">
                        {item.status === 'pending' && (
                          confirmingCancel === item.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-[11px] text-text-muted">Tens a certeza?</span>
                              <button
                                onClick={() => handleCancel(item.id)}
                                className="text-[11px] font-semibold text-danger hover:underline cursor-pointer"
                              >Sim</button>
                              <button
                                onClick={() => setConfirmingCancel(null)}
                                className="text-[11px] font-semibold text-text-muted hover:underline cursor-pointer"
                              >Não</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingCancel(item.id)}
                              disabled={cancelling === item.id}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-danger transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {cancelling === item.id
                                ? <span className="w-3.5 h-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                                : <XCircle size={14} />}
                              Cancelar
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>) : (
            <div className="px-6 py-16 text-center text-sm text-text-muted">
              <CalendarDays className="w-8 h-8 text-border mx-auto mb-2" />
              {w('noRequests')}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default WorkerLeaves;
