import { create } from 'zustand';

// Accent color definitions — hsl values that map to --primary CSS variable
export const ACCENT_COLORS = {
  Blue:    { hsl: '221.2 83.2% 53.3%',  hslDark: '217.2 91.2% 59.8%',  hex: '#3b82f6' },
  Indigo:  { hsl: '238.7 83.5% 66.7%',  hslDark: '238.7 83.5% 66.7%',  hex: '#6366f1' },
  Violet:  { hsl: '262.1 83.3% 57.8%',  hslDark: '263.4 70% 50.4%',    hex: '#8b5cf6' },
  Emerald: { hsl: '160 60% 45%',         hslDark: '160.1 84.1% 39.4%',  hex: '#10b981' },
  Rose:    { hsl: '346.8 77.2% 49.8%',  hslDark: '346.8 77.2% 49.8%',  hex: '#f43f5e' },
  Amber:   { hsl: '32.1 94.6% 43.8%',   hslDark: '37.7 92.1% 50.2%',   hex: '#f59e0b' },
};

// Apply accent color to document CSS variables
function applyAccentColor(colorName, isDark) {
  const color = ACCENT_COLORS[colorName];
  if (!color) return;
  const hsl = isDark ? color.hslDark : color.hsl;
  document.documentElement.style.setProperty('--primary', hsl);
  document.documentElement.style.setProperty('--ring', hsl);
}

export const useThemeStore = create((set, get) => ({
  theme:       localStorage.getItem('theme')       || 'light',
  accentColor: localStorage.getItem('accentColor') || 'Blue',

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    // Re-apply accent for the new theme mode
    applyAccentColor(state.accentColor, nextTheme === 'dark');

    return { theme: nextTheme };
  }),

  setAccentColor: (colorName) => set((state) => {
    localStorage.setItem('accentColor', colorName);
    applyAccentColor(colorName, state.theme === 'dark');
    return { accentColor: colorName };
  }),

  initTheme: () => {
    const { theme, accentColor } = get();

    // Apply dark/light
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    // Apply accent color
    applyAccentColor(accentColor, theme === 'dark');
  },
}));
