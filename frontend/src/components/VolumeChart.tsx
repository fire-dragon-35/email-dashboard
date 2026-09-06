import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_HEIGHT, ChartTooltip, formatDayShort } from './graphPanelHelpers';

interface VolumeChartProps {
  data: { day: string; total: number }[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="day"
          tickFormatter={formatDayShort}
          interval={0}
          tick={{ fontSize: 9, fill: 'var(--soft)' }}
          axisLine={{ stroke: 'var(--line)' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          width={28}
          tick={{ fontSize: 9, fill: 'var(--soft)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={ChartTooltip} cursor={{ fill: 'var(--line)', opacity: 0.4 }} />
        <Bar
          dataKey="total"
          fill="var(--accent)"
          radius={[4, 4, 0, 0]}
          maxBarSize={16}
          activeBar={{ fillOpacity: 0.85 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
