import React from 'react';

const trendConfig = {
  warn:    { text: 'text-amber-600',   dot: 'bg-amber-400',   icon: 'bg-amber-50 text-amber-500'    },
  danger:  { text: 'text-red-600',     dot: 'bg-red-400',     icon: 'bg-red-50 text-red-500'        },
  success: { text: 'text-emerald-600', dot: 'bg-emerald-400', icon: 'bg-emerald-50 text-emerald-500' },
  muted:   { text: 'text-text-muted',  dot: 'bg-slate-300',   icon: 'bg-slate-50 text-slate-400'    },
};

const SumCard = ({ icon, value, label, trend, trendColor = 'warn' }) => {
  const { text, dot, icon: iconClass } = trendConfig[trendColor] ?? trendConfig.muted;

  return (
    <div className="bg-white p-5 rounded-radius border border-border shadow-sm flex flex-col gap-3 hover:shadow-md transition-all duration-200 cursor-default">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-text leading-none">{value}</div>
        <div className="text-xs text-text-muted font-medium mt-1">{label}</div>
      </div>
      {trend && (
        <div className={`text-xs font-semibold flex items-center gap-1.5 ${text}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
          {trend}
        </div>
      )}
    </div>
  );
};

export default SumCard;
