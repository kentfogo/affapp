import { Audio } from 'expo-av';
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
}> = {
  emma: {
    googleVoiceId: 'en-US-Neural2-C',
    name: 'Emma',
    description: 'Warm & encouraging',
    gender: 'female',
    fallbackPitch: 1.0,
    fallbackRate: 0.9,
  },
  aria: {
    googleVoiceId: 'en-US-Neural2-E',
    name: 'Aria',
    description: 'Friendly & energetic',
    gender: 'female',
    fallbackPitch: 1.1,
    fallbackRate: 0.95,
  },
  luna: {
    googleVoiceId: 'en-US-Neural2-F',
    name: 'Luna',
    description: 'Calm & soothing',
    gender: 'female',
    fallbackPitch: 0.9,
    fallbackRate: 0.85,
  },
  james: {
    googleVoiceId: 'en-US-Neural2-D',
    name: 'James',
    description: 'Confident & motivational',
    gender: 'male',
    fallbackPitch: 0.85,
    fallbackRate: 0.9,
  },
  ryan: {
    googleVoiceId: 'en-US-Neural2-A',
    name: 'Ryan',
    description: 'Supportive coach',
    gender: 'male',
    fallbackPitch: 0.95,
    fallbackRate: 0.9,
  },
  marcus: {
    googleVoiceId: 'en-US-Neural2-J',
    name: 'Marcus',
    description: 'Professional & athletic',
    gender: 'male',
    fallbackPitch: 0.9,
    fallbackRate: 0.95,
  },
};

// Audio file mapping - maps voice + affirmation ID to require() statement
const AUDIO_FILES: Record<string, Record<string, any>> = {
  james: {
    anxiety_2: require('../assets/voices/james/anxiety_2.mp3'),
  },
};

class AudioService {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;
  private volume = 0.8;
  private currentPreset: VoicePreset = 'emma';

  async initialize() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
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
      const { sound } = await Audio.Sound.createAsync(audioModule, {
        volume: this.volume,
        shouldPlay: true,
      });
      this.sound = sound;
      this.isPlaying = true;

      return new Promise((resolve, reject) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            this.isPlaying = false;
            sound.unloadAsync();
            this.sound = null;
            resolve();
          }
        });
      });
    } catch (error) {
      this.isPlaying = false;
      throw error;
    }
  }

  private async playAudioUri(uri: string): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { volume: this.volume, shouldPlay: true }
      );
      this.sound = sound;
      this.isPlaying = true;

      return new Promise((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            this.isPlaying = false;
            sound.unloadAsync();
            this.sound = null;
            resolve();
          }
        });
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
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      Speech.stop();
      this.isPlaying = false;
    } catch (error) {
      console.error('Error stopping audio:', error);
      this.isPlaying = false;
    }
  }

  async pause(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
      }
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
