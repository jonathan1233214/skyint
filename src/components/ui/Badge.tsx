import { ReportType } from '@/types/database'

const TYPE_COLORS: Record<ReportType, string> = {
  aircraft:      'bg-blue-500/20 text-blue-400 border-blue-500/40',
  radio:         'bg-purple-500/20 text-purple-400 border-purple-500/40',
  visual:        'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  alert:         'bg-red-500/20 text-red-400 border-red-500/40',
  intercept:     'bg-orange-500/20 text-orange-400 border-orange-500/40',
  aircraft_note: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
}

export function TypeBadge({ type }: { type: ReportType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${TYPE_COLORS[type]}`}>
      {type.toUpperCase()}
    </span>
  )
}

const CONFIDENCE_COLORS = {
  low: 'text-red-400',
  medium: 'text-yellow-400',
  high: 'text-green-400',
  confirmed: 'text-accent',
}

export function ConfidenceDot({ level }: { level: string }) {
  const color = CONFIDENCE_COLORS[level as keyof typeof CONFIDENCE_COLORS] ?? 'text-text-muted'
  return (
    <span className={`inline-block w-2 h-2 rounded-full bg-current ${color}`} title={level} />
  )
}
