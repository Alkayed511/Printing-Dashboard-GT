# تثبيت gstack لـ Codex في VS Code على Windows — Golden Target

تعليمات موثوقة: https://github.com/garrytan/gstack . تستند إلى README و`docs/hosts.md` في المستودع الرسمي (أكتوبر 2026).

## ما الذي نثبّته؟
gstack يوفّر مجموعة متكاملة من أدوار مهندس البرمجيات والمراجع والمختبر والمصمم. لا يثبت تلقائياً بمجرد إضافة هذا المستند إلى GitHub. نسخة Codex **تجريبية** بينما Claude Code هو المسار الأكثر نضجاً. اسم المهارة داخل Codex مثل `gstack-review` وليس بالضرورة `/review`.

## التثبيت الآمن على الكمبيوتر

1. افتح VS Code، وتأكد من تثبيت Codex الرسمي `openai.chatgpt` وتسجيل الدخول، وفتح مجلد مشروع Golden Target.
2. افتح PowerShell وتحقق من `git --version`، `bun --version`، `node --version`. تحتاج Git for Windows وBun وNode.js. يفضّل Bun 1.4.2+ بحسب README؛ إعداد gstack يرفض إصدارات دون 1.3.3.
3. **لا تنفّذ التثبيت داخل مجلد المطبعة نفسه**. في PowerShell:

```powershell
cd $HOME
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git gstack
cd .\gstack
.\setup.ps1 --host codex
.\setup.ps1 --status
```

إذا حظرت PowerShell تشغيل السكربت، افتح Git Bash داخل مجلد `gstack` وشغّل `./setup --host codex` بعد مراجعة السكربت. لا تغيّر إعدادات الأمان العامة للنظام بلا داعٍ. إن احتجت إلى تثبيت Claude Code الأصلي مستقبلاً فهو مسار منفصل؛ `--host codex` لا يثبّت Claude Code بنفسه.

4. أغلق وأعد فتح VS Code / جلسة Codex. اطلب من Codex:
   - «استخدم `gstack-review` لمراجعة فرع Golden Target الحالي، ولا تعدّل ملفات العملاء أو تطبع أسراراً».
   - «استخدم `gstack-qa` على `http://localhost:3000` بشرط اختبار المجلدات الوهمية فقط، ولا تفتح ملفات الإنتاج الفعلية».
   - «استخدم `gstack-investigate` للتحقيق في أي خطأ تسجيل دخول أو تكرار للملفات قبل تعديل الكود».
   - «استخدم `gstack-verify` للتحقق من فحوص المشروع».

## التشغيل قبل أي دمج

```powershell
npm run lint
npm run test:management
npm run build
git status --short
```

ابدأ بفحص غير تعديلي، وراجع أي اقتراحات تعديل. لا تستخدم أوامر `ship` و`land-and-deploy` أو التثبيت الإجباري `--team` إلا بطلب صريح. لا تعطِ مهارات المتصفح ملفات تعريف الارتباط أو جلسات واتساب ولا تسمح لها بإنشاء tunnel للوصول الخارجي دون موافقة منفصلة.

## ملاحظات
- gstack ليس تكاملاً مع واتساب، وليس بديلاً عن مراقبة مجلدات الطابعة.
- حماية بيانات العملاء وملفات التصميم تتقدّم على الاختبارات الآلية.
- إذا لم تظهر المهارات بعد التثبيت، راجع `setup --status` وأعد تشغيل Codex.
