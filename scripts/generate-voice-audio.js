/**
 * Google Cloud Text-to-Speech Audio Generator
 *
 * This script generates high-quality MP3 audio files for all affirmations
 * using Google Cloud Neural2 voices.
 *
 * SETUP:
 * 1. Create a Google Cloud account: https://cloud.google.com/
 * 2. Enable the Text-to-Speech API
 * 3. Create a service account and download the JSON key file
 * 4. Set the environment variable: GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-key.json
 * 5. Install dependencies: npm install @google-cloud/text-to-speech
 * 6. Run this script: node scripts/generate-voice-audio.js
 *
 * COST: ~$0.32 for all 400 affirmations (one-time)
 *
 * OUTPUT: Creates audio files in assets/voices/{voiceName}/{affirmationId}.mp3
 */

const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Load affirmations
const affirmationsPath = path.join(__dirname, '..', 'affirmationslist2.json');
const affirmationsData = JSON.parse(fs.readFileSync(affirmationsPath, 'utf8'));
const affirmations = affirmationsData.affirmations;

// Voice configurations matching the app's VoicePreset type
const VOICES = {
  emma: { voiceName: 'en-US-Neural2-C', gender: 'FEMALE' },
  aria: { voiceName: 'en-US-Neural2-E', gender: 'FEMALE' },
  luna: { voiceName: 'en-US-Neural2-F', gender: 'FEMALE' },
  james: { voiceName: 'en-US-Neural2-D', gender: 'MALE' },
  ryan: { voiceName: 'en-US-Neural2-A', gender: 'MALE' },
  marcus: { voiceName: 'en-US-Neural2-J', gender: 'MALE' },
};

// Speaking rate and pitch for motivational delivery
const AUDIO_CONFIG = {
  audioEncoding: 'MP3',
  speakingRate: 0.95, // Slightly slower for clarity
  pitch: 0, // Natural pitch
  volumeGainDb: 0,
};

async function generateAudio() {
  const client = new textToSpeech.TextToSpeechClient();
  const outputBase = path.join(__dirname, '..', 'assets', 'voices');

  // Create output directories
  for (const voiceName of Object.keys(VOICES)) {
    const voiceDir = path.join(outputBase, voiceName);
    if (!fs.existsSync(voiceDir)) {
      fs.mkdirSync(voiceDir, { recursive: true });
    }
  }

  console.log(`Found ${affirmations.length} affirmations to process`);
  console.log(`Generating audio for ${Object.keys(VOICES).length} voices`);
  console.log('');

  let totalGenerated = 0;
  let totalSkipped = 0;
  let errors = [];

  for (const [voiceKey, voiceConfig] of Object.entries(VOICES)) {
    console.log(`\nProcessing voice: ${voiceKey} (${voiceConfig.voiceName})`);
    const voiceDir = path.join(outputBase, voiceKey);

    for (let i = 0; i < affirmations.length; i++) {
      const affirmation = affirmations[i];
      const outputPath = path.join(voiceDir, `${affirmation.id}.mp3`);

      // Skip if file already exists
      if (fs.existsSync(outputPath)) {
        totalSkipped++;
        continue;
      }

      try {
        const request = {
          input: { text: affirmation.text },
          voice: {
            languageCode: 'en-US',
            name: voiceConfig.voiceName,
            ssmlGender: voiceConfig.gender,
          },
          audioConfig: AUDIO_CONFIG,
        };

        const [response] = await client.synthesizeSpeech(request);
        fs.writeFileSync(outputPath, response.audioContent, 'binary');
        totalGenerated++;

        // Progress indicator
        if ((i + 1) % 50 === 0) {
          console.log(`  Processed ${i + 1}/${affirmations.length} affirmations`);
        }
      } catch (error) {
        console.error(`  Error generating ${affirmation.id}: ${error.message}`);
        errors.push({ voice: voiceKey, id: affirmation.id, error: error.message });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log('\n========================================');
  console.log('Generation Complete!');
  console.log(`  Generated: ${totalGenerated} files`);
  console.log(`  Skipped (already exist): ${totalSkipped} files`);
  console.log(`  Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  ${e.voice}/${e.id}: ${e.error}`));
  }

  console.log(`\nOutput directory: ${outputBase}`);
  console.log('\nNext steps:');
  console.log('1. Copy the voices folder to your app\'s document directory');
  console.log('2. Or bundle them with the app using expo-asset');
}

// Run the generator
generateAudio().catch(console.error);
