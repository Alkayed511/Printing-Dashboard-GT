with open("src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "import { NetworkConfigModal }" in line:
        new_lines.append("import { SettingsTab } from './components/SettingsTab';\n")
        continue
    
    if "<NetworkConfigModal" in line:
        skip = True
        continue
    if skip and "/>" in line:
        skip = False
        continue
    if skip:
        continue

    if "{activeTab === 'stats' && (" in line:
        new_lines.append("        {activeTab === 'settings' && (\n")
        new_lines.append("          <div className=\"flex-1 overflow-y-auto scrollbar-thin\">\n")
        new_lines.append("            <SettingsTab config={config} onSaveConfig={handleSaveConfig} />\n")
        new_lines.append("          </div>\n")
        new_lines.append("        )}\n")

    new_lines.append(line)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
