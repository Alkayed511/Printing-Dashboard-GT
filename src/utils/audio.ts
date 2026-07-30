export const playNotificationSound = (soundType: string = 'default') => {
  if (soundType === 'off') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    const playNote = (
      frequency: number, 
      startTime: number, 
      duration: number, 
      type: OscillatorType = 'sine', 
      volume: number = 0.2
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + duration * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    if (soundType === 'shorts' || soundType === 'viral') {
      // YouTube Shorts / Viral iPhone Chime arpeggio (G5 -> B5 -> D6 -> G6)
      playNote(783.99, now, 0.14, 'sine', 0.25);        // G5
      playNote(987.77, now + 0.1, 0.14, 'sine', 0.25);   // B5
      playNote(1174.66, now + 0.2, 0.2, 'sine', 0.22);  // D6
      playNote(1567.98, now + 0.32, 0.4, 'triangle', 0.2); // G6 Sparkle
    } else if (soundType === 'alt1') {
      // Fast alert
      playNote(523.25, now, 0.12, 'square', 0.1); // C5
      playNote(659.25, now + 0.12, 0.18, 'square', 0.1); // E5
      playNote(783.99, now + 0.25, 0.2, 'square', 0.1); // G5
    } else if (soundType === 'alt2') {
      // Gentle chime
      playNote(440, now, 0.35, 'sine', 0.15); // A4
      playNote(554.37, now + 0.18, 0.35, 'sine', 0.15); // C#5
      playNote(659.25, now + 0.35, 0.4, 'sine', 0.12); // E5
    } else {
      // Default Bell
      playNote(523.25, now, 0.2, 'sine', 0.2); // C5
      playNote(783.99, now + 0.15, 0.4, 'sine', 0.2); // G5
    }
  } catch (e) {
    console.error('Audio play error:', e);
  }
};
