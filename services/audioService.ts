import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Affirmation } from '../types/affirmation';

class AudioService {
  private player: AudioPlayer | null = null;
  private isPlaying = false;

  async initialize() {
    // expo-audio doesn't require explicit initialization like expo-av
    // Audio players are created on-demand
  }

  async playAffirmation(affirmation: Affirmation): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stop();

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
    return new Promise((resolve, reject) => {
      try {
        Speech.speak(text, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
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


