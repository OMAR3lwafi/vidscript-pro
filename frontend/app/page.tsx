'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { VideoIcon, Languages, Clock, Share2, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function LandingPage() {
  const [videoUrl, setVideoUrl] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuthStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!videoUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a video URL',
        variant: 'destructive',
      })
      return
    }

    // Validate URL format
    const validPlatforms = ['youtube.com', 'youtu.be', 'tiktok.com', 'twitter.com', 'x.com']
    const isValid = validPlatforms.some(platform => videoUrl.includes(platform))
    
    if (!isValid) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube, TikTok, or Twitter video URL',
        variant: 'destructive',
      })
      return
    }

    // If user is logged in, redirect to dashboard with URL
    if (user) {
      router.push(`/dashboard?url=${encodeURIComponent(videoUrl)}`)
    } else {
      // Otherwise, redirect to login with URL saved
      sessionStorage.setItem('pendingVideoUrl', videoUrl)
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <VideoIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">VidScript Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Button variant="outline" onClick={() => useAuthStore.getState().signOut()}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-bold mb-6">
            Professional Video Transcription
            <span className="block text-3xl text-muted-foreground mt-2">
              with Precise Timestamps
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Transform your YouTube, TikTok, and Twitter videos into searchable,
            timestamped transcripts in Arabic and English.
          </p>

          {/* URL Input Form */}
          <Card className="p-6 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="url"
                  placeholder="Paste your video URL here..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="lg">
                  Transcribe
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Supports YouTube, TikTok, and Twitter videos
              </p>
            </form>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            Why Content Creators Choose VidScript Pro
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <Languages className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Multilingual Support</h4>
              <p className="text-muted-foreground">
                Accurate transcription in Arabic and English with proper RTL support
                for seamless multilingual content.
              </p>
            </Card>
            <Card className="p-6">
              <Clock className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Precise Timestamps</h4>
              <p className="text-muted-foreground">
                Navigate through your content easily with accurate timestamps for
                every spoken word.
              </p>
            </Card>
            <Card className="p-6">
              <Share2 className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Easy Sharing</h4>
              <p className="text-muted-foreground">
                Generate permanent links to share your transcribed videos with
                collaborators or audience.
              </p>
            </Card>
            <Card className="p-6">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Secure & Private</h4>
              <p className="text-muted-foreground">
                Your content is protected with enterprise-grade security and
                user-controlled privacy settings.
              </p>
            </Card>
            <Card className="p-6">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Lightning Fast</h4>
              <p className="text-muted-foreground">
                Powered by OpenAI Whisper for rapid, accurate transcription
                without compromising quality.
              </p>
            </Card>
            <Card className="p-6">
              <VideoIcon className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Multi-Platform</h4>
              <p className="text-muted-foreground">
                Works seamlessly with YouTube, TikTok, and Twitter videos
                all in one place.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Transform Your Video Content?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of content creators who trust VidScript Pro
            for their transcription needs.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 VidScript Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}