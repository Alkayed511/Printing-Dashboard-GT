import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PrintJob, PrinterType, FileStatus, ServerConfig } from './types';
import {
  Order,
  Customer,
  Payment,
  Machine,
  Material,
  PrintShopCompanySettings,
  PrintLog,
} from './types/printManager';
import {
  listenToOrders,
  listenToCustomers,
  listenToPayments,
  listenToMachines,
  listenToMaterials,
  listenToCompanySettings,
  listenToPrintLogs,
  seedInitialDataIfEmpty,
  companySettingsDefaults
} from './firebase/services';
import { useAuth } from './context/AuthContext';
import { PrintManagerLayout, MainTabType } from './components/printmanager/PrintManagerLayout';
import { DashboardView } from './components/printmanager/DashboardView';
import { CustomersView } from './components/printmanager/CustomersView';
import { OrdersView } from './components/printmanager/OrdersView';
import { PrintLogsView } from './components/printmanager/PrintLogsView';
import { PaymentsView } from './components/printmanager/PaymentsView';
import { MachinesMaterialsView } from './components/printmanager/MachinesMaterialsView';
import { ReportsView } from './components/printmanager/ReportsView';
import { OrderModal } from './components/printmanager/OrderModal';
import { CustomerModal } from './components/printmanager/CustomerModal';
import { PaymentModal } from './components/printmanager/PaymentModal';
import { DocumentModal } from './components/printmanager/DocumentModal';
import { StaffManagementModal } from './components/printmanager/StaffManagementModal';
import { CompanySettingsModal } from './components/printmanager/CompanySettingsModal';
import { LogPrintQuantityModal } from './components/printmanager/LogPrintQuantityModal';

// Existing Kanban & Workshop Display Components
import { KanbanBoard } from './components/KanbanBoard';
import { JobDetailsModal } from './components/JobDetailsModal';
import { ExportReportModal } from './components/ExportReportModal';
import { DepartmentSelector } from './components/DepartmentSelector';
import { DisplayVoiceAnnouncer } from './components/DisplayVoiceAnnouncer';
import { playNotificationSound } from './utils/audio';
import { translations } from './translations';
import { Navbar } from './components/Navbar';

