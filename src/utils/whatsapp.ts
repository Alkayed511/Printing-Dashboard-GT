/** Normalize WhatsApp numbers for matching, without guessing non-Jordan country codes. */
export function normalizeWhatsApp(input:unknown):string {
  let digits=String(input??'').replace(/\D/g,'');
  if(digits.startsWith('00')) digits=digits.slice(2);
  if(/^07\d{8}$/.test(digits)) digits='962'+digits.slice(1);
  else if(/^7\d{8}$/.test(digits)) digits='962'+digits;
  return digits.length>=8 && digits.length<=15 ? digits : '';
}
export function whatsappUrl(input:unknown):string {
  const phone=normalizeWhatsApp(input);
  return phone?'https://wa.me/'+phone:'';
}
