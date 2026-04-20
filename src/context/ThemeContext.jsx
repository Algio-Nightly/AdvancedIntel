import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  // Original 4
  { id: 'clinical',        name: 'Clinical Glass',      color: '#446464', description: 'Standard teal intelligence interface.' },
  { id: 'phantom',         name: 'Phantom Protocol',    color: '#00f5ff', description: 'Midnight stealth mode with neon accents.' },
  { id: 'biosphere',       name: 'Biosphere',           color: '#10b981', description: 'Organic data mapping with forest tones.' },
  { id: 'sterile',         name: 'Sterile Lab',         color: '#1d4ed8', description: 'High-intensity light mode for pure focus.' },

  // Clinical Family — Light variants
  { id: 'clinical-mint-light',      name: 'Mint Light',      color: '#10b981', description: 'Fresh mint tones, light background.' },
  { id: 'clinical-slate-light',     name: 'Slate Light',     color: '#475569', description: 'Professional slate grey, light background.' },
  { id: 'clinical-lavender-light',  name: 'Lavender Light',  color: '#8b5cf6', description: 'Soft violet hues, light background.' },
  { id: 'clinical-amber-light',     name: 'Amber Light',     color: '#d97706', description: 'Warm amber tones, light background.' },
  { id: 'clinical-rose-light',      name: 'Rose Light',      color: '#e11d48', description: 'Elegant rose accents, light background.' },
  { id: 'clinical-sapphire-light',  name: 'Sapphire Light',  color: '#2563eb', description: 'Deep sapphire blue, light background.' },
  { id: 'clinical-emerald-light',   name: 'Emerald Light',   color: '#059669', description: 'Rich emerald green, light background.' },
  { id: 'clinical-crimson-light',   name: 'Crimson Light',   color: '#991b1b', description: 'Bold crimson accents, light background.' },

  // Clinical Family — Dark variants
  { id: 'clinical-mint-dark',       name: 'Mint Dark',       color: '#34d399', description: 'Fresh mint tones, dark background.' },
  { id: 'clinical-slate-dark',      name: 'Slate Dark',      color: '#94a3b8', description: 'Professional slate grey, dark background.' },
  { id: 'clinical-lavender-dark',   name: 'Lavender Dark',   color: '#a78bfa', description: 'Soft violet hues, dark background.' },
  { id: 'clinical-amber-dark',      name: 'Amber Dark',      color: '#fbbf24', description: 'Warm amber tones, dark background.' },
  { id: 'clinical-rose-dark',       name: 'Rose Dark',       color: '#fb7185', description: 'Elegant rose accents, dark background.' },
  { id: 'clinical-sapphire-dark',   name: 'Sapphire Dark',   color: '#60a5fa', description: 'Deep sapphire blue, dark background.' },
  { id: 'clinical-emerald-dark',    name: 'Emerald Dark',    color: '#10b981', description: 'Rich emerald green, dark background.' },
  { id: 'clinical-crimson-dark',    name: 'Crimson Dark',    color: '#ef4444', description: 'Bold crimson accents, dark background.' },
];

// Themes that use a light color scheme
const LIGHT_THEMES = new Set([
  'sterile',
  'clinical-mint-light',
  'clinical-slate-light',
  'clinical-lavender-light',
  'clinical-amber-light',
  'clinical-rose-light',
  'clinical-sapphire-light',
  'clinical-emerald-light',
  'clinical-crimson-light',
]);

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('intel-theme') || 'clinical';
  });

  useEffect(() => {
    localStorage.setItem('intel-theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.setAttribute('data-theme', currentTheme);

    const isLight = LIGHT_THEMES.has(currentTheme);
    if (isLight) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
