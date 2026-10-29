/** Shared, deterministic pricing calculations used by browser and Express. All money in JOD. */
export type PrintMode = 'area' | 'linear' | 'roll' | 'sheet' | 'pieces';
export type ProfitMethod = 'markup' | 'margin';
export interface PrintLine {
  id: string;
  label: string;
  mode: PrintMode;
  printerId: string;
  material: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  rollWidthCm: number;
  sheetWidthCm: number;
  sheetHeightCm: number;
  wastePercent: number;
  materialCostRate: number;
  printingCostRate: number;
  finishingCostPerPiece: number;
  profitPercent: number;
  profitMethod: ProfitMethod;
}
export interface LineResult {
  pieces: number;
  netAreaM2: number;
  chargeableAreaM2: number;
  linearMeters: number;
  sheets: number;
  across: number;
  productionCost: number;
  sellingPrice: number;
  profit: number;
}
export interface EstimateTotals {
  netAreaM2: number;
  chargeableAreaM2: number;
  linearMeters: number;
  productionCost: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  rows: LineResult[];
}
const valid = (v: number, max = 1_000_000) => Number.isFinite(v) && v >= 0 && v <= max ? v : 0;
export const money = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000; // JOD uses three decimal places
export const defaultLine = (): PrintLine => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  label: '', mode: 'area', printerId: 'eco', material: '', widthCm: 100, heightCm: 100,
  quantity: 1, rollWidthCm: 160, sheetWidthCm: 122, sheetHeightCm: 244,
  wastePercent: 5, materialCostRate: 1, printingCostRate: 0.5,
  finishingCostPerPiece: 0, profitPercent: 30, profitMethod: 'markup',
});
/** Rate units: area=m²; linear/roll=linear metre; sheet=sheet; pieces=piece.
 * Roll nesting rotates the item only when doing so uses less length.
 * Sheet nesting uses a rectangular grid, no complex irregular shape packing. */
export function calculateLine(input: PrintLine): LineResult {
  const width = valid(Number(input.widthCm)) / 100;
  const height = valid(Number(input.heightCm)) / 100;
  const quantity = Math.floor(valid(Number(input.quantity), 1_000_000));
  const waste = 1 + Math.min(100, valid(Number(input.wastePercent), 100)) / 100;
  const area = width * height * quantity;
  const rate = valid(Number(input.materialCostRate));
  const printRate = valid(Number(input.printingCostRate));
  const finishing = valid(Number(input.finishingCostPerPiece)) * quantity;
  let units = 0; let length = 0; let sheets = 0; let across = 1;
  if (input.mode === 'area') units = area * waste;
  else if (input.mode === 'linear') {
    length = height * quantity * waste;
    units = length;
  } else if (input.mode === 'roll') {
    const roll = valid(Number(input.rollWidthCm)) / 100;
    if (!roll || !width || !height || width > roll && height > roll) throw new Error('عرض القطعة أكبر من عرض رول الطباعة');
    const choices = [[width, height], [height, width]]
      .filter(([w]) => w <= roll)
      .map(([w,h]) => ({n: Math.floor(roll / w), length: Math.ceil(quantity / Math.floor(roll / w)) * h}));
    const best = choices.sort((a,b) => a.length - b.length)[0];
    across = best?.n || 1;
    length = (best?.length || 0) * waste;
    units = length;
  } else if (input.mode === 'sheet') {
    const sw = valid(Number(input.sheetWidthCm)) / 100;
    const sh = valid(Number(input.sheetHeightCm)) / 100;
    if (!sw || !sh || !width || !height) throw new Error('مقاسات الورق أو القطعة غير صحيحة');
    const fit = (w: number, h: number) => Math.floor(sw / w) * Math.floor(sh / h);
    across = Math.max(fit(width,height), fit(height,width));
    if (across < 1) throw new Error('القطعة أكبر من مقاس الورقة');
    sheets = Math.ceil(Math.ceil(quantity / across) * waste);
    units = sheets;
  } else { units = quantity * waste; }
  const cost = units * (rate + printRate) + finishing;
  const p = Math.min(99.99, valid(Number(input.profitPercent), 100));
  const selling = input.profitMethod === 'margin' ? cost / (1 - p / 100) : cost * (1 + p / 100);
  const chargeableAreaM2 = input.mode === 'roll' ? length * valid(Number(input.rollWidthCm)) / 100
    : input.mode === 'sheet' ? sheets * valid(Number(input.sheetWidthCm)) * valid(Number(input.sheetHeightCm)) / 10000
    : area * waste;
  return { pieces: quantity, netAreaM2: area, chargeableAreaM2, linearMeters: length,
    sheets, across, productionCost: money(cost), sellingPrice: money(selling), profit: money(selling-cost) };
}
export function calculateEstimate(lines: PrintLine[], discountPercent = 0, taxPercent = 0): EstimateTotals {
  if (!Array.isArray(lines) || lines.length > 100) throw new Error('عدد البنود غير صالح');
  const rows = lines.map(calculateLine);
  const sum = (key: keyof LineResult) => rows.reduce((a, r) => a + Number(r[key]), 0);
  const cost = money(sum('productionCost'));
  const subtotal = money(sum('sellingPrice'));
  const discount = money(subtotal * Math.min(100, valid(Number(discountPercent), 100)) / 100);
  const tax = money((subtotal - discount) * Math.min(100, valid(Number(taxPercent), 100)) / 100);
  const total = money(subtotal - discount + tax);
  return { rows, netAreaM2: sum('netAreaM2'), chargeableAreaM2: sum('chargeableAreaM2'),
    linearMeters: sum('linearMeters'), productionCost: cost, subtotal, discount, tax, total,
    profit: money(subtotal - discount - cost) };
}
