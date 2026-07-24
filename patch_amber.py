import os
import glob

# Replace amber -> secondary in KanbanBoard.tsx and JobCard.tsx
for file in ["src/components/KanbanBoard.tsx", "src/components/JobCard.tsx"]:
    with open(file, 'r') as f:
        content = f.read()
    
    content = content.replace("-amber-", "-secondary-")
    content = content.replace("amber-500", "secondary-500")
    content = content.replace("text-amber", "text-secondary")
    content = content.replace("bg-amber", "bg-secondary")
    content = content.replace("border-amber", "border-secondary")
    content = content.replace("ring-amber", "ring-secondary")
    
    with open(file, 'w') as f:
        f.write(content)
