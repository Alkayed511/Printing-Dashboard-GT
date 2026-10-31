import type {BrandingSettings} from '../types.ts';

export const brandingDefaults: Readonly<BrandingSettings> = Object.freeze({name: 'Golden Target', tagline: 'PRINT WORKSPACE', logo: '', logoSize: 44, themeMode: 'dark', accentColor: '#edbd73', textColor: '', fontSize: 15, fontFamily: 'system', corners: 'rounded', density: 'comfortable', reduceMotion: false});
export const resolveBranding = (value?: Partial<BrandingSettings>): BrandingSettings => ({...brandingDefaults, ...value});
export const brandFonts = {system: '"Segoe UI", Tahoma, Arial, sans-serif', tahoma: 'Tahoma, Arial, sans-serif', arial: 'Arial, Tahoma, sans-serif'};
export const appearancePresets: {id: string; ar: string; en: string; description: string; colors: string[]; settings: Partial<BrandingSettings>}[] = [
  {id: 'midnight', ar: 'ذهب منتصف الليل', en: 'Midnight gold', description: 'تباين هادئ ولمسة ذهبية', colors: ['#10141b','#edbd73','#e9edf5'], settings: {themeMode:'dark', accentColor:'#edbd73', textColor:'', corners:'rounded', fontFamily:'system'}},
  {id: 'paper', ar: 'ورق وحبر', en: 'Paper & ink', description: 'مساحة فاتحة بلمسة زرقاء', colors: ['#f4f6fa','#325dce','#19283d'], settings: {themeMode:'light', accentColor:'#325dce', textColor:'', corners:'soft', fontFamily:'system'}},
  {id: 'studio', ar: 'استوديو بنفسجي', en: 'Violet studio', description: 'شخصية إبداعية وألوان عميقة', colors: ['#10141b','#b4a1fa','#f2edff'], settings: {themeMode:'dark', accentColor:'#b4a1fa', textColor:'#f2edff', corners:'rounded', fontFamily:'tahoma'}},
  {id: 'mint', ar: 'بداية منعشة', en: 'Fresh mint', description: 'أخضر متزن للعمل الطويل', colors: ['#f4f6fa','#127d69','#18372f'], settings: {themeMode:'light', accentColor:'#127d69', textColor:'', corners:'rounded', fontFamily:'system'}},
];
export function contrastRatio(first: string, second: string) {
  const luminance = (color: string) => {
    const channels = [1,3,5].map(index => parseInt(color.slice(index,index+2),16)/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
    return channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
export function appearanceVariables(branding: BrandingSettings, mode: 'light' | 'dark') {
  const light = mode === 'light';
  return {
    '--app-canvas': light ? '#f3f5f9' : '#10141b', '--app-surface': light ? '#ffffff' : '#191f28',
    '--app-sidebar': light ? '#fcfdff' : '#141920', '--app-raised': light ? '#edf1f7' : '#242d3b',
    '--app-border': light ? '#d8e0eb' : '#354152', '--app-text': branding.textColor || (light ? '#24334a' : '#e9eff8'),
    '--app-muted': light ? '#5b6b83' : '#98a8bf', '--app-accent': branding.accentColor,
    '--app-on-accent': contrastRatio(branding.accentColor,'#ffffff') > contrastRatio(branding.accentColor,'#121821') ? '#ffffff' : '#121821',
    '--app-font': brandFonts[branding.fontFamily], '--app-font-scale': String(branding.fontSize/14),
    '--app-radius': branding.corners === 'sharp' ? '4px' : branding.corners === 'soft' ? '10px' : '17px',
    '--app-logo-size': branding.logoSize + 'px', '--app-space': branding.density === 'compact' ? '12px' : '20px',
  };
}
