with open("src/index.css", "r") as f:
    text = f.read()

new_css = """@import "tailwindcss";

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-12deg); }
  75% { transform: rotate(12deg); }
}
.animate-wiggle {
  animation: wiggle 0.5s ease-in-out infinite;
}

@theme {
  --color-orange-50: var(--theme-orange-50, #fff7ed);
  --color-orange-100: var(--theme-orange-100, #ffedd5);
  --color-orange-200: var(--theme-orange-200, #fed7aa);
  --color-orange-300: var(--theme-orange-300, #fdba74);
  --color-orange-400: var(--theme-orange-400, #fb923c);
  --color-orange-500: var(--theme-orange-500, #f97316);
  --color-orange-600: var(--theme-orange-600, #ea580c);
  --color-orange-700: var(--theme-orange-700, #c2410c);
  --color-orange-800: var(--theme-orange-800, #9a3412);
  --color-orange-900: var(--theme-orange-900, #7c2d12);
  --color-orange-950: var(--theme-orange-950, #431407);

  --color-blue-50: var(--theme-blue-50, #eff6ff);
  --color-blue-100: var(--theme-blue-100, #dbeafe);
  --color-blue-200: var(--theme-blue-200, #bfdbfe);
  --color-blue-300: var(--theme-blue-300, #93c5fd);
  --color-blue-400: var(--theme-blue-400, #60a5fa);
  --color-blue-500: var(--theme-blue-500, #3b82f6);
  --color-blue-600: var(--theme-blue-600, #2563eb);
  --color-blue-700: var(--theme-blue-700, #1d4ed8);
  --color-blue-800: var(--theme-blue-800, #1e40af);
  --color-blue-900: var(--theme-blue-900, #1e3a8a);
  --color-blue-950: var(--theme-blue-950, #172554);
}

@layer base {
  .primary-orange {
    --theme-orange-50: #fff7ed;
    --theme-orange-100: #ffedd5;
    --theme-orange-200: #fed7aa;
    --theme-orange-300: #fdba74;
    --theme-orange-400: #fb923c;
    --theme-orange-500: #f97316;
    --theme-orange-600: #ea580c;
    --theme-orange-700: #c2410c;
    --theme-orange-800: #9a3412;
    --theme-orange-900: #7c2d12;
    --theme-orange-950: #431407;
  }
  .primary-blue {
    --theme-orange-50: #eff6ff;
    --theme-orange-100: #dbeafe;
    --theme-orange-200: #bfdbfe;
    --theme-orange-300: #93c5fd;
    --theme-orange-400: #60a5fa;
    --theme-orange-500: #3b82f6;
    --theme-orange-600: #2563eb;
    --theme-orange-700: #1d4ed8;
    --theme-orange-800: #1e40af;
    --theme-orange-900: #1e3a8a;
    --theme-orange-950: #172554;
  }
  .primary-green {
    --theme-orange-50: #ecfdf5;
    --theme-orange-100: #d1fae5;
    --theme-orange-200: #a7f3d0;
    --theme-orange-300: #6ee7b7;
    --theme-orange-400: #34d399;
    --theme-orange-500: #10b981;
    --theme-orange-600: #059669;
    --theme-orange-700: #047857;
    --theme-orange-800: #065f46;
    --theme-orange-900: #064e3b;
    --theme-orange-950: #022c22;
  }
  .primary-purple {
    --theme-orange-50: #faf5ff;
    --theme-orange-100: #f3e8ff;
    --theme-orange-200: #e9d5ff;
    --theme-orange-300: #d8b4fe;
    --theme-orange-400: #c084fc;
    --theme-orange-500: #a855f7;
    --theme-orange-600: #9333ea;
    --theme-orange-700: #7e22ce;
    --theme-orange-800: #6b21a8;
    --theme-orange-900: #581c87;
    --theme-orange-950: #3b0764;
  }
  .primary-rose {
    --theme-orange-50: #fff1f2;
    --theme-orange-100: #ffe4e6;
    --theme-orange-200: #fecdd3;
    --theme-orange-300: #fda4af;
    --theme-orange-400: #fb7185;
    --theme-orange-500: #f43f5e;
    --theme-orange-600: #e11d48;
    --theme-orange-700: #be123c;
    --theme-orange-800: #9f1239;
    --theme-orange-900: #881337;
    --theme-orange-950: #4c0519;
  }

  .secondary-blue {
    --theme-blue-50: #eff6ff;
    --theme-blue-100: #dbeafe;
    --theme-blue-200: #bfdbfe;
    --theme-blue-300: #93c5fd;
    --theme-blue-400: #60a5fa;
    --theme-blue-500: #3b82f6;
    --theme-blue-600: #2563eb;
    --theme-blue-700: #1d4ed8;
    --theme-blue-800: #1e40af;
    --theme-blue-900: #1e3a8a;
    --theme-blue-950: #172554;
  }
  .secondary-orange {
    --theme-blue-50: #fff7ed;
    --theme-blue-100: #ffedd5;
    --theme-blue-200: #fed7aa;
    --theme-blue-300: #fdba74;
    --theme-blue-400: #fb923c;
    --theme-blue-500: #f97316;
    --theme-blue-600: #ea580c;
    --theme-blue-700: #c2410c;
    --theme-blue-800: #9a3412;
    --theme-blue-900: #7c2d12;
    --theme-blue-950: #431407;
  }
  .secondary-green {
    --theme-blue-50: #ecfdf5;
    --theme-blue-100: #d1fae5;
    --theme-blue-200: #a7f3d0;
    --theme-blue-300: #6ee7b7;
    --theme-blue-400: #34d399;
    --theme-blue-500: #10b981;
    --theme-blue-600: #059669;
    --theme-blue-700: #047857;
    --theme-blue-800: #065f46;
    --theme-blue-900: #064e3b;
    --theme-blue-950: #022c22;
  }
  .secondary-purple {
    --theme-blue-50: #faf5ff;
    --theme-blue-100: #f3e8ff;
    --theme-blue-200: #e9d5ff;
    --theme-blue-300: #d8b4fe;
    --theme-blue-400: #c084fc;
    --theme-blue-500: #a855f7;
    --theme-blue-600: #9333ea;
    --theme-blue-700: #7e22ce;
    --theme-blue-800: #6b21a8;
    --theme-blue-900: #581c87;
    --theme-blue-950: #3b0764;
  }
  .secondary-rose {
    --theme-blue-50: #fff1f2;
    --theme-blue-100: #ffe4e6;
    --theme-blue-200: #fecdd3;
    --theme-blue-300: #fda4af;
    --theme-blue-400: #fb7185;
    --theme-blue-500: #f43f5e;
    --theme-blue-600: #e11d48;
    --theme-blue-700: #be123c;
    --theme-blue-800: #9f1239;
    --theme-blue-900: #881337;
    --theme-blue-950: #4c0519;
  }
}
"""

with open("src/index.css", "w") as f:
    f.write(new_css)
