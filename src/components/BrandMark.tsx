import React from 'react';
import {Printer} from 'lucide-react';
import type {BrandingSettings} from '../types';

export default function BrandMark({branding, className = ''}: {branding: BrandingSettings; className?: string}) {
  return <span className={'gt-brand-mark ' + className}>{branding.logo ? <img src={branding.logo} alt=""/> : <Printer size={25} strokeWidth={1.7}/>}</span>;
}
