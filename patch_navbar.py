import re

with open("src/components/Navbar.tsx", "r") as f:
    text = f.read()

# Add Tv or Monitor icon import
if "FileDown" in text and "MonitorPlay" not in text:
    text = text.replace("FileDown", "FileDown, MonitorPlay")

old_export = """          {/* Export */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold px-2 py-1 rounded-md transition-all text-xs shrink-0"
            title="تصدير تقرير الجرد"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">جرد</span>
          </button>"""

new_export = """          {/* TV Display Mode */}
          <button
            onClick={() => window.open(window.location.pathname + '?display=true', '_blank')}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold px-2 py-1 rounded-md transition-all text-xs shrink-0"
            title="فتح شاشة العرض للقسم (بدون تحكم)"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">شاشة العرض</span>
          </button>
          
          {/* Export */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold px-2 py-1 rounded-md transition-all text-xs shrink-0"
            title="تصدير تقرير الجرد"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">جرد</span>
          </button>"""

text = text.replace(old_export, new_export)

with open("src/components/Navbar.tsx", "w") as f:
    f.write(text)
