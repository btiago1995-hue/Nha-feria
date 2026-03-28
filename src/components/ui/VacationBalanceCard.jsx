import React from 'react';
import { ClipboardList, AlertCircle } from 'lucide-react';

const VacationBalanceCard = ({ profile, pendingDays = 0 }) => {
  const totalEntitlement = 22;
  const used = 7; // Mock — will come from DB
  const available = Math.max(0, totalEntitlement - used - pendingDays);

  const usedPct     = (used / totalEntitlement) * 100;
  const pendingPct  = (pendingDays / totalEntitlement) * 100;
  const availablePct = (available / totalEntitlement) * 100;

  const segments = [
    { label: 'Gozados',   value: used,        pct: usedPct,      color: 'bg-emerald-400' },
    { label: 'Pendentes', value: pendingDays,  pct: pendingPct,   color: 'bg-amber-400'   },
    { label: 'Disponíveis', value: available,  pct: availablePct, color: 'bg-white/40'    },
  ];

  return (
    <div className="bg-gradient-to-br from-primary to-primary-light rounded-radius p-6 text-white relative overflow-hidden shadow-lg">
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-[180px] h-[180px] bg-white/5 rounded-full pointer-events-none" />
      <div className="absolute -bottom-12 right-8 w-[120px] h-[120px] bg-accent/10 rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-bold text-white/60 uppercase tracking-widest mb-5 relative z-10">
        <ClipboardList size={15} />
        Saldo de Férias 2026
      </div>

      {/* Big number */}
      <div className="relative z-10 mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold leading-none">{available}</span>
          <span className="text-base text-white/60 font-medium">/ {totalEntitlement} dias úteis</span>
        </div>
        <p className="text-sm text-white/70 mt-1">disponíveis este ano</p>
      </div>

      {/* Segmented bar */}
      <div className="relative z-10 mb-4">
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5 bg-white/10">
          {segments.map((s) =>
            s.pct > 0 ? (
              <div
                key={s.label}
                className={`${s.color} transition-all duration-700 ease-out rounded-full`}
                style={{ width: `${s.pct}%` }}
                title={`${s.label}: ${s.value} dias`}
              />
            ) : null
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-5 mt-3">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${s.color}`} />
              <span className="text-xs text-white/65">
                {s.label} <strong className="text-white font-semibold">{s.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail rows */}
      <div className="relative z-10 space-y-1 border-t border-white/10 pt-4 text-sm">
        <div className="flex justify-between items-center py-1 border-b border-white/10">
          <span className="text-white/65">Dias acumulados (ano passado)</span>
          <span className="font-semibold">0 / 44 máx.</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-white/10">
          <span className="text-white/65">Total do direito anual</span>
          <span className="font-semibold">22 dias úteis</span>
        </div>
      </div>

      {/* Tenure alert */}
      {profile?.tenure_months < 6 && (
        <div className="mt-4 bg-accent/20 border border-accent/40 rounded-radius-sm p-3 text-xs text-amber-100 flex gap-2 items-start relative z-10">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>Poderás gozar as tuas férias após completares 6 meses de serviço.</span>
        </div>
      )}
    </div>
  );
};

export default VacationBalanceCard;
