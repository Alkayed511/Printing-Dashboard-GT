with open("server.ts", "r") as f:
    text = f.read()

old_post = """  const { basePath, currentDate, autoRefreshInterval, notificationSound, notificationColor, notificationDuration } = req.body;
  if (basePath !== undefined) serverConfig.basePath = basePath;
  if (currentDate !== undefined) serverConfig.currentDate = currentDate;
  if (autoRefreshInterval !== undefined) serverConfig.autoRefreshInterval = Number(autoRefreshInterval);
  if (notificationSound !== undefined) serverConfig.notificationSound = notificationSound;
  if (notificationColor !== undefined) serverConfig.notificationColor = notificationColor;
  if (notificationDuration !== undefined) serverConfig.notificationDuration = Number(notificationDuration);"""

new_post = """  const { basePath, currentDate, autoRefreshInterval, notificationSound, notificationColor, notificationDuration, disableMouseInDisplayMode, themeColor } = req.body;
  if (basePath !== undefined) serverConfig.basePath = basePath;
  if (currentDate !== undefined) serverConfig.currentDate = currentDate;
  if (autoRefreshInterval !== undefined) serverConfig.autoRefreshInterval = Number(autoRefreshInterval);
  if (notificationSound !== undefined) serverConfig.notificationSound = notificationSound;
  if (notificationColor !== undefined) serverConfig.notificationColor = notificationColor;
  if (notificationDuration !== undefined) serverConfig.notificationDuration = Number(notificationDuration);
  if (disableMouseInDisplayMode !== undefined) serverConfig.disableMouseInDisplayMode = Boolean(disableMouseInDisplayMode);
  if (themeColor !== undefined) serverConfig.themeColor = themeColor;"""

text = text.replace(old_post, new_post)
with open("server.ts", "w") as f:
    f.write(text)
