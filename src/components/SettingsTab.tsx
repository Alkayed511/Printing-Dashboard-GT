import React, {useEffect, useRef, useState, type ReactNode} from 'react';
import {Settings2, HardDrive, Bell, Palette, Monitor, Save, RotateCcw, Check, Copy, ExternalLink, Play, Upload, ShieldCheck, ChevronDown, LoaderCircle, Network, AlertCircle, SlidersHorizontal} from 'lucide-react';
import type {ServerConfig} from '../types';
import {playNotificationSound} from '../utils/audio';
import {productionDefaults, productionSettings} from '../utils/production';
import ProductionPreferences from './ProductionPreferences';
import AppearanceDesigner from './AppearanceDesigner';
import {resolveBranding} from '../utils/branding';

type Props = {config: ServerConfig; onSaveConfig: (config: ServerConfig) => Promise<boolean>; onDirtyChange?: (dirty: boolean) => void; onManage?: () => void};
const preferences = (config: ServerConfig) => ({
  basePath: config.basePath, currentDate: config.currentDate, autoRefreshInterval: config.autoRefreshInterval,
  notificationSound: config.notificationSound || 'default', customSoundUrl: config.customSoundUrl || '',
  notificationColor: config.notificationColor || 'red', notificationDuration: config.notificationDuration || 0,
  disableMouseInDisplayMode: config.disableMouseInDisplayMode || false,
  themeColor: config.themeColor || 'orange', secondaryColor: config.secondaryColor || 'blue',
  language: config.language || 'ar' as 'ar' | 'en', localIp: config.localIp || '',
  production: productionSettings(config.production),
  branding: resolveBranding(config.branding),
});
type Draft = ReturnType<typeof preferences>;
const colors = [{id: 'orange', color: '#f4b75d', ar: 'ذهبي', en: 'Gold'}, {id: 'blue', color: '#7da6ff', ar: 'أزرق', en: 'Blue'}, {id: 'green', color: '#5cceb1', ar: 'أخضر', en: 'Green'}, {id: 'purple', color: '#b799f9', ar: 'بنفسجي', en: 'Purple'}, {id: 'rose', color: '#f598ad', ar: 'وردي', en: 'Rose'}];
const Field = ({label, hint, children}: {label: string; hint?: string; children: ReactNode}) => <label className="gt-settings-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;

