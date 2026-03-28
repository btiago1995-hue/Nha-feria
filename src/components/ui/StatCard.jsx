import React from 'react';

const colorClasses = {
  blue:   { icon: 'bg-blue-50 text-blue-600',       ring: 'ring-blue-100'    },
  green:  { icon: 'bg-emerald-50 text-emerald-600',  ring: 'ring-emerald-100' },
  yellow: { icon: 'bg-amber-50 text-amber-600',      ring: 'ring-amber-100'   },
};

const StatCard = ({ icon, value, label, color = 'blue' }) => {
  const { icon: iconClass, ring } = colorClasses[color] ?? colorClasses.blue;

  return (
    <div className="bg-white px-5 py-5 rounded-radius border border-border shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ${iconClass} ${ring} group-hover:scale-105 transition-transform duration-200`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-3xl font-bold text-text leading-none tabular-nums">{value}</div>
        <div className="text-xs text-text-muted font-medium mt-1.5 leading-tight">{label}</div>
      </div>
    </div>
  );
};

export default StatCard;
