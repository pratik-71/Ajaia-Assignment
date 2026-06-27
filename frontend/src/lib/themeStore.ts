export const theme = {
  colors: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    background: '#f8fafc',
    surface: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
  }
};

export const applyTheme = () => {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.colors.primary);
  root.style.setProperty('--primary-hover', theme.colors.primaryHover);
  root.style.setProperty('--bg-color', theme.colors.background);
  root.style.setProperty('--surface-color', theme.colors.surface);
  root.style.setProperty('--text-primary', theme.colors.textPrimary);
  root.style.setProperty('--text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--border-color', theme.colors.border);
  root.style.setProperty('--error-color', theme.colors.error);
};
