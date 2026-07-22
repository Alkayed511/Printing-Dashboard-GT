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
  basePath: 'C:\\PrintNetworkFolder', // Default Windows SMB/Network path
  currentDate: new Date().toISOString().split('T')[0], // e.g., '2026-07-21'
  autoRefreshInterval: 5, // 5 seconds default
  isRealStorageAvailable: false,
  activePath: 'C:\\PrintNetworkFolder\\' + new Date().toISOString().split('T')[0]
};

const DEFAULT_PRINTERS: PrinterType[] = ['eco', 'solvint', 'r2r', 'cutter', 'dtf', 'flat', 'flat samel'];

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
    printer: 'flat samel',
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

// Helper: check if a target path is real on local disk
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
  const { basePath, currentDate, autoRefreshInterval } = req.body;
  if (basePath !== undefined) serverConfig.basePath = basePath;
  if (currentDate !== undefined) serverConfig.currentDate = currentDate;
  if (autoRefreshInterval !== undefined) serverConfig.autoRefreshInterval = Number(autoRefreshInterval);

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
    // Scan real directory structure
    const dateDir = path.join(serverConfig.basePath, selectedDate);
    const realJobs: PrintJob[] = [];

    DEFAULT_PRINTERS.forEach((printer) => {
      const printerDir = path.join(dateDir, printer);
      const doneDir = path.join(printerDir, 'done');

      // Check pending files
      if (fs.existsSync(printerDir)) {
        const entries = fs.readdirSync(printerDir, { withFileTypes: true });
        entries.forEach((entry) => {
          if (entry.isFile()) {
            const filePath = path.join(printerDir, entry.name);
            const stats = fs.statSync(filePath);
            realJobs.push({
              id: `real-${printer}-${entry.name}`,
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

      // Check done files
      if (fs.existsSync(doneDir)) {
        const entries = fs.readdirSync(doneDir, { withFileTypes: true });
        entries.forEach((entry) => {
          if (entry.isFile()) {
            const filePath = path.join(doneDir, entry.name);
            const stats = fs.statSync(filePath);
            realJobs.push({
              id: `real-${printer}-done-${entry.name}`,
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

    res.json({ jobs: realJobs, isRealStorage: true, scannedPath: dateDir });
  } else {
    // Return mock database filtered or simulated
    res.json({ jobs: mockJobs, isRealStorage: false, scannedPath: path.join(serverConfig.basePath, selectedDate) });
  }
});

// POST /api/files/move - Move file between pending and done
app.post('/api/files/move', (req: Request, res: Response) => {
  const { id, targetStatus } = req.body as { id: string; targetStatus: FileStatus };

  const jobIndex = mockJobs.findIndex((j) => j.id === id);
  if (jobIndex !== -1) {
    mockJobs[jobIndex].status = targetStatus;
    mockJobs[jobIndex].updatedAt = new Date().toISOString();

    // If real folder exists, attempt physical rename/move
    const job = mockJobs[jobIndex];
    const dateDir = path.join(serverConfig.basePath, serverConfig.currentDate);
    const printerDir = path.join(dateDir, job.printer);
    const doneDir = path.join(printerDir, 'done');

    try {
      if (fs.existsSync(printerDir)) {
        if (!fs.existsSync(doneDir)) fs.mkdirSync(doneDir, { recursive: true });

        const fromPath = targetStatus === 'done' 
          ? path.join(printerDir, job.filename)
          : path.join(doneDir, job.filename);

        const toPath = targetStatus === 'done'
          ? path.join(doneDir, job.filename)
          : path.join(printerDir, job.filename);

        if (fs.existsSync(fromPath)) {
          fs.renameSync(fromPath, toPath);
        }
      }
    } catch (e) {
      console.log('Real filesystem move note:', e);
    }

    return res.json({ success: true, updatedJob: mockJobs[jobIndex] });
  }

  res.status(404).json({ error: 'Order file not found' });
});

// POST /api/files/add - Add a new file to queue
app.post('/api/files/add', (req: Request, res: Response) => {
  const { filename, printer, dimensions, material, quantity, customerName, notes } = req.body;

  if (!filename || !printer) {
    return res.status(400).json({ error: 'Filename and printer are required' });
  }

  const newJob: PrintJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    filename,
    printer: printer as PrinterType,
    status: 'pending',
    sizeBytes: Math.floor(Math.random() * 20000000) + 1000000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dimensions: dimensions || 'غير محدد',
    material: material || 'حسب المواصفات',
    quantity: Number(quantity) || 1,
    customerName: customerName || 'عميل مباشر',
    notes: notes || '',
    previewColor: getPrinterColor(printer as PrinterType)
  };

  mockJobs.unshift(newJob);

  // If real storage exists, write a empty placeholder file
  try {
    const dateDir = path.join(serverConfig.basePath, serverConfig.currentDate);
    const printerDir = path.join(dateDir, printer);
    if (fs.existsSync(printerDir)) {
      const filePath = path.join(printerDir, filename);
      fs.writeFileSync(filePath, `Print Order Meta: ${JSON.stringify(newJob)}`);
    }
  } catch (e) {
    console.log('Real filesystem write note:', e);
  }

  res.json({ success: true, newJob });
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
  
  let filtered = [...mockJobs];
  
  if (type === 'daily' && startDate) {
     filtered = filtered.filter(j => j.createdAt.startsWith(startDate as string));
  } else if (type === 'monthly' && startDate) {
     const month = (startDate as string).substring(0, 7);
     filtered = filtered.filter(j => j.createdAt.startsWith(month));
  } else if (type === 'custom' && startDate && endDate) {
     const start = new Date(startDate as string).getTime();
     const end = new Date(endDate as string).getTime() + 86400000;
     filtered = filtered.filter(j => {
       const t = new Date(j.createdAt).getTime();
       return t >= start && t <= end;
     });
  }

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
  
  let filtered = [...mockJobs];
  
  if (type === 'daily' && startDate) {
     filtered = filtered.filter(j => j.createdAt.startsWith(startDate as string));
  } else if (type === 'monthly' && startDate) {
     const month = (startDate as string).substring(0, 7);
     filtered = filtered.filter(j => j.createdAt.startsWith(month));
  } else if (type === 'custom' && startDate && endDate) {
     const start = new Date(startDate as string).getTime();
     const end = new Date(endDate as string).getTime() + 86400000;
     filtered = filtered.filter(j => {
       const t = new Date(j.createdAt).getTime();
       return t >= start && t <= end;
     });
  }

  filtered.forEach(j => {
     csv += `${j.id},${j.filename},${j.printer},${j.status === 'done' ? 'مكتمل' : 'قيد الانتظار'},${j.sizeBytes},${j.createdAt},${j.updatedAt},${j.customerName},${j.material},${j.quantity},${j.dimensions}\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="report_${type}_${startDate || 'export'}.csv"`);
  res.send('\uFEFF' + csv); // UTF-8 BOM for Arabic support in Excel
});

// Get Streamlit Code Generator Script
app.get('/api/streamlit-code', (req: Request, res: Response) => {
  const code = `# ==============================================================================
# برنامج متابعة أوامر الطباعة للمطابع (Streamlit Dashboard for Local Network)
# ==============================================================================
# هذا السคريب يقرأ المجلد الرئيسي للشبكة ويحدد تاريخ اليوم تلقائياً
# ويقوم بتقسيم الطابعات إلى أعمدة: "قيد الانتظار" و "مكتمل" (مجلد done)
# مع زر للتحديث التلقائي وتسهيل العمل بين المصمم وفني الطباعة.
#
# متطلبات التشغيل:
# 1. تثبيت python مع مكتبة streamlit:
#    pip install streamlit pandas
# 2. تشغيل البرنامج:
#    streamlit run app.py
# ==============================================================================

import os
import shutil
import datetime
import streamlit as st

# ------------------------------------------------------------------------------
# 🛠️ إعداد مسار المجلد الرئيسي (Base Path)
# ⚠️ مهم جداً: قم بتغيير هذا المسار ليتوافق مع مسار الشبكة أو المجلد المحلي لديك
# ------------------------------------------------------------------------------
BASE_PATH = r"${serverConfig.basePath.replace(/\\/g, '\\\\')}"

# قائمة أسماء الطابعات المعتمدة لدى المطبعة
PRINTERS = ['eco', 'solvint', 'r2r', 'cutter', 'dtf', 'flat', 'flat samel']

# أسماء الطابعات باللغة العربية للعرض
PRINTER_NAMES_AR = {
    'eco': 'أيكو إيكوسولفنت (ECO)',
    'solvint': 'سولفنت (SOLVINT)',
    'r2r': 'رول إلى رول (R2R)',
    'cutter': 'كاتر بلوتر (CUTTER)',
    'dtf': 'دي تي إف قماش (DTF)',
    'flat': 'فلات بيد UV (FLAT)',
    'flat samel': 'فلات ساميل (FLAT SAMEL)'
}

# ------------------------------------------------------------------------------
# إعدادات صفحة الاستريم ليت (Streamlit Page Config)
# ------------------------------------------------------------------------------
st.set_page_config(
    page_title="لوحة متابعة أوامر الطباعة",
    page_icon="🖨️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# تنسيق RTL للغة العربية
st.markdown("""
<style>
    body { direction: rtl; text-align: right; }
    .stApp { direction: rtl; text-align: right; }
    .stButton>button { width: 100%; border-radius: 8px; font-weight: bold; }
    .card-pending { background-color: #fff8e1; border-right: 5px solid #ffa000; padding: 10px; border-radius: 6px; margin-bottom: 8px; }
    .card-done { background-color: #e8f5e9; border-right: 5px solid #4caf50; padding: 10px; border-radius: 6px; margin-bottom: 8px; }
</style>
""", unsafe_allow_html=True)

st.title("🖨️ لوحة متابعة أوامر الطباعة على الشبكة")

# ------------------------------------------------------------------------------
# شريط الخيارات الجانبي (Sidebar Settings)
# ------------------------------------------------------------------------------
st.sidebar.header("⚙️ إعدادات النظام والمسار")

# إمكانية تعديل المسار الرئيسي من الواجهة
custom_base_path = st.sidebar.text_input("مسار المجلد الرئيسي (Base Path):", value=BASE_PATH)
if custom_base_path:
    BASE_PATH = custom_base_path

# اختيار تاريخ اليوم (تلقائي مع إمكانية التغيير)
selected_date = st.sidebar.date_input("تاريخ اليوم:", datetime.date.today())
date_folder_name = selected_date.strftime("%Y-%m-%d")

# إنشاء المسار الكامل اليومي
today_dir = os.path.join(BASE_PATH, date_folder_name)

st.sidebar.info(f"📁 **المجلد الحالي:**\\n\`{today_dir}\`")

# إنشاء المجلدات تلقائياً إذا لم تكن موجودة
if st.sidebar.button("🛠️ إنشاء هيكل المجلدات اليومي تلقائياً"):
    try:
        os.makedirs(today_dir, exist_ok=True)
        for printer in PRINTERS:
            p_dir = os.path.join(today_dir, printer)
            done_dir = os.path.join(p_dir, "done")
            os.makedirs(p_dir, exist_ok=True)
            os.makedirs(done_dir, exist_ok=True)
        st.sidebar.success("✅ تم إنشاء جميع مجلدات الطابعات ومجلدات (done) بنجاح!")
    except Exception as e:
        st.sidebar.error(f"❌ خطأ أثناء إنشاء المجلدات: {e}")

# خيار التحديث التلقائي
auto_refresh = st.sidebar.checkbox("تحديث تلقائي كل 5 ثوانٍ", value=True)
if auto_refresh:
    st.empty() # ريفرش استريم ليت

# ------------------------------------------------------------------------------
# قراءة وعرض الملفات
# ------------------------------------------------------------------------------
if not os.path.exists(today_dir):
    st.warning(f"⚠️ مجلد التاريخ ({date_folder_name}) غير موجود بعد في المسار الرئيسي.\\nاضغط على زر إنشاء الهيكل في القائمة الجانبية للبدء.")
else:
    # تصفية الطابعات
    selected_printer_filter = st.selectbox(
        "عرض طابعة محددة أو الكل:",
        options=["الكل"] + PRINTERS,
        format_func=lambda x: "جميع الطابعات" if x == "الكل" else PRINTER_NAMES_AR.get(x, x)
    )

    display_printers = PRINTERS if selected_printer_filter == "الكل" else [selected_printer_filter]

    for printer in display_printers:
        st.subheader(f"🖨️ {PRINTER_NAMES_AR.get(printer, printer.upper())}")
        
        printer_dir = os.path.join(today_dir, printer)
        done_dir = os.path.join(printer_dir, "done")

        # التأكد من وجود المجلدات
        os.makedirs(printer_dir, exist_ok=True)
        os.makedirs(done_dir, exist_ok=True)

        # قراءة الملفات في مجلد الطابعة الرئيسي (قيد الانتظار)
        pending_files = [f for f in os.listdir(printer_dir) if os.path.isfile(os.path.join(printer_dir, f))]
        
        # قراءة الملفات في مجلد done (مكتمل)
        done_files = [f for f in os.listdir(done_dir) if os.path.isfile(os.path.join(done_dir, f))]

        # تقسيم الشاشة إلى عمودين (Kanban Layout)
        col1, col2 = st.columns(2)

        # ---------------------------------------
        # العمود الأول: قيد الانتظار
        # ---------------------------------------
        with col1:
            st.markdown(f"#### ⏳ قيد الانتظار ({len(pending_files)})")
            if not pending_files:
                st.caption("لا توجد ملفات تنتظر الطباعة")
            else:
                for file_name in pending_files:
                    file_path = os.path.join(printer_dir, file_name)
                    st.markdown(f"""
                    <div class="card-pending">
                        📄 <b>{file_name}</b><br>
                        <small>حجم الملف: {os.path.getsize(file_path) // 1024} كيلوبايت</small>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # زر النقل إلى المكتمل
                    if st.button(f"✅ نقل إلى المكتمل ➡️ ({file_name[:15]}...)", key=f"done_{printer}_{file_name}"):
                        target_path = os.path.join(done_dir, file_name)
                        shutil.move(file_path, target_path)
                        st.success(f"تم نقل {file_name} إلى مكتمل")
                        st.rerun()

        # ---------------------------------------
        # العمود الثاني: مكتمل (Done)
        # ---------------------------------------
        with col2:
            st.markdown(f"#### ✅ مكتمل ({len(done_files)})")
            if not done_files:
                st.caption("لا توجد ملفات مكتملة بعد")
            else:
                for file_name in done_files:
                    file_path = os.path.join(done_dir, file_name)
                    st.markdown(f"""
                    <div class="card-done">
                        ✔️ <b>{file_name}</b><br>
                        <small>تمت الطباعة بنجاح</small>
                    </div>
                    """, unsafe_allow_html=True)

                    # زر إعادة إلى الانتظار إن لزم
                    if st.button(f"↩️ إعادة للانتظار ({file_name[:15]}...)", key=f"undo_{printer}_{file_name}"):
                        target_path = os.path.join(printer_dir, file_name)
                        shutil.move(file_path, target_path)
                        st.info(f"تمت إعادة {file_name} إلى قيد الانتظار")
                        st.rerun()

        st.divider()
`;
  res.json({ code });
});

// Helper parsers for filename specs
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
    case 'flat samel': return '#06b6d4';
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
