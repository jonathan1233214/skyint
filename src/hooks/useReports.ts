/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Report } from '@/types/database'

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        user_profiles!reports_user_id_fkey(email, reputation)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      const mapped = data.map((r: any) => ({
        ...r,
        user_email: r.user_profiles?.email,
        user_reputation: r.user_profiles?.reputation ?? 0,
      }))
      setReports(mapped)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReports()

    const channel = supabase
      .channel('reports-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          setReports((prev) => [payload.new as Report, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          setReports((prev) =>
            prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchReports])

  return { reports, loading, refetch: fetchReports }
}
