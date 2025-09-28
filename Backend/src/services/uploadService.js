import cloudinary from '../config/cloudinary.js';

/**
 * Upload de imagem para o Cloudinary
 * @param {string} imageBase64 - Imagem em base64
 * @param {string} folder - Pasta no Cloudinary (opcional)
 * @param {string} publicId - ID público personalizado (opcional)
 * @returns {Promise<Object>} Resultado do upload
 */
export const uploadImage = async (imageBase64, folder = 'kontrolla', publicId = null) => {
  try {
    const options = {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(imageBase64, options);
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      asset_id: result.asset_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Erro no upload para Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Deletar imagem do Cloudinary
 * @param {string} publicId - ID público da imagem
 * @returns {Promise<Object>} Resultado da exclusão
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload de logo da empresa
 * @param {string} logoBase64 - Logo em base64
 * @param {string} tenantId - ID do tenant
 * @returns {Promise<Object>} Resultado do upload
 */
export const uploadLogo = async (logoBase64, tenantId) => {
  const publicId = `tenant_${tenantId}_logo`;
  return await uploadImage(logoBase64, 'kontrolla/logos', publicId);
};

/**
 * Upload de avatar do usuário
 * @param {string} avatarBase64 - Avatar em base64
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Resultado do upload
 */
export const uploadAvatar = async (avatarBase64, userId) => {
  const publicId = `user_${userId}_avatar`;
  return await uploadImage(avatarBase64, 'kontrolla/avatars', publicId);
};

/**
 * Upload de QR Code PIX
 * @param {string} qrCodeBase64 - QR Code em base64
 * @param {string} tenantId - ID do tenant
 * @returns {Promise<Object>} Resultado do upload
 */
export const uploadQrCodePix = async (qrCodeBase64, tenantId) => {
  const publicId = `tenant_${tenantId}_qrcode_pix`;
  return await uploadImage(qrCodeBase64, 'kontrolla/pix', publicId);
};

/**
 * Upload de imagens de produtos
 * @param {string[]} imagensBase64 - Array de imagens em base64
 * @param {string} produtoId - ID do produto
 * @param {string} tenantId - ID do tenant
 * @returns {Promise<Object>} Resultado dos uploads
 */
export const uploadImagensProduto = async (imagensBase64, produtoId, tenantId) => {
  try {
    const resultados = [];
    
    for (let i = 0; i < imagensBase64.length; i++) {
      const publicId = `tenant_${tenantId}_produto_${produtoId}_img_${i + 1}`;
      const resultado = await uploadImage(imagensBase64[i], 'kontrolla/produtos', publicId);
      
      if (resultado.success) {
        resultados.push({
          url: resultado.url,
          public_id: resultado.public_id,
          index: i + 1
        });
      } else {
        console.error(`Erro ao fazer upload da imagem ${i + 1}:`, resultado.error);
        return {
          success: false,
          error: `Erro ao fazer upload da imagem ${i + 1}: ${resultado.error}`
        };
      }
    }
    
    return {
      success: true,
      imagens: resultados
    };
  } catch (error) {
    console.error('Erro no upload de imagens do produto:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Deletar imagens de produto do Cloudinary
 * @param {string[]} publicIds - Array de public_ids das imagens
 * @returns {Promise<Object>} Resultado da exclusão
 */
export const deleteImagensProduto = async (publicIds) => {
  try {
    const resultados = [];
    
    for (const publicId of publicIds) {
      const resultado = await deleteImage(publicId);
      resultados.push({
        public_id: publicId,
        success: resultado.success
      });
    }
    
    return {
      success: true,
      resultados
    };
  } catch (error) {
    console.error('Erro ao deletar imagens do produto:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
