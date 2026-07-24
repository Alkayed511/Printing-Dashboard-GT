sed -i '136i\
function scanDateDirectory(dateDir: string): PrintJob[] {\
    const realJobs: PrintJob[] = [];\
    DEFAULT_PRINTERS.forEach((printer) => {\
      const printerDir = path.join(dateDir, printer);\
      const doneDir = path.join(printerDir, '\''done'\'');\
\
      if (fs.existsSync(printerDir)) {\
        const entries = fs.readdirSync(printerDir, { withFileTypes: true });\
        entries.forEach((entry) => {\
          if (entry.isFile() && !entry.name.startsWith('\'.'\'') && !entry.name.toLowerCase().includes('\''thumb'\'') && !entry.name.toLowerCase().includes('\''desktop.ini'\'')) {\
            const filePath = path.join(printerDir, entry.name);\
            const stats = fs.statSync(filePath);\
            realJobs.push({\
              id: `real-${printer}-${entry.name}`,\
              filename: entry.name,\
              printer: printer as PrinterType,\
              status: '\''pending'\'',\
              sizeBytes: stats.size,\
              createdAt: stats.birthtime.toISOString(),\
              updatedAt: stats.mtime.toISOString(),\
              dimensions: parseDimensions(entry.name),\
              material: parseMaterial(entry.name),\
              quantity: parseQuantity(entry.name),\
              customerName: parseCustomer(entry.name)\
            });\
          }\
        });\
      }\
\
      if (fs.existsSync(doneDir)) {\
        const entries = fs.readdirSync(doneDir, { withFileTypes: true });\
        entries.forEach((entry) => {\
          if (entry.isFile() && !entry.name.startsWith('\'.'\'') && !entry.name.toLowerCase().includes('\''thumb'\'') && !entry.name.toLowerCase().includes('\''desktop.ini'\'')) {\
            const filePath = path.join(doneDir, entry.name);\
            const stats = fs.statSync(filePath);\
            realJobs.push({\
              id: `real-${printer}-done-${entry.name}`,\
              filename: entry.name,\
              printer: printer as PrinterType,\
              status: '\''done'\'',\
              sizeBytes: stats.size,\
              createdAt: stats.birthtime.toISOString(),\
              updatedAt: stats.mtime.toISOString(),\
              dimensions: parseDimensions(entry.name),\
              material: parseMaterial(entry.name),\
              quantity: parseQuantity(entry.name),\
              customerName: parseCustomer(entry.name)\
            });\
          }\
        });\
      }\
    });\
    return realJobs;\
}\
\
function getJobsForReport(basePath: string, type: string, startDate?: string, endDate?: string): PrintJob[] {\
  let allJobs: PrintJob[] = [];\
  if (!fs.existsSync(basePath)) return [];\
\
  if (type === '\''daily'\'' && startDate) {\
    const dateDir = path.join(basePath, startDate);\
    if (fs.existsSync(dateDir)) {\
      allJobs = scanDateDirectory(dateDir);\
    }\
  } else if (type === '\''monthly'\'' && startDate) {\
    const month = startDate.substring(0, 7);\
    const entries = fs.readdirSync(basePath, { withFileTypes: true });\
    entries.forEach(entry => {\
      if (entry.isDirectory() && entry.name.startsWith(month)) {\
        allJobs.push(...scanDateDirectory(path.join(basePath, entry.name)));\
      }\
    });\
  } else if (type === '\''custom'\'' && startDate && endDate) {\
    const start = new Date(startDate).getTime();\
    const end = new Date(endDate).getTime() + 86400000;\
    const entries = fs.readdirSync(basePath, { withFileTypes: true });\
    entries.forEach(entry => {\
      if (entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name)) {\
        const t = new Date(entry.name).getTime();\
        if (t >= start && t <= end) {\
          allJobs.push(...scanDateDirectory(path.join(basePath, entry.name)));\
        }\
      }\
    });\
  }\
  return allJobs.map(j => ({ ...j, ...(jobOverrides[j.id] || {}) }));\
}\
' server.ts
