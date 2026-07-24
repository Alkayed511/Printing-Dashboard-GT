import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { PrintJob, PrinterType, FileStatus, ServerConfig } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Default configuration
let serverConfig: ServerConfig = {
  basePath: 'C:\\Users\\gt511\\OneDrive\\Desktop\\share', // Default Windows SMB/Network path
  currentDate: `${new Date().getDate()}-${new Date().getMonth() + 1}`, // e.g., '22-7'
  autoRefreshInterval: 5, // 5 seconds default
  isRealStorageAvailable: false,
  activePath: 'C:\\Users\\gt511\\OneDrive\\Desktop\\share\\' + `${new Date().getDate()}-${new Date().getMonth() + 1}`,
  notificationSound: 'default',
  notificationColor: 'red',
  notificationDuration: 0,
};

const DEFAULT_PRINTERS: PrinterType[] = ['eco', 'solvint', 'r2r', 'cutter', 'dtf', 'flat', 'flat small'];

// In-memory overrides for real disk jobs
let jobOverrides: Record<string, Partial<PrintJob>> = {};

// In-memory file database for simulation or sync
let mockJobs: PrintJob[] = [
  {
    id: 'job-1',
    filename: 'لوحة_محل_القمة_300x120cm_فينيل_خارجي.pdf',
    printer: 'eco',
    status: 'pending',
    sizeBytes: 15420000,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    dimensions: '300 × 120 سم',
    material: 'فينيل لامع + لمنيشن',
    quantity: 2,
    customerName: 'محل القمة التجاري',
    notes: 'يرجى مراعاة دقة الألوان الجانبية',
    previewColor: '#10b981'
  },
  {
    id: 'job-2',
    filename: 'ستيكر_قص_شعار_شركة_المراد_500قطعة.eps',
    printer: 'cutter',
    status: 'pending',
    sizeBytes: 8500000,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    dimensions: '10 × 10 سم',
    material: 'ستيكر أبيض مطفي',
    quantity: 500,
    customerName: 'شركة المراد للتجارة',
    notes: 'تفريغ دقيق للزوايا الصغيرة',
    previewColor: '#f43f5e'
  },
  {
    id: 'job-3',
    filename: 'بنر_مهرجان_التسوق_6x3متر_فليكس_مضاء.tiff',
    printer: 'solvint',
    status: 'pending',
    sizeBytes: 84000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    dimensions: '600 × 300 سم',
    material: 'فليكس بنر 440 جرام',
    quantity: 1,
    customerName: 'مهرجان التسوق السنوي',
    notes: 'حلقات تثبيت كل 50 سم',
    previewColor: '#f59e0b'
  },
  {
    id: 'job-4',
    filename: 'شعارات_تيشيرتات_أطفال_DTF_ألوان_زهية.png',
    printer: 'dtf',
    status: 'pending',
    sizeBytes: 12300000,
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    dimensions: 'A3 (29.7 × 42 سم)',
    material: 'فيلم حراري DTF',
    quantity: 25,
    customerName: 'مدارس الأمل',
    notes: 'درجة حرارة المكبس 160 درجة',
    previewColor: '#a855f7'
  },
  {
    id: 'job-5',
    filename: 'درع_أكريليك_تكريم_الطلاب_15قطعة.ai',
    printer: 'flat',
    status: 'pending',
    sizeBytes: 32000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    dimensions: '20 × 15 سم',
    material: 'أكريليك شفاف 8 ملم',
    quantity: 15,
    customerName: 'جامعة العلوم',
    notes: 'طباعة خلفية معكوسة + طبقة أبيض',
    previewColor: '#6366f1'
  },
  {
    id: 'job-6',
    filename: 'ستارة_رول_مكتبية_مطبوعة_UV.jpg',
    printer: 'r2r',
    status: 'done',
    sizeBytes: 24500000,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    dimensions: '180 × 200 سم',
    material: 'قماش بلاك أوت',
    quantity: 3,
    customerName: 'مكتب الهندسة الحديثة',
    notes: 'تم فحص الألوان ومطابقتها',
    previewColor: '#3b82f6'
  },
  {
    id: 'job-7',
    filename: 'صينية_خشبية_مخصصة_هدية_خاصة.psd',
    printer: 'flat small',
    status: 'done',
    sizeBytes: 45000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    dimensions: '40 × 30 سم',
    material: 'خشب طبيعي زان',
    quantity: 1,
    customerName: 'استوديو الإبداع',
    notes: 'تمت الطباعة والورنيش الحافظ',
    previewColor: '#06b6d4'
  }
];

