# VidScript Pro

## Professional Video Transcription with Timestamps

VidScript Pro is a powerful web application that provides professional video transcription services with precise timestamps for YouTube, TikTok, and Twitter videos. Supporting both Arabic and English languages, it's the perfect tool for content creators who need accurate transcriptions.

## Features

- 🎥 **Multi-Platform Support**: Works with YouTube, TikTok, and Twitter videos
- 🌍 **Multilingual**: Supports Arabic and English transcription
- ⏱️ **Precise Timestamps**: Get accurate timestamps for easy navigation
- 🔗 **Permanent Links**: Share your transcribed videos with unique URLs
- 🎨 **Professional Dark Theme**: Beautiful, modern interface
- 🔐 **Secure Authentication**: Powered by Supabase Auth
- 📱 **Responsive Design**: Works perfectly on all devices

## Tech Stack

### Frontend
- Next.js 14 with TypeScript
- Tailwind CSS & shadcn/ui
- Zustand for state management
- React Player for video playback

### Backend
- FastAPI (Python)
- OpenAI Whisper API for transcription
- Supabase for database and authentication

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/OMAR3lwafi/vidscript-pro.git
cd vidscript-pro
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
pip install -r requirements.txt
```

4. Set up environment variables:
- Copy `.env.example` to `.env` in both frontend and backend directories
- Add your Supabase and OpenAI credentials

5. Set up Supabase database:
- Run the SQL scripts in `database/schema.sql` in your Supabase dashboard

6. Start the development servers:

**Frontend:**
```bash
cd frontend
npm run dev
```

**Backend:**
```bash
cd backend
uvicorn main:app --reload
```

## Usage

1. Sign up or log in to your account
2. Paste a YouTube, TikTok, or Twitter video URL
3. Select your preferred transcription language
4. Click "Transcribe" and wait for the magic
5. View, copy, or share your transcribed video

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issues page.