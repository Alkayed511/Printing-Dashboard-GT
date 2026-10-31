import type {PrintJob, ProductionSettings} from '../types.ts';

export const productionDefaults: Readonly<ProductionSettings> = Object.freeze({
  jobSort: 'priority', printerSort: 'workload', defaultStatus: 'pending',
  hideEmptyPrinters: false, cardDensity: 'comfortable', showSummary: true,
  confirmFileMoves: true, allowFileDeletion: false,
});
export const productionSettings = (value?: Partial<ProductionSettings>): ProductionSettings => ({...productionDefaults, ...value});
const priority = {urgent: 0, high: 1, medium: 2, low: 3};
const timestamp = (job: PrintJob) => {const value = Date.parse(job.createdAt); return Number.isFinite(value) ? value : 0;};
export function sortProductionJobs(jobs: PrintJob[], sort: ProductionSettings['jobSort']): PrintJob[] {
  return [...jobs].sort((a, b) => {
    if (sort === 'name') return a.filename.localeCompare(b.filename, 'ar', {numeric: true});
    if (sort === 'newest') return timestamp(b) - timestamp(a) || a.id.localeCompare(b.id);
    if (sort === 'priority') {
      const difference = (priority[a.priority || 'medium'] ?? 2) - (priority[b.priority || 'medium'] ?? 2);
      if (difference) return difference;
    }
    return timestamp(a) - timestamp(b) || a.id.localeCompare(b.id);
  });
}
export function filterProductionJobs(jobs: PrintJob[], status: ProductionSettings['defaultStatus'], query: string) {
  const normalize = (value: string) => value.normalize('NFKC').replace(/[\u064B-\u065F\u0670]/g, '').toLocaleLowerCase();
  const needle = normalize(query.trim());
  return jobs.filter(job => (status === 'all' || job.status === status) && normalize([job.filename, job.customerName, job.printer, job.material, job.dimensions].join(' ')).includes(needle));
}
