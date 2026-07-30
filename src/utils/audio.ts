export const playNotificationSound = (soundType: string = 'default', customAudioUrl?: string) => {
  if (soundType === 'off') return;

  // Try custom Audio URL first if provided
  if (customAudioUrl) {
    try {
      const customAudio = new Audio(customAudioUrl);
      customAudio.play().catch(() => {});
    } catch (e) {
      console.warn('Custom audio play failed:', e);
    }
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const playNote = (
        frequency: number, 
        startTime: number, 
        duration: number, 
        type: OscillatorType = 'sine', 
        volume: number = 0.25
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
        // 1. Vocal Voice Synthesis saying "فاااااا" (Faaaaaa)
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel(); // clear previous queue
            const utter = new SpeechSynthesisUtterance("فاااااا");
            utter.rate = 1.0;
            utter.pitch = 1.2;
            utter.volume = 1.0;
            utter.lang = 'ar-SA';
            window.speechSynthesis.speak(utter);
          } catch (err) {
            console.error('Speech synthesis error:', err);
          }
        }

        // 2. Brass / Choir Harmonic Chord for "FAAAAAA" (F3, F4, A4, C5, F5)
        const fDuration = 0.9;
        
        // Initial breath noise attack
        const bufferSize = Math.floor(ctx.sampleRate * 0.08);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 3200;
        noiseFilter.Q.value = 1.5;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        whiteNoise.start(now);

        // Vocal Choir synth layers
        playNote(174.61, now + 0.02, fDuration, 'sawtooth', 0.15); // F3
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
        // Default Bell
        playNote(523.25, now, 0.2, 'sine', 0.2); // C5
        playNote(783.99, now + 0.15, 0.4, 'sine', 0.2); // G5
      }
    }
  } catch (e) {
    console.error('Audio play error:', e);
  }
};
