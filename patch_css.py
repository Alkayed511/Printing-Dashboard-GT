with open("src/index.css", "r") as f:
    text = f.read()

new_css = text + """

:root, .theme-orange {
  --theme-50: var(--color-orange-50);
  --theme-100: var(--color-orange-100);
  --theme-200: var(--color-orange-200);
  --theme-300: var(--color-orange-300);
  --theme-400: var(--color-orange-400);
  --theme-500: var(--color-orange-500);
  --theme-600: var(--color-orange-600);
  --theme-700: var(--color-orange-700);
  --theme-800: var(--color-orange-800);
  --theme-900: var(--color-orange-900);
  --theme-950: var(--color-orange-950);
}

.theme-blue {
  --theme-50: var(--color-blue-50);
  --theme-100: var(--color-blue-100);
  --theme-200: var(--color-blue-200);
  --theme-300: var(--color-blue-300);
  --theme-400: var(--color-blue-400);
  --theme-500: var(--color-blue-500);
  --theme-600: var(--color-blue-600);
  --theme-700: var(--color-blue-700);
  --theme-800: var(--color-blue-800);
  --theme-900: var(--color-blue-900);
  --theme-950: var(--color-blue-950);
}

.theme-green {
  --theme-50: var(--color-emerald-50);
  --theme-100: var(--color-emerald-100);
  --theme-200: var(--color-emerald-200);
  --theme-300: var(--color-emerald-300);
  --theme-400: var(--color-emerald-400);
  --theme-500: var(--color-emerald-500);
  --theme-600: var(--color-emerald-600);
  --theme-700: var(--color-emerald-700);
  --theme-800: var(--color-emerald-800);
  --theme-900: var(--color-emerald-900);
  --theme-950: var(--color-emerald-950);
}

.theme-purple {
  --theme-50: var(--color-purple-50);
  --theme-100: var(--color-purple-100);
  --theme-200: var(--color-purple-200);
  --theme-300: var(--color-purple-300);
  --theme-400: var(--color-purple-400);
  --theme-500: var(--color-purple-500);
  --theme-600: var(--color-purple-600);
  --theme-700: var(--color-purple-700);
  --theme-800: var(--color-purple-800);
  --theme-900: var(--color-purple-900);
  --theme-950: var(--color-purple-950);
}

@theme {
  --color-orange-50: var(--theme-50);
  --color-orange-100: var(--theme-100);
  --color-orange-200: var(--theme-200);
  --color-orange-300: var(--theme-300);
  --color-orange-400: var(--theme-400);
  --color-orange-500: var(--theme-500);
  --color-orange-600: var(--theme-600);
  --color-orange-700: var(--theme-700);
  --color-orange-800: var(--theme-800);
  --color-orange-900: var(--theme-900);
  --color-orange-950: var(--theme-950);
}
"""

with open("src/index.css", "w") as f:
    f.write(new_css)
