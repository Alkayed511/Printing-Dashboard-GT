with open("server.ts", "r") as f:
    text = f.read()

old_theme = "if (themeColor !== undefined) serverConfig.themeColor = themeColor;"
new_theme = "if (themeColor !== undefined) serverConfig.themeColor = themeColor;\n  if (req.body.secondaryColor !== undefined) serverConfig.secondaryColor = req.body.secondaryColor;"

text = text.replace(old_theme, new_theme)
with open("server.ts", "w") as f:
    f.write(text)
