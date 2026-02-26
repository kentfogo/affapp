import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Affirmation } from '../types/affirmation';
import { VoicePreset } from '../types/session';

// Google Cloud Neural2 voice configurations
export const VOICE_PRESETS: Record<VoicePreset, {
  googleVoiceId: string;
  name: string;
  description: string;
  gender: 'female' | 'male';
  fallbackPitch: number;
  fallbackRate: number;
  bundled: boolean; // true = included in app, false = needs download
}> = {
  emma: {
    googleVoiceId: 'en-US-Neural2-C',
    name: 'Emma',
    description: 'Warm & encouraging',
    gender: 'female',
    fallbackPitch: 1.0,
    fallbackRate: 0.9,
    bundled: true,
  },
  aria: {
    googleVoiceId: 'en-US-Neural2-E',
    name: 'Aria',
    description: 'Friendly & energetic',
    gender: 'female',
    fallbackPitch: 1.1,
    fallbackRate: 0.95,
    bundled: false,
  },
  luna: {
    googleVoiceId: 'en-US-Neural2-F',
    name: 'Luna',
    description: 'Calm & soothing',
    gender: 'female',
    fallbackPitch: 0.9,
    fallbackRate: 0.85,
    bundled: false,
  },
  james: {
    googleVoiceId: 'en-US-Neural2-D',
    name: 'James',
    description: 'Confident & motivational',
    gender: 'male',
    fallbackPitch: 0.85,
    fallbackRate: 0.9,
    bundled: true,
  },
  ryan: {
    googleVoiceId: 'en-US-Neural2-A',
    name: 'Ryan',
    description: 'Supportive coach',
    gender: 'male',
    fallbackPitch: 0.95,
    fallbackRate: 0.9,
    bundled: false,
  },
  marcus: {
    googleVoiceId: 'en-US-Neural2-J',
    name: 'Marcus',
    description: 'Professional & athletic',
    gender: 'male',
    fallbackPitch: 0.9,
    fallbackRate: 0.95,
    bundled: false,
  },
};

