// Utilitários para manipulação de imagens no Electron

/**
 * Verifica se uma URL de imagem é válida e acessível
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // URLs do Cloudinary
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }
  
  // Base64 images
  if (url.startsWith('data:image/')) {
    return true;
  }
  
  // Caminhos relativos (para imagens locais)
  if (url.startsWith('./') || url.startsWith('../')) {
    return true;
  }
  
  return false;
};

/**
 * Obtém a URL da imagem do produto, com fallback
 */
export const getProductImageUrl = (produto: any): string | null => {
  if (!produto || !produto.imagens || produto.imagens.length === 0) {
    return null;
  }

  const primeiraImagem = produto.imagens[0];
  
  // Se é uma string (URL ou base64)
  if (typeof primeiraImagem === 'string') {
    if (isValidImageUrl(primeiraImagem)) {
      return primeiraImagem;
    }
  }
  
  // Se é um objeto com propriedade url
  if (typeof primeiraImagem === 'object' && primeiraImagem.url) {
    if (isValidImageUrl(primeiraImagem.url)) {
      return primeiraImagem.url;
    }
  }
  
  return null;
};

/**
 * Obtém a URL da imagem com fallback para placeholder
 */
export const getImageWithFallback = (url: string | null, fallback?: string): string => {
  if (url && isValidImageUrl(url)) {
    return url;
  }
  
  return fallback || './placeholder.svg';
};

/**
 * Redimensiona uma imagem base64 para otimizar performance
 */
export const resizeBase64Image = (base64: string, maxWidth: number = 800, maxHeight: number = 600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }
      
      // Calcular novas dimensões mantendo proporção
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(resizedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
    };
    
    img.src = base64;
  });
};

/**
 * Preload de imagens para melhor performance
 */
export const preloadImages = (urls: string[]): Promise<void[]> => {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      if (!isValidImageUrl(url)) {
        resolve();
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Não falha se uma imagem não carregar
      img.src = url;
    });
  });
  
  return Promise.all(promises);
};
