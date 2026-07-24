with open("src/App.tsx", "r") as f:
    text = f.read()

# Update sound playback
sound_block = """      // Play sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(console.error);"""

new_sound_block = """      // Play sound
      if (config.notificationSound !== 'off') {
        const soundSrc = config.notificationSound === 'alt1' 
          ? 'data:audio/wav;base64,UklGRqYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' // empty dummy
          : config.notificationSound === 'alt2'
          ? 'data:audio/wav;base64,UklGRqYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
          : 'data:audio/wav;base64,UklGRqYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
          
        const audio = new Audio(soundSrc);
        audio.play().catch(() => {});
      }"""

text = text.replace(sound_block, new_sound_block)

# Add duration logic
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
text = text.replace(use_effect_deps, new_use_effect_deps)

# Color logic
banner_class = """<div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between shadow-md z-50">"""
new_banner_class = """<div className={`text-white px-4 py-2 flex items-center justify-between shadow-md z-50 ${
          config.notificationColor === 'orange' ? 'bg-orange-500' :
          config.notificationColor === 'blue' ? 'bg-blue-500' :
          config.notificationColor === 'green' ? 'bg-green-500' :
          config.notificationColor === 'purple' ? 'bg-purple-500' :
          'bg-red-500'
        }`}>"""
text = text.replace(banner_class, new_banner_class)

with open("src/App.tsx", "w") as f:
    f.write(text)
