import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import ModernWorkspaceShell, { type WorkspaceTab } from './components/ModernWorkspaceShell';
import WorkspaceOverview from './components/WorkspaceOverview';
import { PrintJob, PrinterType, FileStatus, ServerConfig } from './types';
import { translations } from './translations';
import { DepartmentSelector } from './components/DepartmentSelector';
import { DisplayVoiceAnnouncer } from './components/DisplayVoiceAnnouncer';
import { playNotificationSound } from './utils/audio';
import {productionSettings} from './utils/production';
import {useBranding} from './components/BrandingProvider';

const ManagementWorkspace = lazy(() => import('./components/ManagementWorkspace'));
const WhatsAppIntake = lazy(() => import('./components/WhatsAppIntake'));
const ProductionLedgerWorkspace = lazy(() => import('./components/ProductionLedgerWorkspace'));
const KanbanBoard = lazy(() => import('./components/KanbanBoard').then(module => ({default: module.KanbanBoard})));
const StatsOverview = lazy(() => import('./components/StatsOverview').then(module => ({default: module.StatsOverview})));
const SettingsTab = lazy(() => import('./components/SettingsTab').then(module => ({default: module.SettingsTab})));
const ManagementTab = lazy(() => import('./components/ManagementTab').then(module => ({default: module.ManagementTab})));
const JobDetailsModal = lazy(() => import('./components/JobDetailsModal').then(module => ({default: module.JobDetailsModal})));
const ExportReportModal = lazy(() => import('./components/ExportReportModal').then(module => ({default: module.ExportReportModal})));

