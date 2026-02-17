export class SoundManager {
  private context: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
    }
    return this.context;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    gain: number = 0.3,
    frequencyEnd?: number
  ) {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (frequencyEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(frequencyEnd, ctx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  private playNote(frequency: number, startTime: number, duration: number, type: OscillatorType = "sine", gain: number = 0.3) {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(gain, startTime);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  cornPickup() {
    this.playTone(600, 0.1, "sine", 0.3, 900);
  }

  playerStep() {
    this.playTone(200, 0.03, "triangle", 0.1);
  }

  timerWarning() {
    this.playTone(1000, 0.05, "square", 0.15);
  }

  levelComplete() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    this.playNote(523, now, 0.1, "sine", 0.25);
    this.playNote(659, now + 0.1, 0.1, "sine", 0.25);
    this.playNote(784, now + 0.2, 0.15, "sine", 0.25);
  }

  gameOverLose() {
    this.playTone(400, 0.3, "sine", 0.25, 200);
  }

  gameOverWin() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    this.playNote(523, now, 0.15, "sine", 0.25);         // C5
    this.playNote(659, now + 0.15, 0.15, "sine", 0.25);  // E5
    this.playNote(784, now + 0.3, 0.15, "sine", 0.25);   // G5
    this.playNote(1047, now + 0.45, 0.25, "sine", 0.3);  // C6
  }
}
