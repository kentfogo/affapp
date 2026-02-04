/**
 * Audio Mapping Generator
 *
 * Run this AFTER you've generated the MP3 files to create the
 * AUDIO_FILES mapping for audioService.ts
 *
 * Usage: node scripts/generate-audio-mapping.js
 */

const fs = require('fs');
const path = require('path');

// Load affirmations to get all IDs
const affirmationsPath = path.join(__dirname, '..', 'affirmationslist2.json');
const affirmationsData = JSON.parse(fs.readFileSync(affirmationsPath, 'utf8'));
const affirmationIds = affirmationsData.affirmations.map(a => a.id);

const voices = ['emma', 'aria', 'luna', 'james', 'ryan', 'marcus'];

console.log('// Copy this into audioService.ts, replacing the empty AUDIO_FILES object:\n');
console.log('const AUDIO_FILES: Record<string, Record<string, any>> = {');

for (const voice of voices) {
  const voiceDir = path.join(__dirname, '..', 'assets', 'voices', voice);

  // Check if voice directory exists
  if (!fs.existsSync(voiceDir)) {
    console.log(`  // ${voice}: No audio files found (create assets/voices/${voice}/)`);
    continue;
  }

  // Get existing MP3 files
  const files = fs.readdirSync(voiceDir).filter(f => f.endsWith('.mp3'));

  if (files.length === 0) {
    console.log(`  // ${voice}: Directory exists but no MP3 files found`);
    continue;
  }

  console.log(`  ${voice}: {`);

  for (const file of files) {
    const id = file.replace('.mp3', '');
    // Escape any special characters in the ID for use as object key
    const safeId = id.includes('-') ? `'${id}'` : id;
    console.log(`    ${safeId}: require('../assets/voices/${voice}/${file}'),`);
  }

  console.log('  },');
}

console.log('};');

console.log('\n// ----------------------------------------');
console.log('// Summary:');

let totalFiles = 0;
for (const voice of voices) {
  const voiceDir = path.join(__dirname, '..', 'assets', 'voices', voice);
  if (fs.existsSync(voiceDir)) {
    const count = fs.readdirSync(voiceDir).filter(f => f.endsWith('.mp3')).length;
    console.log(`// ${voice}: ${count} files`);
    totalFiles += count;
  } else {
    console.log(`// ${voice}: not found`);
  }
}
console.log(`// Total: ${totalFiles} audio files`);
console.log(`// Expected: ${affirmationIds.length} affirmations × ${voices.length} voices = ${affirmationIds.length * voices.length} files`);
