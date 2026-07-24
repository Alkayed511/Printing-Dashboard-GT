with open("src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
settings_count = 0

for line in lines:
    if "{activeTab === 'settings' && (" in line:
        settings_count += 1
        if settings_count > 1:
            skip = True
    
    if skip:
        if ")}" in line:
            skip = False
        continue

    new_lines.append(line)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
