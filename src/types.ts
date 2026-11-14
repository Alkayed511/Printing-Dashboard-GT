export interface Department {
  id: string;
  name: string;
}

export interface Printer {
  id: string;
  name: string;
  departmentId: string;
}

export type PrinterType = string;

export type FileStatus = 'pending' | 'done';

export type JobPriority = 'urgent' | 'high' | 'medium' | 'low';

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
  customerId?: string;
  fileSignature?: string; // metadata key for reconciling renamed files in the print ledger
  notes?: string;
  previewColor?: string;
  priority?: JobPriority;
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
  notificationSound?: string;
  customSoundUrl?: string;
  notificationColor?: string;
  notificationDuration?: number;
  disableMouseInDisplayMode?: boolean;
  themeColor?: string;
  secondaryColor?: string;
  localIp?: string;
  language?: 'ar' | 'en';
  departments?: Department[];
  printers?: Printer[];
  production?: ProductionSettings;
  branding?: BrandingSettings;
}

export interface BrandingSettings {
  name: string;
  tagline: string;
  logo: string;
  logoSize: number;
  themeMode: 'dark' | 'light' | 'system';
  accentColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: 'system' | 'tahoma' | 'arial';
  corners: 'soft' | 'rounded' | 'sharp';
  density: 'comfortable' | 'compact';
  reduceMotion: boolean;
}

export interface ProductionSettings {
  jobSort: 'priority' | 'oldest' | 'newest' | 'name';
  printerSort: 'workload' | 'configured' | 'name';
  defaultStatus: 'pending' | 'done' | 'all';
  hideEmptyPrinters: boolean;
  cardDensity: 'comfortable' | 'compact';
  showSummary: boolean;
  confirmFileMoves: boolean;
  allowFileDeletion: boolean;
}

export interface VoiceNote {
  id: string;
  audioUrl: string;
  sender: string;
  departmentId?: string | 'all';
  timestamp: string;
  durationSeconds?: number;
}

export interface PrintStats {
  totalJobs: number;
  pendingJobs: number;
  doneJobs: number;
  completionRate: number;
  byPrinter: Record<PrinterType, { pending: number; done: number; total: number }>;
}
