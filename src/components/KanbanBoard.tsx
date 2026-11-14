import React, {useEffect, useMemo, useState} from 'react';
import {DragDropContext, Droppable, Draggable, type DropResult} from '@hello-pangea/dnd';
import {Printer, Search, Settings2, Clock3, CircleCheck, Files, X, FilterX} from 'lucide-react';
import type {PrintJob, FileStatus, ServerConfig, ProductionSettings} from '../types';
import {productionSettings, sortProductionJobs, filterProductionJobs} from '../utils/production';
import {JobCard} from './JobCard';

interface Props {
  jobs: PrintJob[]; config: ServerConfig; myDepartment?: string | null; language?: 'ar' | 'en'; readOnly?: boolean;
  onMoveJob: (id: string, status: FileStatus, printer?: string) => void;
  onSelectJob: (job: PrintJob) => void; onDeleteJob: (id: string) => void;
  onUpdateJob?: (id: string, updates: Partial<PrintJob>) => void; onOpenSettings?: () => void;
}
export const KanbanBoard: React.FC<Props> = ({jobs, config, myDepartment, language = 'ar', readOnly = false, onMoveJob, onSelectJob, onDeleteJob, onUpdateJob, onOpenSettings}) => {
  const options = productionSettings(config.production);
  const [printerFilter, setPrinterFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(options.defaultStatus);
  const [sort, setSort] = useState(options.jobSort);
  const [hideEmpty, setHideEmpty] = useState(options.hideEmptyPrinters);
  const isAr = language === 'ar';
  const tx = (ar: string, en: string) => isAr ? ar : en;
  useEffect(() => setStatus(options.defaultStatus), [options.defaultStatus]);
  useEffect(() => setSort(options.jobSort), [options.jobSort]);
  useEffect(() => setHideEmpty(options.hideEmptyPrinters), [options.hideEmptyPrinters]);
  const filteredJobs = useMemo(() => sortProductionJobs(filterProductionJobs(jobs, status, query), sort), [jobs, status, query, sort]);
  const visiblePrinters = useMemo(() => {
    const printers = (config.printers || []).filter(printer => !myDepartment || myDepartment === 'all' || printer.departmentId === myDepartment);
    if (options.printerSort === 'configured') return printers;
    return [...printers].sort((a, b) => options.printerSort === 'name' ? a.name.localeCompare(b.name, language, {numeric: true}) : jobs.filter(job => job.printer === b.id && job.status === 'pending').length - jobs.filter(job => job.printer === a.id && job.status === 'pending').length);
  }, [config.printers, options.printerSort, myDepartment, jobs, language]);
  useEffect(() => {if (printerFilter !== 'ALL' && !visiblePrinters.some(printer => printer.id === printerFilter)) setPrinterFilter('ALL');}, [visiblePrinters, printerFilter]);
  const printers = visiblePrinters.filter(printer => (printerFilter === 'ALL' || printer.id === printerFilter) && (!hideEmpty || filteredJobs.some(job => job.printer === printer.id)));
  const unassigned = filteredJobs.filter(job => !visiblePrinters.some(printer => printer.id === job.printer)).length;
  const shown = filteredJobs.filter(job => printers.some(printer => printer.id === job.printer)).length;
  const clear = () => {setQuery(''); setPrinterFilter('ALL'); setStatus('all'); setHideEmpty(false);};
  const onDragEnd = ({source, destination, draggableId}: DropResult) => {
    if (readOnly || !destination || source.droppableId === destination.droppableId) return;
    const job = jobs.find(item => item.id === draggableId);
    if (job?.status === 'pending') onMoveJob(job.id, 'pending', destination.droppableId);
  };

  return <DragDropContext onDragEnd={onDragEnd}><div className={'gt-kanban-board gt-production-board gt-density-' + options.cardDensity} dir={isAr ? 'rtl' : 'ltr'}>
    {options.showSummary && <div className="gt-production-summary" aria-label={tx('ملخص الإنتاج', 'Production summary')}><span><Files size={17}/>{tx('إجمالي الملفات', 'Total files')}<strong>{jobs.length}</strong></span><span><Clock3 size={17}/>{tx('بالانتظار', 'Pending')}<strong>{jobs.filter(job => job.status === 'pending').length}</strong></span><span><CircleCheck size={17}/>{tx('منجزة', 'Completed')}<strong>{jobs.filter(job => job.status === 'done').length}</strong></span><span>{tx('المعروض', 'Showing')}<strong>{shown}</strong></span></div>}
    <div className="gt-kanban-filters gt-production-controls"><label className="gt-production-search"><Search size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={tx('اسم ملف، عميل، خامة أو طابعة…', 'File, customer, material, or printer…')} aria-label={tx('البحث في ملفات الإنتاج', 'Search production files')}/>{query && <button type="button" onClick={() => setQuery('')} aria-label={tx('مسح البحث', 'Clear search')}><X size={16}/></button>}</label><div className="gt-production-filter-fields"><label><span>{tx('الطابعة', 'Printer')}</span><select aria-label={tx('تصفية الطابعة', 'Filter printer')} value={printerFilter} onChange={event => setPrinterFilter(event.target.value)}><option value="ALL">{tx('جميع الطابعات', 'All printers')}</option>{visiblePrinters.map(printer => <option key={printer.id} value={printer.id}>{printer.name}</option>)}</select></label><label><span>{tx('الترتيب', 'Sort')}</span><select aria-label={tx('ترتيب ملفات الإنتاج', 'Production job order')} value={sort} onChange={event => setSort(event.target.value as ProductionSettings['jobSort'])}><option value="priority">{tx('الأولوية ثم الأقدم', 'Priority, then oldest')}</option><option value="oldest">{tx('الأقدم أولًا', 'Oldest first')}</option><option value="newest">{tx('الأحدث أولًا', 'Newest first')}</option><option value="name">{tx('اسم الملف', 'File name')}</option></select></label>{onOpenSettings && !readOnly && <button type="button" className="gt-icon-button" onClick={onOpenSettings} title={tx('إعدادات الإنتاج', 'Production settings')} aria-label={tx('إعدادات الإنتاج', 'Production settings')}><Settings2 size={18}/></button>}</div></div>
    <div className="gt-production-viewbar"><div className="gt-segmented" aria-label={tx('حالة ملفات الإنتاج', 'Production file status')}>{(['pending','done','all'] as const).map(value => <button type="button" key={value} aria-pressed={status === value} onClick={() => setStatus(value)}>{value === 'pending' ? tx('بانتظار الإنجاز', 'Pending') : value === 'done' ? tx('المنجز', 'Completed') : tx('الكل', 'All')}</button>)}</div><label><input type="checkbox" checked={hideEmpty} onChange={event => setHideEmpty(event.target.checked)}/>{tx('إخفاء الطابعات الفارغة', 'Hide empty printers')}</label>{(query || printerFilter !== 'ALL' || hideEmpty) && <button type="button" onClick={clear}><FilterX size={14}/>{tx('مسح التصفية', 'Clear filters')}</button>}</div>
    {unassigned > 0 && <p className="gt-production-warning" role="status">{tx(`${unassigned} ملف مرتبط بطابعة غير موجودة في إعدادات هذا القسم. راجع ربط الطابعات.`, `${unassigned} files reference a printer missing from this department. Review printer assignments.`)}</p>}
    {printers.length ? <div className="gt-kanban-grid">{printers.map(printer => {
      const printerJobs = filteredJobs.filter(job => job.printer === printer.id);
      return <section key={printer.id} className="gt-printer-column"><header className="gt-production-printer-header"><span><Printer size={19}/><strong>{printer.name}</strong><small dir="ltr">{printer.id}</small></span><span className="gt-production-printer-count">{printerJobs.length}</span></header><Droppable droppableId={printer.id} isDropDisabled={readOnly || status === 'done'}>{provided => <div className="gt-production-job-list" ref={provided.innerRef} {...provided.droppableProps}>{printerJobs.length ? printerJobs.map((job, index) => <React.Fragment key={job.id}><Draggable draggableId={job.id} index={index} isDragDisabled={readOnly || job.status === 'done'}>{(provided, snapshot) => <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={snapshot.isDragging ? 'gt-dragging-job' : undefined}><JobCard job={job} onMoveJob={onMoveJob} onSelectJob={onSelectJob} onDeleteJob={onDeleteJob} onUpdateJob={onUpdateJob} language={language} readOnly={readOnly} allowDelete={options.allowFileDeletion}/></div>}</Draggable></React.Fragment>) : <div className="gt-production-printer-empty"><CircleCheck size={25}/><strong>{tx('لا توجد ملفات مطابقة', 'No matching files')}</strong><small>{query || status !== 'all' ? tx('جرّب تغيير البحث أو حالة العرض.', 'Try a different search or status.') : tx('ستظهر ملفات هذه الطابعة هنا.', 'Files for this printer will appear here.')}</small></div>}{provided.placeholder}</div>}</Droppable></section>;
    })}</div> : <div className="gt-production-empty"><Printer size={32}/><h3>{visiblePrinters.length ? tx('لا توجد طابعات تطابق التصفية', 'No printers match your filters') : tx('لم تُضف طابعات لهذا القسم بعد', 'No printers are configured for this department')}</h3><p>{tx('أدخل مسار الطباعة يدويًا وأضف الطابعات من الإعدادات، أو غيّر التصفية الحالية.', 'Enter the print folder manually and configure printers, or adjust the current filters.')}</p>{visiblePrinters.length ? <button type="button" onClick={clear}>{tx('إظهار جميع الطابعات', 'Show all printers')}</button> : onOpenSettings && <button type="button" onClick={onOpenSettings}>{tx('فتح إعدادات الإنتاج', 'Open production settings')}</button>}</div>}
  </div></DragDropContext>;
};
