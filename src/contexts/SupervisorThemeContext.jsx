import { createContext, useContext, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

const LIGHT_THEME = {
  primary: '#2563EB',
  darkBlue: '#1E3A8A',
  textMain: '#111827',
  textMuted: '#6B7280',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E5E7EB',
  overlay: 'rgba(255, 255, 255, 0.7)',
};

const DARK_THEME = {
  primary: '#60A5FA',
  darkBlue: '#93C5FD',
  textMain: '#F9FAFB',
  textMuted: '#9CA3AF',
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  overlay: 'rgba(15, 23, 42, 0.85)',
};

const SupervisorThemeContext = createContext(null);

export function SupervisorThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const value = useMemo(() => ({
    isDarkMode,
    theme: isDarkMode ? DARK_THEME : LIGHT_THEME,
    toggleTheme: () => setIsDarkMode((current) => !current),
    resetTheme: () => setIsDarkMode(false),
  }), [isDarkMode]);

  return (
    <SupervisorThemeContext.Provider value={value}>
      {children}
    </SupervisorThemeContext.Provider>
  );
}

export function useSupervisorTheme() {
  const context = useContext(SupervisorThemeContext);
  if (!context) {
    throw new Error('useSupervisorTheme must be used within SupervisorThemeProvider');
  }
  return context;
}

const DARK_SURFACES = {
  '#FFFFFF': '#1E293B',
  '#FFF': '#1E293B',
  '#F8FAFC': '#0F172A',
  '#F0F4F8': '#0F172A',
  '#F9FAFB': '#1E293B',
  '#F3F4F6': '#334155',
  '#FAFAFA': '#1E293B',
  '#EDF2F7': '#334155',
  '#EFF6FF': '#1E3A8A',
  '#DBEAFE': '#1E3A8A',
  '#E0E7FF': '#312E81',
  '#FEF3C7': '#78350F',
  '#FEE2E2': '#7F1D1D',
  '#DCFCE7': '#064E3B',
  '#ECFDF5': '#064E3B',
  '#D1FAE5': '#064E3B',
  '#FCE7F3': '#831843',
};

const DARK_TEXT = {
  '#111827': '#F9FAFB',
  '#1A202C': '#F9FAFB',
  '#2D3748': '#E2E8F0',
  '#374151': '#E5E7EB',
  '#4A5568': '#CBD5E1',
  '#4B5563': '#CBD5E1',
  '#6B7280': '#9CA3AF',
  '#718096': '#9CA3AF',
  '#A0AEC0': '#94A3B8',
  '#059669': '#6EE7B7',
  '#16A34A': '#4ADE80',
  '#DC2626': '#FCA5A5',
  '#EF4444': '#F87171',
  '#D97706': '#FCD34D',
  '#B45309': '#FCD34D',
  '#2563EB': '#93C5FD',
  '#4F46E5': '#A5B4FC',
};

function themeStyle(style, theme) {
  const flattened = StyleSheet.flatten(style) || {};
  return Object.fromEntries(
    Object.entries(flattened).map(([key, value]) => {
      if (typeof value !== 'string') return [key, value];

      const normalized = value.toUpperCase();
      if (key.toLowerCase().includes('backgroundcolor')) {
        if (normalized.startsWith('RGBA(255, 255, 255')) return [key, theme.overlay];
        return [key, DARK_SURFACES[normalized] || value];
      }
      if (key.toLowerCase().includes('color')) {
        if (key.toLowerCase().includes('border')) {
          return [key, ['#E2E8F0', '#E5E7EB', '#CBD5E0'].includes(normalized) ? theme.border : value];
        }
        return [key, DARK_TEXT[normalized] || value];
      }
      return [key, value];
    })
  );
}

export function useSupervisorStyles(baseStyles) {
  const { isDarkMode, theme } = useSupervisorTheme();
  return useMemo(() => {
    if (!isDarkMode) return baseStyles;
    return Object.fromEntries(
      Object.entries(baseStyles).map(([name, style]) => [name, themeStyle(style, theme)])
    );
  }, [baseStyles, isDarkMode, theme]);
}
