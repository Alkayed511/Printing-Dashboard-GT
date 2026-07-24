sed -i '135i\
let globalOrderCounter = 1001;\
const filePathToOrderMap = new Map<string, string>();\
\
function getOrderId(dateDirName: string, printer: string, filename: string): string {\
  const key = `${dateDirName}:${printer}:${filename}`;\
  if (filePathToOrderMap.has(key)) return filePathToOrderMap.get(key)!;\
  const newId = (globalOrderCounter++).toString();\
  filePathToOrderMap.set(key, newId);\
  return newId;\
}\
' server.ts
sed -i 's/id: `real-${printer}-${entry.name}`/id: getOrderId(path.basename(dateDir), printer, entry.name)/g' server.ts
sed -i 's/id: `real-${printer}-done-${entry.name}`/id: getOrderId(path.basename(dateDir), printer, entry.name)/g' server.ts
