export type UserRole = 'admin' | 'employee';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  photoURL?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface Customer {
  id: string;
  customerNumber: string; // e.g. CUST-1001
  name: string;
  companyName: string;
  phone: string;
  whatsapp: string;
  address: string;
  email: string;
  notes: string;
  totalInvoiced: number; // in JOD
  totalPaid: number; // in JOD
  balance: number; // in JOD
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'new'
  | 'designing'
  | 'approved'
  | 'printing'
  | 'finishing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type PricingMode = 'sqm' | 'linear_meter' | 'piece' | 'manual';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cliq' | 'card' | 'cheque';

export interface OrderItem {
  id: string;
  description: string;
  printingType: string;
  machineId?: string;
  machineName?: string;
  materialId?: string;
  materialName?: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  printedQuantity?: number; // Quantity completed so far
  wasteQuantity?: number; // Defective / scrap pieces
  totalAreaSqm?: number; // Calculated area in m²
  totalLinearMeters?: number; // Calculated linear meters
  pricingMode: PricingMode;
  unitPrice: number;
  additionalFees: number;
  total: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-2026-0001
  customerId: string;
  customerName: string;
  customerPhone?: string;
  orderDate: string;
  deliveryDate: string;
  description: string;
  printingType: string;
  machineId?: string;
  machineName?: string;
  materialId?: string;
  materialName?: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  printedQuantity?: number; // Total completed items across the order
  wasteQuantity?: number; // Total waste/damaged items
  totalAreaSqm?: number; // Total m² to print
  totalLinearMeters?: number; // Total linear meters
  pricingMode: PricingMode;
  unitPrice: number;
  additionalFees: number;
  discount: number;
  totalAmount: number; // in JOD
  paidAmount: number; // in JOD
  remainingBalance: number; // in JOD
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  productionNotes?: string;
  assignedEmployee?: string;
  fileAttachment?: string;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PrintLog {
  id: string;
  orderId: string;
  orderNumber: string;
  itemId?: string;
  itemDescription?: string;
  customerId: string;
  customerName: string;
  machineId: string;
  machineName: string;
  materialId?: string;
  materialName?: string;
  quantityPrinted: number; // e.g. pieces or copies completed in this run
  wasteQuantity: number; // e.g. damaged or defective pieces in this run
  areaSqm: number; // m² printed in this batch
  linearMeters: number; // linear meters in this batch
  operator: string;
  printSpeed?: string; // e.g. 4 Pass, 8 Pass, High-Speed
  notes?: string;
  printedAt: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string; // e.g. REC-2026-0001
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  amount: number; // in JOD
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Machine {
  id: string;
  name: string;
  code: string;
  type: string;
  maxPrintWidthCm: number;
  status: 'active' | 'maintenance' | 'idle' | 'archived';
  notes?: string;
  totalPrintedSqm?: number; // Odometer: Total m² printed on this machine
  totalPrintedLinearM?: number; // Odometer: Total linear meters printed
  totalPrintedPieces?: number; // Total piece count
  lastMaintenanceMeter?: number; // Meter reading at last service
  nextMaintenanceMeter?: number; // Scheduled next maintenance meter
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPerUnit: number; // in JOD
  sellPricePerUnit: number; // in JOD
  stockQuantity: number;
  minStockThreshold: number;
  isArchived: boolean;
  createdAt: string;
}

export interface PrintShopCompanySettings {
  companyName: string;
  companyNameEn?: string;
  companyPhone: string;
  companyWhatsapp: string;
  companyEmail: string;
  companyAddress: string;
  taxNumber?: string;
  currency: string;
  invoiceFooter?: string;
  logoUrl?: string;
}

export const PRINTING_TYPES = [
  'طباعة يو في مسطح (UV Flatbed)',
  'طباعة يو في رول (UV Roll-to-Roll)',
  'سولفنت خارجي (Solvent Large Format)',
  'إيكو سولفنت عالي الدقة (Eco-Solvent HD)',
  'يو في دي تي إف (UV DTF Stickers)',
  'طباعة دي تي إف ملابس (DTF Textile)',
  'طباعة سبلميشن حراري (Sublimation)',
  'فليكس وبانر مضيء (Flex Banner)',
  'فينيل ولاصق سيارات (Vinyl Sticker & Vehicle Wrap)',
  'راوتر وحفر سي إن سي (CNC Router & Carving)',
  'قص وتفريغ ليزر (Laser Cutting & Engraving)',
  'لوحات أكريليك وزنكور (Acrylic & Signage)',
  'طباعة رقمية ورقية (Digital Laser Paper)',
  'أخرى (Other)'
] as const;

export const ORDER_STATUS_DETAILS: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  new: { label: 'طلب جديد', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  designing: { label: 'قيد التصميم', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  approved: { label: 'معتمد للإنتاج', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  printing: { label: 'قيد الطباعة', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  finishing: { label: 'قيد التشطيب والقص', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  ready: { label: 'جاهز للتسليم', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  delivered: { label: 'تم التسليم', color: 'text-teal-300', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
  cancelled: { label: 'ملغي', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
};

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'نقداً (Cash)' },
  { id: 'cliq', label: 'كليك (CliQ)' },
  { id: 'bank_transfer', label: 'تحويل بنكي (Bank Transfer)' },
  { id: 'card', label: 'بطاقة إلكترونية (Visa/Mastercard)' },
  { id: 'cheque', label: 'شيك بنكي (Cheque)' },
];

export const PRICING_MODES: { id: PricingMode; label: string; unitText: string }[] = [
  { id: 'sqm', label: 'بالمتر المربع (م²)', unitText: 'م²' },
  { id: 'linear_meter', label: 'بالمتر الطولي (م.ط)', unitText: 'م.ط' },
  { id: 'piece', label: 'بالقطعة (حبة)', unitText: 'قطعة' },
  { id: 'manual', label: 'سعر إجمالي يدوي', unitText: 'إجمالي' },
];
