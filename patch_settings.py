import re

with open("src/components/SettingsTab.tsx", "r") as f:
    text = f.read()

# Add states
old_states = """  const [notificationSound, setNotificationSound] = useState(config.notificationSound || 'default');
  const [notificationColor, setNotificationColor] = useState(config.notificationColor || 'red');
  const [notificationDuration, setNotificationDuration] = useState(config.notificationDuration || 0);"""

new_states = """  const [notificationSound, setNotificationSound] = useState(config.notificationSound || 'default');
  const [notificationColor, setNotificationColor] = useState(config.notificationColor || 'red');
  const [notificationDuration, setNotificationDuration] = useState(config.notificationDuration || 0);
  const [disableMouseInDisplayMode, setDisableMouseInDisplayMode] = useState(config.disableMouseInDisplayMode || false);
  const [themeColor, setThemeColor] = useState(config.themeColor || 'orange');"""

text = text.replace(old_states, new_states)

old_effect = """    setNotificationSound(config.notificationSound || 'default');
    setNotificationColor(config.notificationColor || 'red');
    setNotificationDuration(config.notificationDuration || 0);
  }, [config]);"""

new_effect = """    setNotificationSound(config.notificationSound || 'default');
    setNotificationColor(config.notificationColor || 'red');
    setNotificationDuration(config.notificationDuration || 0);
    setDisableMouseInDisplayMode(config.disableMouseInDisplayMode || false);
    setThemeColor(config.themeColor || 'orange');
  }, [config]);"""

text = text.replace(old_effect, new_effect)

old_submit = """      notificationSound,
      notificationColor,
      notificationDuration,
    });"""

new_submit = """      notificationSound,
      notificationColor,
      notificationDuration,
      disableMouseInDisplayMode,
      themeColor,
    });"""

text = text.replace(old_submit, new_submit)

# Add UI for theme and mouse
old_ui = """          <div className="pt-6 flex items-center justify-end border-t border-zinc-800">"""

new_ui = """          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              إعدادات شاشة العرض والمظهر
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  لون الواجهة الرئيسي (الثيم)
                </label>
                <select
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="orange">برتقالي (الافتراضي)</option>
                  <option value="blue">أزرق</option>
                  <option value="green">أخضر</option>
                  <option value="purple">بنفسجي</option>
                </select>
              </div>

              <div className="space-y-2 flex flex-col justify-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disableMouseInDisplayMode}
                    onChange={(e) => setDisableMouseInDisplayMode(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-700 text-blue-500 focus:ring-blue-500 bg-zinc-900"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-200">تعطيل الماوس في شاشة العرض</span>
                    <span className="text-xs text-zinc-400">منع التفاعل مع البطاقات عند فتح وضع شاشة العرض</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <hr className="border-zinc-800" />
""" + old_ui

text = text.replace(old_ui, new_ui)

with open("src/components/SettingsTab.tsx", "w") as f:
    f.write(text)
