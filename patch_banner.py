with open("src/App.tsx", "r") as f:
    text = f.read()

old_banner = """      {unacknowledgedJobs.length > 0 && (
        <div className={`${getBannerColorClass()} text-white px-4 py-2 flex items-center justify-between shadow-md z-50 transition-colors`}>
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            يوجد {unacknowledgedJobs.length} ملفات جديدة بانتظار الطباعة!
          </div>
          <button 
            onClick={handleAcknowledgeAlert}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
          >
            إخفاء التنبيه
          </button>
        </div>
      )}"""

new_banner = """      {unacknowledgedJobs.length > 0 && (
        <div className={`fixed bottom-6 right-6 ${getBannerColorClass()} text-white px-6 py-4 rounded-xl shadow-2xl z-50 transition-all transform animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center justify-between gap-6 border border-white/10`}>
          <div className="flex items-center gap-3 font-bold">
            <span className="w-3 h-3 bg-white rounded-full animate-ping shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
            <div>
              <div className="text-sm opacity-90 font-normal">تنبيه طلبات جديدة</div>
              <div className="text-lg">يوجد {unacknowledgedJobs.length} ملفات جديدة بانتظار الطباعة!</div>
            </div>
          </div>
          <button 
            onClick={handleAcknowledgeAlert}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            إخفاء
          </button>
        </div>
      )}"""

text = text.replace(old_banner, new_banner)

with open("src/App.tsx", "w") as f:
    f.write(text)
