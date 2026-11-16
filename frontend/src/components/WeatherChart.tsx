import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, AreaChart, Area } from 'recharts'
import type { Severity } from '../types'

export interface ChartDatum {
  [key: string]: string | number | boolean
}

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '13px',
}

// Severity color map for consistent visual language
export const SEVERITY_COLORS: Record<Severity, string> = {
  favorable: '#22c55e',
  caution: '#eab308',
  warning: '#f97316',
  critical: '#dc2626',
}

export function WeatherLineChart({
  data,
  xKey,
  lines,
  height = 220,
  yUnit = '',
}: {
  data: ChartDatum[]
  xKey: string
  lines: { key: string; color: string; name: string }[]
  height?: number
  yUnit?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit={yUnit} width={40} />
        <Tooltip contentStyle={tooltipStyle} />
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            stroke={l.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            name={l.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function WeatherAreaChart({
  data,
  xKey,
  series,
  height = 220,
  yUnit = '',
}: {
  data: ChartDatum[]
  xKey: string
  series: { key: string; color: string; name: string }[]
  height?: number
  yUnit?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit={yUnit} width={40} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            fill={`url(#grad-${s.key})`}
            strokeWidth={2}
            name={s.name}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function WeatherBarChart({
  data,
  xKey,
  bars,
  height = 220,
  yUnit = '',
}: {
  data: ChartDatum[]
  xKey: string
  bars: { key: string; fill: string; name: string }[]
  height?: number
  yUnit?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit={yUnit} width={40} />
        <Tooltip contentStyle={tooltipStyle} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} fill={b.fill} name={b.name} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
