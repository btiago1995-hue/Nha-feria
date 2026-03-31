import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Calendar, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  ChevronLeft,
  CalendarDays
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getBusinessDays } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveRequestForm = () => {
  const navigate = useNavigate();
  const { profile } = useOutletContext();
  
  const [formData, setFormData] = useState({
    type: 'férias',
    startDate: '',
    endDate: '',
    description: ''
  });

  const [businessDays, setBusinessDays] = useState(0);
  const [error, setError] = useState(null);
  const [overlapWarning, setOverlapWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBalance = profile?.vacation_balance || 22;

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start <= end) {
        const days = getBusinessDays(formData.startDate, formData.endDate);
        setBusinessDays(days);

        if (formData.type !== 'justificação' && days > availableBalance) {
          setError('Saldo insuficiente para este período.');
        } else if (formData.type === 'férias' && days < 10) {
          setError('O Código Laboral de Cabo Verde exige um mínimo de 10 dias úteis consecutivos por período de férias anuais (Art. 162º).');
        } else {
          setError(null);
        }

        // Check for overlapping requests
        supabase
          .from('leave_requests')
          .select('id')
          .eq('user_id', profile.id)
          .not('status', 'in', '("rejected","cancelled")')
          .lte('start_date', formData.endDate)
          .gte('end_date', formData.startDate)
          .then(({ data }) => setOverlapWarning((data || []).length > 0));
      } else {
        setBusinessDays(0);
        setOverlapWarning(false);
        setError('A data de início deve ser anterior à data de fim.');
      }
    } else {
      setBusinessDays(0);
      setOverlapWarning(false);
      setError(null);
    }
  }, [formData, availableBalance, profile.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error || businessDays === 0) return;

    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from('leave_requests')
        .insert([{
          user_id: profile.id,
          start_date: formData.startDate,
          end_date: formData.endDate,
          type: formData.type,
          description: formData.description,
          status: 'pending'
        }]);

      if (insertError) throw insertError;

      alert('Pedido submetido com sucesso! O teu gestor foi notificado.');
      navigate('/worker-dashboard');
    } catch (err) {
      console.error('Error submitting leave request:', err);
      alert('Erro ao submeter pedido. Por favor, tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pb-20"
    >
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Dashboard
      </button>

      <div className="bg-white rounded-radius border border-border shadow-xl overflow-hidden glass-card">
        <div className="p-8 border-b border-border bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center gap-4 mb-2">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent/30"
            >
              <Plane size={24} />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold font-display text-text">Solicitar Ausência</h2>
              <p className="text-sm text-text-muted">Preenche os detalhes do teu pedido. O cálculo é automático.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">Tipo de Ausência</label>
            <select
              className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-all"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="férias">Férias Anuais</option>
              <option value="falta">Folga / Dia de Descanso</option>
              <option value="justificação">Falta Justificada (Doença, etc.)</option>
              <option value="formação">Formação</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Data de Início</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-text-light w-4 h-4" />
                <input
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-all"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
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
              placeholder={formData.type === 'justificação' ? "Ex: Consulta médica, casamento..." : "Alguma nota para o teu gestor?"}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required={formData.type === 'justificação'}
            ></textarea>
          </div>

          {/* Business Logic Displays */}
          <AnimatePresence>
            {businessDays > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-5 rounded-xl flex gap-4 items-start overflow-hidden border ${error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-primary/5 border-primary/10 text-primary'}`}
              >
                {error ? <AlertCircle className="flex-shrink-0 mt-0.5" size={20} /> : <Info className="flex-shrink-0 mt-0.5" size={20} />}
                <div className="flex-1">
                  <div className="text-sm font-bold flex items-center justify-between">
                    <span>{error ? 'Atenção' : 'Resumo do Período'}</span>
                    {!error && <span className="bg-primary/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{businessDays} Dias Úteis</span>}
                  </div>
                  <p className="text-[13px] leading-relaxed mt-1 opacity-90">
                    {error || `Este pedido corresponde a ${businessDays} dias úteis, excluindo fins de semana e feriados nacionais de Cabo Verde.`}
                  </p>
                  {!error && formData.type !== 'justificação' && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-primary bg-white px-3 py-1.5 rounded-lg border border-primary/5 shadow-sm w-fit">
                      <CalendarDays size={14} /> Saldo após pedido: {availableBalance - businessDays} dias
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {overlapWarning && !error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 items-start">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
              <p className="text-[12px] text-amber-800 leading-relaxed">
                <strong>Atenção:</strong> Já tens um pedido pendente ou aprovado que coincide com este período. Podes submeter na mesma, mas o teu gestor poderá recusar por sobreposição.
              </p>
            </div>
          )}

          {profile?.tenureMonths < 6 && formData.type !== 'justificação' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 items-start">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
              <p className="text-[12px] text-amber-800 leading-relaxed">
                <strong>Nota Legal:</strong> Tens menos de 6 meses de casa. Segundo o Código Laboral, este pedido requer autorização excecional pois o direito a férias vence após 6 meses.
              </p>
            </div>
          )}

          <div className="pt-4">
            <motion.button
              whileHover={!isSubmitting && !error && businessDays > 0 ? { scale: 1.01 } : {}}
              whileTap={!isSubmitting && !error && businessDays > 0 ? { scale: 0.98 } : {}}
              type="submit"
              disabled={isSubmitting || !!error || businessDays === 0}
              className={`w-full py-4 text-white font-bold rounded-radius shadow-lg transition-all flex items-center justify-center gap-2
                ${isSubmitting || !!error || businessDays === 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-accent hover:bg-accent-hover shadow-accent/30'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  A processar...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Submeter Pedido
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default LeaveRequestForm;
