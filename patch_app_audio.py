with open("src/App.tsx", "r") as f:
    text = f.read()

sound_block = "      // Play sound"

new_sound_block = """      // Play sound using Web Audio API if not 'off'
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

if new_sound_block not in text:
    text = text.replace(sound_block, new_sound_block)

use_effect_deps = "}, [jobs]);"
new_use_effect_deps = """}, [jobs, config.notificationSound]);

  useEffect(() => {
    if (unacknowledgedJobs.length > 0 && config.notificationDuration && config.notificationDuration > 0) {
      const timer = setTimeout(() => {
        handleAcknowledgeAlert();
      }, config.notificationDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [unacknowledgedJobs, config.notificationDuration, handleAcknowledgeAlert]);"""

if new_use_effect_deps not in text:
    text = text.replace(use_effect_deps, new_use_effect_deps)

with open("src/App.tsx", "w") as f:
    f.write(text)
