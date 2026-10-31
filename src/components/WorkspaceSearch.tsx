import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowUpLeft, Command, FileSearch, Search, X} from 'lucide-react';
import type {PrintJob} from '../types';
import type {WorkspaceTab} from './ModernWorkspaceShell';

type Destination = {tab: WorkspaceTab; label: string};
type Props = {open: boolean; onClose: () => void; jobs: PrintJob[]; destinations: Destination[]; onNavigate: (tab: WorkspaceTab) => void; onSelectJob: (job: PrintJob) => void; isAr: boolean};

export default function WorkspaceSearch({open, onClose, jobs, destinations, onNavigate, onSelectJob, isAr}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const tx = (ar: string, en: string) => isAr ? ar : en;
  const normalize = (value: string) => value.normalize('NFKC').replace(/[\u064B-\u065F\u0670]/g, '').toLocaleLowerCase().trim();
  const results = useMemo(() => {
    const needle = normalize(query);
    return {pages: destinations.filter(item => !needle || normalize(item.label).includes(needle)), jobs: needle ? jobs.filter(job => normalize([job.filename, job.customerName, job.printer, job.material].join(' ')).includes(needle)).slice(0, 8) : []};
  }, [query, destinations, jobs]);

  useEffect(() => {
    if (open) {setQuery(''); dialog.current?.showModal(); input.current?.focus();}
    else dialog.current?.close();
  }, [open]);

  return <dialog ref={dialog} className="gt-command-dialog" dir={isAr ? 'rtl' : 'ltr'} aria-labelledby="gt-search-title" onCancel={onClose} onClick={event => {if (event.target === dialog.current) onClose();}}>
    <div className="gt-command-content">
      <div className="gt-command-input"><Search size={21}/><label className="sr-only" id="gt-search-title" htmlFor="gt-global-search">{tx('البحث في الملفات والصفحات', 'Search files and pages')}</label><input id="gt-global-search" ref={input} value={query} onChange={event => setQuery(event.target.value)} placeholder={tx('ابحث عن ملف، عميل، أو صفحة…', 'Search for a file, customer, or page…')}/><button type="button" onClick={onClose} aria-label={tx('إغلاق البحث', 'Close search')}><X size={19}/></button></div>
      <div className="gt-command-results">
        {results.jobs.length > 0 && <><p className="gt-command-label">{tx('ملفات الطباعة', 'Print files')}</p>{results.jobs.map(job => <button type="button" className="gt-command-result" key={job.id} onClick={() => {onClose(); onSelectJob(job);}}><FileSearch size={19}/><span><strong>{job.filename}</strong><small>{job.customerName || tx('عميل غير محدد', 'Unassigned customer')} · {job.printer}</small></span><ArrowUpLeft size={15}/></button>)}</>}
        {results.pages.length > 0 && <><p className="gt-command-label">{tx('انتقال سريع', 'Quick navigation')}</p>{results.pages.map(item => <button type="button" className="gt-command-result" key={item.tab} onClick={() => {onClose(); onNavigate(item.tab);}}><Command size={17}/><span>{item.label}</span><ArrowUpLeft size={15}/></button>)}</>}
        {!results.jobs.length && !results.pages.length && <div className="gt-empty-state"><Search size={28}/><strong>{tx('لا توجد نتائج مطابقة', 'No matching results')}</strong><p>{tx('جرّب اسم الملف أو العميل أو الطابعة.', 'Try a file, customer, or printer name.')}</p></div>}
      </div>
      <footer className="gt-command-footer">{tx('ابحث في ملفات تاريخ العمل الحالي', 'Search files for the current work date')}<span><kbd>Esc</kbd> {tx('للإغلاق', 'to close')}</span></footer>
    </div>
  </dialog>;
}
