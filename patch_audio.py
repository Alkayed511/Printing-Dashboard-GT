import re

with open("src/App.tsx", "r") as f:
    text = f.read()

old_audio = """      // Play sound using Web Audio API if not 'off'
      if (config.notificationSound !== 'off') {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (config.notificationSound === 'alt1') {
              osc.type = 'square';
              osc.frequency.setValueAtTime(600, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.1);
            } else if (config.notificationSound === 'alt2') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(400, ctx.currentTime);
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.3);
            } else {
              // Default
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.2);
            }
          }
        } catch (e) {
          console.error('Audio play error:', e);
        }
      }"""

new_audio = """      // Play sound using HTML5 Audio if not 'off'
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

text = text.replace(old_audio, new_audio)

with open("src/App.tsx", "w") as f:
    f.write(text)
