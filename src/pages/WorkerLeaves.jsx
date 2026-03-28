import React, { useState, useEffect } from 'react';
import {
  Plane,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle2,
  History,
  CalendarDays,
  Plus,
} from 'lucide-react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { getBusinessDays } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

const WorkerLeaves = () => {
  const { profile } = useOutletContext();
  const location = useLocation();

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
          setFormError('Saldo insuficiente para este período.');
        } else {
          setFormError(null);
        }
      } else {
        setBusinessDays(0);
        setFormError('A data de início deve ser anterior à data de fim.');
      }
    } else {
      setBusinessDays(0);
      setFormError(null);
    }
  }, [formData, availableBalance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formError || businessDays === 0) return;

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

      setSuccessMsg('Pedido submetido! O teu gestor foi notificado.');
      setFormData({ type: 'férias', startDate: '', endDate: '', description: '' });
      fetchRequests();

      setTimeout(() => {
        setSuccessMsg(null);
        setActiveTab('history');
      }, 2500);
    } catch (err) {
      console.error('Error submitting leave request:', err);
      setFormError('Erro ao submeter pedido. Por favor, tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── History state ────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchRequests = async () => {
    if (!profile) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (profile) fetchRequests();
  }, [profile]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Aprovado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            Pendente
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-100">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            Rejeitado
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
        <h2 className="text-2xl font-bold text-text text-gradient">As Minhas Férias</h2>
        <p className="text-sm text-text-muted mt-1">Submete pedidos e consulta o teu histórico.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg border border-border rounded-radius-sm p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-semibold transition-all cursor-pointer
            ${activeTab === 'form' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
        >
          <Plus size={15} />
          Nova Solicitação
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-semibold transition-all cursor-pointer
            ${activeTab === 'history' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
        >
          <History size={15} />
          Histórico
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
                <h3 className="text-lg font-bold text-text">Solicitar Ausência</h3>
                <p className="text-sm text-text-muted">O cálculo de dias úteis é automático.</p>
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
                <option value="férias">Férias Anuais</option>
                <option value="falta">Folga / Dia de Descanso</option>
                <option value="justificação">Falta Justificada (Doença, etc.)</option>
                <option value="formação">Formação</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text uppercase tracking-wider">Data de Início</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-text-light w-4 h-4" />
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-all"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text uppercase tracking-wider">Data de Fim</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-text-light w-4 h-4" />
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-all"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                {formData.type === 'justificação' ? 'Motivo / Justificação' : 'Observações (Opcional)'}
              </label>
              <textarea
                rows="3"
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-all"
                placeholder={formData.type === 'justificação' ? 'Ex: Consulta médica, casamento...' : 'Alguma nota para o teu gestor?'}
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
                      <span>{formError ? 'Atenção' : 'Resumo do Período'}</span>
                      {!formError && (
                        <span className="bg-primary/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          {businessDays} Dias Úteis
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed mt-1 opacity-90">
                      {formError || `Este pedido corresponde a ${businessDays} dias úteis, excluindo fins de semana e feriados nacionais de Cabo Verde.`}
                    </p>
                    {!formError && formData.type !== 'justificação' && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-primary bg-white px-3 py-1.5 rounded-lg border border-primary/5 shadow-sm w-fit">
                        <CalendarDays size={13} /> Saldo após pedido: {availableBalance - businessDays} dias
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
                  A processar...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Submeter Pedido
                </>
              )}
            </motion.button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-radius border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg text-xs font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Período</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-4 py-3 text-center">Dias</th>
                  <th className="px-6 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingHistory ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-text-muted">
                      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                      A carregar...
                    </td>
                  </tr>
                ) : requests.length > 0 ? (
                  requests.map((item) => (
                    <tr key={item.id} className="hover:bg-bg/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-text">
                        {format(parseISO(item.start_date), 'd MMM')} – {format(parseISO(item.end_date), 'd MMM yyyy')}
                      </td>
                      <td className="px-5 py-4 text-text-muted capitalize">{item.type}</td>
                      <td className="px-4 py-4 text-center font-semibold text-primary">
                        {getBusinessDays(item.start_date, item.end_date)}
                      </td>
                      <td className="px-6 py-4 text-right">{getStatusBadge(item.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center text-sm text-text-muted">
                      <CalendarDays className="w-8 h-8 text-border mx-auto mb-2" />
                      Ainda não tens pedidos de férias.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WorkerLeaves;
