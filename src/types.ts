export type PrinterType = 'eco' | 'solvint' | 'r2r' | 'cutter' | 'dtf' | 'flat' | 'flat samel';

export type FileStatus = 'pending' | 'done';

export interface PrintJob {
  id: string;
  filename: string;
  printer: PrinterType;
  status: FileStatus;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  dimensions?: string;
  material?: string;
  quantity?: number;
  customerName?: string;
  notes?: string;
  previewColor?: string;
}

export interface PrinterInfo {
  id: PrinterType;
  nameAr: string;
  nameEn: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  description: string;
}

export interface ServerConfig {
  basePath: string;
  currentDate: string;
  autoRefreshInterval: number; // in seconds, 0 = off
  isRealStorageAvailable: boolean;
  activePath: string;
}

export interface PrintStats {
  totalJobs: number;
  pendingJobs: number;
  doneJobs: number;
  completionRate: number;
  byPrinter: Record<PrinterType, { pending: number; done: number; total: number }>;
}
