sed -i '278,283c\
  if (isReal) {\
    const dateDir = path.join(serverConfig.basePath, selectedDate);\
    const realJobs = scanDateDirectory(dateDir);\
    const jobsWithOverrides = realJobs.map(j => ({ ...j, ...(jobOverrides[j.id] || {}) }));\
    res.json({ jobs: jobsWithOverrides, isRealStorage: true, scannedPath: dateDir });\
' server.ts
