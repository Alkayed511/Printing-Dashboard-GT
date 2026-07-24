with open("src/types.ts", "r") as f:
    text = f.read()

text = text.replace("themeColor?: string;", "themeColor?: string;\n  secondaryColor?: string;")
with open("src/types.ts", "w") as f:
    f.write(text)
