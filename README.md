# TranscriptX - Smart Note Taking App

TranscriptX is a web application that helps you record, transcribe, and generate well-structured notes using AI.

## Features

- Record audio from your microphone with pause/resume capability
- Live transcription of speech
- Upload audio files for transcription
- AI-powered note generation from transcriptions
- Notion-style editable notes

## How to Use TranscriptX

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your DeepSeek API key:
   ```
   REACT_APP_DEEPSEEK_API_KEY=your-api-key-here
   ```
4. Start the development server:
   ```
   npm start
   ```

### Using the App

#### Recording Audio

1. Click the **Record** button to start recording from your microphone
2. Speak clearly to see your words transcribed in real-time
3. Use the **Pause** button to temporarily pause recording
4. Click **Resume** to continue recording
5. When finished, click **Stop** to end the recording session

#### Uploading Audio Files

1. Click or drag and drop an audio file into the upload area
2. Once a file is selected, click the **Transcribe Audio** button
3. Wait for the transcription process to complete

#### Generating Notes

1. After recording or uploading audio, you'll see the transcription in the main panel
2. Click the **Generate Notes** button to process the transcription with AI
3. The generated notes will appear in a Notion-style editor below the transcription
4. Edit the notes as needed directly in the editor

### Tips for Best Results

- Use a good quality microphone for clearer transcriptions
- Speak clearly and at a moderate pace
- For better transcription, try to minimize background noise
- For file uploads, higher quality audio files will yield better transcriptions
- The notes editor supports formatting like headings and bullet points

## Troubleshooting

- If the microphone recording doesn't work, check that you've granted microphone permissions to your browser
- If speech recognition isn't working, try using Google Chrome which has the best support for the Web Speech API
- If the app fails to generate notes, check that your DeepSeek API key is correctly set in the .env file

## Technical Details

TranscriptX uses:

- React for the UI
- Web Speech API for live transcription
- MediaRecorder API for audio recording
- Slate.js for the rich text editor
- DeepSeek API for AI-powered note generation

## License

MIT