// Audio file mapping - maps voice + affirmation ID to require() statement
// Only Emma and James are bundled; other voices download on demand
const AUDIO_FILES: Record<string, Record<string, any>> = {
  emma: {
    anxiety_1: require('../assets/voices/emma/anxiety_1.mp3'),
    anxiety_10: require('../assets/voices/emma/anxiety_10.mp3'),
    anxiety_2: require('../assets/voices/emma/anxiety_2.mp3'),
    anxiety_3: require('../assets/voices/emma/anxiety_3.mp3'),
    anxiety_4: require('../assets/voices/emma/anxiety_4.mp3'),
    anxiety_5: require('../assets/voices/emma/anxiety_5.mp3'),
    anxiety_6: require('../assets/voices/emma/anxiety_6.mp3'),
    anxiety_7: require('../assets/voices/emma/anxiety_7.mp3'),
    anxiety_8: require('../assets/voices/emma/anxiety_8.mp3'),
    anxiety_9: require('../assets/voices/emma/anxiety_9.mp3'),
    confidence_1: require('../assets/voices/emma/confidence_1.mp3'),
    confidence_10: require('../assets/voices/emma/confidence_10.mp3'),
    confidence_2: require('../assets/voices/emma/confidence_2.mp3'),
    confidence_3: require('../assets/voices/emma/confidence_3.mp3'),
    confidence_4: require('../assets/voices/emma/confidence_4.mp3'),
    confidence_5: require('../assets/voices/emma/confidence_5.mp3'),
    confidence_6: require('../assets/voices/emma/confidence_6.mp3'),
    confidence_7: require('../assets/voices/emma/confidence_7.mp3'),
    confidence_8: require('../assets/voices/emma/confidence_8.mp3'),
    confidence_9: require('../assets/voices/emma/confidence_9.mp3'),
    focus_1: require('../assets/voices/emma/focus_1.mp3'),
    focus_10: require('../assets/voices/emma/focus_10.mp3'),
    focus_2: require('../assets/voices/emma/focus_2.mp3'),
    focus_3: require('../assets/voices/emma/focus_3.mp3'),
    focus_4: require('../assets/voices/emma/focus_4.mp3'),
    focus_5: require('../assets/voices/emma/focus_5.mp3'),
    focus_6: require('../assets/voices/emma/focus_6.mp3'),
    focus_7: require('../assets/voices/emma/focus_7.mp3'),
    focus_8: require('../assets/voices/emma/focus_8.mp3'),
    focus_9: require('../assets/voices/emma/focus_9.mp3'),
    selflove_1: require('../assets/voices/emma/selflove_1.mp3'),
    selflove_10: require('../assets/voices/emma/selflove_10.mp3'),
    selflove_2: require('../assets/voices/emma/selflove_2.mp3'),
    selflove_3: require('../assets/voices/emma/selflove_3.mp3'),
    selflove_4: require('../assets/voices/emma/selflove_4.mp3'),
    selflove_5: require('../assets/voices/emma/selflove_5.mp3'),
    selflove_6: require('../assets/voices/emma/selflove_6.mp3'),
    selflove_7: require('../assets/voices/emma/selflove_7.mp3'),
    selflove_8: require('../assets/voices/emma/selflove_8.mp3'),
    selflove_9: require('../assets/voices/emma/selflove_9.mp3'),
    wellness_1: require('../assets/voices/emma/wellness_1.mp3'),
    wellness_10: require('../assets/voices/emma/wellness_10.mp3'),
    wellness_2: require('../assets/voices/emma/wellness_2.mp3'),
    wellness_3: require('../assets/voices/emma/wellness_3.mp3'),
    wellness_4: require('../assets/voices/emma/wellness_4.mp3'),
    wellness_5: require('../assets/voices/emma/wellness_5.mp3'),
    wellness_6: require('../assets/voices/emma/wellness_6.mp3'),
    wellness_7: require('../assets/voices/emma/wellness_7.mp3'),
    wellness_8: require('../assets/voices/emma/wellness_8.mp3'),
    wellness_9: require('../assets/voices/emma/wellness_9.mp3'),
  },
  james: {
    anxiety_1: require('../assets/voices/james/anxiety_1.mp3'),
    anxiety_10: require('../assets/voices/james/anxiety_10.mp3'),
    anxiety_2: require('../assets/voices/james/anxiety_2.mp3'),
    anxiety_3: require('../assets/voices/james/anxiety_3.mp3'),
    anxiety_4: require('../assets/voices/james/anxiety_4.mp3'),
    anxiety_5: require('../assets/voices/james/anxiety_5.mp3'),
    anxiety_6: require('../assets/voices/james/anxiety_6.mp3'),
    anxiety_7: require('../assets/voices/james/anxiety_7.mp3'),
    anxiety_8: require('../assets/voices/james/anxiety_8.mp3'),
    anxiety_9: require('../assets/voices/james/anxiety_9.mp3'),
    confidence_1: require('../assets/voices/james/confidence_1.mp3'),
    confidence_10: require('../assets/voices/james/confidence_10.mp3'),
    confidence_2: require('../assets/voices/james/confidence_2.mp3'),
    confidence_3: require('../assets/voices/james/confidence_3.mp3'),
    confidence_4: require('../assets/voices/james/confidence_4.mp3'),
    confidence_5: require('../assets/voices/james/confidence_5.mp3'),
    confidence_6: require('../assets/voices/james/confidence_6.mp3'),
    confidence_7: require('../assets/voices/james/confidence_7.mp3'),
    confidence_8: require('../assets/voices/james/confidence_8.mp3'),
    confidence_9: require('../assets/voices/james/confidence_9.mp3'),
    focus_1: require('../assets/voices/james/focus_1.mp3'),
    focus_10: require('../assets/voices/james/focus_10.mp3'),
    focus_2: require('../assets/voices/james/focus_2.mp3'),
    focus_3: require('../assets/voices/james/focus_3.mp3'),
    focus_4: require('../assets/voices/james/focus_4.mp3'),
    focus_5: require('../assets/voices/james/focus_5.mp3'),
    focus_6: require('../assets/voices/james/focus_6.mp3'),
    focus_7: require('../assets/voices/james/focus_7.mp3'),
    focus_8: require('../assets/voices/james/focus_8.mp3'),
    focus_9: require('../assets/voices/james/focus_9.mp3'),
    selflove_1: require('../assets/voices/james/selflove_1.mp3'),
    selflove_10: require('../assets/voices/james/selflove_10.mp3'),
    selflove_2: require('../assets/voices/james/selflove_2.mp3'),
    selflove_3: require('../assets/voices/james/selflove_3.mp3'),
    selflove_4: require('../assets/voices/james/selflove_4.mp3'),
    selflove_5: require('../assets/voices/james/selflove_5.mp3'),
    selflove_6: require('../assets/voices/james/selflove_6.mp3'),
    selflove_7: require('../assets/voices/james/selflove_7.mp3'),
    selflove_8: require('../assets/voices/james/selflove_8.mp3'),
    selflove_9: require('../assets/voices/james/selflove_9.mp3'),
    wellness_1: require('../assets/voices/james/wellness_1.mp3'),
    wellness_10: require('../assets/voices/james/wellness_10.mp3'),
    wellness_2: require('../assets/voices/james/wellness_2.mp3'),
    wellness_3: require('../assets/voices/james/wellness_3.mp3'),
    wellness_4: require('../assets/voices/james/wellness_4.mp3'),
    wellness_5: require('../assets/voices/james/wellness_5.mp3'),
    wellness_6: require('../assets/voices/james/wellness_6.mp3'),
    wellness_7: require('../assets/voices/james/wellness_7.mp3'),
    wellness_8: require('../assets/voices/james/wellness_8.mp3'),
    wellness_9: require('../assets/voices/james/wellness_9.mp3'),
  },
};

