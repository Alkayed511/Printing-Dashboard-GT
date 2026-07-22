import { PrinterInfo, PrinterType } from '../types';

export const PRINTERS_LIST: PrinterInfo[] = [
  {
    id: 'eco',
    nameAr: 'أيكو إيكوسولفنت (ECO)',
    nameEn: 'Eco Solvent',
    icon: 'Printer',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    accentColor: '#10b981',
    description: 'طباعة الفينيل والستيكر والبنر عالي الدقة للإعلانات الداخلية والخارجية'
  },
  {
    id: 'solvint',
    nameAr: 'سولفنت (SOLVINT)',
    nameEn: 'Solvent Large Format',
    icon: 'Layers',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    badgeText: 'text-amber-600 dark:text-amber-400',
    accentColor: '#f59e0b',
    description: 'طباعة البنرات الضخمة واللوحات الطرقية والفليكس بأسعار اقتصادية'
  },
  {
    id: 'r2r',
    nameAr: 'رول إلى رول (R2R)',
    nameEn: 'Roll to Roll (R2R)',
    icon: 'Repeat',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    badgeText: 'text-blue-600 dark:text-blue-400',
    accentColor: '#3b82f6',
    description: 'طباعة رول متصل أوفست ويو في / لاتكس للستائر والستيكرات المتصلة'
  },
  {
    id: 'cutter',
    nameAr: 'كاتر بلوتر (CUTTER)',
    nameEn: 'Cutter Plotter',
    icon: 'Scissors',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    badgeText: 'text-rose-600 dark:text-rose-400',
    accentColor: '#f43f5e',
    description: 'قص وتفريغ الفينيل والستيكر المطبوع وغير المطبوع والتنعيم'
  },
  {
    id: 'dtf',
    nameAr: 'دي تي إف قماش (DTF)',
    nameEn: 'Direct to Film (DTF)',
    icon: 'Shirt',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
    badgeText: 'text-purple-600 dark:text-purple-400',
    accentColor: '#a855f7',
    description: 'طباعة أفلام الحرارة للملابس والأقمشة والتيشيرتات والمنتجات النسيجية'
  },
  {
    id: 'flat',
    nameAr: 'فلات بيد UV (FLAT)',
    nameEn: 'UV Flatbed',
    icon: 'Box',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
    badgeText: 'text-orange-600 dark:text-orange-400',
    accentColor: '#6366f1',
    description: 'طباعة مباشرة على الأسطح المسطحة (خشب، أكليريك، فوركس، صاج، زجاج)'
  },
  {
    id: 'flat small',
    nameAr: 'فلات سمول (FLAT SMALL)',
    nameEn: 'Flatbed Samel / Specialty',
    icon: 'Maximize',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800',
    badgeText: 'text-cyan-600 dark:text-cyan-400',
    accentColor: '#06b6d4',
    description: 'طابعة الأسطح والمنتجات الخاصة والعينات الصغيرة والدروع'
  }
];
