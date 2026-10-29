import React, { useState, useEffect, useCallback, useRef } from 'react';
import ManagementWorkspace from './components/ManagementWorkspace';
import WhatsAppIntake from './components/WhatsAppIntake';
import ModernWorkspaceShell, { type WorkspaceTab } from './components/ModernWorkspaceShell';
import WorkspaceOverview from './components/WorkspaceOverview';
import { PrintJob, PrinterType, FileStatus, ServerConfig } from './types';
import { translations } from './translations';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { StatsOverview } from './components/StatsOverview';
import { SettingsTab } from './components/SettingsTab';
import { ManagementTab } from './components/ManagementTab';
import { JobDetailsModal } from './components/JobDetailsModal';
import { ExportReportModal } from './components/ExportReportModal';
import { DepartmentSelector } from './components/DepartmentSelector';
import { DisplayVoiceAnnouncer } from './components/DisplayVoiceAnnouncer';
import { playNotificationSound } from './utils/audio';

// Safelist for dynamic themes: primary-orange primary-blue primary-green primary-purple primary-rose secondary-orange secondary-blue secondary-green secondary-purple secondary-rose
export default function App() {
  const isDisplayMode = new URLSearchParams(window.location.search).get('display') === 'true';
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [unacknowledgedJobs, setUnacknowledgedJobs] = useState<PrintJob[]>([]);
  const seenJobIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  const [config, setConfig] = useState<ServerConfig>({
    basePath: 'C:\\Users\\gt511\\OneDrive\\Desktop\\share',
    currentDate: `${new Date().getDate()}-${new Date().getMonth() + 1}`,
    autoRefreshInterval: 5,
    isRealStorageAvailable: false,
    activePath: ''
  });

  const [myDepartment, setMyDepartment] = useState<string | 'all' | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const deptParam = urlParams.get('dept');
    if (deptParam) return deptParam;
    if (urlParams.get('display') === 'true' && urlParams.get('choose') === 'true') {
      return null;
    }
    const targetJobId = urlParams.get('jobId') || urlParams.get('job');
    if (targetJobId) {
      return (localStorage.getItem('myDepartment') as string | 'all') || 'all';
    }
    return (localStorage.getItem('myDepartment') as string | 'all') || null;
  });
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(isDisplayMode ? 'kanban' : 'home');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<PrintJob | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialJobHandledRef = useRef<boolean>(false);

  const handleSelectJob = useCallback((job: PrintJob | null) => {
    setSelectedJobDetails(job);
    try {
      const url = new URL(window.location.href);
      if (job) {
        url.searchParams.set('jobId', job.id);
      } else {
        url.searchParams.delete('jobId');
        url.searchParams.delete('job');
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.error('URL sync error:', e);
    }
  }, []);

  // Open job automatically if scanned via QR code or navigated to with ?jobId=...
  useEffect(() => {
    if (jobs.length > 0 && !initialJobHandledRef.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetJobId = urlParams.get('jobId') || urlParams.get('job');
      if (targetJobId) {
        const found = jobs.find(j => j.id === targetJobId || j.filename === targetJobId);
        if (found) {
          setSelectedJobDetails(found);
          initialJobHandledRef.current = true;
          setMyDepartment(prev => prev || 'all');
        }
      }
    }
  }, [jobs]);

  // Keep open job details updated if background refresh alters its status or attributes
  useEffect(() => {
    if (selectedJobDetails) {
      const freshJob = jobs.find(j => j.id === selectedJobDetails.id);
      if (freshJob && (freshJob.status !== selectedJobDetails.status || freshJob.quantity !== selectedJobDetails.quantity || freshJob.notes !== selectedJobDetails.notes || freshJob.customerId !== selectedJobDetails.customerId || freshJob.customerName !== selectedJobDetails.customerName)) {
        setSelectedJobDetails(freshJob);
      }
    }
  }, [jobs, selectedJobDetails]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const targetJobId = urlParams.get('jobId') || urlParams.get('job');
      if (targetJobId) {
        const found = jobs.find(j => j.id === targetJobId || j.filename === targetJobId);
        if (found) {
          setSelectedJobDetails(found);
        }
      } else {
        setSelectedJobDetails(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [jobs]);

  const visibleJobs = myDepartment && myDepartment !== 'all'
    ? jobs.filter(j => {
        const deptPrinters = (config.printers || []).filter(p => p.departmentId === myDepartment).map(p => p.id);
        return deptPrinters.includes(j.printer);
      })
    : jobs;

  // Acknowledge new order alerts & stop sound
  const handleAcknowledgeAlert = useCallback(() => {
    setUnacknowledgedJobs([]);
  }, []);

  // Fetch Config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/config?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleSaveConfig = async (newConfig: ServerConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFiles = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/files?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleMoveJob = async (jobId: string, targetStatus: FileStatus, printer?: PrinterType) => {
    try {
      const res = await fetch('/api/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, targetStatus, printer })
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateJob = async (jobId: string, updates: Partial<PrintJob>) => {
    try {
      const res = await fetch(`/api/files/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/files/${jobId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchFiles();
  }, [fetchConfig, fetchFiles]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('primary-orange', 'primary-blue', 'primary-green', 'primary-purple', 'primary-rose');
    root.classList.remove('secondary-orange', 'secondary-blue', 'secondary-green', 'secondary-purple', 'secondary-rose');
    root.classList.add(`primary-${config.themeColor || 'orange'}`);
    root.classList.add(`secondary-${config.secondaryColor || 'blue'}`);
  }, [config.themeColor, config.secondaryColor]);

  useEffect(() => {
    if (config.autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchFiles();
        fetchConfig();
      }, config.autoRefreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [config.autoRefreshInterval, fetchFiles, fetchConfig]);

  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      jobs.forEach((j) => seenJobIdsRef.current.add(j.id));
      return;
    }

    const newJobs = visibleJobs.filter(
      (j) => j.status === 'pending' && !seenJobIdsRef.current.has(j.id)
    );

    if (newJobs.length > 0) {
      newJobs.forEach(j => seenJobIdsRef.current.add(j.id));
      setUnacknowledgedJobs((prev) => {
        const combined = [...prev];
        newJobs.forEach((nj) => {
          if (!combined.find((c) => c.id === nj.id)) combined.push(nj);
        });
        return combined;
      });


      // Trigger desktop browser push notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const firstJob = newJobs[0];
          const title = newJobs.length === 1 
            ? `طلب طباعة جديد: ${firstJob.filename}`
            : `وصلت ${newJobs.length} طلبات طباعة جديدة!`;
          new Notification(title, {
            body: `الطابعة: ${firstJob.printer.toUpperCase()} - اضغط للفتح`,
            tag: 'print-job-alert'
          });
        } catch (e) {
          console.error('Desktop notification error:', e);
        }
      }

      // Play notification chime
      playNotificationSound(config.notificationSound || 'default', config.customSoundUrl);
    }
  }, [jobs, config.notificationSound]);

  // Auto-hide notifications based on duration
  useEffect(() => {
    if (unacknowledgedJobs.length > 0 && config.notificationDuration && config.notificationDuration > 0) {
      const timer = setTimeout(() => {
        handleAcknowledgeAlert();
      }, config.notificationDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [unacknowledgedJobs, config.notificationDuration, handleAcknowledgeAlert]);

  const getBannerColorClass = () => {
    switch (config.notificationColor) {
      case 'blue': return 'bg-blue-600';
      case 'green': return 'bg-emerald-600';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-600';
      default: return 'bg-red-500';
    }
  };

  const t = translations[config.language || 'ar'];

  return (
    <>
      {!myDepartment ? (
        <DepartmentSelector 
          language={config.language || 'ar'} 
          config={config}
          onSelect={(dept) => { 
            setMyDepartment(dept);
            localStorage.setItem('myDepartment', dept);
          }} 
        />
      ) : (
      <div className={`h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col gt-app selection:bg-secondary-500 selection:text-white ${config.language === 'en' ? 'dir-ltr text-left' : 'dir-rtl text-right'} ${isDisplayMode ? 'select-none' : ''}`}>
      <DisplayVoiceAnnouncer myDepartment={myDepartment} language={config.language || 'ar'} />
      <ModernWorkspaceShell
        enabled={!isDisplayMode}
        activeTab={activeTab}
        onNavigate={setActiveTab}
        config={config}
        jobs={visibleJobs}
        pendingAlerts={unacknowledgedJobs.length}
        isRefreshing={isRefreshing}
        onRefresh={fetchFiles}
        onExport={() => setIsExportOpen(true)}
        onChangeDepartment={() => { setMyDepartment(null); localStorage.removeItem('myDepartment'); }}
        myDepartment={myDepartment}
        advancedTools={!isDisplayMode ? <Navbar
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onChangeDate={(newDate) => handleSaveConfig({ ...config, currentDate: newDate })}
        onOpenExport={() => setIsExportOpen(true)}
        onRefresh={fetchFiles}
        isRefreshing={isRefreshing}
        totalJobsCount={jobs.length}
        pendingJobsCount={jobs.filter(j => j.status === 'pending').length}
        allJobs={jobs}
        unacknowledgedJobs={unacknowledgedJobs}
        onDismissNotification={(id) => {
          setUnacknowledgedJobs(prev => prev.filter(j => j.id !== id));
        }}
        onDismissAllNotifications={handleAcknowledgeAlert}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onSelectJob={(job) => setSelectedJobDetails(job)}
        onUpdateConfig={(updates) => handleSaveConfig({ ...config, ...updates })}
        myDepartment={myDepartment}
        onChangeDepartment={() => {
          setMyDepartment(null);
          localStorage.removeItem('myDepartment');
        }}
      /> : null}>

      {unacknowledgedJobs.length > 0 && (
        <div className={`fixed bottom-6 right-6 ${getBannerColorClass()} text-white px-6 py-4 rounded-xl shadow-2xl z-50 transition-all transform animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center justify-between gap-6 border border-white/10`}>
          <div className="flex items-center gap-3 font-bold">
            <span className="w-3 h-3 bg-white rounded-full animate-ping shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
            <div>
              <div className="text-sm opacity-90 font-normal">{t.newJobsAlertTitle}</div>
              <div className="text-lg">{t.newJobsAlertCount} {unacknowledgedJobs.length} {t.newJobsAlertDesc}</div>
            </div>
          </div>
          {!isDisplayMode && <button 
            onClick={handleAcknowledgeAlert}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors pointer-events-auto"
          >
            {t.hideAlert}
          </button>}
        </div>
      )}

      <main className={`gt-main-content flex-1 w-full px-2 sm:px-3 py-2 overflow-hidden flex flex-col min-h-0 ${isDisplayMode && config.disableMouseInDisplayMode ? 'pointer-events-none' : ''}`}>
        {activeTab === 'home' && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <WorkspaceOverview jobs={visibleJobs} config={config} onNavigate={setActiveTab} onSelectJob={(job) => handleSelectJob(job)} />
          </div>
        )}
        {activeTab === 'kanban' && (
          <KanbanBoard
            config={config}
            myDepartment={myDepartment}
            jobs={visibleJobs}
            onMoveJob={handleMoveJob}
            onSelectJob={handleSelectJob}
            onDeleteJob={handleDeleteJob}
            onUpdateJob={handleUpdateJob}
            language={config.language || 'ar'}
          />
        )}

        {activeTab === 'intake' && (
          <WhatsAppIntake jobs={jobs} config={config} onRefreshJobs={fetchFiles} />
        )}
        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <StatsOverview jobs={visibleJobs} config={config} />
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ManagementWorkspace tab="customers" config={config} jobs={jobs} onRefreshJobs={fetchFiles} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <SettingsTab config={config} onSaveConfig={handleSaveConfig} />
          </div>
        )}

        {activeTab === 'management' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ManagementTab config={config} onSaveConfig={handleSaveConfig} language={config.language || 'ar'} />
          </div>
        )}
      </main>
      </ModernWorkspaceShell>

      {isExportOpen && (
        <ExportReportModal
          onClose={() => setIsExportOpen(false)}
        />
      )}
      <JobDetailsModal
        config={config}
        job={selectedJobDetails}
        onClose={() => handleSelectJob(null)}
        onMoveJob={handleMoveJob}
        onUpdateJob={handleUpdateJob}
        onRefreshJobs={fetchFiles}
        basePath={config.basePath}
        currentDate={config.currentDate}
      />
    </div>
    )}
    </>
  );
}
