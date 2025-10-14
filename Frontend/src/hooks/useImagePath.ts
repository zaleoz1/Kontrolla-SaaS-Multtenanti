import { useElectron } from './useElectron';

/**
 * Hook para obter o caminho correto das imagens baseado no ambiente
 * @param imageName Nome da imagem (ex: 'logopix.png', 'logo.png')
 * @returns Caminho correto da imagem
 */
export function useImagePath(imageName: string): string {
  // Sempre usar caminho relativo - funciona tanto no Electron quanto no navegador
  const path = `./${imageName}`;
  return path;
}

/**
 * Hook para obter o caminho correto das imagens com fallback
 * @param imageName Nome da imagem
 * @param fallback Caminho de fallback
 * @returns Caminho correto da imagem
 */
export function useImagePathWithFallback(imageName: string, fallback?: string): string {
  const isElectron = useElectron();
  
  // Sempre usar caminho absoluto, pois o servidor estático serve na raiz
  return `/${imageName}`;
}
