import fs from 'node:fs';
import path from 'node:path';
import type {ServerConfig, Printer} from '../types.ts';
import {productionDefaults, productionSettings} from '../utils/production.ts';
import {validateBranding} from './brandingConfig.ts';

export function validFolderName(value: unknown, max = 100): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max && value === value.trim() && !/[\\/:*?"<>|\x00-\x1f]/.test(value) && !/[. ]$/.test(value) && !['.', '..'].includes(value) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value);
}
function text(value: unknown, label: string, max = 1000) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`قيمة غير صالحة: ${label}`);
  return value.trim();
}
export function updateServerConfig(current: ServerConfig, input: unknown): ServerConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('إعدادات غير صالحة');
  const body = input as Record<string, unknown>;
  const next = {...current};
  if (body.branding !== undefined) next.branding = validateBranding(current.branding, body.branding);
  if (body.basePath !== undefined) {
    const basePath = text(body.basePath, 'مسار الإنتاج', 2000);
    if (!path.isAbsolute(basePath) || /[\x00-\x1f]/.test(basePath)) throw new Error('أدخل مسار إنتاج مطلقًا وصالحًا');
    next.basePath = basePath;
  }
  if (body.currentDate !== undefined) {
    const date = text(body.currentDate, 'مجلد تاريخ العمل', 100);
    if (!validFolderName(date)) throw new Error('تاريخ العمل يجب أن يكون اسم مجلد واحد صالحًا');
    next.currentDate = date;
  }
  for (const key of ['autoRefreshInterval', 'notificationDuration'] as const) if (body[key] !== undefined) {
    const value = body[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 300 || (key === 'autoRefreshInterval' && value === 1)) throw new Error('فترة التحديث أو التنبيه غير صالحة');
    next[key] = value;
  }
  const choices = {language: ['ar','en'], themeColor: ['orange','blue','green','purple','rose'], secondaryColor: ['orange','blue','green','purple','rose'], notificationColor: ['red','orange','blue','green','purple'], notificationSound: ['default','alt1','alt2','shorts','faaaaaa','custom','off','fa','viral']};
  for (const [key, values] of Object.entries(choices)) if (body[key] !== undefined) {
    if (!values.includes(body[key] as string)) throw new Error(`خيار غير صالح: ${key}`);
    Object.assign(next, {[key]: body[key]});
  }
  if (body.disableMouseInDisplayMode !== undefined) {
    if (typeof body.disableMouseInDisplayMode !== 'boolean') throw new Error('إعداد العرض غير صالح');
    next.disableMouseInDisplayMode = body.disableMouseInDisplayMode;
  }
  if (body.localIp !== undefined) next.localIp = text(body.localIp, 'عنوان الشبكة', 255);
  if (body.customSoundUrl !== undefined) {
    if (typeof body.customSoundUrl !== 'string' || body.customSoundUrl.length > 4_300_000) throw new Error('حجم الصوت المخصص غير صالح');
    next.customSoundUrl = body.customSoundUrl;
  }
  if (body.departments !== undefined) {
    if (!Array.isArray(body.departments) || body.departments.length > 100) throw new Error('قائمة الأقسام غير صالحة');
    next.departments = body.departments.map(item => ({id: text(item?.id, 'معرّف القسم', 100), name: text(item?.name, 'اسم القسم', 150)}));
    if (next.departments.some(item => !item.id || !item.name) || new Set(next.departments.map(item => item.id)).size !== next.departments.length) throw new Error('الأقسام تتطلب أسماء ومعرّفات غير مكررة');
  }
  if (body.printers !== undefined) {
    if (!Array.isArray(body.printers) || body.printers.length > 200) throw new Error('قائمة الطابعات غير صالحة');
    next.printers = body.printers.map(item => ({id: text(item?.id, 'مجلد الطابعة', 100), name: text(item?.name, 'اسم الطابعة', 150), departmentId: text(item?.departmentId, 'قسم الطابعة', 100)}));
    if (next.printers.some(item => !validFolderName(item.id) || item.id.toLowerCase() === 'done' || !item.name || !next.departments?.some(department => department.id === item.departmentId))) throw new Error('تحقق من اسم مجلد كل طابعة والقسم المرتبط بها');
    if (new Set(next.printers.map(item => item.id.toLowerCase())).size !== next.printers.length) throw new Error('مجلدات الطابعات يجب أن تكون غير مكررة');
  }
  if (body.production !== undefined) {
    if (!body.production || typeof body.production !== 'object' || Array.isArray(body.production)) throw new Error('إعدادات الإنتاج غير صالحة');
    const source = body.production as Record<string, unknown>;
    const production = productionSettings(current.production);
    const options = {jobSort: ['priority','oldest','newest','name'], printerSort: ['workload','configured','name'], defaultStatus: ['pending','done','all'], cardDensity: ['comfortable','compact']};
    for (const key of Object.keys(productionDefaults)) if (source[key] !== undefined) {
      if (key in options) {
        if (!options[key as keyof typeof options].includes(source[key] as string)) throw new Error(`إعداد إنتاج غير صالح: ${key}`);
      } else if (typeof source[key] !== 'boolean') throw new Error(`إعداد إنتاج غير صالح: ${key}`);
      Object.assign(production, {[key]: source[key]});
    }
    next.production = production;
  }
  if (body.departments !== undefined && next.printers?.some(printer => !next.departments?.some(department => department.id === printer.departmentId))) throw new Error('توجد طابعات مرتبطة بقسم غير موجود');
  return next;
}

type FolderState = 'available' | 'missing' | 'unreadable';
function folderState(folder: string): FolderState {
  try {if (!fs.statSync(folder).isDirectory()) return 'missing'; fs.accessSync(folder, fs.constants.R_OK); return 'available';}
  catch (error) {return (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'unreadable';}
}
export function inspectProductionStorage(basePath: string, date: string, printers: Printer[]) {
  if (!path.isAbsolute(basePath) || !validFolderName(date) || printers.some(printer => !validFolderName(printer.id))) throw new Error('أدخل مسارًا مطلقًا وأسماء مجلدات صالحة');
  const activePath = path.join(basePath, date);
  return {basePath: folderState(basePath), dateFolder: folderState(activePath), activePath, printers: printers.map(printer => ({id: printer.id, name: printer.name, pending: folderState(path.join(activePath, printer.id)), done: folderState(path.join(activePath, printer.id, 'done'))}))};
}
