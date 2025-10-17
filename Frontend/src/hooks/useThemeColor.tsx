import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type ThemeColor = string;

interface ThemeColorContextType {
  primaryColor: ThemeColor;
  setPrimaryColor: (color: ThemeColor) => void;
  applyPrimaryColor: (color: ThemeColor) => void;
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

interface ThemeColorProviderProps {
  children: ReactNode;
}

// Cores predefinidas disponíveis
export const PREDEFINED_COLORS = [
  { name: 'Azul', value: '#3b82f6', class: 'blue' },
  { name: 'Verde', value: '#10b981', class: 'green' },
  { name: 'Amarelo', value: '#f59e0b', class: 'amber' },
  { name: 'Vermelho', value: '#ef4444', class: 'red' },
  { name: 'Roxo', value: '#8b5cf6', class: 'purple' },
  { name: 'Ciano', value: '#06b6d4', class: 'cyan' },
  { name: 'Rosa', value: '#ec4899', class: 'pink' },
  { name: 'Laranja', value: '#f97316', class: 'orange' },
  { name: 'Indigo', value: '#6366f1', class: 'indigo' },
  { name: 'Teal', value: '#14b8a6', class: 'teal' },
  { name: 'Lime', value: '#84cc16', class: 'lime' },
  { name: 'Emerald', value: '#059669', class: 'emerald' }
];

export function ThemeColorProvider({ children }: ThemeColorProviderProps) {
  const [primaryColor, setPrimaryColor] = useState<ThemeColor>('#45d77b');

  // Carregar cor salva do localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('kontrolla_primary_color');
    if (savedColor) {
      setPrimaryColor(savedColor);
      applyPrimaryColor(savedColor);
    } else {
      // Aplicar cor padrão se não houver cor salva
      applyPrimaryColor('#45d77b');
    }
  }, []);

  // Aplicar cor primária ao documento
  const applyPrimaryColor = (color: ThemeColor) => {
    const root = document.documentElement;
    
    // Converter cor HEX para HSL para compatibilidade com o sistema de cores
    const hslColor = hexToHsl(color);
    
    // Aplicar cor como CSS custom property
    root.style.setProperty('--primary-dynamic', hslColor);
    root.style.setProperty('--primary-dynamic-foreground', getContrastColor(color));
    
    // Gerar variações da cor primária
    const variations = generateColorVariations(color);
    Object.entries(variations).forEach(([key, value]) => {
      root.style.setProperty(`--primary-dynamic-${key}`, value);
    });
  };

  // Aplicar cor quando ela muda
  useEffect(() => {
    applyPrimaryColor(primaryColor);
    localStorage.setItem('kontrolla_primary_color', primaryColor);
  }, [primaryColor]);

  const handleSetPrimaryColor = (color: ThemeColor) => {
    setPrimaryColor(color);
  };

  return (
    <ThemeColorContext.Provider value={{ 
      primaryColor, 
      setPrimaryColor: handleSetPrimaryColor, 
      applyPrimaryColor 
    }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext);
  if (context === undefined) {
    throw new Error('useThemeColor must be used within a ThemeColorProvider');
  }
  return context;
}

// Função para gerar cor de contraste (texto)
function getContrastColor(hexColor: string): string {
  // Remove o # se presente
  const color = hexColor.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calcula luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retorna branco para cores escuras, preto para cores claras
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Função para converter HEX para HSL
function hexToHsl(hex: string): string {
  // Remove o # se presente
  const color = hex.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(color.substr(0, 2), 16) / 255;
  const g = parseInt(color.substr(2, 2), 16) / 255;
  const b = parseInt(color.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Função para gerar variações da cor primária
function generateColorVariations(hexColor: string) {
  const color = hexColor.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  return {
    '50': `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`,
    '100': `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`,
    '200': `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`,
    '300': `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`,
    '400': `rgb(${Math.min(255, r + 10)}, ${Math.min(255, g + 10)}, ${Math.min(255, b + 10)})`,
    '500': `rgb(${r}, ${g}, ${b})`,
    '600': `rgb(${Math.max(0, r - 10)}, ${Math.max(0, g - 10)}, ${Math.max(0, b - 10)})`,
    '700': `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`,
    '800': `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`,
    '900': `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`,
    '950': `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`
  };
}
