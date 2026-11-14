import React, {createContext, useCallback, useContext, useEffect, useState, type ReactNode} from 'react';
import {resolveBranding, appearanceVariables} from '../utils/branding';
import type {BrandingSettings} from '../types';

const BrandingContext = createContext({branding: resolveBranding(), setBranding: (_value: Partial<BrandingSettings>) => {}, mode: 'dark' as 'dark' | 'light'});
export const useBranding = () => useContext(BrandingContext);
export default function BrandingProvider({children}: {children: ReactNode}) {
  const [branding, update] = useState(() => resolveBranding());
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const setBranding = useCallback((value: Partial<BrandingSettings>) => update(current => {const next = resolveBranding(value); return JSON.stringify(next) === JSON.stringify(current) ? current : next;}), []);
  const mode = branding.themeMode === 'system' ? systemDark ? 'dark' : 'light' : branding.themeMode;
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateMode = () => setSystemDark(media.matches);
    media.addEventListener('change', updateMode);
    let active = true;
    fetch('/api/branding', {cache:'no-cache'}).then(response => response.ok ? response.json() : null).then(value => {if (active && value?.branding) setBranding(value.branding);}).catch(() => {});
    return () => {active = false; media.removeEventListener('change', updateMode);};
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode; root.dataset.density = branding.density; root.dataset.motion = branding.reduceMotion ? 'reduced' : 'normal';
    root.dataset.brandName = branding.name;
    root.dataset.hasLogo = branding.logo ? 'true' : 'false';
    root.style.colorScheme = mode;
    for (const [key, value] of Object.entries(appearanceVariables(branding, mode))) root.style.setProperty(key, value);
    document.title = `${branding.name} | إدارة المطبعة`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'light' ? '#f3f5f9' : '#141920');
    document.querySelector('link[rel="icon"]')?.setAttribute('href', branding.logo || '/icon.svg');
  }, [branding, mode]);
  return <BrandingContext.Provider value={{branding, setBranding, mode}}>{children}</BrandingContext.Provider>;
}
