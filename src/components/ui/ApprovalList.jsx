import React from 'react';
import { Check, X, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const TYPE_BADGE = {
  férias:       { label: 'Férias',      cls: 'bg-blue-50 text-blue-700 border-blue-100'      },
  falta:        { label: 'Folga',       cls: 'bg-slate-50 text-slate-600 border-slate-200'    },
  justificação: { label: 'Justificada', cls: 'bg-violet-50 text-violet-700 border-violet-100' },
  formação:     { label: 'Formação',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
};

const ApprovalList = ({ requests = [], onApprove, onReject }) => {
  if (requests.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="w-12 h-12 bg-bg rounded-full flex items-center justify-center mx-auto mb-3">
          <CalendarDays className="w-6 h-6 text-border" />
        </div>
        <p className="text-sm font-medium text-text-muted">Sem pedidos pendentes</p>
        <p className="text-xs text-text-light mt-0.5">Todos os pedidos foram processados.</p>
      </div>
    );
  }

  const fmtDate = (d) => {
    try { return format(parseISO(d), 'd MMM', { locale: pt }); }
    catch { return d; }
  };

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const typeCfg = TYPE_BADGE[req.type] || { label: req.type, cls: 'bg-bg text-text-muted border-border' };
        return (
          <div
            key={req.id}
            className="border border-border rounded-radius-sm hover:border-primary-light/40 hover:shadow-sm transition-all overflow-hidden"
          >
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                {req.avatar || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-text truncate">{req.workerName}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeCfg.cls}`}>
                    {typeCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-muted">
                  <CalendarDays size={11} className="flex-shrink-0" />
                  {fmtDate(req.startDate)} – {fmtDate(req.endDate)}
                </div>
              </div>
              {req.days > 0 && (
                <div className="text-right flex-shrink-0 bg-bg rounded-lg px-3 py-1.5 border border-border">
                  <div className="text-xl font-bold text-primary leading-tight">{req.days}</div>
                  <div className="text-[9px] text-text-muted font-medium uppercase tracking-wide">dias úteis</div>
                </div>
              )}
            </div>

            {/* Description */}
            {req.description && (
              <div className="mx-4 mb-3 text-[12px] text-text bg-bg px-3 py-2 rounded-lg border-l-4 border-accent/50 leading-relaxed">
                <span className="font-semibold text-text-muted">Motivo: </span>
                {req.description}
              </div>
            )}

            {/* Actions */}
            <div className="flex border-t border-border">
              <button
                onClick={() => onApprove(req.id)}
                className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 text-[12px] font-bold hover:bg-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-r border-border"
              >
                <Check size={13} /> Aprovar
              </button>
              <button
                onClick={() => onReject(req.id)}
                className="flex-1 py-2.5 bg-red-50 text-red-700 text-[12px] font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X size={13} /> Recusar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ApprovalList;
