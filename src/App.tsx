import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PrintJob, PrinterType, FileStatus, ServerConfig } from './types';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { CompactGrid } from './components/CompactGrid';
import { StatsOverview } from './components/StatsOverview';
import { NetworkConfigModal } from './components/NetworkConfigModal';
import { NewJobModal } from './components/NewJobModal';
import { JobDetailsModal } from './components/JobDetailsModal';
import { QuickSimulatorBar } from './components/QuickSimulatorBar';
import { ExportReportModal } from './components/ExportReportModal';
import { NewOrderNotification } from './components/NewOrderNotification';

export default function App() {
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

  const [activeTab, setActiveTab] = useState<'kanban' | 'compact' | 'stats'>('kanban');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedPrinterForNewJob, setSelectedPrinterForNewJob] = useState<PrinterType>('eco');
  const [selectedJobDetails, setSelectedJobDetails] = useState<PrintJob | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Acknowledge new order alerts & stop sound
  const handleAcknowledgeAlert = useCallback(() => {
    unacknowledgedJobs.forEach((j) => seenJobIdsRef.current.add(j.id));
    jobs.forEach((j) => seenJobIdsRef.current.add(j.id));
    setUnacknowledgedJobs([]);
  }, [jobs, unacknowledgedJobs]);

  // Fetch Config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error('Error fetching config:', e);
    }
  }, []);

  // Fetch Files
  const fetchFiles = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/files?date=${config.currentDate}`);
      if (res.ok) {
        const data = await res.json();
        if (data.jobs && Array.isArray(data.jobs)) {
          const validJobs: PrintJob[] = data.jobs.filter((j: PrintJob) => {
            const lowerName = j.filename.toLowerCase();
            return !lowerName.includes('thumbs.db') && !lowerName.includes('desktop.ini') && !j.filename.startsWith('.');
          });

          setJobs(validJobs);

          if (isFirstLoadRef.current) {
            // Mark all initial jobs as seen on startup
            validJobs.forEach((j) => seenJobIdsRef.current.add(j.id));
            isFirstLoadRef.current = false;
          } else {
            // Check for new incoming pending jobs
            const newIncoming = validJobs.filter(
              (j) => j.status === 'pending' && !seenJobIdsRef.current.has(j.id)
            );
            if (newIncoming.length > 0) {
              setUnacknowledgedJobs((prev) => {
                const combined = [...newIncoming, ...prev];
                const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
                return unique;
              });
            }
          }
        } else {
          setJobs([]);
        }
      }
    } catch (e) {
      console.error('Error fetching print files:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [config.currentDate]);

  // Initial Load
  useEffect(() => {
    fetchConfig();
    fetchFiles();
  }, [fetchConfig, fetchFiles]);

  // Auto-refresh polling timer
  useEffect(() => {
    if (!config.autoRefreshInterval || config.autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      fetchFiles();
    }, config.autoRefreshInterval * 1000);

    return () => clearInterval(timer);
  }, [config.autoRefreshInterval, fetchFiles]);

  // Save Config
  const handleSaveConfig = async (newConfig: Partial<ServerConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        fetchFiles();
      }
    } catch (e) {
      console.error('Error saving config:', e);
    }
  };

  // Move Job status (Pending <-> Done)
  const handleMoveJob = async (id: string, targetStatus: FileStatus) => {
    // If moving job, also mark it as seen
    seenJobIdsRef.current.add(id);
    setUnacknowledgedJobs((prev) => prev.filter((j) => j.id !== id));

    const targetJob = jobs.find((j) => j.id === id);

    // Optimistic UI Update
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: targetStatus, updatedAt: new Date().toISOString() } : j))
    );

    try {
      await fetch('/api/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          targetStatus,
          printer: targetJob?.printer,
          filename: targetJob?.filename,
        }),
      });
    } catch (e) {
      console.error('Error moving file:', e);
      fetchFiles(); // Rollback on error
    }
  };

  // Add New Job
  const handleAddJob = async (jobData: Partial<PrintJob>) => {
    try {
      const res = await fetch('/api/files/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.newJob) {
          const newJobObj: PrintJob = data.newJob;
          setJobs((prev) => [newJobObj, ...prev]);
          // Add to unacknowledged jobs to trigger cascading alert and sound
          setUnacknowledgedJobs((prev) => [newJobObj, ...prev]);
        }
      }
    } catch (e) {
      console.error('Error adding new job:', e);
    }
  };

  // Quick simulation add
  const handleAddQuickJob = (printer: PrinterType) => {
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const sampleNames: Record<PrinterType, string> = {
      eco: `ستيكر_محل_الرؤية_${randomNum}_120x80cm.pdf`,
      solvint: `بنر_طريقي_${randomNum}_400x200cm_فليكس.tiff`,
      r2r: `ستارة_مكتبية_رول_${randomNum}_150x200cm.jpg`,
      cutter: `قص_شعار_شركة_الأمل_${randomNum}_300قطعة.eps`,
      dtf: `طباعة_قميص_شعار_${randomNum}_A3.png`,
      flat: `لوحة_أكريليك_شفافة_${randomNum}_40x30cm.ai`,
      'flat small': `هدية_صينية_خشب_${randomNum}_25x25cm.psd`
    };

    handleAddJob({
      filename: sampleNames[printer],
      printer,
      dimensions: 'مواصفات سريعة',
      material: 'خامة افتراضية',
      quantity: 1,
      customerName: 'عميل اختبار',
      notes: 'أمر تجريبي سريع'
    });
  };

  // Delete Job
  const handleDeleteJob = async (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setUnacknowledgedJobs((prev) => prev.filter((j) => j.id !== id));
    try {
      await fetch(`/api/files/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting job:', e);
    }
  };

  const pendingCount = jobs.filter((j) => j.status === 'pending').length;

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white dir-rtl text-right select-none">
      
      {/* Top Navbar */}
      <Navbar
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConfig={() => setIsConfigOpen(true)}
        onChangeDate={(newDate) => handleSaveConfig({ currentDate: newDate })}
        onOpenNewJob={() => {
          setSelectedPrinterForNewJob('eco');
          setIsNewJobOpen(true);
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onRefresh={fetchFiles}
        isRefreshing={isRefreshing}
        totalJobsCount={jobs.length}
        pendingJobsCount={pendingCount}
        unacknowledgedCount={unacknowledgedJobs.length}
        onAcknowledgeAlert={handleAcknowledgeAlert}
      />

      {/* Cascading Red Notification Banner with Sound */}
      <NewOrderNotification
        unacknowledgedJobs={unacknowledgedJobs}
        onAcknowledge={handleAcknowledgeAlert}
        onSelectJob={setSelectedJobDetails}
      />

      {/* Main Container - Fills screen without outer scrolling */}
      <main className="flex-1 w-full px-2 sm:px-3 py-2 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'kanban' && (
          <KanbanBoard
            jobs={jobs}
            onMoveJob={handleMoveJob}
            onSelectJob={setSelectedJobDetails}
            onDeleteJob={handleDeleteJob}
            onOpenNewJobWithPrinter={(printer) => {
              setSelectedPrinterForNewJob(printer);
              setIsNewJobOpen(true);
            }}
          />
        )}

        {activeTab === 'compact' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <CompactGrid
              jobs={jobs}
              onMoveJob={handleMoveJob}
              onSelectJob={setSelectedJobDetails}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <StatsOverview jobs={jobs} />
          </div>
        )}
      </main>

      {/* Quick Simulator & Status Bar at bottom */}
      <QuickSimulatorBar
        onAddQuickJob={handleAddQuickJob}
        onAutoPoll={fetchFiles}
        isPolling={isRefreshing}
      />

      {/* Modals */}
      <NetworkConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      <NewJobModal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        defaultPrinter={selectedPrinterForNewJob}
        onAddJob={handleAddJob}
      />

      {isExportOpen && (
        <ExportReportModal
          onClose={() => setIsExportOpen(false)}
        />
      )}

      <JobDetailsModal
        job={selectedJobDetails}
        onClose={() => setSelectedJobDetails(null)}
        onMoveJob={handleMoveJob}
        basePath={config.basePath}
        currentDate={config.currentDate}
      />

    </div>
  );
}
