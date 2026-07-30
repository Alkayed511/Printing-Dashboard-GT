export const playNotificationSound = (soundType: string = 'default', customAudioUrl?: string) => {
  if (soundType === 'off') return;

  // Custom uploaded sound file
  if (soundType === 'custom') {
    const storedCustomUrl = customAudioUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('customSoundUrl') : null) || '/uploads/custom-sound.mp3';
    try {
      const audio = new Audio(storedCustomUrl);
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Custom audio play error:', err);
        });
      }
      return;
    } catch (e) {
      console.warn('Custom audio error:', e);
    }
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

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

    if (soundType === 'faaaaaa' || soundType === 'fa') {
      // "Faaaaaa" Sound Effect option
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance("فاااااا");
          utter.rate = 0.95;
          utter.pitch = 1.1;
          utter.volume = 1.0;
          utter.lang = 'ar-SA';
          window.speechSynthesis.speak(utter);
        } catch (e) {
          console.warn('SpeechSynthesis error:', e);
        }
      }

      const fDuration = 0.9;
      playNote(349.23, now + 0.02, fDuration, 'sawtooth', 0.20); // F4
      playNote(440.00, now + 0.05, fDuration, 'triangle', 0.20); // A4
      playNote(523.25, now + 0.08, fDuration, 'sine', 0.22);     // C5
      playNote(698.46, now + 0.12, fDuration, 'triangle', 0.25); // F5
    } else if (soundType === 'shorts' || soundType === 'viral') {
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
      // Default Bell (Original Chime)
      playNote(523.25, now, 0.2, 'sine', 0.2); // C5
      playNote(783.99, now + 0.15, 0.4, 'sine', 0.2); // G5
    }
  } catch (e) {
    console.error('Audio play error:', e);
  }
};
