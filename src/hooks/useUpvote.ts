'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useUpvote() {
  const [voting, setVoting] = useState<string | null>(null)

  const upvote = async (reportId: string, userId: string) => {
    if (voting) return
    setVoting(reportId)
    try {
      // Check if already upvoted
      const { data: existing } = await supabase
        .from('upvotes')
        .select('id')
        .eq('report_id', reportId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        // Remove upvote
        await supabase.from('upvotes').delete().eq('id', existing.id)
        await supabase.rpc('decrement_upvotes', { report_id: reportId })
      } else {
        // Add upvote
        await supabase.from('upvotes').insert({ report_id: reportId, user_id: userId })
        await supabase.rpc('increment_upvotes', { report_id: reportId })
        // Increment reporter reputation
        const { data: report } = await supabase
          .from('reports')
          .select('user_id')
          .eq('id', reportId)
          .single()
        if (report) {
          await supabase.rpc('increment_reputation', { profile_id: report.user_id })
        }
      }
    } finally {
      setVoting(null)
    }
  }

  return { upvote, voting }
}
