with open("src/components/SettingsTab.tsx", "r") as f:
    text = f.read()

old_ip_ui = """          {/* Directory Structure Preview */}"""

new_ip_ui = """          {/* Network Display Link */}
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" />
              رابط شاشة العرض للأجهزة الأخرى (مثل الماك القديم):
            </h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-emerald-400 font-mono text-sm dir-ltr text-center">
                http://{config.localIp || 'localhost'}:3000/?display=true
              </code>
            </div>
            <p className="text-xs text-zinc-500">اكتب هذا الرابط في متصفح أي جهاز آخر متصل بنفس الشبكة (واي فاي أو سلك) لفتح شاشة العرض.</p>
          </div>
          
          <hr className="border-zinc-800" />

          {/* Directory Structure Preview */}"""

text = text.replace(old_ip_ui, new_ip_ui)

with open("src/components/SettingsTab.tsx", "w") as f:
    f.write(text)
