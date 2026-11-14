/** One-way, user-initiated, read-only sync with Google People API.
 * Access tokens stay in browser memory; only names/phone numbers reach Golden Target.
 */
export type GoogleContact={name:string;phone:string};
export type GooglePerson={names?:Array<{displayName?:string}>;phoneNumbers?:Array<{value?:string}>};
export type GoogleConnectionPage={connections?:GooglePerson[];nextPageToken?:string};
type TokenClient={requestAccessToken(options?:{prompt?:string}):void};
type GoogleIdentity={accounts:{oauth2:{initTokenClient(config:{
  client_id:string;scope:string;callback:(response:{access_token?:string;error?:string;error_description?:string})=>void;
  error_callback?:(error:{type:string})=>void;
}):TokenClient}}};
declare global {interface Window {google?:GoogleIdentity}}
const SCOPE='https://www.googleapis.com/auth/contacts.readonly';
const GOOGLE_SCRIPT='https://accounts.google.com/gsi/client';

export function extractGoogleContacts(people:GooglePerson[]):GoogleContact[]{
  const numbers=new Set<string>();const result:GoogleContact[]=[];
  for(const person of people){
    const name=String(person.names?.[0]?.displayName||'').trim().slice(0,200);
    if(!name)continue;
    for(const phone of person.phoneNumbers||[]){
      const number=String(phone.value||'').trim().slice(0,80);
      const digits=number.replace(/\D/g,'');
      if(digits.length<8||digits.length>17)continue;
      if(numbers.has(digits))continue;
      numbers.add(digits);result.push({name,phone:number});
    }
  }
  return result;
}

export function loadGoogleIdentity():Promise<void>{
  if(window.google?.accounts?.oauth2)return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const existing=document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
    const script=existing||document.createElement('script');
    if(!existing){
      script.src=GOOGLE_SCRIPT;script.async=true;script.dataset.googleIdentity='true';
      document.head.appendChild(script);
    }
    script.addEventListener('load',()=>resolve(),{once:true});
    script.addEventListener('error',()=>reject(Error('تعذّر تحميل صفحة ربط Google. افحص الاتصال والإضافات.')),{once:true});
  });
}
export function requestGoogleContactsToken(clientId:string):Promise<string>{
  if(!window.google?.accounts?.oauth2)throw Error('لم تجهز مكتبة تسجيل الدخول من Google بعد، أعد فتح الصفحة');
  return new Promise((resolve,reject)=>{
    const client=window.google!.accounts.oauth2.initTokenClient({
      client_id:clientId,scope:SCOPE,
      callback:response=>{
        if(response.error||!response.access_token)reject(Error(response.error_description||response.error||'لم يتم منح صلاحية قراءة جهات الاتصال'));
        else resolve(response.access_token);
      },
      error_callback:error=>reject(Error(error.type==='popup_closed'?'أُغلقت نافذة ربط Google دون إكمال':'تعذّر إتمام اتصال Google'))
    });
    // Called synchronously from the user's click; required for browser pop-up permission.
    client.requestAccessToken({prompt:'consent'});
  });
}
export async function fetchGoogleContacts(accessToken:string):Promise<GoogleContact[]>{
  const all:GooglePerson[]=[];let pageToken='';let pages=0;
  do{
    const url=new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.set('pageSize','1000');
    url.searchParams.set('personFields','names,phoneNumbers');
    url.searchParams.set('sources','READ_SOURCE_TYPE_CONTACT');
    if(pageToken)url.searchParams.set('pageToken',pageToken);
    const response=await fetch(url.toString(),{headers:{Authorization:'Bearer '+accessToken},cache:'no-store'});
    if(!response.ok){
      const error=await response.json().catch(()=>null) as {error?:{message?:string}}|null;
      throw Error(error?.error?.message||'تعذّر قراءة جهات الاتصال من Google ('+response.status+')');
    }
    const data=await response.json() as GoogleConnectionPage;
    all.push(...(data.connections||[]));
    pageToken=data.nextPageToken||'';
    if(++pages>200)throw Error('تجاوز عدد صفحات جهات الاتصال الحد المسموح');
  }while(pageToken);
  return extractGoogleContacts(all);
}