export const SettingsTab: React.FC<Props> = ({config, onSaveConfig, onDirtyChange, onManage}) => {
  const [draft, setDraft] = useState(() => preferences(config));
  const [section, setSection] = useState(() => {const value = new URLSearchParams(location.search).get('section'); return value && ['production','appearance','notifications','display'].includes(value) ? value : 'general';});
  const [checkingStorage, setCheckingStorage] = useState(false);
  const [storageCheck, setStorageCheck] = useState<{basePath: string; currentDate: string; result: {basePath: string; dateFolder: string; printers: {id: string; name: string; pending: string; done: string}[]}} | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const sectionNavigation = useRef<HTMLElement>(null);
  const baseline = JSON.stringify(preferences(config));
  const previousBaseline = useRef(baseline);
  const dirty = JSON.stringify(draft) !== baseline;
  const isAr = draft.language !== 'en';
  const tx = (ar: string, en: string) => isAr ? ar : en;
  const checkStorage = async () => {
    setCheckingStorage(true); setError(''); setStorageCheck(null);
    try {
      const response = await fetch('/api/production/storage/check', {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({basePath: draft.basePath, currentDate: draft.currentDate})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || tx('تعذّر فحص المسار.', 'Could not check storage.'));
      setStorageCheck({basePath: draft.basePath, currentDate: draft.currentDate, result});
    } catch (error) {setError(error instanceof Error ? error.message : tx('تعذّر فحص المسار.', 'Could not check storage.'));}
    finally {setCheckingStorage(false);}
  };
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {setDraft(previous => ({...previous, [key]: value})); setMessage(''); setError('');};
  useEffect(() => {sectionNavigation.current?.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'center',behavior:'auto'});}, [section]);
  useEffect(() => {
    const select = (event: Event) => {const value = (event as CustomEvent<string>).detail; if (['general','production','appearance','notifications','display'].includes(value)) setSection(value);};
    window.addEventListener('gt-settings-section',select);
    return () => window.removeEventListener('gt-settings-section',select);
  }, []);
  useEffect(() => {
    const previous = previousBaseline.current;
    previousBaseline.current = baseline;
    setDraft(current => JSON.stringify(current) === previous ? JSON.parse(baseline) : current);
  }, [baseline]);
  useEffect(() => {onDirtyChange?.(dirty); return () => onDirtyChange?.(false);}, [dirty, onDirtyChange]);
  useEffect(() => {
    const discard = () => setDraft(JSON.parse(baseline));
    window.addEventListener('gt-settings-discard', discard);
    return () => window.removeEventListener('gt-settings-discard', discard);
  }, [baseline]);
  useEffect(() => {
    if (!dirty) return;
    const preventLoss = (event: BeforeUnloadEvent) => {event.preventDefault(); event.returnValue = '';};
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [dirty]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!draft.basePath.trim() || !draft.currentDate.trim() || /[\\/:*?"<>|]/.test(draft.currentDate) || ['.', '..'].includes(draft.currentDate.trim())) {setError(tx('أدخل مسارًا وتاريخ مجلد صالحين. تاريخ العمل هو اسم مجلد واحد مثل 30-10.', 'Enter a path and a valid single date folder name, such as 30-10.')); return;}
    if (!draft.branding.name.trim()) {setError(tx('اكتب اسم المطبعة قبل الحفظ.', 'Enter the print shop name before saving.')); setSection('appearance'); return;}
    const values = {...draft, basePath:draft.basePath.trim(), currentDate:draft.currentDate.trim(), localIp:draft.localIp.trim(), branding:{...draft.branding,name:draft.branding.name.trim(),tagline:draft.branding.tagline.trim()}};
    const createFolders = section === 'general';
    setSaving(true);
    try {
      const payload = {...config, ...values, initializeProductionFolders:createFolders};
      const success = await onSaveConfig(payload);
      if (!success) throw new Error(tx('لم يتم الحفظ. تحقق من اتصال الخادم ثم حاول مجددًا؛ تعديلاتك ما زالت موجودة.', 'Settings were not saved. Check the server connection and try again; your changes are still here.'));
      setDraft(preferences({...config, ...values}));
      onDirtyChange?.(false);
      if (createFolders) setStorageCheck(null);
      setMessage(createFolders ? tx('تم حفظ المسار وتجهيز مجلد كل طابعة ومجلد done بداخله.', 'Path saved. Every printer folder and its done subfolder are ready.') : tx('تم حفظ الإعدادات بنجاح.', 'Settings saved successfully.'));
    } catch (error) {setError(error instanceof Error ? error.message : tx('تعذّر الحفظ. تعديلاتك ما زالت موجودة.', 'Could not save. Your changes are still here.'));}
    finally {setSaving(false);}
  };
  const reset = () => {setDraft(preferences(config)); setError(''); setMessage('');};
  const copy = async (url: string, kind: string) => {
    try {await navigator.clipboard.writeText(url); setCopied(kind); setTimeout(() => setCopied(''), 2200);}
    catch {setError(tx('تعذّر النسخ التلقائي. يمكنك تحديد الرابط ونسخه يدويًا.', 'Could not copy automatically. Select and copy the link manually.'));}
  };
  const uploadSound = (file?: File) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024 || !(/^(audio\/)/.test(file.type) || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name))) {setError(tx('اختر ملف صوت بحجم 3 ميجابايت أو أقل.', 'Choose an audio file of 3 MB or less.')); return;}
    const reader = new FileReader();
    reader.onerror = () => setError(tx('تعذّرت قراءة الملف.', 'Could not read the file.'));
    reader.onload = () => {setDraft(previous => ({...previous, customSoundUrl: String(reader.result), notificationSound: 'custom'})); setMessage(''); setError('');};
    reader.readAsDataURL(file);
  };
  const tabs = [{id: 'general', ar: 'المسار ويوم العمل', en: 'Storage & work date', icon: HardDrive}, {id: 'production', ar: 'إعدادات الإنتاج', en: 'Production', icon: SlidersHorizontal}, {id: 'notifications', ar: 'التنبيهات', en: 'Notifications', icon: Bell}, {id: 'appearance', ar: 'هوية المطبعة والمظهر', en: 'Appearance', icon: Palette}, {id: 'display', ar: 'شاشات العرض', en: 'Display screens', icon: Monitor}];
  const displayUrl = new URL(window.location.pathname, window.location.origin);
  displayUrl.searchParams.set('display', 'true');
  const lanHost = draft.localIp.trim();
  const lanUrl = /^[a-z\d.:[\]-]+$/i.test(lanHost) ? `http://${lanHost}:3000/?display=true` : '';

  return <div className="gt-settings" dir={isAr ? 'rtl' : 'ltr'}>
    {section !== 'appearance' && (<div className="gt-settings-intro"><div><span className="gt-section-kicker">WORKSPACE PREFERENCES</span><h2>{tx('اضبط مساحة عملك.', 'Make it work for you.')}</h2><p>{tx('الأساسيات في المقدمة، والتفاصيل المتقدمة عند الحاجة.', 'Everyday preferences first. Advanced details when you need them.')}</p></div><span className="gt-settings-security"><ShieldCheck size={17}/>{tx('إدارة آمنة', 'Secure administration')}</span></div>)}
    <div className="gt-settings-layout"><nav ref={sectionNavigation} className="gt-settings-nav" aria-label={tx('أقسام الإعدادات', 'Settings categories')}>{tabs.map(({id, ar, en, icon: Icon}) => <button type="button" key={id} aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}><Icon size={18}/>{tx(ar, en)}</button>)}<p>{tx('تُطبّق التعديلات على مساحة العمل بعد الحفظ.', 'Changes apply to the workspace after saving.')}</p></nav>
      <form className="gt-settings-form" onSubmit={save}>
        <fieldset disabled={saving} className="contents">
        {section === 'production' && <ProductionPreferences value={draft.production} onChange={value => update('production', value)} onManage={onManage} isAr={isAr} onRecommended={() => {setDraft(previous => ({...previous, production: {...productionDefaults}, autoRefreshInterval: 5, notificationSound: 'alt2', notificationDuration: 10, notificationColor: 'blue', disableMouseInDisplayMode: true})); setMessage(''); setError('');}}/>}
        {section === 'general' && <section className="gt-settings-card"><header><span className="gt-settings-icon"><HardDrive size={22}/></span><div><h3>{tx('التخزين ويوم العمل', 'Storage & work date')}</h3><p>{tx('مصدر ملفات الإنتاج وطريقة تحديثها.', 'Where production files are read and how often they refresh.')}</p></div></header><div className={'gt-storage-state ' + (config.isRealStorageAvailable ? 'gt-storage-ready' : '')}><span className="gt-status-dot"/><div><strong>{config.isRealStorageAvailable ? tx('مجلد الإنتاج متاح', 'Production folder available') : tx('مجلد الإنتاج غير متاح حاليًا', 'Production folder currently unavailable')}</strong><p>{tx('تُفحص إتاحة المسار المحفوظ تلقائيًا. تغيير المسار يحتاج إلى حفظ.', 'Availability reflects the saved path. Save to apply a different path.')}</p></div></div>
          <Field label={tx('مسار مجلد الطباعة', 'Print folder path')} hint={tx('مسار محلي أو مجلد مشترك يستطيع الخادم الوصول إليه.', 'A local or shared folder that the server can access.')}><input name="basePath" dir="ltr" value={draft.basePath} onChange={event => update('basePath', event.target.value)} placeholder="C:\PrintJobs" required/></Field>
          <div className="gt-settings-grid"><Field label={tx('تاريخ العمل / اسم المجلد', 'Work date / folder name')} hint={tx('استخدم نفس اسم مجلد اليوم الموجود داخل مسار الطباعة.', 'Match the existing day folder inside the print path.')}><input name="currentDate" dir="ltr" value={draft.currentDate} onChange={event => update('currentDate', event.target.value)} required/><button className="gt-settings-text-button" type="button" onClick={() => {const today = new Date(); update('currentDate', `${today.getDate()}-${today.getMonth() + 1}`);}}>{tx('استخدام تاريخ اليوم', 'Use today’s date')}</button></Field><Field label={tx('التحديث التلقائي', 'Automatic refresh')} hint={tx('5 ثوانٍ مناسبة للعمل اليومي. اختر يدويًا لإيقاف التحديث الدوري.', '5 seconds suits most workflows. Choose manual to stop polling.')}><select name="autoRefreshInterval" value={draft.autoRefreshInterval} onChange={event => update('autoRefreshInterval', Number(event.target.value))}>{[2, 5, 10, 30, 0].map(value => <option key={value} value={value}>{value ? `${value} ${tx('ثوانٍ', 'seconds')}${value === 5 ? tx(' · موصى به', ' · recommended') : ''}` : tx('تحديث يدوي', 'Manual refresh')}</option>)}</select></Field></div>
          <details className="gt-settings-details"><summary><Network size={17}/>{tx('المسار الفعلي وتفاصيل الشبكة', 'Folder structure & network details')}<ChevronDown size={16}/></summary><div><Field label={tx('عنوان الجهاز على الشبكة (اختياري)', 'LAN hostname or IP (optional)')} hint={tx('لإنشاء رابط شاشة العرض المحلي. لا يفتح المنفذ أو يضبط اتصال الإنترنت.', 'Used for the local display link. This does not open ports or configure internet access.')}><input name="localIp" dir="ltr" value={draft.localIp} onChange={event => update('localIp', event.target.value)} placeholder="192.168.1.100"/></Field><pre dir="ltr">{`${draft.basePath}\\${draft.currentDate}\\\n${(config.printers || []).slice(0, 5).map(printer => `  ├─ ${printer.id}\\\n  │   └─ done\\`).join('\n')}`}</pre></div></details>
          <div className="gt-manual-storage"><strong>{tx('إدخال المسار وتجهيز مجلدات الطابعات', 'Set up the path and printer folders')}</strong><p>{tx('بعد حفظ المسار يُنشأ مجلد تاريخ العمل، وداخله مجلد لكل طابعة يتضمن done. تُنشأ المجلدات الناقصة فقط؛ تبقى الملفات الموجودة كما هي. زر الفحص لا ينشئ شيئًا.', 'Saving creates the work-date folder, a folder for each printer, and its done subfolder. Only missing folders are created; existing files stay intact. Checking does not create anything.')}</p><div className="flex flex-wrap gap-3"><button type="button" disabled={checkingStorage || !draft.basePath.trim() || !draft.currentDate.trim()} onClick={checkStorage}>{checkingStorage ? <LoaderCircle size={16} className="animate-spin"/> : <HardDrive size={16}/>} {checkingStorage ? tx('جارٍ الفحص…', 'Checking…') : tx('فحص المسار دون حفظ', 'Check folder without saving')}</button><button type="submit" disabled={saving || checkingStorage || !draft.basePath.trim() || !draft.currentDate.trim()}><Save size={16}/>{tx('حفظ وتجهيز مجلدات الطابعات', 'Save & prepare printer folders')}</button></div></div>
          {storageCheck && storageCheck.basePath === draft.basePath && storageCheck.currentDate === draft.currentDate && <div className="gt-storage-diagnostics" role="status"><strong>{storageCheck.result.dateFolder === 'available' ? tx('مجلد تاريخ العمل متاح للقراءة', 'The work-date folder is readable') : tx('مجلد تاريخ العمل غير متاح؛ راجع المسار والتاريخ وصلاحيات القراءة', 'The work-date folder is unavailable; check the path, date, and read permissions')}</strong><div className="overflow-x-auto"><table><thead><tr><th>{tx('الطابعة', 'Printer')}</th><th>{tx('مجلد الانتظار', 'Pending folder')}</th><th>done</th></tr></thead><tbody>{storageCheck.result.printers.map(printer => <tr key={printer.id}><td>{printer.name}</td><td>{printer.pending === 'available' ? tx('متاح', 'Available') : tx('غير متاح', 'Unavailable')}</td><td>{printer.done === 'available' ? tx('متاح', 'Available') : tx('غير متاح', 'Unavailable')}</td></tr>)}</tbody></table></div><small>{tx('نتيجة فحص فقط؛ لم يُحفظ المسار ولم تتغير أي ملفات.', 'Check results only. The path has not been saved and no files were changed.')}</small></div>}
        </section>}
        {section === 'notifications' && <section className="gt-settings-card"><header><span className="gt-settings-icon"><Bell size={22}/></span><div><h3>{tx('تنبيهات تناسب يومك', 'Alerts that fit your day')}</h3><p>{tx('اختر كيف تُبلّغ بوصول ملفات جديدة.', 'Choose how new production files get your attention.')}</p></div></header><div className="gt-settings-grid"><Field label={tx('صوت التنبيه', 'Alert sound')}><select value={draft.notificationSound} onChange={event => update('notificationSound', event.target.value)}>{[['default', 'النغمة الأساسية', 'Standard chime'], ['alt2', 'نغمة هادئة', 'Gentle chime'], ['alt1', 'نغمة سريعة', 'Quick alert'], ['shorts', 'نغمة متصاعدة', 'Rising chime'], ['faaaaaa', 'تنبيه صوتي', 'Voice alert'], ['custom', 'ملف صوت مخصص', 'Custom audio'], ['off', 'بدون صوت', 'Silent']].map(([value, ar, en]) => <option key={value} value={value}>{tx(ar, en)}</option>)}</select><button type="button" className="gt-settings-text-button" disabled={draft.notificationSound === 'off' || (draft.notificationSound === 'custom' && !draft.customSoundUrl)} onClick={() => playNotificationSound(draft.notificationSound, draft.customSoundUrl)}><Play size={14}/>{tx('تجربة الصوت', 'Preview sound')}</button></Field><Field label={tx('مدة ظهور التنبيه', 'Alert duration')}><select value={draft.notificationDuration} onChange={event => update('notificationDuration', Number(event.target.value))}>{[0, 5, 10, 30].map(value => <option key={value} value={value}>{value ? `${value} ${tx('ثوانٍ', 'seconds')}` : tx('حتى إغلاقه يدويًا', 'Until dismissed')}</option>)}</select></Field></div><Field label={tx('لون التنبيه', 'Alert color')}><select value={draft.notificationColor} onChange={event => update('notificationColor', event.target.value)}>{[['red', 'أحمر', 'Red'], ['orange', 'برتقالي', 'Orange'], ['blue', 'أزرق', 'Blue'], ['green', 'أخضر', 'Green'], ['purple', 'بنفسجي', 'Purple']].map(([value, ar, en]) => <option key={value} value={value}>{tx(ar, en)}</option>)}</select></Field><label className="gt-sound-upload"><Upload size={22}/><strong>{draft.customSoundUrl ? tx('تغيير ملف الصوت', 'Replace audio file') : tx('إضافة صوت خاص بالمطبعة', 'Add your own alert sound')}</strong><small>MP3, WAV, OGG · {tx('حتى 3 ميجابايت · يُطبّق بعد الحفظ', 'up to 3 MB · applies after saving')}</small><input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac" onChange={event => uploadSound(event.target.files?.[0])}/></label>{draft.customSoundUrl && <span className="gt-settings-hint"><Check size={15}/>{tx('يوجد ملف صوت مخصص ضمن الإعدادات.', 'A custom audio file is included in your preferences.')}</span>}</section>}
        {section === 'appearance' && <AppearanceDesigner value={draft.branding} onChange={value => update('branding',value)} language={draft.language} onLanguageChange={value => update('language',value)}/>}
        {section === 'display' && <section className="gt-settings-card"><header><span className="gt-settings-icon"><Monitor size={22}/></span><div><h3>{tx('شاشات العرض', 'Display screens')}</h3><p>{tx('افتح لوحة الإنتاج على شاشة مستقلة.', 'Open the production board on a separate display.')}</p></div></header><div className="gt-display-link"><strong>{tx('رابط العرض على هذا الخادم', 'Display link on this server')}</strong><code dir="ltr">{displayUrl.toString()}</code><div><button type="button" onClick={() => copy(displayUrl.toString(), 'current')}><Copy size={15}/>{copied === 'current' ? tx('تم النسخ', 'Copied') : tx('نسخ الرابط', 'Copy link')}</button><a href={displayUrl.toString()} target="_blank" rel="noreferrer"><ExternalLink size={15}/>{tx('فتح العرض', 'Open display')}</a></div></div>{lanUrl && <div className="gt-display-link"><strong>{tx('رابط الشبكة المحلية', 'Local network link')}</strong><code dir="ltr">{lanUrl}</code><button type="button" onClick={() => copy(lanUrl, 'lan')}><Copy size={15}/>{copied === 'lan' ? tx('تم النسخ', 'Copied') : tx('نسخ الرابط', 'Copy link')}</button></div>}<label className="gt-settings-toggle"><input type="checkbox" checked={draft.disableMouseInDisplayMode} onChange={event => update('disableMouseInDisplayMode', event.target.checked)}/><span><strong>{tx('قفل التفاعل في شاشة العرض', 'Lock interactions in display mode')}</strong><small>{tx('مناسب لشاشات المتابعة المعلّقة داخل المطبعة.', 'Suitable for wall-mounted production displays.')}</small></span></label><p className="gt-settings-note"><ShieldCheck size={18}/>{tx('شاشة العرض تتطلب تسجيل دخول. الوصول من خارج الشبكة يحتاج إلى إعداد استضافة وHTTPS؛ الرابط المحلي لا يوفّر ذلك تلقائيًا.', 'Displays require sign-in. Access from outside your network requires hosting and HTTPS; a local link does not provide that automatically.')}</p></section>}
        <div className="gt-settings-feedback" aria-live="polite">{error && <p role="alert" className="gt-settings-error"><AlertCircle size={17}/>{error}</p>}{message && <p className="gt-settings-success"><Check size={17}/>{message}</p>}</div>
        <footer className="gt-settings-savebar"><span>{dirty ? tx('توجد تغييرات غير محفوظة', 'You have unsaved changes') : tx('الإعدادات محدّثة', 'All changes saved')}</span><div><button type="button" className="gt-settings-reset" disabled={!dirty || saving} onClick={reset}><RotateCcw size={16}/>{tx('تراجع', 'Discard')}</button><button type="submit" className="gt-main-action" disabled={!dirty || saving}>{saving ? <LoaderCircle size={17} className="animate-spin"/> : <Save size={17}/>}<span>{saving ? tx('جارٍ الحفظ…', 'Saving…') : tx('حفظ التغييرات', 'Save changes')}</span></button></div></footer>
        </fieldset>
      </form>
    </div>
  </div>;
};
