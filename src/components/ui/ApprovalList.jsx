import React from 'react';
import { Check, X, AlertTriangle, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const ApprovalList = ({ requests = [], onApprove, onReject }) => {
  if (requests.length === 0) {
    return (
      <div className="py-10 text-center">
        <CalendarDays className="w-8 h-8 text-border mx-auto mb-2" />
        <p className="text-sm text-text-muted">Sem pedidos pendentes de aprovação.</p>
      </div>
    );
  }

  const fmtDate = (d) => {
    try { return format(parseISO(d), 'd MMM', { locale: pt }); }
    catch { return d; }
  };

  const typeLabel = (type) => {
    const map = {
      'férias': 'Férias',
      'falta': 'Folga',
      'justificação': 'Justificada',
      'formação': 'Formação',
    };
    return map[type] || (type?.charAt(0).toUpperCase() + type?.slice(1)) || '—';
  };

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="border border-border rounded-radius-sm p-4 hover:border-primary-light/50 hover:shadow-sm transition-all group"
        >
          {/* Worker info row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {req.avatar || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text truncate">{req.workerName}</div>
              <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <CalendarDays size={11} className="flex-shrink-0" />
                {fmtDate(req.startDate)} – {fmtDate(req.endDate)}
                <span className="mx-1 text-border">·</span>
                <span className="capitalize">{typeLabel(req.type)}</span>
              </div>
            </div>
            {/* Days badge */}
            {req.days > 0 && (
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold text-primary leading-tight">{req.days}</div>
                <div className="text-[10px] text-text-muted font-medium">dias úteis</div>
              </div>
            )}
          </div>

          {/* Description */}
          {req.description && (
            <div className="mb-3 text-[12px] text-text bg-bg px-3 py-2 rounded border-l-4 border-accent/60 leading-relaxed">
              <span className="font-semibold text-text-muted">Motivo: </span>
              {req.description}
            </div>
          )}

          {/* Overlap hint */}
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 rounded-full px-2.5 py-1 text-[11px] font-semibold mb-3">
            <AlertTriangle size={11} />
            Verificar sobreposição no calendário
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(req.id)}
              className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-radius-sm text-[12px] font-bold hover:bg-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} /> Aprovar
            </button>
            <button
              onClick={() => onReject(req.id)}
              className="flex-1 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-radius-sm text-[12px] font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X size={14} /> Recusar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApprovalList;
