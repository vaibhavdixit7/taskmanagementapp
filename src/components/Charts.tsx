interface BarChartProps {
  data: { label: string; value: number; highlight?: boolean }[];
  maxValue?: number;
  color?: string;
  height?: number;
}

export function BarChart({ data, maxValue, color = 'bg-blue-500', height = 120 }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${d.highlight ? 'bg-emerald-500' : color}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="text-xs text-slate-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ segments, size = 160 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="12"
            className="stroke-slate-100 dark:stroke-slate-700"
          />
          {total > 0 && segments.map((seg, i) => {
            const len = (seg.value / total) * circumference;
            const circle = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth="12"
                strokeDasharray={`${len} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className={seg.color}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            );
            offset += len;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800 dark:text-white">{total}</span>
          <span className="text-xs text-slate-400">Total</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${seg.color.replace('stroke-', 'bg-')}`} />
            <span className="text-sm text-slate-600 dark:text-slate-300">{seg.label}</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function LineChart({ data, height = 100, color = '#3b82f6' }: LineChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 300;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = height - (d.value / max) * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#lineGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * width;
          const y = height - (d.value / max) * (height - 10) - 5;
          return <circle key={i} cx={x} cy={y} r="3" fill={color} className="transition-all" />;
        })}
      </svg>
      <div className="mt-1 flex justify-between">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-slate-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
