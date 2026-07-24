with open("server.ts", "r") as f:
    text = f.read()

old = """app.post('/api/config', (req: Request, res: Response) => {
  const { basePath, currentDate, autoRefreshInterval } = req.body;
  if (basePath !== undefined) serverConfig.basePath = basePath;
  if (currentDate !== undefined) serverConfig.currentDate = currentDate;
  if (autoRefreshInterval !== undefined) serverConfig.autoRefreshInterval = Number(autoRefreshInterval);"""

new = """app.post('/api/config', (req: Request, res: Response) => {
  const { basePath, currentDate, autoRefreshInterval, notificationSound, notificationColor, notificationDuration } = req.body;
  if (basePath !== undefined) serverConfig.basePath = basePath;
  if (currentDate !== undefined) serverConfig.currentDate = currentDate;
  if (autoRefreshInterval !== undefined) serverConfig.autoRefreshInterval = Number(autoRefreshInterval);
  if (notificationSound !== undefined) serverConfig.notificationSound = notificationSound;
  if (notificationColor !== undefined) serverConfig.notificationColor = notificationColor;
  if (notificationDuration !== undefined) serverConfig.notificationDuration = Number(notificationDuration);"""

text = text.replace(old, new)

with open("server.ts", "w") as f:
    f.write(text)
