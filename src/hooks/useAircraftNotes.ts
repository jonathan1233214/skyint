'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Report } from '@/types/database'

export interface AircraftNote {
  id: string
  icao24: string
  note: string
  user_email: string
  created_at: string
}

/** Aircraft notes are stored as reports with type='aircraft_note', callsign=icao24 */
export function useAircraftNotes(icao24: string | null) {
  const [notes, setNotes] = useState<AircraftNote[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotes = useCallback(async () => {
    if (!icao24) { setNotes([]); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('reports')
      .select('id, created_at, description, callsign, user_profiles!reports_user_id_fkey(email)')
      .eq('type', 'aircraft_note')
      .eq('callsign', icao24)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setNotes(data.map((r: any) => ({
        id:         r.id,
        icao24:     r.callsign,
        note:       r.description,
        user_email: r.user_profiles?.email ?? 'anonymous',
        created_at: r.created_at,
      })))
    }
    setLoading(false)
  }, [icao24])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const addNote = async (userId: string, note: string): Promise<string | null> => {
    if (!icao24) return 'No aircraft selected'
    const { error } = await supabase.from('reports').insert({
      user_id:     userId,
      type:        'aircraft_note' as Report['type'],
      callsign:    icao24,
      lat:         0,
      lng:         0,
      description: note.trim(),
      confidence:  'medium',
    })
    if (error) return error.message
    await fetchNotes()
    return null
  }

  return { notes, loading, addNote, refetch: fetchNotes }
}
