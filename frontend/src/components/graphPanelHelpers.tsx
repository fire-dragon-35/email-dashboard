import type { TooltipContentProps } from 'recharts';

export const CHART_HEIGHT = 220;

export interface DayVolume {
  day: string;
  total: number;
}

export function formatDayShort(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
}

function formatDayFull(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as DayVolume;
  return (
    <div className="graph-panel__tooltip">
      <div className="graph-panel__tooltip-value">
        {point.total} {point.total === 1 ? 'email' : 'emails'}
      </div>
      <div className="graph-panel__tooltip-day">{formatDayFull(point.day)}</div>
    </div>
  );
}