let globalOrderCounter = 1001;
const filePathToOrderMap = new Map<string, string>();

function getOrderId(dateDirName: string, printer: string, filename: string): string {
  const key = `${dateDirName}:${printer}:${filename}`;
  if (filePathToOrderMap.has(key)) return filePathToOrderMap.get(key)!;
  const newId = (globalOrderCounter++).toString();
  filePathToOrderMap.set(key, newId);
  return newId;
}

// Helper: check if a target path is real on local disk
function scanDateDirectory(dateDir: string): PrintJob[] {
    const realJobs: PrintJob[] = [];
    DEFAULT_PRINTERS.forEach((printer) => {
      const printerDir = path.join(dateDir, printer);
      const doneDir = path.join(printerDir, 'done');

      if (fs.existsSync(printerDir)) {
        const entries = fs.readdirSync(printerDir, { withFileTypes: true });
        entries.forEach((entry) => {
          if (entry.isFile() && !entry.name.startsWith('.') && !entry.name.toLowerCase().includes('thumb') && !entry.name.toLowerCase().includes('desktop.ini')) {
            const filePath = path.join(printerDir, entry.name);
            const stats = fs.statSync(filePath);
            realJobs.push({
              id: getOrderId(path.basename(dateDir), printer, entry.name),
              filename: entry.name,
              printer: printer as PrinterType,
              status: 'pending',
              sizeBytes: stats.size,
              createdAt: stats.birthtime.toISOString(),
              updatedAt: stats.mtime.toISOString(),
              dimensions: parseDimensions(entry.name),
              material: parseMaterial(entry.name),
              quantity: parseQuantity(entry.name),
              customerName: parseCustomer(entry.name)
            });
          }
        });
      }

      if (fs.existsSync(doneDir)) {
        const entries = fs.readdirSync(doneDir, { withFileTypes: true });
        entries.forEach((entry) => {
          if (entry.isFile() && !entry.name.startsWith('.') && !entry.name.toLowerCase().includes('thumb') && !entry.name.toLowerCase().includes('desktop.ini')) {
            const filePath = path.join(doneDir, entry.name);
            const stats = fs.statSync(filePath);
            realJobs.push({
              id: getOrderId(path.basename(dateDir), printer, entry.name),
              filename: entry.name,
              printer: printer as PrinterType,
              status: 'done',
              sizeBytes: stats.size,
              createdAt: stats.birthtime.toISOString(),
              updatedAt: stats.mtime.toISOString(),
              dimensions: parseDimensions(entry.name),
              material: parseMaterial(entry.name),
              quantity: parseQuantity(entry.name),
              customerName: parseCustomer(entry.name)
            });
          }
        });
      }
    });
    return realJobs;
}

function parseFolderNameDate(name: string): number | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(name)) return new Date(name).getTime();
  const dmMatch = name.match(/^(\d{1,2})-(\d{1,2})$/);
  if (dmMatch) {
    const d = parseInt(dmMatch[1]);
    const m = parseInt(dmMatch[2]) - 1;
    return new Date(new Date().getFullYear(), m, d).getTime();
  }
  const dmyMatch = name.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1]);
    const m = parseInt(dmyMatch[2]) - 1;
    const y = parseInt(dmyMatch[3]);
    return new Date(y, m, d).getTime();
  }
  return null;
}

