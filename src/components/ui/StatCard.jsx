import React from 'react';

const colorClasses = {
  blue:   { icon: 'bg-blue-50 text-blue-600',      border: 'border-l-blue-400'    },
  green:  { icon: 'bg-emerald-50 text-emerald-600', border: 'border-l-emerald-400' },
  yellow: { icon: 'bg-amber-50 text-amber-600',     border: 'border-l-amber-400'   },
};

const StatCard = ({ icon, value, label, color = 'blue' }) => {
  const { icon: iconClass, border } = colorClasses[color] ?? colorClasses.blue;

  return (
    <div className={`bg-white px-5 py-5 rounded-radius border border-border border-l-4 ${border} flex items-center gap-4 hover:shadow-md transition-all duration-200 cursor-default shadow-sm`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        {icon}
      </div>
      <div>
        <div className="text-3xl font-bold text-text leading-none">{value}</div>
        <div className="text-xs text-text-muted font-medium mt-1.5">{label}</div>
      </div>
    </div>
  );
};

export default StatCard;
