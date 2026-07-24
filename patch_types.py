with open("src/types.ts", "r") as f:
    text = f.read()

text = text.replace("activePath: string;\n}", "activePath: string;\n  notificationSound?: string;\n  notificationColor?: string;\n  notificationDuration?: number;\n}")

with open("src/types.ts", "w") as f:
    f.write(text)
