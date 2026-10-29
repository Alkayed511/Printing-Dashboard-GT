import type { PrintLine, EstimateTotals } from '../utils/printMath';
export interface Customer { id:string; name:string; contact:string; phone:string; whatsapp:string; email:string; address:string; taxNumber:string; category:string; paymentTerms:string; creditLimit:number; notes:string; archived:boolean; createdAt:string; updatedAt:string }
export interface Estimate { id:string;customerId:string;title:string;lines:PrintLine[];discountPercent:number;taxPercent:number;totals:EstimateTotals;createdAt:string;updatedAt:string }
export interface Quote {id:string;customerId:string;estimateId:string;title:string;total:number;lines:PrintLine[];totals:EstimateTotals;status:'draft'|'approved';orderId?:string;createdAt:string}
export interface Invoice {id:string;customerId:string;quoteId:string;title:string;total:number;balance:number;createdAt:string;dueDate:string}
export interface Payment {id:string;invoiceId:string;customerId:string;amount:number;kind:'payment'|'refund';method:string;note:string;createdAt:string}
export interface Material {id:string;name:string;unit:string;costRate:number;updatedAt:string}
export interface ManagedOrder {id:string;filename:string;customerId?:string;customerName?:string;status:string;printer:string;quantity?:number;createdAt:string}
export interface ManagementData {customers:Customer[];estimates:Estimate[];quotes:Quote[];invoices:Invoice[];payments:Payment[];materials:Material[];orders:ManagedOrder[];jobLinks:Record<string,string>}
