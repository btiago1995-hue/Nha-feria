import React from 'react';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#7C3AED', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

const today = new Date();
const CURRENT_YEAR = today.getFullYear();
const CURRENT_MONTH = today.getMonth(); // 0-indexed

function daysInMonth(month, year = CURRENT_YEAR) {
  return new Date(year, month + 1, 0).getDate();
}

function overlapsMonth(r, m) {
  const start = new Date(r.startDate + 'T00:00:00');
  const end   = new Date(r.endDate   + 'T00:00:00');
  const mStart = new Date(CURRENT_YEAR, m, 1);
  const mEnd   = new Date(CURRENT_YEAR, m + 1, 0);
  return start <= mEnd && end >= mStart;
}

function calcBar(r, m) {
  const days    = daysInMonth(m);
  const start   = new Date(r.startDate + 'T00:00:00');
  const end     = new Date(r.endDate   + 'T00:00:00');
  const mStart  = new Date(CURRENT_YEAR, m, 1);
  const mEnd    = new Date(CURRENT_YEAR, m + 1, 0);

  const effStart = start < mStart ? mStart : start;
  const effEnd   = end   > mEnd   ? mEnd   : end;

  const leftPct  = ((effStart.getDate() - 1) / days) * 100;
  const rightPct = Math.max(0, ((days - effEnd.getDate()) / days) * 100);
  return { leftPct, rightPct };
}

const GanttChart = ({ data = [], viewMode = 'annual' }) => {
  // Determine which month indices to show
  let monthIndices;
  if (viewMode === 'monthly') {
    monthIndices = [CURRENT_MONTH];
  } else if (viewMode === 'quarterly') {
    const qStart = Math.floor(CURRENT_MONTH / 3) * 3;
    monthIndices = [qStart, qStart + 1, qStart + 2].filter(m => m < 12);
  } else {
    monthIndices = Array.from({ length: 12 }, (_, i) => i);
  }

  const gridTemplate = `140px repeat(${monthIndices.length}, 1fr)`;

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: viewMode === 'monthly' ? 400 : 600 }}>
        {/* Header */}
        <div className="grid gap-0 mb-2" style={{ gridTemplateColumns: gridTemplate }}>
          <div />
          {monthIndices.map((m) => (
            <div
              key={m}
              className={`text-[10px] font-bold text-center uppercase py-1 tracking-wider border-r border-border last:border-r-0 ${
                m === CURRENT_MONTH ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {MONTHS[m]}
              {viewMode !== 'annual' && (
                <span className="block text-[9px] font-normal normal-case opacity-60">
                  {daysInMonth(m)} dias
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {data.length === 0 ? (
            <p className="text-center py-10 text-xs text-text-muted">Sem dados para o mapa.</p>
          ) : (
            data.map((worker, idx) => {
              const color = COLORS[idx % COLORS.length];
              return (
                <div
                  key={idx}
                  className="grid gap-0 items-center"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  <div className="flex items-center gap-2 pr-2 overflow-hidden">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {worker.avatar || 'U'}
                    </div>
                    <span className="text-[12px] font-semibold text-text truncate">{worker.name}</span>
                  </div>

                  {monthIndices.map((m) => {
                    const monthReqs = (worker.requests || []).filter(r => overlapsMonth(r, m));
                    const isCurrentMonth = m === CURRENT_MONTH;
                    return (
                      <div
                        key={m}
                        className={`h-7 border-r border-border last:border-r-0 relative ${
                          isCurrentMonth ? 'bg-primary/5' : 'bg-bg/20'
                        }`}
                      >
                        {monthReqs.map((r, i) => {
                          const { leftPct, rightPct } = calcBar(r, m);
                          return (
                            <div
                              key={i}
                              title={`${r.startDate} → ${r.endDate}`}
                              className="absolute top-1.5 bottom-1.5 rounded-sm opacity-80 hover:opacity-100 transition-opacity cursor-default"
                              style={{ left: `${leftPct}%`, right: `${rightPct}%`, backgroundColor: color }}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
