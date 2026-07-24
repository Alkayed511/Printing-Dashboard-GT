with open("server.ts", "r") as f:
    text = f.read()
text = text.replace("activePath: 'C:\\\\Users\\\\gt511\\\\OneDrive\\\\Desktop\\\\share\\\\' + `${new Date().getDate()}-${new Date().getMonth() + 1}`\n  notificationSound: 'default',", "activePath: 'C:\\\\Users\\\\gt511\\\\OneDrive\\\\Desktop\\\\share\\\\' + `${new Date().getDate()}-${new Date().getMonth() + 1}`,\n  notificationSound: 'default',")
with open("server.ts", "w") as f:
    f.write(text)
