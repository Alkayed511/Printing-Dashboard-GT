sed -i '359i\
  // Attempt physical file move on disk\
  const dateDir = path.join(serverConfig.basePath, serverConfig.currentDate);\
  const printerDir = path.join(dateDir, printer);\
  const doneDir = path.join(printerDir, '\''done'\'');\
\
  let fileMovedOnDisk = false;\
' server.ts
