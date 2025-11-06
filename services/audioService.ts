import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Affirmation } from '../types/affirmation';

class AudioService {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
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
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      this.sound = sound;
      this.isPlaying = true;

      await sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.isPlaying = false;
        }
      });
    } catch (error) {
      console.error('Error playing audio file:', error);
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
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      Speech.stop();
      this.isPlaying = false;
    } catch (error) {
      console.error('Error stopping audio:', error);
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

