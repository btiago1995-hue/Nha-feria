import React from 'react';

const trendConfig = {
  warn:    { text: 'text-amber-600',   dot: 'bg-amber-400',   icon: 'bg-amber-50 text-amber-500',     ring: 'ring-amber-100'   },
  danger:  { text: 'text-red-600',     dot: 'bg-red-400',     icon: 'bg-red-50 text-red-500',         ring: 'ring-red-100'     },
  success: { text: 'text-emerald-600', dot: 'bg-emerald-400', icon: 'bg-emerald-50 text-emerald-500', ring: 'ring-emerald-100' },
  muted:   { text: 'text-text-muted',  dot: 'bg-slate-300',   icon: 'bg-slate-50 text-slate-400',     ring: 'ring-slate-100'   },
};

const SumCard = ({ icon, value, label, trend, trendColor = 'warn' }) => {
  const { text, dot, icon: iconClass, ring } = trendConfig[trendColor] ?? trendConfig.muted;

  return (
    <div className="bg-white p-5 rounded-radius border border-border shadow-sm flex flex-col gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ${iconClass} ${ring} group-hover:scale-105 transition-transform duration-200`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-text leading-none tabular-nums mt-1">{value}</div>
      <div className="text-xs text-text-muted font-medium leading-tight">{label}</div>
      {trend && (
        <div className={`text-[11px] font-semibold flex items-center gap-1.5 mt-0.5 ${text}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
          {trend}
        </div>
      )}
    </div>
  );
};

export default SumCard;
