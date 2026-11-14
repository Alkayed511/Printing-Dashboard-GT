import fs from 'node:fs';
import path from 'node:path';
import type {ServerConfig} from '../types.ts';
import {validFolderName} from './serverConfig.ts';

export function productionFoldersRequested(previous: ServerConfig, next: ServerConfig, force = false) {
  const ids = (config: ServerConfig) => (config.printers || []).map(printer => printer.id).sort().join('\0');
  return force || previous.basePath !== next.basePath || previous.currentDate !== next.currentDate || ids(previous) !== ids(next);
}

/** Create missing directories only. Never replace, move, or remove an existing entry. */
export function ensureProductionFolders(config: Pick<ServerConfig,'basePath'|'currentDate'|'printers'>) {
  const root = path.resolve(config.basePath);
  if (!path.isAbsolute(config.basePath) || !validFolderName(config.currentDate) || config.printers?.some(printer => !validFolderName(printer.id) || printer.id.toLowerCase() === 'done')) throw new Error('مسار الإنتاج أو أسماء مجلدات الطابعات غير صالحة');
  const datePath = path.join(root,config.currentDate);
  const folders = [root,datePath,...(config.printers || []).flatMap(printer => [path.join(datePath,printer.id),path.join(datePath,printer.id,'done')])];
  const inspect = (folder: string) => {
    try {
      const stat = fs.lstatSync(folder);
      if (folder !== root && stat.isSymbolicLink()) throw new Error('أحد مجلدات الإنتاج رابط إلى مسار آخر؛ اختر مجلدًا مباشرًا');
      if (!(folder === root ? fs.statSync(folder) : stat).isDirectory()) throw new Error('يوجد ملف مكان أحد مجلدات الإنتاج؛ لم يتم استبداله');
      return true;
    } catch (error) {if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error;}
  };
  // Detect existing file conflicts before creating any directories.
  for (const folder of folders) inspect(folder);
  let createdCount = 0;
  for (const folder of folders) {
    if (!inspect(folder)) {fs.mkdirSync(folder,{recursive:true}); createdCount++;}
  }
  return {createdCount,printerCount:config.printers?.length || 0,datePath};
}
