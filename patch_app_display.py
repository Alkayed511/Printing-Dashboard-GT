import re

with open("src/App.tsx", "r") as f:
    text = f.read()

# Add isDisplayMode
old_app_start = """export default function App() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
"""

new_app_start = """export default function App() {
  const isDisplayMode = new URLSearchParams(window.location.search).get('display') === 'true';
  const [jobs, setJobs] = useState<PrintJob[]>([]);
"""

text = text.replace(old_app_start, new_app_start)


# Hide Navbar when isDisplayMode
old_navbar_render = """      <Navbar
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onChangeDate={(newDate) => handleSaveConfig({ ...config, currentDate: newDate })}
        onOpenExport={() => setIsExportOpen(true)}
        onRefresh={fetchFiles}
        isRefreshing={isRefreshing}
        totalJobsCount={jobs.length}
        pendingJobsCount={jobs.filter(j => j.status === 'pending').length}
        unacknowledgedJobs={unacknowledgedJobs}
      />"""

new_navbar_render = """      {!isDisplayMode && <Navbar
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onChangeDate={(newDate) => handleSaveConfig({ ...config, currentDate: newDate })}
        onOpenExport={() => setIsExportOpen(true)}
        onRefresh={fetchFiles}
        isRefreshing={isRefreshing}
        totalJobsCount={jobs.length}
        pendingJobsCount={jobs.filter(j => j.status === 'pending').length}
        unacknowledgedJobs={unacknowledgedJobs}
      />}"""

text = text.replace(old_navbar_render, new_navbar_render)

# Add pointer-events-none to main when in display mode
old_main = """<main className="flex-1 w-full px-2 sm:px-3 py-2 overflow-hidden flex flex-col min-h-0">"""
new_main = """<main className={`flex-1 w-full px-2 sm:px-3 py-2 overflow-hidden flex flex-col min-h-0 ${isDisplayMode ? 'pointer-events-none' : ''}`}>"""

text = text.replace(old_main, new_main)

# Auto hide banner if display mode
old_banner_btn = """          <button 
            onClick={handleAcknowledgeAlert}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            إخفاء
          </button>"""

new_banner_btn = """          {!isDisplayMode && <button 
            onClick={handleAcknowledgeAlert}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors pointer-events-auto"
          >
            إخفاء
          </button>}"""

text = text.replace(old_banner_btn, new_banner_btn)

with open("src/App.tsx", "w") as f:
    f.write(text)