export default function App() {
  const isDisplayMode = new URLSearchParams(window.location.search).get('display') === 'true';
  const { currentUser, userProfile, isAdmin, role } = useAuth();

  // Firestore Real-Time Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [printLogs, setPrintLogs] = useState<PrintLog[]>([]);
  const [companySettings, setCompanySettings] = useState<PrintShopCompanySettings>(companySettingsDefaults);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<MainTabType>('dashboard');

  // Modals State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderInitialCustomer, setOrderInitialCustomer] = useState<Customer | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInitialOrder, setPaymentInitialOrder] = useState<Order | null>(null);
  const [paymentInitialCustomer, setPaymentInitialCustomer] = useState<Customer | null>(null);

  const [documentModalState, setDocumentModalState] = useState<{
    isOpen: boolean;
    type: 'invoice' | 'ticket';
    order: Order | null;
  }>({
    isOpen: false,
    type: 'ticket',
    order: null,
  });

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isCompanySettingsModalOpen, setIsCompanySettingsModalOpen] = useState(false);
  const [isLogPrintModalOpen, setIsLogPrintModalOpen] = useState(false);
  const [logPrintTargetOrderId, setLogPrintTargetOrderId] = useState<string | undefined>(undefined);

  // -------------------------------------------------------------
  // Legacy / File-watcher Jobs for Kanban tab & ?display=true mode
  // -------------------------------------------------------------
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [unacknowledgedJobs, setUnacknowledgedJobs] = useState<PrintJob[]>([]);
  const seenJobIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);
  const [selectedJobDetails, setSelectedJobDetails] = useState<PrintJob | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [config, setConfig] = useState<ServerConfig>({
    basePath: 'C:\\Users\\gt511\\OneDrive\\Desktop\\share',
    currentDate: `${new Date().getDate()}-${new Date().getMonth() + 1}`,
    autoRefreshInterval: 5,
    isRealStorageAvailable: false,
    activePath: '',
    language: 'ar'
  });

  const [myDepartment, setMyDepartment] = useState<string | 'all' | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const deptParam = urlParams.get('dept');
    if (deptParam) return deptParam;
    const targetJobId = urlParams.get('jobId') || urlParams.get('job');
    if (targetJobId) {
      return (localStorage.getItem('myDepartment') as string | 'all') || 'all';
    }
    return (localStorage.getItem('myDepartment') as string | 'all') || 'all';
  });

  // -------------------------------------------------------------
  // Attach Real-Time Firestore Subscriptions
  // -------------------------------------------------------------
  useEffect(() => {
    // Seed initial default equipment and samples if database is brand new
    seedInitialDataIfEmpty();

    const unsubOrders = listenToOrders(setOrders);
    const unsubCustomers = listenToCustomers(setCustomers);
    const unsubPayments = listenToPayments(setPayments);
    const unsubMachines = listenToMachines(setMachines);
    const unsubMaterials = listenToMaterials(setMaterials);
    const unsubPrintLogs = listenToPrintLogs(setPrintLogs);
    const unsubSettings = listenToCompanySettings(setCompanySettings);

    return () => {
      unsubOrders();
      unsubCustomers();
      unsubPayments();
      unsubMachines();
      unsubMaterials();
      unsubPrintLogs();
      unsubSettings();
    };
  }, []);

  // Sync URL query for order modal or job details
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetJobId = urlParams.get('jobId') || urlParams.get('job');
    if (targetJobId && orders.length > 0) {
      const foundOrder = orders.find(o => o.id === targetJobId || o.orderNumber === targetJobId);
      if (foundOrder) {
        setDocumentModalState({ isOpen: true, type: 'ticket', order: foundOrder });
      }
    }
  }, [orders]);

  // Fetch local server config and files for Kanban/Display mode
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/config?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      // serverless or offline fallback
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/files?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      // fallback
    } finally {
      setIsRefreshing(false);
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

  const handleMoveJob = async (jobId: string, targetStatus: FileStatus, printer?: PrinterType) => {
    try {
      const res = await fetch('/api/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, targetStatus, printer })
      });
      if (res.ok) fetchFiles();
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
      if (res.ok) fetchFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/files/${jobId}`, { method: 'DELETE' });
      if (res.ok) fetchFiles();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchFiles();
  }, [fetchConfig, fetchFiles]);

  const visibleJobs = myDepartment && myDepartment !== 'all'
    ? jobs.filter(j => {
        const deptPrinters = (config.printers || []).filter(p => p.departmentId === myDepartment).map(p => p.id);
        return deptPrinters.includes(j.printer);
      })
    : jobs;

  // Pending count for navbar badges
  const pendingOrdersCount = orders.filter(
    o => o.status === 'new' || o.status === 'designing' || o.status === 'approved' || o.status === 'printing'
  ).length;

  // -------------------------------------------------------------
  // If user requested Dedicated Big-Screen Workshop Display Mode (?display=true)
  // -------------------------------------------------------------
  if (isDisplayMode) {
    const t = translations[config.language || 'ar'];
    return (
      <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col dir-rtl text-right select-none">
        <DisplayVoiceAnnouncer myDepartment={myDepartment || 'all'} language={config.language || 'ar'} />
        <main className="flex-1 w-full px-2 sm:px-3 py-2 overflow-hidden flex flex-col min-h-0">
          <KanbanBoard
            config={config}
            myDepartment={myDepartment || 'all'}
            jobs={visibleJobs}
            onMoveJob={handleMoveJob}
            onSelectJob={setSelectedJobDetails}
            onDeleteJob={handleDeleteJob}
            onUpdateJob={handleUpdateJob}
            language={config.language || 'ar'}
          />
        </main>
        <JobDetailsModal
          config={config}
          job={selectedJobDetails}
          onClose={() => setSelectedJobDetails(null)}
          onMoveJob={handleMoveJob}
          onUpdateJob={handleUpdateJob}
          basePath={config.basePath}
          currentDate={config.currentDate}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // Full Professional Print Manager System
  // -------------------------------------------------------------
  return (
    <PrintManagerLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pendingOrdersCount={pendingOrdersCount}
      openStaffModal={() => setIsStaffModalOpen(true)}
      openCompanySettingsModal={() => setIsCompanySettingsModalOpen(true)}
    >
      {/* Module 1: Dashboard */}
      {activeTab === 'dashboard' && (
        <DashboardView
          orders={orders}
          customers={customers}
          machines={machines}
          printLogs={printLogs}
          onOpenNewOrder={() => {
            setEditingOrder(null);
            setOrderInitialCustomer(null);
            setIsOrderModalOpen(true);
          }}
          onOpenNewCustomer={() => {
            setEditingCustomer(null);
            setIsCustomerModalOpen(true);
          }}
          onSelectOrder={(order) => {
            setDocumentModalState({ isOpen: true, type: 'ticket', order });
          }}
          onNavigateTab={setActiveTab}
          onOpenLogPrintQuantity={(orderId) => {
            setLogPrintTargetOrderId(orderId);
            setIsLogPrintModalOpen(true);
          }}
        />
      )}

      {/* Module 2: Customers */}
      {activeTab === 'customers' && (
        <CustomersView
          customers={customers}
          orders={orders}
          payments={payments}
          isAdmin={isAdmin}
          onOpenNewOrderForCustomer={(cust) => {
            setEditingOrder(null);
            setOrderInitialCustomer(cust);
            setIsOrderModalOpen(true);
          }}
          onOpenNewPaymentForCustomer={() => {
            setIsLogPrintModalOpen(true);
          }}
          onSelectOrder={(order) => {
            setDocumentModalState({ isOpen: true, type: 'ticket', order });
          }}
        />
      )}

      {/* Module 3: Orders */}
      {activeTab === 'orders' && (
        <OrdersView
          orders={orders}
          customers={customers}
          machines={machines}
          materials={materials}
          isAdmin={isAdmin}
          onSelectOrder={(order) => {
            setDocumentModalState({ isOpen: true, type: 'ticket', order });
          }}
          onOpenNewOrder={() => {
            setEditingOrder(null);
            setOrderInitialCustomer(null);
            setIsOrderModalOpen(true);
          }}
          onOpenPrintTicket={(order) => {
            setDocumentModalState({ isOpen: true, type: 'ticket', order });
          }}
        />
      )}

      {/* Module 4: Dedicated Print Quantities Log */}
      {activeTab === 'print_logs' && (
        <PrintLogsView
          logs={printLogs}
          machines={machines}
          materials={materials}
          orders={orders}
          onOpenLogModal={() => {
            setLogPrintTargetOrderId(undefined);
            setIsLogPrintModalOpen(true);
          }}
        />
      )}

      {/* Module 5: Machines & Materials */}
      {activeTab === 'machines' && (
        <MachinesMaterialsView
          machines={machines}
          materials={materials}
          orders={orders}
          isAdmin={isAdmin}
          onFilterOrdersByMachine={(machineId) => {
            setActiveTab('orders');
          }}
        />
      )}

      {/* Module 6: Reports & Analytics */}
      {activeTab === 'reports' && (
        <ReportsView
          orders={orders}
          customers={customers}
          machines={machines}
        />
      )}

      {/* Module: Production Kanban & Workshop Monitor */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">شاشة مراقبة الإنتاج والتشغيل (Kanban)</h2>
              <p className="text-xs text-slate-400">سحب وإفلات الأوامر بين حالات الانتظار، الطباعة، والإنجاز مع فحص الباركود</p>
            </div>
            <a
              href="?display=true"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition"
            >
              فتح شاشة العرض التلفزيوني للشوب (Display Mode)
            </a>
          </div>

          <div className="h-[75vh] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
            <KanbanBoard
              config={config}
              myDepartment={myDepartment || 'all'}
              jobs={visibleJobs}
              onMoveJob={handleMoveJob}
              onSelectJob={setSelectedJobDetails}
              onDeleteJob={handleDeleteJob}
              onUpdateJob={handleUpdateJob}
              language={config.language || 'ar'}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {isOrderModalOpen && (
        <OrderModal
          order={editingOrder}
          initialCustomer={orderInitialCustomer}
          existingCount={orders.length}
          customers={customers}
          machines={machines}
          materials={materials}
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setEditingOrder(null);
            setOrderInitialCustomer(null);
          }}
        />
      )}

      {isCustomerModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          existingCount={customers.length}
          isOpen={isCustomerModalOpen}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setEditingCustomer(null);
          }}
          isAdmin={isAdmin}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          initialOrder={paymentInitialOrder}
          initialCustomer={paymentInitialCustomer}
          orders={orders}
          customers={customers}
          existingPaymentsCount={payments.length}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentInitialOrder(null);
            setPaymentInitialCustomer(null);
          }}
        />
      )}

      {documentModalState.isOpen && (
        <DocumentModal
          type={documentModalState.type}
          order={documentModalState.order}
          customer={customers.find(c => c.id === documentModalState.order?.customerId)}
          settings={companySettings}
          isOpen={documentModalState.isOpen}
          onClose={() => setDocumentModalState({ isOpen: false, type: 'invoice', order: null })}
        />
      )}

      {isStaffModalOpen && (
        <StaffManagementModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
        />
      )}

      {isCompanySettingsModalOpen && (
        <CompanySettingsModal
          settings={companySettings}
          isOpen={isCompanySettingsModalOpen}
          onClose={() => setIsCompanySettingsModalOpen(false)}
        />
      )}

      {selectedJobDetails && (
        <JobDetailsModal
          config={config}
          job={selectedJobDetails}
          onClose={() => setSelectedJobDetails(null)}
          onMoveJob={handleMoveJob}
          onUpdateJob={handleUpdateJob}
          basePath={config.basePath}
          currentDate={config.currentDate}
        />
      )}

      {isLogPrintModalOpen && (
        <LogPrintQuantityModal
          isOpen={isLogPrintModalOpen}
          onClose={() => {
            setIsLogPrintModalOpen(false);
            setLogPrintTargetOrderId(undefined);
          }}
          orders={orders}
          machines={machines}
          materials={materials}
          initialOrderId={logPrintTargetOrderId}
        />
      )}
    </PrintManagerLayout>
  );
}
