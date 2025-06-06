'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VideoIcon, Copy, Download, Play, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ReactPlayer from 'react-player'
import { formatDistanceToNow, formatTimestamp } from '@/lib/utils'

interface Video {
  id: string
  url: string
  platform: string
  title: string
  thumbnail: string | null
  created_at: string
}

interface Transcription {
  id: string
  language: 'ar' | 'en' | 'both'
  content: string
  timestamps: TranscriptionSegment[]
  status: string
}

interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

export default function SharedVideoPage({ params }: { params: { link: string } }) {
  const [video, setVideo] = useState<Video | null>(null)
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en'>('en')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSegment, setActiveSegment] = useState<number>(-1)
  const [playerRef, setPlayerRef] = useState<ReactPlayer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    fetchSharedVideo()
  }, [params.link])

  const fetchSharedVideo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/shared/${params.link}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Video not found')
        } else {
          setError('Failed to load video')
        }
        setLoading(false)
        return
      }

      const data = await response.json()
      setVideo(data.video)
      setTranscriptions(data.transcriptions)
      
      // Set default language based on available transcriptions
      if (data.transcriptions.length > 0) {
        setSelectedLanguage(data.transcriptions[0].language as 'ar' | 'en')
      }
    } catch (err) {
      setError('Failed to load video')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyTranscript = () => {
    const transcript = transcriptions
      .find(t => t.language === selectedLanguage)
      ?.content || ''
    
    navigator.clipboard.writeText(transcript)
  }

  const handleDownloadTranscript = () => {
    const transcript = transcriptions
      .find(t => t.language === selectedLanguage)
      ?.content || ''
    
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${video?.title || 'transcript'}-${selectedLanguage}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
    const currentTranscription = transcriptions.find(t => t.language === selectedLanguage)
    const segments = currentTranscription?.timestamps || []
    
    const activeIndex = segments.findIndex(
      segment => currentTime >= segment.start && currentTime <= segment.end
    )
    
    setActiveSegment(activeIndex)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Video not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentTranscription = transcriptions.find(t => t.language === selectedLanguage)
  const availableLanguages = transcriptions.map(t => t.language).filter(l => l !== 'both') as ('ar' | 'en')[]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <VideoIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">VidScript Pro</h1>
            </Link>
            <Link href="/signup">
              <Button>Create Free Account</Button>
            </Link>
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
                <CardTitle>{video.title}</CardTitle>
                <CardDescription>
                  {video.platform} • Shared {formatDistanceToNow(new Date(video.created_at))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <ReactPlayer
                    ref={setPlayerRef}
                    url={video.url}
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
                  {currentTranscription && (
                    <div className="flex items-center space-x-2">
                      {availableLanguages.length > 1 && (
                        <Select
                          value={selectedLanguage}
                          onValueChange={(value) => setSelectedLanguage(value as 'ar' | 'en')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLanguages.includes('en') && (
                              <SelectItem value="en">English</SelectItem>
                            )}
                            {availableLanguages.includes('ar') && (
                              <SelectItem value="ar">العربية</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <Button variant="outline" size="icon" onClick={handleCopyTranscript}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleDownloadTranscript}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentTranscription ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {currentTranscription.timestamps.map((segment, index) => (
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
                    <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No transcription available</h3>
                    <p className="text-muted-foreground mb-6">
                      Create an account to transcribe this video
                    </p>
                    <Link href="/signup">
                      <Button>
                        Create Free Account
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Want to transcribe your own videos?</CardTitle>
              <CardDescription>
                Create a free account to start transcribing YouTube, TikTok, and Twitter videos
                with precise timestamps in Arabic and English.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}