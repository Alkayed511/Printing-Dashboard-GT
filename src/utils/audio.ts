export const playNotificationSound = (soundType: string = 'faaaaaa', customAudioUrl?: string) => {
  if (soundType === 'off') return;

  // Check for uploaded audio file (URL or localStorage base64)
  const storedCustomUrl = customAudioUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('customSoundUrl') : null);

  if (soundType === 'custom' || storedCustomUrl) {
    const targetUrl = storedCustomUrl || '/uploads/custom-sound.mp3';
    try {
      const audio = new Audio(targetUrl);
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio element play fallback:', err);
        });
      }
      return; // Do not modify or layer synthesized audio over the uploaded sound file!
    } catch (e) {
      console.warn('Custom audio play error:', e);
    }
  }

  // 1. Try SpeechSynthesis first for "Faaaaaa" (فاااااا) if selected or default
  if (soundType === 'faaaaaa' || soundType === 'fa' || soundType === 'default') {
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
  }

  // 2. Play Web Audio synthesizer tone with AudioContext state resume fix
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
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
        volume: number = 0.3
      ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + duration * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      if (soundType === 'faaaaaa' || soundType === 'fa' || soundType === 'default') {
        // High quality "FAAAAAA" vocal synth chord
        const fDuration = 1.1;

        // F breath noise
        const bufferSize = Math.floor(ctx.sampleRate * 0.1);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 3400;
        noiseFilter.Q.value = 2.0;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.25, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        whiteNoise.start(now);

        // Vocal "AAAAAA" choir chord (F3, F4, A4, C5, F5)
        playNote(174.61, now + 0.02, fDuration, 'sawtooth', 0.20); // F3
        playNote(349.23, now + 0.02, fDuration, 'sawtooth', 0.25); // F4
        playNote(440.00, now + 0.05, fDuration, 'triangle', 0.25); // A4
        playNote(523.25, now + 0.08, fDuration, 'sine', 0.25);     // C5
        playNote(698.46, now + 0.12, fDuration, 'triangle', 0.30); // F5
      } else if (soundType === 'shorts' || soundType === 'viral') {
        playNote(783.99, now, 0.14, 'sine', 0.25);
        playNote(987.77, now + 0.1, 0.14, 'sine', 0.25);
        playNote(1174.66, now + 0.2, 0.2, 'sine', 0.22);
        playNote(1567.98, now + 0.32, 0.4, 'triangle', 0.2);
      } else if (soundType === 'alt1') {
        playNote(523.25, now, 0.12, 'square', 0.1);
        playNote(659.25, now + 0.12, 0.18, 'square', 0.1);
        playNote(783.99, now + 0.25, 0.2, 'square', 0.1);
      } else if (soundType === 'alt2') {
        playNote(440, now, 0.35, 'sine', 0.15);
        playNote(554.37, now + 0.18, 0.35, 'sine', 0.15);
        playNote(659.25, now + 0.35, 0.4, 'sine', 0.12);
      }
    }
  } catch (e) {
    console.error('Audio play error:', e);
  }
};
