with open("src/components/SettingsTab.tsx", "r") as f:
    text = f.read()

text = text.replace("import { HardDrive, RefreshCw, Calendar, CheckCircle2, Network, HelpCircle, Save, Settings } from 'lucide-react';", "import { HardDrive, RefreshCw, Calendar, CheckCircle2, Network, HelpCircle, Save, Settings, Bell, Palette, Clock } from 'lucide-react';")

text = text.replace(
    "const [autoRefreshInterval, setAutoRefreshInterval] = useState(config.autoRefreshInterval);",
    """const [autoRefreshInterval, setAutoRefreshInterval] = useState(config.autoRefreshInterval);
  const [notificationSound, setNotificationSound] = useState(config.notificationSound || 'default');
  const [notificationColor, setNotificationColor] = useState(config.notificationColor || 'red');
  const [notificationDuration, setNotificationDuration] = useState(config.notificationDuration || 0);"""
)

text = text.replace(
    "setAutoRefreshInterval(config.autoRefreshInterval);",
    """setAutoRefreshInterval(config.autoRefreshInterval);
    setNotificationSound(config.notificationSound || 'default');
    setNotificationColor(config.notificationColor || 'red');
    setNotificationDuration(config.notificationDuration || 0);"""
)

text = text.replace(
    "autoRefreshInterval,\n    });",
    """autoRefreshInterval,
      notificationSound,
      notificationColor,
      notificationDuration,
    });"""
)

new_ui = """
          <hr className="border-zinc-800" />

          {/* Notifications Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              إعدادات التنبيهات
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sound */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-zinc-400" />
                  صوت التنبيه
                </label>
                <select
                  value={notificationSound}
                  onChange={(e) => setNotificationSound(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="default">الافتراضي (جرس)</option>
                  <option value="alt1">نغمة سريعة</option>
                  <option value="alt2">نغمة هادئة</option>
                  <option value="off">إيقاف الصوت</option>
                </select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  لون شريط التنبيه
                </label>
                <select
                  value={notificationColor}
                  onChange={(e) => setNotificationColor(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="red">أحمر (افتراضي)</option>
                  <option value="orange">برتقالي</option>
                  <option value="blue">أزرق</option>
                  <option value="green">أخضر</option>
                  <option value="purple">بنفسجي</option>
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  مدة بقاء التنبيه
                </label>
                <select
                  value={notificationDuration}
                  onChange={(e) => setNotificationDuration(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>إبقاء حتى التأكيد (يدوي)</option>
                  <option value={5}>يختفي بعد 5 ثوانٍ</option>
                  <option value={10}>يختفي بعد 10 ثوانٍ</option>
                  <option value={30}>يختفي بعد 30 ثانية</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-zinc-800" />
"""

text = text.replace("          {/* Directory Structure Preview */}", new_ui + "\n          {/* Directory Structure Preview */}")

with open("src/components/SettingsTab.tsx", "w") as f:
    f.write(text)
