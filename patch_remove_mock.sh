sed -i '401,418c\
  if (serverConfig.isRealStorageAvailable) {\
    filtered = getJobsForReport(serverConfig.basePath, type as string, startDate as string, endDate as string);\
  }\
' server.ts
sed -i '498,515c\
  if (serverConfig.isRealStorageAvailable) {\
    filtered = getJobsForReport(serverConfig.basePath, type as string, startDate as string, endDate as string);\
  }\
' server.ts
