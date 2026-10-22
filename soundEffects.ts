// Web Audio API Synthesizer for Grip Alarm Sounds
class SoundService {
  private ctx: AudioContext | null = null;
  private alarmOscillators: OscillatorNode[] = [];
  private alarmGain: GainNode | null = null;
  private isAlarmPlaying = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play crisp one-shot wake-up alarm sound (urgent yet energetic arpeggio chime)
  startWakeUpAlarm() {
    if (this.isAlarmPlaying) return;
    try {
      const ctx = this.getContext();
      this.isAlarmPlaying = true;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.alarmGain = masterGain;

      const playPattern = () => {
        if (!this.isAlarmPlaying) return;
        const now = ctx.currentTime;
        // 4 ascending tones that grab attention without being shrill
        const freqs = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);

          noteGain.gain.setValueAtTime(0.3, now + idx * 0.14);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.3);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.35);
        });
      };

      playPattern();
      const interval = setInterval(() => {
        if (!this.isAlarmPlaying) {
          clearInterval(interval);
          return;
        }
        playPattern();
      }, 1400);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  stopWakeUpAlarm() {
    this.isAlarmPlaying = false;
    if (this.alarmGain) {
      try {
        this.alarmGain.disconnect();
      } catch (_) {}
      this.alarmGain = null;
    }
  }

  // Quick success chime on waking up
  playWakeUpSuccess() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.4); // C6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch (_) {}
  }
}

export const soundEffects = new SoundService();
