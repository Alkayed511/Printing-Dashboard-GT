import os
import glob

# Replace orange -> primary, blue -> secondary in TSX files
for file in glob.glob("src/**/*.tsx", recursive=True):
    with open(file, 'r') as f:
        content = f.read()
    
    # We only want to replace tailwind color classes.
    # We can just replace "-orange-" with "-primary-" and "-blue-" with "-secondary-"
    content = content.replace("-orange-", "-primary-")
    content = content.replace("orange-500", "primary-500")
    content = content.replace("text-orange", "text-primary")
    content = content.replace("bg-orange", "bg-primary")
    content = content.replace("border-orange", "border-primary")
    content = content.replace("ring-orange", "ring-primary")
    content = content.replace("selection:bg-orange", "selection:bg-primary")
    content = content.replace("selection:text-orange", "selection:text-primary")
    
    content = content.replace("-blue-", "-secondary-")
    content = content.replace("blue-500", "secondary-500")
    content = content.replace("text-blue", "text-secondary")
    content = content.replace("bg-blue", "bg-secondary")
    content = content.replace("border-blue", "border-secondary")
    content = content.replace("ring-blue", "ring-secondary")
    
    with open(file, 'w') as f:
        f.write(content)
