from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, HttpUrl
from typing import Optional, Literal
import os
import uuid
import asyncio
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import openai
import yt_dlp
import tempfile
import requests
from urllib.parse import urlparse
import json

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="VidScript Pro API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://vidscript-pro.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", "")
)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY", "")

# Security
security = HTTPBearer()

# Models
class VideoProcessRequest(BaseModel):
    url: HttpUrl

class TranscribeRequest(BaseModel):
    language: Literal['ar', 'en', 'both']

class VideoResponse(BaseModel):
    id: str
    user_id: str
    url: str
    platform: str
    title: str
    thumbnail: Optional[str]
    permanent_link: str
    created_at: str
    updated_at: str

class TranscriptionResponse(BaseModel):
    id: str
    video_id: str
    language: str
    content: str
    timestamps: list
    status: str
    created_at: str

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Verify the token with Supabase
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# Helper functions
def extract_video_info(url: str):
    """Extract video information using yt-dlp"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Determine platform
            domain = urlparse(url).netloc.lower()
            if 'youtube.com' in domain or 'youtu.be' in domain:
                platform = 'youtube'
            elif 'tiktok.com' in domain:
                platform = 'tiktok'
            elif 'twitter.com' in domain or 'x.com' in domain:
                platform = 'twitter'
            else:
                platform = 'unknown'
            
            return {
                'title': info.get('title', 'Untitled Video'),
                'thumbnail': info.get('thumbnail'),
                'platform': platform,
                'duration': info.get('duration', 0)
            }
    except Exception as e:
        print(f"Error extracting video info: {str(e)}")
        return None

def download_video_audio(url: str) -> Optional[str]:
    """Download audio from video"""
    try:
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': tmp_file.name.replace('.mp3', '.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'quiet': True,
                'no_warnings': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            
            return tmp_file.name
    except Exception as e:
        print(f"Error downloading audio: {str(e)}")
        return None

def transcribe_audio(audio_path: str, language: str):
    """Transcribe audio using OpenAI Whisper API"""
    try:
        with open(audio_path, 'rb') as audio_file:
            # For 'both' language, we'll use auto-detection
            if language == 'both':
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )
            else:
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )
        
        # Extract segments with timestamps
        segments = transcript.get('segments', [])
        timestamps = [{
            'start': seg['start'],
            'end': seg['end'],
            'text': seg['text'].strip()
        } for seg in segments]
        
        # Full transcript
        full_text = ' '.join([seg['text'] for seg in segments])
        
        return {
            'content': full_text,
            'timestamps': timestamps,
            'detected_language': transcript.get('language', language)
        }
    except Exception as e:
        print(f"Error transcribing audio: {str(e)}")
        return None
    finally:
        # Clean up the audio file
        if os.path.exists(audio_path):
            os.remove(audio_path)

# API Routes
@app.get("/")
async def root():
    return {"message": "VidScript Pro API"}

@app.post("/api/videos/process", response_model=VideoResponse)
async def process_video(request: VideoProcessRequest, user=Depends(get_current_user)):
    """Process a video URL and save it to the database"""
    url = str(request.url)
    
    # Extract video information
    video_info = extract_video_info(url)
    if not video_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process video URL"
        )
    
    # Generate permanent link
    permanent_link = str(uuid.uuid4())
    
    # Save to database
    try:
        video_data = {
            'user_id': user.user.id,
            'url': url,
            'platform': video_info['platform'],
            'title': video_info['title'],
            'thumbnail': video_info['thumbnail'],
            'permanent_link': permanent_link
        }
        
        result = supabase.table('videos').insert(video_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save video"
            )
        
        return result.data[0]
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save video"
        )

@app.post("/api/videos/{video_id}/transcribe")
async def transcribe_video(video_id: str, request: TranscribeRequest, user=Depends(get_current_user)):
    """Start transcription for a video"""
    # Verify video ownership
    video_result = supabase.table('videos').select('*').eq('id', video_id).eq('user_id', user.user.id).execute()
    
    if not video_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    video = video_result.data[0]
    
    # Check if transcription already exists
    existing = supabase.table('transcriptions').select('*').eq('video_id', video_id).eq('language', request.language).execute()
    
    if existing.data and existing.data[0]['status'] == 'completed':
        return {"message": "Transcription already exists", "transcription_id": existing.data[0]['id']}
    
    # Create pending transcription record
    transcription_data = {
        'video_id': video_id,
        'language': request.language,
        'content': '',
        'timestamps': [],
        'status': 'processing'
    }
    
    transcription_result = supabase.table('transcriptions').insert(transcription_data).execute()
    
    if not transcription_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create transcription record"
        )
    
    transcription_id = transcription_result.data[0]['id']
    
    # Start async transcription
    asyncio.create_task(process_transcription(video['url'], video_id, transcription_id, request.language))
    
    return {"message": "Transcription started", "transcription_id": transcription_id}

async def process_transcription(video_url: str, video_id: str, transcription_id: str, language: str):
    """Process transcription in the background"""
    try:
        # Download audio
        audio_path = download_video_audio(video_url)
        if not audio_path:
            raise Exception("Failed to download audio")
        
        # Transcribe audio
        transcription_result = transcribe_audio(audio_path, language)
        if not transcription_result:
            raise Exception("Failed to transcribe audio")
        
        # Update transcription record
        supabase.table('transcriptions').update({
            'content': transcription_result['content'],
            'timestamps': transcription_result['timestamps'],
            'status': 'completed'
        }).eq('id', transcription_id).execute()
        
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        # Update status to failed
        supabase.table('transcriptions').update({
            'status': 'failed'
        }).eq('id', transcription_id).execute()

@app.get("/api/videos/{video_id}/transcription-status")
async def get_transcription_status(video_id: str, user=Depends(get_current_user)):
    """Get transcription status for a video"""
    # Verify video ownership
    video_result = supabase.table('videos').select('*').eq('id', video_id).eq('user_id', user.user.id).execute()
    
    if not video_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Get latest transcription
    transcription_result = supabase.table('transcriptions').select('*').eq('video_id', video_id).order('created_at', desc=True).limit(1).execute()
    
    if not transcription_result.data:
        return {"status": "not_started"}
    
    return {
        "status": transcription_result.data[0]['status'],
        "transcription_id": transcription_result.data[0]['id']
    }

@app.get("/api/shared/{permanent_link}")
async def get_shared_video(permanent_link: str):
    """Get video data for public sharing"""
    # Get video by permanent link
    video_result = supabase.table('videos').select('*').eq('permanent_link', permanent_link).execute()
    
    if not video_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    video = video_result.data[0]
    
    # Get transcriptions
    transcriptions_result = supabase.table('transcriptions').select('*').eq('video_id', video['id']).eq('status', 'completed').execute()
    
    return {
        "video": video,
        "transcriptions": transcriptions_result.data or []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)