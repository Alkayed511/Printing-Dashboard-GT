import re

with open("src/App.tsx", "r") as f:
    text = f.read()

old_audio = """      // Play sound using HTML5 Audio if not 'off'
      if (config.notificationSound !== 'off') {
        try {
          const audio = new Audio();
          if (config.notificationSound === 'alt1') {
            audio.src = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
          } else if (config.notificationSound === 'alt2') {
            audio.src = 'https://actions.google.com/sounds/v1/water/water_drop.ogg';
          } else {
            audio.src = 'https://actions.google.com/sounds/v1/alarms/positive_notification.ogg';
          }
          audio.play().catch(e => console.error('Audio play error:', e));
        } catch (e) {
          console.error('Audio play error:', e);
        }
      }"""

new_audio = """      // Play sound using Web Audio API if not 'off'
      if (config.notificationSound !== 'off') {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            
            const playNote = (frequency: number, startTime: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2) => {
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
            if (config.notificationSound === 'alt1') {
              // Quick alert
              playNote(523.25, now, 0.15, 'square', 0.1); // C5
              playNote(659.25, now + 0.15, 0.2, 'square', 0.1); // E5
            } else if (config.notificationSound === 'alt2') {
              // Gentle chime
              playNote(440, now, 0.4, 'sine', 0.15); // A4
              playNote(554.37, now + 0.2, 0.4, 'sine', 0.15); // C#5
            } else {
              // Default (Positive Ding)
              playNote(523.25, now, 0.2, 'sine', 0.2); // C5
              playNote(783.99, now + 0.15, 0.4, 'sine', 0.2); // G5
            }
          }
        } catch (e) {
          console.error('Audio play error:', e);
        }
      }"""

text = text.replace(old_audio, new_audio)

with open("src/App.tsx", "w") as f:
    f.write(text)
