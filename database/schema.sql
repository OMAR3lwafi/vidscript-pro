-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Videos table
CREATE TABLE videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'twitter')),
    title TEXT NOT NULL,
    thumbnail TEXT,
    permanent_link TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Transcriptions table
CREATE TABLE transcriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('ar', 'en', 'both')),
    content TEXT NOT NULL,
    timestamps JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_permanent_link ON videos(permanent_link);
CREATE INDEX idx_transcriptions_video_id ON transcriptions(video_id);
CREATE INDEX idx_transcriptions_status ON transcriptions(status);

-- Row Level Security (RLS) policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Videos policies
CREATE POLICY "Users can view their own videos" ON videos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" ON videos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON videos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON videos
    FOR DELETE USING (auth.uid() = user_id);

-- Public access for shared videos
CREATE POLICY "Anyone can view shared videos" ON videos
    FOR SELECT USING (permanent_link IS NOT NULL);

-- Transcriptions policies
CREATE POLICY "Users can view transcriptions of their videos" ON transcriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = transcriptions.video_id
            AND videos.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transcriptions for their videos" ON transcriptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = transcriptions.video_id
            AND videos.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transcriptions of their videos" ON transcriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = transcriptions.video_id
            AND videos.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transcriptions of their videos" ON transcriptions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = transcriptions.video_id
            AND videos.user_id = auth.uid()
        )
    );

-- Public access for transcriptions of shared videos
CREATE POLICY "Anyone can view transcriptions of shared videos" ON transcriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = transcriptions.video_id
            AND videos.permanent_link IS NOT NULL
        )
    );

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at column
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();