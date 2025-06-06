import { createClient } from '@supabase/supabase-js'

// These would normally be in environment variables, but per requirements,
// we're storing them in the UI files
const SUPABASE_URL = 'YOUR_SUPABASE_URL' // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY' // Replace with your Supabase anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type Database = {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string
          user_id: string
          url: string
          platform: 'youtube' | 'tiktok' | 'twitter'
          title: string
          thumbnail: string | null
          permanent_link: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['videos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['videos']['Insert']>
      }
      transcriptions: {
        Row: {
          id: string
          video_id: string
          language: 'ar' | 'en' | 'both'
          content: string
          timestamps: any
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transcriptions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transcriptions']['Insert']>
      }
    }
  }
}