import React from 'react';
import { Check, X, AlertTriangle, CalendarDays } from 'lucide-react';

const ApprovalList = ({ requests = [], onApprove, onReject }) => {
  if (requests.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-text-muted">Sem pedidos pendentes de aprovação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="border border-border rounded-radius-sm p-4 hover:border-primary-light hover:shadow-sm transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {req.avatar || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text truncate">{req.workerName}</div>
              <div className="text-xs text-text-muted truncate flex items-center gap-1">
                <CalendarDays size={11} className="flex-shrink-0" />
                {req.startDate} a {req.endDate} · {req.type}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary leading-tight">
                {req.days} <span className="text-[10px] text-text-muted font-normal">dias</span>
              </div>
            </div>
          </div>

          {req.description && (
            <div className="mb-3 text-[12px] text-text bg-bg p-2 rounded border-l-4 border-accent">
              <strong>Motivo:</strong> {req.description}
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 rounded-full px-2.5 py-1 text-xs font-semibold mb-3">
            <AlertTriangle size={12} />
            Validar sobreposição no calendário
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onApprove(req.id)}
              className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-radius-sm text-[12px] font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check size={14} /> Aprovar
            </button>
            <button
              onClick={() => onReject(req.id)}
              className="flex-1 py-2 bg-red-50 text-red-700 border border-red-200 rounded-radius-sm text-[12px] font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
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
