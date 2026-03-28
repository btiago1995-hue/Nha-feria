import React from 'react';
import { ClipboardList, AlertCircle, TrendingUp } from 'lucide-react';

const VacationBalanceCard = ({ profile, pendingDays = 0, usedDays = 0 }) => {
  const totalEntitlement = 22;
  const used = usedDays;
  const available = Math.max(0, totalEntitlement - used - pendingDays);

  const usedPct     = Math.min((used / totalEntitlement) * 100, 100);
  const pendingPct  = Math.min((pendingDays / totalEntitlement) * 100, 100 - usedPct);
  const availablePct = Math.max(0, 100 - usedPct - pendingPct);

  const usedPctDisplay = Math.round(usedPct);

  return (
    <div className="bg-gradient-to-br from-primary via-[#1e4470] to-primary-light rounded-radius p-6 text-white relative overflow-hidden shadow-lg h-full flex flex-col">
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 w-[200px] h-[200px] bg-white/5 rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 right-4 w-[140px] h-[140px] bg-accent/10 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -left-8 w-[80px] h-[80px] bg-white/3 rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-widest mb-6 relative z-10">
        <ClipboardList size={14} />
        Saldo de Férias 2026
      </div>

      {/* Big number + usage context */}
      <div className="relative z-10 flex items-end justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold leading-none">{available}</span>
            <div>
              <div className="text-sm text-white/50 font-medium">/ {totalEntitlement}</div>
              <div className="text-xs text-white/40">dias úteis</div>
            </div>
          </div>
          <p className="text-sm text-white/60 mt-1.5">disponíveis este ano</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-white/60 text-xs font-semibold mb-1">
            <TrendingUp size={12} />
            Utilização
          </div>
          <div className="text-2xl font-bold">{usedPctDisplay}%</div>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="relative z-10 mb-5">
        <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-white/10">
          {usedPct > 0 && (
            <div
              className="bg-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${usedPct}%` }}
              title={`Gozados: ${used} dias`}
            />
          )}
          {pendingPct > 0 && (
            <div
              className="bg-amber-400 transition-all duration-700 ease-out"
              style={{ width: `${pendingPct}%` }}
              title={`Pendentes: ${pendingDays} dias`}
            />
          )}
          {availablePct > 0 && (
            <div
              className="bg-white/30 transition-all duration-700 ease-out rounded-r-full"
              style={{ width: `${availablePct}%` }}
              title={`Disponíveis: ${available} dias`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3">
          {[
            { label: 'Gozados',    value: used,        color: 'bg-emerald-400' },
            { label: 'Pendentes',  value: pendingDays,  color: 'bg-amber-400'   },
            { label: 'Disponíveis', value: available,   color: 'bg-white/40'    },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${s.color}`} />
              <span className="text-xs text-white/55">
                {s.label} <strong className="text-white/90 font-semibold">{s.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail rows */}
      <div className="relative z-10 space-y-0 border-t border-white/10 pt-4 text-sm flex-1">
        <div className="flex justify-between items-center py-2 border-b border-white/10">
          <span className="text-white/50 text-xs">Dias acumulados (ano passado)</span>
          <span className="font-semibold text-sm">0 / 44 máx.</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-white/50 text-xs">Total do direito anual</span>
          <span className="font-semibold text-sm">22 dias úteis</span>
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