function getJobsForReport(basePath: string, type: string, startDate?: string, endDate?: string): PrintJob[] {
  let allJobs: PrintJob[] = [];
  if (!fs.existsSync(basePath)) return [];

  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  
  if (type === 'daily' && startDate) {
    const targetTime = new Date(startDate).getTime();
    entries.forEach(entry => {
      if (entry.isDirectory()) {
        const entryTime = parseFolderNameDate(entry.name);
        if (entryTime && Math.abs(entryTime - targetTime) < 86400000 / 2) {
          allJobs.push(...scanDateDirectory(path.join(basePath, entry.name)));
        }
      }
    });
  } else if (type === 'monthly' && startDate) {
    const targetY = parseInt(startDate.substring(0, 4));
    const targetM = parseInt(startDate.substring(5, 7)) - 1;
    entries.forEach(entry => {
      if (entry.isDirectory()) {
        const entryTime = parseFolderNameDate(entry.name);
        if (entryTime) {
           const d = new Date(entryTime);
           if (d.getFullYear() === targetY && d.getMonth() === targetM) {
             allJobs.push(...scanDateDirectory(path.join(basePath, entry.name)));
           }
        }
      }
    });
  } else if (type === 'custom' && startDate && endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;
    entries.forEach(entry => {
      if (entry.isDirectory()) {
        const t = parseFolderNameDate(entry.name);
        if (t !== null && t >= start && t <= end) {
          allJobs.push(...scanDateDirectory(path.join(basePath, entry.name)));
        }
      }
    });
  }
  return allJobs.map(j => ({ ...j, ...(jobOverrides[j.id] || {}) }));
}


