'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { VideoIcon, ArrowLeft, Languages, Copy, Download, Share2, Loader2, Play } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useVideoStore } from '@/lib/stores/video-store'
import ReactPlayer from 'react-player'
import { formatDistanceToNow } from '@/lib/utils'

interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, checkAuth } = useAuthStore()
  const { currentVideo, transcriptions, fetchVideo, fetchTranscription } = useVideoStore()
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en' | 'both'>('en')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)
  const [activeSegment, setActiveSegment] = useState<number>(-1)
  const [playerRef, setPlayerRef] = useState<ReactPlayer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user === null && !useAuthStore.getState().loading) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (user && params.id) {
      fetchVideo(params.id)
      fetchTranscription(params.id)
    }
  }, [user, params.id])

  const handleTranscribe = async () => {
    if (!currentVideo) return

    setIsTranscribing(true)
    setTranscriptionProgress(0)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/videos/${currentVideo.id}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await useAuthStore.getState().supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ language: selectedLanguage }),
      })

      if (!response.ok) {
        throw new Error('Failed to start transcription')
      }

      // Simulate progress (in real app, you'd use WebSocket or SSE for real-time updates)
      const progressInterval = setInterval(() => {
        setTranscriptionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 1000)

      // Poll for completion
      const checkStatus = async () => {
        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/videos/${currentVideo.id}/transcription-status`, {
          headers: {
            'Authorization': `Bearer ${(await useAuthStore.getState().supabase.auth.getSession()).data.session?.access_token}`,
          },
        })

        const status = await statusResponse.json()
        
        if (status.status === 'completed') {
          clearInterval(progressInterval)
          setTranscriptionProgress(100)
          await fetchTranscription(currentVideo.id)
          toast({
            title: 'Success',
            description: 'Video transcribed successfully!',
          })
          setIsTranscribing(false)
        } else if (status.status === 'failed') {
          clearInterval(progressInterval)
          throw new Error('Transcription failed')
        } else {
          setTimeout(checkStatus, 2000)
        }
      }

      setTimeout(checkStatus, 2000)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to transcribe video',
        variant: 'destructive',
      })
      setIsTranscribing(false)
    }
  }

  const handleCopyTranscript = () => {
    const transcript = transcriptions
      .find(t => t.language === selectedLanguage)
      ?.content || ''
    
    navigator.clipboard.writeText(transcript)
    toast({
      title: 'Copied!',
      description: 'Transcript copied to clipboard',
    })
  }

  const handleDownloadTranscript = () => {
    const transcript = transcriptions
      .find(t => t.language === selectedLanguage)
      ?.content || ''
    
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentVideo?.title || 'transcript'}-${selectedLanguage}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShareVideo = () => {
    const shareUrl = `${window.location.origin}/shared/${currentVideo?.permanent_link}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: 'Link copied!',
      description: 'Share link copied to clipboard',
    })
  }

  const handleSegmentClick = (segment: TranscriptionSegment) => {
    if (playerRef) {
      playerRef.seekTo(segment.start, 'seconds')
      setPlaying(true)
    }
  }

  const handleProgress = (state: { playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds)
    
    // Find active segment
    const segments = transcriptions
      .find(t => t.language === selectedLanguage)
      ?.timestamps as TranscriptionSegment[] || []
    
    const activeIndex = segments.findIndex(
      segment => currentTime >= segment.start && currentTime <= segment.end
    )
    
    setActiveSegment(activeIndex)
  }

  if (!user || !currentVideo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const currentTranscription = transcriptions.find(t => t.language === selectedLanguage)
  const hasTranscription = currentTranscription && currentTranscription.status === 'completed'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/" className="flex items-center space-x-2">
                <VideoIcon className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">VidScript Pro</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleShareVideo}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Video Player */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{currentVideo.title}</CardTitle>
                <CardDescription>
                  {currentVideo.platform} • {formatDistanceToNow(new Date(currentVideo.created_at))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <ReactPlayer
                    ref={setPlayerRef}
                    url={currentVideo.url}
                    playing={playing}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onProgress={handleProgress}
                    controls
                    width="100%"
                    height="100%"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transcription Panel */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transcription</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={selectedLanguage}
                      onValueChange={(value) => setSelectedLanguage(value as 'ar' | 'en' | 'both')}
                      disabled={isTranscribing}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasTranscription && (
                      <>
                        <Button variant="outline" size="icon" onClick={handleCopyTranscript}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleDownloadTranscript}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isTranscribing ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-12">
                      <Languages className="h-12 w-12 text-muted-foreground animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-center text-muted-foreground">
                        Transcribing video...
                      </p>
                      <Progress value={transcriptionProgress} className="w-full" />
                    </div>
                  </div>
                ) : hasTranscription ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {(currentTranscription.timestamps as TranscriptionSegment[]).map((segment, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          activeSegment === index
                            ? 'bg-primary/10 border-l-4 border-primary'
                            : 'hover:bg-muted'
                        } ${selectedLanguage === 'ar' ? 'rtl' : ''}`}
                        onClick={() => handleSegmentClick(segment)}
                      >
                        <div className="flex items-start space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSegmentClick(segment)
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <div className="flex-1">
                            <p className="text-sm">{segment.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Languages className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No transcription yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Select a language and click transcribe to get started
                    </p>
                    <Button onClick={handleTranscribe} disabled={isTranscribing}>
                      <Languages className="h-4 w-4 mr-2" />
                      Transcribe Video
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}