import re
with open("src/App.tsx", "r") as f:
    text = f.read()

# Pass recentJobs to Navbar
old_navbar_render = """      {!isDisplayMode && <Navbar
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
        recentJobs={[...jobs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 30)}
      />}"""

text = text.replace(old_navbar_render, new_navbar_render)

with open("src/App.tsx", "w") as f:
    f.write(text)
