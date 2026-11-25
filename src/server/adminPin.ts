/** Admin access uses a four-digit PIN only on a trusted local network. */
export const isValidAdminPin=(value:string)=>/^\d{4}$/.test(value);
export const isValidSessionSecret=(value:string)=>value.length>=32;
