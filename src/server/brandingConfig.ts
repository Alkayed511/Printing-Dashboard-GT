import type {BrandingSettings} from '../types.ts';
import {resolveBranding} from '../utils/branding.ts';

export function validateBranding(current: BrandingSettings | undefined, input: unknown): BrandingSettings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('إعدادات الهوية غير صالحة');
  const source = input as Record<string, unknown>;
  const next = resolveBranding(current);
  for (const [key, max] of [['name',60],['tagline',100]] as const) if (source[key] !== undefined) {
    if (typeof source[key] !== 'string' || source[key].length > max || /[\x00-\x1f]/.test(source[key] as string)) throw new Error('اسم المطبعة أو الوصف غير صالح');
    next[key] = (source[key] as string).trim();
    if (key === 'name' && !next.name) throw new Error('اكتب اسم المطبعة');
  }
  const choices = {themeMode:['dark','light','system'],fontFamily:['system','tahoma','arial'],corners:['soft','rounded','sharp'],density:['comfortable','compact']};
  for (const [key, values] of Object.entries(choices)) if (source[key] !== undefined) {
    if (!values.includes(source[key] as string)) throw new Error('خيار مظهر غير صالح');
    Object.assign(next,{[key]:source[key]});
  }
  for (const [key, min, max] of [['fontSize',12,20],['logoSize',32,72]] as const) if (source[key] !== undefined) {
    if (!Number.isInteger(source[key]) || Number(source[key]) < min || Number(source[key]) > max) throw new Error('حجم الخط أو الشعار خارج النطاق المسموح');
    next[key] = source[key] as number;
  }
  for (const key of ['accentColor','textColor'] as const) if (source[key] !== undefined) {
    if (!(key === 'textColor' && source[key] === '') && (typeof source[key] !== 'string' || !/^#[a-fA-F0-9]{6}$/.test(source[key] as string))) throw new Error('استخدم لونًا صالحًا بصيغة HEX');
    next[key] = source[key] as string;
  }
  if (source.reduceMotion !== undefined) {
    if (typeof source.reduceMotion !== 'boolean') throw new Error('إعداد الحركة غير صالح');
    next.reduceMotion = source.reduceMotion;
  }
  if (source.logo !== undefined) {
    if (typeof source.logo !== 'string' || source.logo.length > 2_800_000) throw new Error('حجم الشعار أكبر من المسموح');
    if (source.logo) {
      const comma = source.logo.indexOf(',');
      const header = source.logo.slice(0,comma), encoded = source.logo.slice(comma+1);
      if (!['data:image/png;base64','data:image/jpeg;base64','data:image/webp;base64'].includes(header) || !/^[a-zA-Z0-9+/]+={0,2}$/.test(encoded)) throw new Error('الشعار يجب أن يكون صورة PNG أو JPG أو WebP');
      const bytes = Buffer.from(encoded,'base64');
      const png = header.includes('/png;') && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const jpeg = header.includes('/jpeg;') && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp = header.includes('/webp;') && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
      if (bytes.length > 2*1024*1024 || (!png && !jpeg && !webp)) throw new Error('ملف الشعار غير صالح أو يتجاوز 2 ميجابايت');
    }
    next.logo = source.logo;
  }
  return next;
}
