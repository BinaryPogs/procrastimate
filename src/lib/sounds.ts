class SoundPlayer {
  private static instance: SoundPlayer;
  private audio: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/sounds/notification.mp3');
    }
  }

  static getInstance(): SoundPlayer {
    if (!SoundPlayer.instance) {
      SoundPlayer.instance = new SoundPlayer();
    }
    return SoundPlayer.instance;
  }

  playNotification() {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(err => console.log('Audio playback failed:', err));
    }
  }
}

export const soundPlayer = SoundPlayer.getInstance(); 