function checkDiskStorage(baseP: string, dateStr: string) {
  try {
    const fullDatePath = path.join(baseP, dateStr);
    if (fs.existsSync(baseP) || fs.existsSync(fullDatePath)) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

// API Routes
app.get('/api/config', (req: Request, res: Response) => {
  const isAvailable = checkDiskStorage(serverConfig.basePath, serverConfig.currentDate);
  serverConfig.isRealStorageAvailable = isAvailable;
  serverConfig.activePath = path.join(serverConfig.basePath, serverConfig.currentDate);
  res.json(serverConfig);
});

app.post('/api/config', (req: Request, res: Response) => {
  const { basePath, currentDate, autoRefreshInterval, notificationSound, notificationColor, notificationDuration } = req.body;
  if (basePath !== undefined) serverConfig.basePath = basePath;
  if (currentDate !== undefined) serverConfig.currentDate = currentDate;
  if (autoRefreshInterval !== undefined) serverConfig.autoRefreshInterval = Number(autoRefreshInterval);
  if (notificationSound !== undefined) serverConfig.notificationSound = notificationSound;
  if (notificationColor !== undefined) serverConfig.notificationColor = notificationColor;
  if (notificationDuration !== undefined) serverConfig.notificationDuration = Number(notificationDuration);

  serverConfig.activePath = path.join(serverConfig.basePath, serverConfig.currentDate);
  serverConfig.isRealStorageAvailable = checkDiskStorage(serverConfig.basePath, serverConfig.currentDate);

  // If real path exists, create printer folders if missing
  if (serverConfig.isRealStorageAvailable) {
    try {
      const dateDir = serverConfig.activePath;
      if (!fs.existsSync(dateDir)) {
        fs.mkdirSync(dateDir, { recursive: true });
      }
      DEFAULT_PRINTERS.forEach((p) => {
        const printerDir = path.join(dateDir, p);
        const doneDir = path.join(printerDir, 'done');
        if (!fs.existsSync(printerDir)) fs.mkdirSync(printerDir, { recursive: true });
        if (!fs.existsSync(doneDir)) fs.mkdirSync(doneDir, { recursive: true });
      });
    } catch (err) {
      console.error('Error creating network folder structure:', err);
    }
  }

  res.json({ success: true, config: serverConfig });
});

// GET /api/files - List files for selected date
app.get('/api/files', (req: Request, res: Response) => {
  const selectedDate = (req.query.date as string) || serverConfig.currentDate;
  const isReal = checkDiskStorage(serverConfig.basePath, selectedDate);
  if (isReal) {
    const dateDir = path.join(serverConfig.basePath, selectedDate);
    const realJobs = scanDateDirectory(dateDir);
    const jobsWithOverrides = realJobs.map(j => ({ ...j, ...(jobOverrides[j.id] || {}) }));
    res.json({ jobs: jobsWithOverrides, isRealStorage: true, scannedPath: dateDir });

  } else {
    // Return mock database filtered or simulated
    const jobsWithOverrides = mockJobs.map(j => ({ ...j, ...(jobOverrides[j.id] || {}) }));
    res.json({ jobs: jobsWithOverrides, isRealStorage: false, scannedPath: path.join(serverConfig.basePath, selectedDate) });
  }
});

// POST /api/files/move - Move file between pending and done
app.post('/api/files/move', (req: Request, res: Response) => {
  const { id, targetStatus, printer: reqPrinter, filename: reqFilename } = req.body as {
    id: string;
    targetStatus: FileStatus;
    printer?: PrinterType;
    filename?: string;
  };

  let filename = reqFilename || '';
  let printer: PrinterType = reqPrinter || 'eco';
  let foundInMock = false;

  const jobIndex = mockJobs.findIndex((j) => j.id === id);
  if (jobIndex !== -1) {
    foundInMock = true;
    mockJobs[jobIndex].status = targetStatus;
    mockJobs[jobIndex].updatedAt = new Date().toISOString();
    if (!filename) filename = mockJobs[jobIndex].filename;
    if (!reqPrinter) printer = mockJobs[jobIndex].printer;
  } else {
    if (!filename || !printer) {
      return res.status(400).json({ error: 'Filename and printer are required for real files' });
    }
  }

  // Attempt physical file move on disk
  const dateDir = path.join(serverConfig.basePath, serverConfig.currentDate);
  const printerDir = path.join(dateDir, printer);
  const doneDir = path.join(printerDir, 'done');

  let fileMovedOnDisk = false;


  try {
    if (filename) {
      if (!fs.existsSync(printerDir)) fs.mkdirSync(printerDir, { recursive: true });
      if (!fs.existsSync(doneDir)) fs.mkdirSync(doneDir, { recursive: true });

      const pendingFilePath = path.join(printerDir, filename);
      const doneFilePath = path.join(doneDir, filename);

      if (targetStatus === 'done') {
        if (fs.existsSync(pendingFilePath)) {
          fs.renameSync(pendingFilePath, doneFilePath);
          fileMovedOnDisk = true;
        }
      } else if (targetStatus === 'pending') {
        if (fs.existsSync(doneFilePath)) {
          fs.renameSync(doneFilePath, pendingFilePath);
          fileMovedOnDisk = true;
        }
      }
    }
  } catch (e) {
    console.error('Real filesystem move error:', e);
  }

  return res.json({
    success: true,
    fileMovedOnDisk,
    updatedJob: foundInMock ? mockJobs[jobIndex] : undefined,
  });
});

// PUT /api/files/:id - Update job metadata
app.put('/api/files/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { customerName, material, quantity, notes, dimensions } = req.body;
  
  if (!jobOverrides[id]) {
    jobOverrides[id] = {};
  }
  
  if (customerName !== undefined) jobOverrides[id].customerName = customerName;
  if (material !== undefined) jobOverrides[id].material = material;
  if (quantity !== undefined) jobOverrides[id].quantity = Number(quantity);
  if (notes !== undefined) jobOverrides[id].notes = notes;
  if (dimensions !== undefined) jobOverrides[id].dimensions = dimensions;
  jobOverrides[id].updatedAt = new Date().toISOString();

  // Also update mockJobs if it exists there
  const jobIndex = mockJobs.findIndex((j) => j.id === id);
  if (jobIndex !== -1) {
    Object.assign(mockJobs[jobIndex], jobOverrides[id]);
    return res.json({ success: true, updatedJob: mockJobs[jobIndex] });
  }
  
  return res.json({ success: true, updatedOverrides: jobOverrides[id] });
});

// DELETE /api/files/:id - Delete an order file
app.delete('/api/files/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = mockJobs.length;
  mockJobs = mockJobs.filter((j) => j.id !== id);
  res.json({ success: mockJobs.length < initialLen });
});

