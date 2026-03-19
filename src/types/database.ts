export type ReportType = 'aircraft' | 'radio' | 'visual' | 'alert' | 'intercept' | 'aircraft_note'
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'confirmed'

export interface Report {
  id: string
  created_at: string
  user_id: string
  type: ReportType
  callsign: string | null
  lat: number
  lng: number
  description: string
  confidence: ConfidenceLevel
  upvotes: number
  user_email?: string
  user_reputation?: number
}

export interface AircraftTrack {
  icao24: string
  callsign: string | null
  lat: number
  lng: number
  altitude: number | null
  velocity: number | null
  heading: number | null
  on_ground: boolean
  last_contact: number
}

export interface UserProfile {
  id: string
  email: string
  reputation: number
  created_at: string
}

export interface Upvote {
  id: string
  report_id: string
  user_id: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at' | 'upvotes'>
        Update: Partial<Report>
      }
      upvotes: {
        Row: Upvote
        Insert: Omit<Upvote, 'id' | 'created_at'>
        Update: Partial<Upvote>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'reputation'>
        Update: Partial<UserProfile>
      }
    }
  }
}
