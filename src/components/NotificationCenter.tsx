import React, {useEffect, useRef} from 'react';
import {Bell, CheckCheck, FileText, Settings2, X} from 'lucide-react';
import type {PrintJob} from '../types';

type Props = {open: boolean; onClose: () => void; alerts: PrintJob[]; onReadAll: () => void; onSelect: (job: PrintJob) => void; onSettings: () => void; isAr: boolean};
export default function NotificationCenter({open,onClose,alerts,onReadAll,onSelect,onSettings,isAr}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const tx = (ar:string,en:string) => isAr ? ar : en;
  useEffect(() => {if(open) dialog.current?.showModal(); else dialog.current?.close();},[open]);
  return <dialog ref={dialog} className="gt-notifications-dialog" dir={isAr?'rtl':'ltr'} aria-labelledby="gt-notification-title" onCancel={onClose} onClick={event=>{if(event.target===dialog.current)onClose();}}><div className="gt-notifications-content"><header><span><Bell size={19}/><strong id="gt-notification-title">{tx('التنبيهات','Notifications')}</strong><small>{alerts.length}</small></span><button type="button" aria-label={tx('إغلاق التنبيهات','Close notifications')} onClick={onClose}><X size={18}/></button></header>{alerts.length>0 ? <><button type="button" className="gt-read-all" onClick={onReadAll}><CheckCheck size={15}/>{tx('تمت قراءة الكل','Mark all as read')}</button><div className="gt-notification-list">{alerts.map(job=><button type="button" key={job.id} onClick={()=>{onClose();onSelect(job);}}><span><FileText size={19}/></span><div><strong>{job.filename}</strong><small>{job.customerName || tx('ملف إنتاج جديد','New production file')} · {job.printer}</small></div></button>)}</div></> : <div className="gt-notifications-empty"><span><CheckCheck size={29}/></span><h3>{tx('كل شيء تحت المتابعة','You’re all caught up')}</h3><p>{tx('ستظهر هنا تنبيهات الملفات الجديدة.','New file alerts will appear here.')}</p></div>}<footer><button type="button" onClick={()=>{onClose();onSettings();}}><Settings2 size={16}/>{tx('إعدادات التنبيهات','Notification preferences')}</button></footer></div></dialog>;
}
