# Voice Audio Generation Setup

This guide explains how to generate high-quality voice audio files for the app using Google Cloud Text-to-Speech.

## Why Google Cloud TTS?

The default expo-speech sounds robotic. Google's Neural2 voices sound natural, human, and motivational - similar to Nike Run Club quality.

## Cost

- **One-time cost: ~$0.32** for all 400 affirmations
- Neural2 voices: $16 per 1 million characters
- Your 400 affirmations × ~50 chars = 20,000 characters

## Setup Instructions

### 1. Create Google Cloud Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable billing (required, but cost is minimal)

### 2. Enable Text-to-Speech API

1. In Google Cloud Console, go to APIs & Services > Library
2. Search for "Cloud Text-to-Speech API"
3. Click Enable

### 3. Create Service Account

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "Service Account"
3. Name it (e.g., "tts-generator")
4. Click "Create and Continue"
5. Skip roles (not needed for TTS)
6. Click "Done"

### 4. Download Key File

1. Click on your new service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select JSON
5. Download and save as `google-tts-key.json` in the scripts folder

### 5. Install Dependencies

```bash
npm install @google-cloud/text-to-speech
```

### 6. Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\scripts\google-tts-key.json"
```

**Mac/Linux:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/scripts/google-tts-key.json"
```

### 7. Run the Generator

```bash
node scripts/generate-voice-audio.js
```

This will create audio files in `assets/voices/{voiceName}/{affirmationId}.mp3`

## Voice Options

The script generates audio for 6 voices:

| Voice | Google ID | Gender | Style |
|-------|-----------|--------|-------|
| Emma | en-US-Neural2-C | Female | Warm & encouraging |
| Aria | en-US-Neural2-E | Female | Friendly & energetic |
| Luna | en-US-Neural2-F | Female | Calm & soothing |
| James | en-US-Neural2-D | Male | Confident & motivational |
| Ryan | en-US-Neural2-A | Male | Supportive coach |
| Marcus | en-US-Neural2-J | Male | Professional & athletic |

## Adding to App

After generating the audio files:

### Option 1: Bundle with App (Recommended for offline)

The audio files will be in `assets/voices/`. The app's audioService is already configured to look for these files.

### Option 2: Download on First Launch

You could host the files on a CDN and download them when the user first selects a voice.

## Troubleshooting

**"Could not load the default credentials"**
- Make sure GOOGLE_APPLICATION_CREDENTIALS is set correctly
- Verify the JSON key file exists at the specified path

**"Permission denied"**
- Check that the Text-to-Speech API is enabled
- Verify billing is enabled on your Google Cloud project

**Rate limiting**
- The script includes a 50ms delay between requests
- If you still hit limits, increase the delay

## File Size Estimate

- ~400 affirmations × 6 voices = 2,400 files
- Average MP3 size: ~20KB per file
- Total: ~48MB for all voices
- Per voice: ~8MB

You can generate only the voices you want by modifying the VOICES object in the script.
