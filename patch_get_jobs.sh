sed -i '191,222c\
function parseFolderNameDate(name: string): number | null {\
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(name)) return new Date(name).getTime();\
  const dmMatch = name.match(/^(\\d{1,2})-(\\d{1,2})$/);\
  if (dmMatch) {\
    const d = parseInt(dmMatch[1]);\
    const m = parseInt(dmMatch[2]) - 1;\
    return new Date(new Date().getFullYear(), m, d).getTime();\
  }\
  const dmyMatch = name.match(/^(\\d{1,2})-(\\d{1,2})-(\\d{4})$/);\
  if (dmyMatch) {\
    const d = parseInt(dmyMatch[1]);\
    const m = parseInt(dmyMatch[2]) - 1;\
    const y = parseInt(dmyMatch[3]);\
    return new Date(y, m, d).getTime();\
  }\
  return null;\
}\
\
function getJobsForReport(basePath: string, type: string, startDate?: string, endDate?: string): PrintJob[] {\
  let allJobs: PrintJob[] = [];\
  if (!fs.existsSync(basePath)) return [];\
\
  const entries = fs.readdirSync(basePath, { withFileTypes: true });\
  \
  if (type === '\''daily'\'' && startDate) {\
    const targetTime = new Date(startDate).getTime();\
    entries.forEach(entry => {\
      if (entry.isDirectory()) {\
        const entryTime = parseFolderNameDate(entry.name);\
        if (entryTime && Math.abs(entryTime - targetTime) < 86400000 / 2) {\
          allJobs.push(...scanDateDirectory(path.join(basePath, entry.name)));\
        }\
      }\
    });\
  } else if (type === '\''monthly'\'' && startDate) {\
    const targetY = parseInt(startDate.substring(0, 4));\
    const targetM = parseInt(startDate.substring(5, 7)) - 1;\
    entries.forEach(entry => {\
      if (entry.isDirectory()) {\
        const entryTime = parseFolderNameDate(entry.name);\
        if (entryTime) {\
           const d = new Date(entryTime);\
           if (d.getFullYear() === targetY && d.getMonth() === targetM) {\
             allJobs.push(...scanDateDirectory(path.join(basePath, entry.name)));\
           }\
        }\
      }\
    });\
  } else if (type === '\''custom'\'' && startDate && endDate) {\
    const start = new Date(startDate).getTime();\
    const end = new Date(endDate).getTime() + 86400000;\
    entries.forEach(entry => {\
      if (entry.isDirectory()) {\
        const t = parseFolderNameDate(entry.name);\
        if (t !== null && t >= start && t <= end) {\
          allJobs.push(...scanDateDirectory(path.join(basePath, entry.name)));\
        }\
      }\
    });\
  }\
  return allJobs.map(j => ({ ...j, ...(jobOverrides[j.id] || {}) }));\
}\
' server.ts
