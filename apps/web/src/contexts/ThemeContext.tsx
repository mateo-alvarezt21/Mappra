import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem('mappra_theme') as Theme) ?? 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('mappra_theme', t);
    document.documentElement.setAttribute('data-theme', t);
    try {
      await apiFetch('/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ theme: t }),
      });
    } catch {
      // preference saved in localStorage even if API fails
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
