import React from 'react';

const trendConfig = {
  warn:    { text: 'text-amber-600',   dot: 'bg-amber-400' },
  danger:  { text: 'text-red-600',     dot: 'bg-red-400' },
  success: { text: 'text-emerald-600', dot: 'bg-emerald-400' },
  muted:   { text: 'text-text-muted',  dot: 'bg-slate-300' },
};

const SumCard = ({ icon, value, label, trend, trendColor = 'warn' }) => {
  const { text, dot } = trendConfig[trendColor] ?? trendConfig.muted;

  return (
    <div className="bg-white p-5 rounded-radius border border-border shadow-sm flex flex-col gap-3 hover:shadow-md transition-all duration-200 cursor-default">
      <div className="w-10 h-10 rounded-radius-sm bg-bg flex items-center justify-center flex-shrink-0 text-text-muted">
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
