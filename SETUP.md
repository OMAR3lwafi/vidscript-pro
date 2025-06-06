# VidScript Pro Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account (free tier works)
- OpenAI API key (for Whisper API)
- FFmpeg installed on your system

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/OMAR3lwafi/vidscript-pro.git
cd vidscript-pro
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Copy the entire contents of `database/schema.sql`
4. Run the SQL script in the SQL Editor
5. Go to Settings > API and copy:
   - Project URL
   - Anon/Public key
   - Service key (for backend)

### 3. Configure the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update Supabase configuration in `frontend/lib/supabase.ts`:
   ```typescript
   const SUPABASE_URL = 'your-project-url'
   const SUPABASE_ANON_KEY = 'your-anon-key'
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at http://localhost:3000

### 4. Configure the Backend

1. Navigate to the backend directory:
   ```bash
   cd ../backend
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

5. Update `.env` with your credentials:
   ```env
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_KEY=your-service-key
   OPENAI_API_KEY=your-openai-api-key
   ```

6. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at http://localhost:8000

## Production Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Configure build settings:
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/.next`
   - Install Command: `cd frontend && npm install`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

### Backend (Render/Railway)

1. Create a new web service
2. Connect your GitHub repo
3. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Working Directory: `backend`
4. Add environment variables from your `.env` file

### Database (Supabase)

Your Supabase project is already hosted and ready to use!

## Features Configuration

### Email Authentication

1. Go to Supabase Dashboard > Authentication > Providers
2. Configure Email settings
3. Set up email templates for verification

### Storage (Optional)

If you want to store video files:

1. Go to Supabase Dashboard > Storage
2. Create a new bucket called `videos`
3. Set appropriate policies

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Install FFmpeg: https://ffmpeg.org/download.html
   - Add to system PATH

2. **CORS errors**
   - Update `backend/main.py` CORS origins
   - Add your frontend URL to allowed origins

3. **Transcription fails**
   - Check OpenAI API key is valid
   - Ensure you have credits in your OpenAI account
   - Check video URL is accessible

4. **Authentication issues**
   - Verify Supabase keys are correct
   - Check RLS policies in database
   - Ensure user is verified (check email)

## Environment Variables Summary

### Frontend
- Update `lib/supabase.ts` with Supabase credentials
- Set `NEXT_PUBLIC_API_URL` for production

### Backend
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Service role key (not anon key)
- `OPENAI_API_KEY`: OpenAI API key for Whisper

## Support

For issues, please check:
1. GitHub Issues: https://github.com/OMAR3lwafi/vidscript-pro/issues
2. Supabase Docs: https://supabase.com/docs
3. OpenAI Docs: https://platform.openai.com/docs