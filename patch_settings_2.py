import re
with open("src/components/SettingsTab.tsx", "r") as f:
    text = f.read()

old_states = """  const [themeColor, setThemeColor] = useState(config.themeColor || 'orange');"""
new_states = """  const [themeColor, setThemeColor] = useState(config.themeColor || 'orange');
  const [secondaryColor, setSecondaryColor] = useState(config.secondaryColor || 'blue');"""
text = text.replace(old_states, new_states)

old_effect = """    setThemeColor(config.themeColor || 'orange');"""
new_effect = """    setThemeColor(config.themeColor || 'orange');
    setSecondaryColor(config.secondaryColor || 'blue');"""
text = text.replace(old_effect, new_effect)

old_submit = """      themeColor,"""
new_submit = """      themeColor,
      secondaryColor,"""
text = text.replace(old_submit, new_submit)

old_ui = """                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
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
              </div>"""

new_ui = """                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-zinc-400" />
                    ألوان الواجهة
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-zinc-400 px-1">اللون الرئيسي</span>
                      <select
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="orange">برتقالي</option>
                        <option value="blue">أزرق</option>
                        <option value="green">أخضر</option>
                        <option value="purple">بنفسجي</option>
                        <option value="rose">وردي</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-zinc-400 px-1">اللون الثانوي</span>
                      <select
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="blue">أزرق</option>
                        <option value="orange">برتقالي</option>
                        <option value="green">أخضر</option>
                        <option value="purple">بنفسجي</option>
                        <option value="rose">وردي</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>"""

text = text.replace(old_ui, new_ui)
with open("src/components/SettingsTab.tsx", "w") as f:
    f.write(text)
