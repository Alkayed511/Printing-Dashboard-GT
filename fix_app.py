with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

target = """        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <SettingsTab config={config} onSaveConfig={handleSaveConfig} />
          </div>
        )}
"""

text = text.replace(target + target, target)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)
