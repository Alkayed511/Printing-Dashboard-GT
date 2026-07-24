sed -i '478,519c\
app.get('\''/api/reports/export'\'', (req: Request, res: Response) => {\
  const { type, startDate, endDate } = req.query;\
  const headers = "رقم الطلب,اسم الملف,الطابعة,الحالة,الحجم (بايت),تاريخ الإنشاء,تاريخ التحديث,العميل,الخامة,الكمية,المقاسات\\n";\
  let csv = headers;\
\
  let filtered: PrintJob[] = [];\
  if (serverConfig.isRealStorageAvailable) {\
    filtered = getJobsForReport(serverConfig.basePath, type as string, startDate as string, endDate as string);\
  }\
\
  filtered = filtered.filter(j => j.status === '\''done'\'');\
\
  filtered.forEach(j => {\
     csv += `${j.id},${j.filename},${j.printer},${j.status === '\''done'\'' ? '\''مكتمل'\'' : '\''قيد الانتظار'\''},${j.sizeBytes},${j.createdAt},${j.updatedAt},${j.customerName},${j.material},${j.quantity},${j.dimensions}\\n`;\
  });\
\
  res.setHeader('\''Content-Type'\'', '\''text/csv; charset=utf-8'\'');\
  res.setHeader('\''Content-Disposition'\'', `attachment; filename="report_${type}_${startDate || '\''export'\''}.csv"`);\
  res.send('\''\\uFEFF'\'' + csv);\
});\
\
function parseDimensions(name: string): string {\
  const match = name.match(/(\\d+x\\d+cm|\\d+x\\d+m|\\d+×\\d+سم|\\d+×\\d+متر)/i);\
  return match ? match[0] : '\''مواصفات قياسية'\'';\
}\
\
function parseMaterial(name: string): string {\
  if (/فينيل|vinyl/i.test(name)) return '\''فينيل ستيكر'\'';\
  if (/بنر|banner/i.test(name)) return '\''بنر إعلاني'\'';\
  if (/فليكس|flex/i.test(name)) return '\''فليكس مضاء'\'';\
  if (/أكريليك|acrylic/i.test(name)) return '\''أكريليك'\'';\
  if (/dtf|تيشيرت/i.test(name)) return '\''DTF قماش'\'';\
  return '\''حسب الطلب'\'';\
}\
\
function parseQuantity(name: string): number {\
  const match = name.match(/(\\d+)(قطعة|قطع|pcs|copies)/i);\
  return match ? parseInt(match[1], 10) : 1;\
}' server.ts