class AudioService {
  private player: AudioPlayer | null = null;
  private isPlaying = false;
  private volume = 0.8;
  private currentPreset: VoicePreset = 'emma';

  async initialize() {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
      interruptionModeAndroid: 'duckOthers',
    });
  }

  setVolume(volumePercent: number) {
    this.volume = Math.max(0, Math.min(1, volumePercent / 100));
  }

  setVoicePreset(preset: VoicePreset) {
    this.currentPreset = preset;
  }

  getVoicePreset(): VoicePreset {
    return this.currentPreset;
  }

  async playChime(): Promise<void> {
    return new Promise((resolve) => {
      Speech.speak('...', {
        language: 'en',
        pitch: 1.5,
        rate: 2.0,
        volume: this.volume,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
      setTimeout(resolve, 300);
    });
  }

  async playAffirmation(affirmation: Affirmation, playChime = false): Promise<void> {
    try {
      await this.stop();

      if (playChime) {
        await this.playChime();
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Check if we have a pre-generated audio file for this voice + affirmation
      const voiceFiles = AUDIO_FILES[this.currentPreset];
      const audioFile = voiceFiles?.[affirmation.id];

      if (audioFile) {
        await this.playAudioFile(audioFile);
      } else if (affirmation.isCustom && affirmation.audioUri) {
        await this.playAudioUri(affirmation.audioUri);
      } else {
        // Fallback to device TTS
        await this.speakText(affirmation.text);
      }
    } catch (error) {
      console.error('Error playing affirmation:', error);
      // Fallback to TTS
      try {
        await this.speakText(affirmation.text);
      } catch (fallbackError) {
        console.error('Fallback TTS failed:', fallbackError);
        throw error;
      }
    }
  }

  private async playAudioFile(audioModule: any): Promise<void> {
    try {
      const player = createAudioPlayer(audioModule);
      player.volume = this.volume;
      this.player = player;
      player.play();
      this.isPlaying = true;

      return new Promise<void>((resolve) => {
        const poll = setInterval(() => {
          if (!this.player || this.player.currentStatus.didJustFinish) {
            clearInterval(poll);
            this.isPlaying = false;
            if (this.player) { this.player.remove(); this.player = null; }
            resolve();
          }
        }, 100);
      });
    } catch (error) {
      this.isPlaying = false;
      throw error;
    }
  }

  private async playAudioUri(uri: string): Promise<void> {
    try {
      const player = createAudioPlayer({ uri });
      player.volume = this.volume;
      this.player = player;
      player.play();
      this.isPlaying = true;

      return new Promise<void>((resolve) => {
        const poll = setInterval(() => {
          if (!this.player || this.player.currentStatus.didJustFinish) {
            clearInterval(poll);
            this.isPlaying = false;
            if (this.player) { this.player.remove(); this.player = null; }
            resolve();
          }
        }, 100);
      });
    } catch (error) {
      this.isPlaying = false;
      throw error;
    }
  }

  private async speakText(text: string): Promise<void> {
    const preset = VOICE_PRESETS[this.currentPreset];
    return new Promise((resolve, reject) => {
      try {
        Speech.speak(text, {
          language: 'en',
          pitch: preset.fallbackPitch,
          rate: preset.fallbackRate,
          volume: this.volume,
          onDone: () => {
            this.isPlaying = false;
            resolve();
          },
          onStopped: () => {
            this.isPlaying = false;
            resolve();
          },
          onError: (error) => {
            this.isPlaying = false;
            reject(error);
          },
        });
        this.isPlaying = true;
      } catch (error) {
        this.isPlaying = false;
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    try {
      if (this.player) { this.player.remove(); this.player = null; }
      Speech.stop();
      this.isPlaying = false;
    } catch (error) {
      console.error('Error stopping audio:', error);
      this.isPlaying = false;
    }
  }

  async pause(): Promise<void> {
    try {
      if (this.player) this.player.pause();
      Speech.stop();
      this.isPlaying = false;
    } catch (error) {
      console.error('Error pausing audio:', error);
      this.isPlaying = false;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  async cleanup() {
    await this.stop();
  }
}

export const audioService = new AudioService();
