'use client'

import { formatDistanceToNow } from 'date-fns'
import { TypeBadge, ConfidenceDot } from '@/components/ui/Badge'
import type { Report } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { useUpvote } from '@/hooks/useUpvote'

interface ReportCardProps {
  report: Report
  onClick?: () => void
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  const { user } = useAuth()
  const { upvote, voting } = useUpvote()

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    await upvote(report.id, user.id)
  }

  return (
    <div
      className="p-3 border border-border-subtle rounded bg-surface-2 hover:border-accent/40 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={report.type} />
          <ConfidenceDot level={report.confidence} />
          {report.callsign && (
            <span className="font-mono text-xs text-text-primary font-bold">{report.callsign}</span>
          )}
        </div>
        <button
          onClick={handleUpvote}
          disabled={!user || voting === report.id}
          className="flex items-center gap-1 text-xs font-mono text-text-secondary hover:text-accent disabled:opacity-40 transition-colors flex-shrink-0"
          title={user ? 'Upvote' : 'Sign in to upvote'}
        >
          <span>▲</span>
          <span>{report.upvotes}</span>
        </button>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-2">
        {(() => {
          try {
            const d = JSON.parse(report.description)
            return d.notes ?? report.description
          } catch {
            return report.description
          }
        })()}
      </p>
      {(() => {
        try {
          const d = JSON.parse(report.description)
          return (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
              {d.aircraft_type && <span className="font-mono text-xs text-text-muted">{d.aircraft_type}</span>}
              {d.route         && <span className="font-mono text-xs text-text-muted">✈ {d.route}</span>}
              {d.frequency     && <span className="font-mono text-xs text-accent">{d.frequency} MHz</span>}
              {d.location      && <span className="font-mono text-xs text-text-muted">📍 {d.location}</span>}
            </div>
          )
        } catch { return null }
      })()}

      <div className="flex items-center justify-between text-xs text-text-muted font-mono">
        <span>{report.user_email?.split('@')[0] ?? 'anon'}</span>
        <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
      </div>
    </div>
  )
}
