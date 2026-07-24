sed -i '441,455c\
  let filtered: PrintJob[] = [];\
  if (serverConfig.isRealStorageAvailable) {\
    filtered = getJobsForReport(serverConfig.basePath, type as string, startDate as string, endDate as string);\
  } else {\
    filtered = [...mockJobs].map(j => ({ ...j, ...(jobOverrides[j.id] || {}) }));\
    if (type === '\''daily'\'' && startDate) {\
       filtered = filtered.filter(j => j.createdAt.startsWith(startDate as string));\
    } else if (type === '\''monthly'\'' && startDate) {\
       const month = (startDate as string).substring(0, 7);\
       filtered = filtered.filter(j => j.createdAt.startsWith(month));\
    } else if (type === '\''custom'\'' && startDate && endDate) {\
       const start = new Date(startDate as string).getTime();\
       const end = new Date(endDate as string).getTime() + 86400000;\
       filtered = filtered.filter(j => {\
         const t = new Date(j.createdAt).getTime();\
         return t >= start && t <= end;\
       });\
    }\
  }\
' server.ts
