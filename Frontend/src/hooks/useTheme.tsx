import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'dark-light' | 'windows-dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark' | 'dark-light' | 'windows-dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'dark-light' | 'windows-dark'>('light');

  // Carregar tema salvo do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('kontrolla_theme') as Theme;
    if (savedTheme && ['light', 'dark', 'dark-light', 'windows-dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // Resolver tema baseado na preferência do sistema
  useEffect(() => {
    const resolveTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(theme as 'light' | 'dark' | 'dark-light' | 'windows-dark');
      }
    };

    resolveTheme();

    // Escutar mudanças na preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        resolveTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Aplicar tema ao documento
  useEffect(() => {
    const root = document.documentElement;
    
    // Remover classes anteriores
    root.classList.remove('light', 'dark', 'dark-light', 'windows-dark');
    
    // Adicionar classe do tema resolvido
    root.classList.add(resolvedTheme);
    
    // Salvar tema no localStorage
    localStorage.setItem('kontrolla_theme', theme);
  }, [theme, resolvedTheme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
