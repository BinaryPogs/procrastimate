'use client'

class SoundPlayer {
  private static instance: SoundPlayer;
  private audio: HTMLAudioElement | null = null;
  private initialized = false;

  private constructor() {
    // Don't initialize in constructor
  }

  static getInstance(): SoundPlayer {
    if (!SoundPlayer.instance) {
      SoundPlayer.instance = new SoundPlayer();
    }
    return SoundPlayer.instance;
  }

  private initialize() {
    if (typeof window !== 'undefined' && !this.initialized) {
      this.audio = new Audio('/sounds/notification.mp3');
      this.initialized = true;
    }
  }

  playNotification() {
    try {
      this.initialize();
      if (this.audio) {
        this.audio.currentTime = 0;
        this.audio.play().catch(err => {
          console.log('Audio playback failed:', err);
        });
      }
    } catch (error) {
      console.error('Sound playback error:', error);
    }
  }
}

export const soundPlayer = SoundPlayer.getInstance(); 