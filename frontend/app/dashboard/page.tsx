'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { VideoIcon, Plus, Search, Calendar, Link as LinkIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useVideoStore } from '@/lib/stores/video-store'
import { formatDistanceToNow } from '@/lib/utils'
import Image from 'next/image'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, checkAuth } = useAuthStore()
  const { videos, loading, fetchVideos, addVideo } = useVideoStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [isAddingVideo, setIsAddingVideo] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user === null && !useAuthStore.getState().loading) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (user) {
      fetchVideos()
      
      // Check if there's a URL parameter from the landing page
      const urlParam = searchParams.get('url')
      if (urlParam) {
        setNewVideoUrl(urlParam)
        setIsAddingVideo(true)
        // Remove the URL parameter from the address bar
        router.replace('/dashboard')
      }
    }
  }, [user, searchParams, router])

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newVideoUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a video URL',
        variant: 'destructive',
      })
      return
    }

    // Validate URL format
    const validPlatforms = ['youtube.com', 'youtu.be', 'tiktok.com', 'twitter.com', 'x.com']
    const isValid = validPlatforms.some(platform => newVideoUrl.includes(platform))
    
    if (!isValid) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube, TikTok, or Twitter video URL',
        variant: 'destructive',
      })
      return
    }

    setIsAddingVideo(true)
    const { data, error } = await addVideo(newVideoUrl)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } else if (data) {
      toast({
        title: 'Success',
        description: 'Video added successfully!',
      })
      setNewVideoUrl('')
      router.push(`/video/${data.id}`)
    }
    
    setIsAddingVideo(false)
  }

  const filteredVideos = videos.filter(video => {
    if (!searchQuery) return true
    return video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           video.url.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getVideoPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return '🎬'
      case 'tiktok':
        return '🎵'
      case 'twitter':
        return '🐦'
      default:
        return '📹'
    }
  }

  if (!user || useAuthStore.getState().loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" onClick={() => useAuthStore.getState().signOut()}>
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Add Video Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Video</CardTitle>
            <CardDescription>
              Paste a YouTube, TikTok, or Twitter video URL to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddVideo} className="flex space-x-2">
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                disabled={isAddingVideo}
                className="flex-1"
              />
              <Button type="submit" disabled={isAddingVideo}>
                {isAddingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Video
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse mt-2" />
                </CardHeader>
              </Card>
            ))
          ) : filteredVideos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No videos found' : 'No videos yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Add your first video to get started'}
              </p>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <Link key={video.id} href={`/video/${video.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {video.thumbnail ? (
                    <div className="aspect-video relative">
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2 text-2xl">
                        {getVideoPlatformIcon(video.platform)}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <VideoIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{video.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 text-xs">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(video.created_at))}
                      </span>
                      <span className="flex items-center">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Permanent link
                      </span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}