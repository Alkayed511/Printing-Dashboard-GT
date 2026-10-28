import { PricingMode, OrderItem } from '../types/printManager';

/**
 * Format currency in Jordanian Dinar (JOD) with exactly 3 decimal places
 * e.g. 15.250 د.أ
 */
export function formatJOD(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.000 د.أ';
  }
  return `${amount.toFixed(3)} د.أ`;
}

/**
 * Safe round to 3 decimal places
 */
export function roundJOD(val: number): number {
  return Math.round((val + Number.EPSILON) * 1000) / 1000;
}

/**
 * Calculate line item total based on dimensions and pricing mode
 */
export function calculateLineTotal(
  widthCm: number,
  heightCm: number,
  quantity: number,
  pricingMode: PricingMode,
  unitPrice: number,
  additionalFees: number = 0
): number {
  const qty = Math.max(1, quantity || 1);
  const price = Math.max(0, unitPrice || 0);
  const fees = Math.max(0, additionalFees || 0);

  let subtotal = 0;
  if (pricingMode === 'sqm') {
    // Area in square meters = (width / 100) * (height / 100)
    const sqm = ((widthCm || 0) / 100) * ((heightCm || 0) / 100);
    subtotal = sqm * price * qty;
  } else if (pricingMode === 'linear_meter') {
    // Linear length in meters = height (or length) / 100
    const linearMeters = (Math.max(widthCm || 0, heightCm || 0)) / 100;
    subtotal = linearMeters * price * qty;
  } else if (pricingMode === 'piece') {
    subtotal = price * qty;
  } else {
    // manual fixed price
    subtotal = price;
  }

  return roundJOD(subtotal + fees);
}

/**
 * Generate sequential formatted ID
 */
export function generateOrderNumber(existingCount: number = 0): string {
  const year = new Date().getFullYear();
  const num = (existingCount + 1).toString().padStart(4, '0');
  return `ORD-${year}-${num}`;
}

export function generatePaymentNumber(existingCount: number = 0): string {
  const year = new Date().getFullYear();
  const num = (existingCount + 1).toString().padStart(4, '0');
  return `REC-${year}-${num}`;
}

export function generateCustomerNumber(existingCount: number = 0): string {
  const num = (1001 + existingCount).toString();
  return `CUST-${num}`;
}

/**
 * Calculate area in square meters (m²)
 */
export function calculateAreaSqm(widthCm: number, heightCm: number, quantity: number = 1): number {
  const w = Math.max(0, widthCm || 0);
  const h = Math.max(0, heightCm || 0);
  const q = Math.max(0, quantity || 0);
  const area = ((w / 100) * (h / 100)) * q;
  return Math.round((area + Number.EPSILON) * 1000) / 1000;
}

/**
 * Calculate linear length in meters (م.ط)
 */
export function calculateLinearMeters(widthCm: number, heightCm: number, quantity: number = 1): number {
  const maxDim = Math.max(widthCm || 0, heightCm || 0);
  const q = Math.max(0, quantity || 0);
  const linear = (maxDim / 100) * q;
  return Math.round((linear + Number.EPSILON) * 1000) / 1000;
}

/**
 * Format progress percentage safely
 */
export function calculateProgressPercent(completed: number = 0, total: number = 1): number {
  if (!total || total <= 0) return 0;
  const pct = Math.round((completed / total) * 100);
  return Math.min(100, Math.max(0, pct));
}