app.get('/api/reports/export/pdf', (req: Request, res: Response) => {
  const { type, startDate, endDate } = req.query;
  
  let filtered: PrintJob[] = [];
  if (serverConfig.isRealStorageAvailable) {
    filtered = getJobsForReport(serverConfig.basePath, type as string, startDate as string, endDate as string);
  }


  filtered = filtered.filter(j => j.status === 'done');

  const rows = filtered.map(j => `
    <tr>
      <td>${j.id}</td>
      <td style="direction: ltr; text-align: right;">${j.filename}</td>
      <td>${j.printer.toUpperCase()}</td>
      <td>${j.status === 'done' ? 'مكتمل' : 'قيد الانتظار'}</td>
      <td>${j.customerName || '-'}</td>
      <td>${j.material || '-'}</td>
      <td>${j.quantity || 1}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير أوامر الطباعة</title>
      <style>
        body { font-family: Tahoma, Arial, sans-serif; padding: 20px; color: #333; }
        h1 { text-align: center; color: #1e1b4b; }
        .meta { text-align: center; margin-bottom: 20px; color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
        th { background-color: #f8fafc; color: #334155; font-weight: bold; }
        tr:nth-child(even) { background-color: #f1f5f9; }
        @media print {
          @page { margin: 1cm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: center; margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer;">حفظ كملف PDF / طباعة</button>
      </div>
      <h1>تقرير جرد أوامر الطباعة</h1>
      <div class="meta">
        <p>نوع الجرد: ${type === 'daily' ? 'يومي' : type === 'monthly' ? 'شهري' : 'مخصص'}</p>
        <p>الفترة: ${type === 'daily' ? startDate : type === 'monthly' ? startDate : `${startDate} إلى ${endDate}`}</p>
        <p>إجمالي الأوامر: <strong>${filtered.length}</strong></p>
      </div>
      <table>
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>اسم الملف</th>
            <th>الطابعة</th>
            <th>الحالة</th>
            <th>العميل</th>
            <th>الخامة</th>
            <th>الكمية</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length > 0 ? rows : '<tr><td colspan="7" style="text-align: center;">لا توجد بيانات لهذه الفترة</td></tr>'}
        </tbody>
      </table>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.get('/api/reports/export', (req: Request, res: Response) => {
  const { type, startDate, endDate } = req.query;
  const headers = "رقم الطلب,اسم الملف,الطابعة,الحالة,الحجم (بايت),تاريخ الإنشاء,تاريخ التحديث,العميل,الخامة,الكمية,المقاسات\n";
  let csv = headers;

  let filtered: PrintJob[] = [];
  if (serverConfig.isRealStorageAvailable) {
    filtered = getJobsForReport(serverConfig.basePath, type as string, startDate as string, endDate as string);
  }

  filtered = filtered.filter(j => j.status === 'done');

  filtered.forEach(j => {
     csv += `${j.id},${j.filename},${j.printer},${j.status === 'done' ? 'مكتمل' : 'قيد الانتظار'},${j.sizeBytes},${j.createdAt},${j.updatedAt},${j.customerName},${j.material},${j.quantity},${j.dimensions}\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="report_${type}_${startDate || 'export'}.csv"`);
  res.send('\uFEFF' + csv);
});

function parseDimensions(name: string): string {
  const match = name.match(/(\d+x\d+cm|\d+x\d+m|\d+×\d+سم|\d+×\d+متر)/i);
  return match ? match[0] : 'مواصفات قياسية';
}

function parseMaterial(name: string): string {
  if (/فينيل|vinyl/i.test(name)) return 'فينيل ستيكر';
  if (/بنر|banner/i.test(name)) return 'بنر إعلاني';
  if (/فليكس|flex/i.test(name)) return 'فليكس مضاء';
  if (/أكريليك|acrylic/i.test(name)) return 'أكريليك';
  if (/dtf|تيشيرت/i.test(name)) return 'DTF قماش';
  return 'حسب الطلب';
}

function parseQuantity(name: string): number {
  const match = name.match(/(\d+)(قطعة|قطع|pcs|copies)/i);
  return match ? parseInt(match[1], 10) : 1;
}

function parseCustomer(name: string): string {
  const parts = name.split('_');
  if (parts.length > 1) return parts[0];
  return 'عميل طباعة';
}

function getPrinterColor(p: PrinterType): string {
  switch (p) {
    case 'eco': return '#10b981';
    case 'solvint': return '#f59e0b';
    case 'r2r': return '#3b82f6';
    case 'cutter': return '#f43f5e';
    case 'dtf': return '#a855f7';
    case 'flat': return '#6366f1';
    case 'flat small': return '#06b6d4';
    default: return '#6b7280';
  }
}

// Start Express server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Print Shop Kanban Server running on http://localhost:${PORT}`);
  });
}

startServer();
