# TranscriptX Backend Server

This backend server handles all API calls to external services like AssemblyAI and DeepSeek, protecting your API keys from client exposure.

## Setup Instructions

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file based on the `.env.example` template:

   ```bash
   cp .env.example .env
   ```

3. Add your API keys to the `.env` file:

   ```
   PORT=5000
   ASSEMBLY_API_KEY=your_assemblyai_key_here
   DEEPSEEK_API_KEY=your_deepseek_key_here
   ```

4. Start the server:
   - For development: `npm run dev`
   - For production: `npm start`

## API Endpoints

- `POST /api/upload` - Upload audio file
- `POST /api/transcription` - Request transcription
- `GET /api/transcription/:id` - Check transcription status
- `GET /api/test-assembly-key` - Test if AssemblyAI API key is valid
- `POST /api/generate` - Generate notes from transcription

## Security Measures

- API keys are stored only on the server
- CORS protection
- File size limits for uploads
- Proper error handling
