import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { useAuthStore } from './auth-store'

type Video = Database['public']['Tables']['videos']['Row']
type Transcription = Database['public']['Tables']['transcriptions']['Row']

interface VideoState {
  videos: Video[]
  currentVideo: Video | null
  transcriptions: Transcription[]
  loading: boolean
  fetchVideos: () => Promise<void>
  fetchVideo: (id: string) => Promise<void>
  addVideo: (url: string) => Promise<{ data: Video | null; error: Error | null }>
  fetchTranscription: (videoId: string) => Promise<void>
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  currentVideo: null,
  transcriptions: [],
  loading: false,

  fetchVideos: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ videos: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching videos:', error)
      set({ loading: false })
    }
  },

  fetchVideo: async (id: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentVideo: data, loading: false })
    } catch (error) {
      console.error('Error fetching video:', error)
      set({ loading: false })
    }
  },

  addVideo: async (url: string) => {
    try {
      // Call API to process video
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/videos/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('Failed to process video')
      }

      const data = await response.json()
      
      // Add to local state
      set(state => ({
        videos: [data, ...state.videos]
      }))

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  fetchTranscription: async (videoId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ transcriptions: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching transcriptions:', error)
      set({ loading: false })
    }
  },
}))