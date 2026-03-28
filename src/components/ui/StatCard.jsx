import React from 'react';

const colorClasses = {
  blue:   { wrap: 'bg-blue-50 text-blue-600',    ring: 'ring-blue-100' },
  green:  { wrap: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
  yellow: { wrap: 'bg-amber-50 text-amber-600',   ring: 'ring-amber-100' },
};

const StatCard = ({ icon, value, label, color = 'blue' }) => {
  const { wrap, ring } = colorClasses[color] ?? colorClasses.blue;

  return (
    <div className="bg-white px-5 py-4 rounded-radius border border-border flex items-center gap-4 hover:shadow-md transition-all duration-200 cursor-default">
      <div className={`w-11 h-11 rounded-radius-sm flex items-center justify-center flex-shrink-0 ring-1 ${wrap} ${ring}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-text leading-none">{value}</div>
        <div className="text-xs text-text-muted font-medium mt-1">{label}</div>
      </div>
    </div>
  );
};

export default StatCard;
