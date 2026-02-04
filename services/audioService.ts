import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Affirmation } from '../types/affirmation';
import { VoicePreset } from '../types/session';

export const VOICE_PRESETS: Record<VoicePreset, { pitch: number; rate: number; description: string }> = {
  calm: { pitch: 0.85, rate: 0.55, description: 'Slower, lower pitch' },
  natural: { pitch: 1.0, rate: 0.7, description: 'Standard speaking' },
  warm: { pitch: 0.75, rate: 0.5, description: 'Deep, slow, soothing' },
  gentle: { pitch: 0.9, rate: 0.45, description: 'Very slow, soft' },
  energetic: { pitch: 1.1, rate: 0.8, description: 'Slightly upbeat' },
};

class AudioService {
  private player: AudioPlayer | null = null;
  private chimePlayer: AudioPlayer | null = null;
  private isPlaying = false;
  private volume = 0.8; // 0-1
  private currentPreset: VoicePreset = 'calm';

  async initialize() {
    // expo-audio doesn't require explicit initialization like expo-av
    // Audio players are created on-demand
  }

  setVolume(volumePercent: number) {
    // Convert 0-100 to 0-1
    this.volume = Math.max(0, Math.min(1, volumePercent / 100));
  }

  setVoicePreset(preset: VoicePreset) {
    this.currentPreset = preset;
  }

  getVoicePreset(): VoicePreset {
    return this.currentPreset;
  }

  async playChime(): Promise<void> {
    // Play a simple chime/notification sound before affirmation
    // Using Speech to say a brief tone indicator since we don't have a chime asset
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
      // Short delay for the chime
      setTimeout(resolve, 300);
    });
  }

  async playAffirmation(affirmation: Affirmation, playChime = false): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stop();

      // Play chime first if enabled
      if (playChime) {
        await this.playChime();
        // Brief pause after chime
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (affirmation.isCustom && affirmation.audioUri) {
        // Play recorded audio
        await this.playAudioFile(affirmation.audioUri);
      } else {
        // Use TTS
        await this.speakText(affirmation.text);
      }
    } catch (error) {
      console.error('Error playing affirmation:', error);
      throw error;
    }
  }

  private async playAudioFile(uri: string): Promise<void> {
    try {
      // Create a new audio player for the file
      this.player = createAudioPlayer(uri);
      this.isPlaying = true;

      // Set up playback completion listener
      this.player.addListener('playbackStatusUpdate', () => {
        if (this.player && !this.player.playing && this.player.isLoaded) {
          this.isPlaying = false;
        }
      });

      // Start playback
      this.player.play();
      
      // Wait for playback to finish
      await new Promise<void>((resolve) => {
        const checkStatus = () => {
          if (!this.player || !this.player.playing) {
            this.isPlaying = false;
            resolve();
          } else {
            setTimeout(checkStatus, 100);
          }
        };
        checkStatus();
      });
    } catch (error) {
      console.error('Error playing audio file:', error);
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
          pitch: preset.pitch,
          rate: preset.rate,
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
      if (this.player) {
        this.player.pause();
        this.player.remove();
        this.player = null;
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
      if (this.player) {
        this.player.pause();
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