// Safelist for dynamic themes: primary-orange primary-blue primary-green primary-purple primary-rose secondary-orange secondary-blue secondary-green secondary-purple secondary-rose
export default function App() {
  const {setBranding} = useBranding();
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
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    if (isDisplayMode) return 'kanban';
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab && ['home','kanban','customers','intake','ledger','stats','management','settings'].includes(tab) ? tab as WorkspaceTab : 'home';
  });
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [configError, setConfigError] = useState('');
  const [filesError, setFilesError] = useState('');
  const [operationError, setOperationError] = useState('');
  const mutationPending = useRef(false);
  const navigate = (tab: WorkspaceTab, section?: string) => {
    if (tab === activeTab && !section) return;
    if (!allowLeave()) return;
    setSettingsDirty(false);
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    if (section) url.searchParams.set('section',section); else url.searchParams.delete('section');
    window.history.replaceState({}, '', url);
    if (section) window.dispatchEvent(new CustomEvent('gt-settings-section',{detail:section}));
  };
  const allowLeave = () => {
    if (settingsDirty && !window.confirm(config.language === 'en' ? 'Discard unsaved settings and leave this page?' : 'توجد إعدادات غير محفوظة. هل تريد تجاهلها والانتقال؟')) return false;
    window.dispatchEvent(new Event('gt-settings-discard'));
    return true;
  };
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
      const res = await fetch('/api/config', {cache:'no-cache'});
      if (res.status === 401) window.dispatchEvent(new Event('gt-session-expired'));
      if (!res.ok) throw new Error('CONFIG_FETCH_FAILED');
      const data = await res.json();
      setConfig(data);
      setConfigError('');
    } catch (err) {
      setConfigError(config.language === 'en' ? 'Could not load server settings.' : 'تعذّر تحميل إعدادات الخادم.');
    }
  }, [config.language]);

  useEffect(() => {if (config.branding) setBranding(config.branding);}, [config.branding, setBranding]);

  const handleSaveConfig = async (newConfig: ServerConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.status === 401) window.dispatchEvent(new Event('gt-session-expired'));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (config.language === 'en' ? 'Settings could not be saved.' : 'تعذّر حفظ الإعدادات.'));
      setConfig(data.config);
      setSettingsDirty(false);
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error(config.language === 'en' ? 'Could not connect to the server.' : 'تعذّر الاتصال بالخادم.');
    }
  };

  const fetchFiles = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/files?t=${Date.now()}`);
      if (res.status === 401) window.dispatchEvent(new Event('gt-session-expired'));
      if (!res.ok) throw new Error('FILES_FETCH_FAILED');
      const data = await res.json();
      if (isFirstLoadRef.current) {
        (data.jobs || []).forEach((job: PrintJob) => seenJobIdsRef.current.add(job.id));
        isFirstLoadRef.current = false;
      }
      setJobs(data.jobs || []);
      const activeIds = new Set((data.jobs || []).map((job: PrintJob) => job.id));
      setUnacknowledgedJobs(previous => previous.filter(job => activeIds.has(job.id)));
      setLastSynced(new Date());
      setFilesError(Array.isArray(data.warnings)?data.warnings.join('، '):'');
    } catch (err) {
      setFilesError(config.language === 'en' ? 'Could not refresh production files. Showing the last loaded data.' : 'تعذّر تحديث ملفات الإنتاج. تُعرض آخر بيانات تم تحميلها.');
    } finally {
      setIsRefreshing(false);
    }
  }, [config.language]);

  const handleMoveJob = async (jobId: string, targetStatus: FileStatus, printer?: PrinterType) => {
    if (isDisplayMode || mutationPending.current) return;
    const job = jobs.find(item => item.id === jobId);
    if (!job || (job.status === targetStatus && (!printer || printer === job.printer))) return;
    if (productionSettings(config.production).confirmFileMoves && !window.confirm(config.language === 'en' ? `Move “${job.filename}” to ${printer || job.printer} / ${targetStatus === 'done' ? 'done' : 'pending'}?` : `تأكيد نقل «${job.filename}» إلى ${printer || job.printer} / ${targetStatus === 'done' ? 'المنجز' : 'الانتظار'}؟`)) return;
    mutationPending.current = true;
    setOperationError('');
    try {
      const res = await fetch('/api/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, targetStatus, printer })
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || (config.language === 'en' ? 'The file was not moved.' : 'لم يتم نقل الملف.'));
      await fetchFiles();
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'تعذّر نقل الملف.');
    } finally {mutationPending.current = false;}
  };

  const handleUpdateJob = async (jobId: string, updates: Partial<PrintJob>) => {
    if (isDisplayMode) return false;
    setOperationError('');
    try {
      const res = await fetch(`/api/files/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if(!res.ok){const result=await res.json().catch(()=>({}));throw Error(result.error||'تعذّر حفظ بيانات الملف');}
      await fetchFiles();
      return true;
    } catch (err) {
      setOperationError(err instanceof Error?err.message:'تعذّر حفظ بيانات الملف');
      return false;
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (isDisplayMode || mutationPending.current || !productionSettings(config.production).allowFileDeletion) return;
    const job = jobs.find(item => item.id === jobId);
    if (!job || !job.id.startsWith('crm-') || !window.confirm(config.language === 'en' ? `Delete the registered order “${job.filename}”?` : `هل تريد حذف الطلب المسجّل «${job.filename}»؟`)) return;
    mutationPending.current = true;
    setOperationError('');
    try {
      const res = await fetch(`/api/files/${jobId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'لم يتم حذف الطلب.');
      await fetchFiles();
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'تعذّر حذف الطلب.');
    } finally {mutationPending.current = false;}
  };

  useEffect(() => {
    fetchConfig();
    fetchFiles();
  }, [fetchConfig, fetchFiles]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = config.language || 'ar';
    root.dir = config.language === 'en' ? 'ltr' : 'rtl';
    root.classList.remove('primary-orange', 'primary-blue', 'primary-green', 'primary-purple', 'primary-rose');
    root.classList.remove('secondary-orange', 'secondary-blue', 'secondary-green', 'secondary-purple', 'secondary-rose');
    root.classList.add(`primary-${config.themeColor || 'orange'}`);
    root.classList.add(`secondary-${config.secondaryColor || 'blue'}`);
  }, [config.themeColor, config.secondaryColor, config.language]);

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
    if (isFirstLoadRef.current) return;

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
        onNavigate={navigate}
        config={config}
        jobs={visibleJobs}
        pendingAlerts={unacknowledgedJobs.length}
        alerts={unacknowledgedJobs}
        onDismissAlerts={handleAcknowledgeAlert}
        onOpenAppearance={() => navigate('settings','appearance')}
        onOpenNotificationSettings={() => navigate('settings','notifications')}
        isRefreshing={isRefreshing}
        onRefresh={() => {void fetchConfig(); void fetchFiles();}}
        lastSynced={lastSynced}
        connectionError={filesError || configError}
        onSelectJob={handleSelectJob}
        onBeforeLogout={allowLeave}
        onExport={() => setIsExportOpen(true)}
        onChangeDepartment={() => { if (allowLeave()) {setMyDepartment(null); localStorage.removeItem('myDepartment');} }}
        myDepartment={myDepartment}
      >

      {unacknowledgedJobs.length > 0 && (
        <div className={`gt-job-alert fixed bottom-6 right-6 ${getBannerColorClass()} text-white px-6 py-4 rounded-xl shadow-2xl z-50 transition-all transform animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center justify-between gap-6 border border-white/10`}>
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
        {operationError && <div className="gt-production-operation-error" role="alert"><span>{operationError}</span><button type="button" onClick={() => setOperationError('')}>{config.language === 'en' ? 'Dismiss' : 'إغلاق'}</button></div>}
        <Suspense fallback={<div className="gt-loading-page" role="status"><span className="gt-auth-spinner"/>{config.language === 'en' ? 'Loading workspace…' : 'جارٍ تحميل مساحة العمل…'}</div>}>
        {activeTab === 'home' && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <WorkspaceOverview jobs={visibleJobs} config={config} onNavigate={navigate} onSelectJob={(job) => handleSelectJob(job)} />
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
            readOnly={isDisplayMode}
            onOpenSettings={() => navigate('settings','production')}
          />
        )}

        {activeTab === 'intake' && (
          <WhatsAppIntake jobs={jobs} config={config} onRefreshJobs={fetchFiles} />
        )}
        {activeTab === 'ledger' && <ProductionLedgerWorkspace />}
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
            <SettingsTab config={config} onSaveConfig={handleSaveConfig} onDirtyChange={setSettingsDirty} onManage={() => navigate('management')} />
          </div>
        )}

        {activeTab === 'management' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ManagementTab config={config} onSaveConfig={handleSaveConfig} language={config.language || 'ar'} />
          </div>
        )}
        </Suspense>
      </main>
      </ModernWorkspaceShell>

      <Suspense fallback={null}>
      {isExportOpen && (
        <ExportReportModal
          onClose={() => setIsExportOpen(false)}
        />
      )}
      {selectedJobDetails && <JobDetailsModal
        config={config}
        readOnly={isDisplayMode}
        job={selectedJobDetails}
        onClose={() => handleSelectJob(null)}
        onMoveJob={handleMoveJob}
        onUpdateJob={handleUpdateJob}
        onRefreshJobs={fetchFiles}
        basePath={config.basePath}
        currentDate={config.currentDate}
      />}
      </Suspense>
    </div>
    )}
    </>
  );
}
