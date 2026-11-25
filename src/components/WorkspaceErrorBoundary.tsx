import React, {Component, type ReactNode} from 'react';
import {RefreshCcw, TriangleAlert} from 'lucide-react';

export default class WorkspaceErrorBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  declare props: {children: ReactNode};
  state = {failed: false};
  static getDerivedStateFromError() {return {failed: true};}
  render() {
    if (!this.state.failed) return this.props.children;
    const isAr = document.documentElement.lang !== 'en';
    return <div className="gt-recovery-screen" dir={isAr ? 'rtl' : 'ltr'}><div><span><TriangleAlert size={29}/></span><h1>{isAr ? 'تعذّر فتح مساحة العمل' : 'Could not open the workspace'}</h1><p>{isAr ? 'تحقق من اتصالك ثم أعد تحميل الصفحة للمتابعة.' : 'Check your connection and reload the page to continue.'}</p><button type="button" onClick={() => window.location.reload()}><RefreshCcw size={17}/>{isAr ? 'إعادة تحميل الصفحة' : 'Reload workspace'}</button></div></div>;
  }
}
