import React, { useState, useEffect } from 'react';
import { Code2, Copy, Download, Check, Terminal, FileCode, Sparkles, HelpCircle, Laptop } from 'lucide-react';

interface StreamlitExportProps {
  basePath: string;
}

export const StreamlitExport: React.FC<StreamlitExportProps> = ({ basePath }) => {
  const [streamlitCode, setStreamlitCode] = useState<string>('');
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [activeCodeTab, setActiveCodeTab] = useState<'streamlit' | 'html'>('streamlit');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch code from server
    fetch('/api/streamlit-code')
      .then((res) => res.json())
      .then((data) => {
        if (data.code) setStreamlitCode(data.code);
      })
      .catch((err) => console.error('Error fetching Streamlit code:', err));

    // Generate standalone HTML/JS code
    const standaloneHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>لوحة متابعة أوامر الطباعة المحلية</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    h1 { color: #38bdf8; text-align: center; }
    .config-box { background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #334155; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
    .card { background: #1e293b; border-radius: 12px; padding: 15px; border: 1px solid #334155; }
    .printer-title { color: #f59e0b; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-top: 0; }
    .col-pending { background: #451a03; padding: 10px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #78350f; }
    .col-done { background: #064e3b; padding: 10px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #065f46; }
    .btn { background: #2563eb; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 8px; }
    .btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <h1>🖨️ لوحة متابعة أوامر الطباعة للمطبعة</h1>
  <div class="config-box">
    <h3>⚙️ المسار المحلي الرئيسي:</h3>
    <code>${basePath || 'C:\\PrintJobs'}</code>
    <p>قم بتأكيد تاريخ اليوم والمجلدات المعتمدة.</p>
  </div>
  <div id="app" class="grid"></div>

  <script>
    const PRINTERS = ['eco', 'solvint', 'r2r', 'cutter', 'dtf', 'flat', 'flat samel'];
    function render() {
      const app = document.getElementById('app');
      app.innerHTML = PRINTERS.map(p => \`
        <div class="card">
          <h2 class="printer-title">\${p.toUpperCase()}</h2>
          <div class="col-pending">
            <h4>⏳ قيد الانتظار</h4>
            <p style="font-size: 12px; color: #cbd5e1;">ضع الملفات داخل المجلد الرئيسي لليوم</p>
          </div>
          <div class="col-done">
            <h4>✅ مكتمل (done)</h4>
            <p style="font-size: 12px; color: #cbd5e1;">قم بنقل الملفات يدوياً إلى مجلد done</p>
          </div>
        </div>
      \`).join('');
    }
    render();
  </script>
</body>
</html>`;
    setHtmlCode(standaloneHtml);
  }, [basePath]);

  const currentCode = activeCodeTab === 'streamlit' ? streamlitCode : htmlCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeCodeTab === 'streamlit' ? 'app_print_kanban.py' : 'index_local.html';
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl text-zinc-100 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-zinc-100">تصدير البرمجية للتشغيل المحلي المباشر</h2>
              <p className="text-xs text-zinc-400">احصل على كود Python Streamlit أو HTML المخصص للتشغيل على شبكتك المحلية بدون إنترنت</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('streamlit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCodeTab === 'streamlit'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>كود Python Streamlit (موصى به)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('html')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCodeTab === 'html'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>صفحة HTML محلية</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-[11px]">1</span>
              تعديل المسار الرئيسي (BASE_PATH)
            </span>
            <p className="text-zinc-400">
              داخل الكود أدمجنا المتغير <code className="text-cyan-300 dir-ltr bg-zinc-900 px-1 py-0.5 rounded">BASE_PATH</code> مع مسار الشبكة المختار:
              <br />
              <strong className="text-zinc-200 dir-ltr block mt-1 font-mono text-[11px] truncate">
                BASE_PATH = r"{basePath || '\\SERVER\\PrintShare'}"
              </strong>
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-mono text-[11px]">2</span>
              تثبيت المكتبة على جهازك
            </span>
            <p className="text-zinc-400">
              افتح موجه الأوامر (CMD أو Terminal) واكتب الأمر التالي:
              <br />
              <code className="text-emerald-300 dir-ltr block mt-1 font-mono bg-zinc-900 p-1 rounded text-[11px]">
                pip install streamlit
              </code>
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono text-[11px]">3</span>
              تشغيل لوحة المتابعة
            </span>
            <p className="text-zinc-400">
              قم بحفظ الكود في ملف <code className="text-zinc-200 dir-ltr">app.py</code> ثم شغّله بالأمر:
              <br />
              <code className="text-emerald-300 dir-ltr block mt-1 font-mono bg-zinc-900 p-1 rounded text-[11px]">
                streamlit run app.py
              </code>
            </p>
          </div>
        </div>

      </div>

      {/* Code Display Box */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Code Box Header */}
        <div className="px-5 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>{activeCodeTab === 'streamlit' ? 'app_print_kanban.py (Python Streamlit Script)' : 'index_local.html (Offline Webpage)'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>نسخ الكود</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-amber-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل الملف</span>
            </button>
          </div>
        </div>

        {/* Code Content View */}
        <div className="p-4 overflow-x-auto max-h-[500px] scrollbar-thin">
          <pre className="text-xs font-mono text-zinc-200 dir-ltr text-left leading-relaxed whitespace-pre">
            {currentCode || '// جاري تحضير الكود البرمجي...'}
          </pre>
        </div>

      </div>

    </div>
  );
};
