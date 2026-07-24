with open("src/index.css", "r") as f:
    text = f.read()

# Replace the whole index.css with our dynamic remapping
new_css = """@import "tailwindcss";

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-12deg); }
  75% { transform: rotate(12deg); }
}
.animate-wiggle {
  animation: wiggle 0.5s ease-in-out infinite;
}

@layer base {
  :root {
    --og-orange-50: #fff7ed;
    --og-orange-100: #ffedd5;
    --og-orange-200: #fed7aa;
    --og-orange-300: #fdba74;
    --og-orange-400: #fb923c;
    --og-orange-500: #f97316;
    --og-orange-600: #ea580c;
    --og-orange-700: #c2410c;
    --og-orange-800: #9a3412;
    --og-orange-900: #7c2d12;
    --og-orange-950: #431407;

    --og-blue-50: #eff6ff;
    --og-blue-100: #dbeafe;
    --og-blue-200: #bfdbfe;
    --og-blue-300: #93c5fd;
    --og-blue-400: #60a5fa;
    --og-blue-500: #3b82f6;
    --og-blue-600: #2563eb;
    --og-blue-700: #1d4ed8;
    --og-blue-800: #1e40af;
    --og-blue-900: #1e3a8a;
    --og-blue-950: #172554;
  }

  .primary-orange {
    --color-orange-50: var(--og-orange-50);
    --color-orange-100: var(--og-orange-100);
    --color-orange-200: var(--og-orange-200);
    --color-orange-300: var(--og-orange-300);
    --color-orange-400: var(--og-orange-400);
    --color-orange-500: var(--og-orange-500);
    --color-orange-600: var(--og-orange-600);
    --color-orange-700: var(--og-orange-700);
    --color-orange-800: var(--og-orange-800);
    --color-orange-900: var(--og-orange-900);
    --color-orange-950: var(--og-orange-950);
  }
  .primary-blue {
    --color-orange-50: var(--color-blue-50);
    --color-orange-100: var(--color-blue-100);
    --color-orange-200: var(--color-blue-200);
    --color-orange-300: var(--color-blue-300);
    --color-orange-400: var(--color-blue-400);
    --color-orange-500: var(--color-blue-500);
    --color-orange-600: var(--color-blue-600);
    --color-orange-700: var(--color-blue-700);
    --color-orange-800: var(--color-blue-800);
    --color-orange-900: var(--color-blue-900);
    --color-orange-950: var(--color-blue-950);
  }
  .primary-green {
    --color-orange-50: var(--color-emerald-50);
    --color-orange-100: var(--color-emerald-100);
    --color-orange-200: var(--color-emerald-200);
    --color-orange-300: var(--color-emerald-300);
    --color-orange-400: var(--color-emerald-400);
    --color-orange-500: var(--color-emerald-500);
    --color-orange-600: var(--color-emerald-600);
    --color-orange-700: var(--color-emerald-700);
    --color-orange-800: var(--color-emerald-800);
    --color-orange-900: var(--color-emerald-900);
    --color-orange-950: var(--color-emerald-950);
  }
  .primary-purple {
    --color-orange-50: var(--color-purple-50);
    --color-orange-100: var(--color-purple-100);
    --color-orange-200: var(--color-purple-200);
    --color-orange-300: var(--color-purple-300);
    --color-orange-400: var(--color-purple-400);
    --color-orange-500: var(--color-purple-500);
    --color-orange-600: var(--color-purple-600);
    --color-orange-700: var(--color-purple-700);
    --color-orange-800: var(--color-purple-800);
    --color-orange-900: var(--color-purple-900);
    --color-orange-950: var(--color-purple-950);
  }
  .primary-rose {
    --color-orange-50: var(--color-rose-50);
    --color-orange-100: var(--color-rose-100);
    --color-orange-200: var(--color-rose-200);
    --color-orange-300: var(--color-rose-300);
    --color-orange-400: var(--color-rose-400);
    --color-orange-500: var(--color-rose-500);
    --color-orange-600: var(--color-rose-600);
    --color-orange-700: var(--color-rose-700);
    --color-orange-800: var(--color-rose-800);
    --color-orange-900: var(--color-rose-900);
    --color-orange-950: var(--color-rose-950);
  }

  .secondary-blue {
    --color-blue-50: var(--og-blue-50);
    --color-blue-100: var(--og-blue-100);
    --color-blue-200: var(--og-blue-200);
    --color-blue-300: var(--og-blue-300);
    --color-blue-400: var(--og-blue-400);
    --color-blue-500: var(--og-blue-500);
    --color-blue-600: var(--og-blue-600);
    --color-blue-700: var(--og-blue-700);
    --color-blue-800: var(--og-blue-800);
    --color-blue-900: var(--og-blue-900);
    --color-blue-950: var(--og-blue-950);
  }
  .secondary-orange {
    --color-blue-50: var(--color-orange-50);
    --color-blue-100: var(--color-orange-100);
    --color-blue-200: var(--color-orange-200);
    --color-blue-300: var(--color-orange-300);
    --color-blue-400: var(--color-orange-400);
    --color-blue-500: var(--color-orange-500);
    --color-blue-600: var(--color-orange-600);
    --color-blue-700: var(--color-orange-700);
    --color-blue-800: var(--color-orange-800);
    --color-blue-900: var(--color-orange-900);
    --color-blue-950: var(--color-orange-950);
  }
  .secondary-green {
    --color-blue-50: var(--color-emerald-50);
    --color-blue-100: var(--color-emerald-100);
    --color-blue-200: var(--color-emerald-200);
    --color-blue-300: var(--color-emerald-300);
    --color-blue-400: var(--color-emerald-400);
    --color-blue-500: var(--color-emerald-500);
    --color-blue-600: var(--color-emerald-600);
    --color-blue-700: var(--color-emerald-700);
    --color-blue-800: var(--color-emerald-800);
    --color-blue-900: var(--color-emerald-900);
    --color-blue-950: var(--color-emerald-950);
  }
  .secondary-purple {
    --color-blue-50: var(--color-purple-50);
    --color-blue-100: var(--color-purple-100);
    --color-blue-200: var(--color-purple-200);
    --color-blue-300: var(--color-purple-300);
    --color-blue-400: var(--color-purple-400);
    --color-blue-500: var(--color-purple-500);
    --color-blue-600: var(--color-purple-600);
    --color-blue-700: var(--color-purple-700);
    --color-blue-800: var(--color-purple-800);
    --color-blue-900: var(--color-purple-900);
    --color-blue-950: var(--color-purple-950);
  }
  .secondary-rose {
    --color-blue-50: var(--color-rose-50);
    --color-blue-100: var(--color-rose-100);
    --color-blue-200: var(--color-rose-200);
    --color-blue-300: var(--color-rose-300);
    --color-blue-400: var(--color-rose-400);
    --color-blue-500: var(--color-rose-500);
    --color-blue-600: var(--color-rose-600);
    --color-blue-700: var(--color-rose-700);
    --color-blue-800: var(--color-rose-800);
    --color-blue-900: var(--color-rose-900);
    --color-blue-950: var(--color-rose-950);
  }
}
"""

with open("src/index.css", "w") as f:
    f.write(new_css)
