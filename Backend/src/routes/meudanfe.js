/**
 * Rotas de integração com a API MeuDanfe
 * https://meudanfe.com.br/api
 * 
 * A configuração da API Key é feita via variável de ambiente:
 * MEUDANFE_API_KEY=sua_api_key
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getConfigInfo,
  isApiConfigured,
  consultarNfePorChave,
  obterXmlNfePorChave,
  obterDanfePorChave,
  converterXmlParaDanfe,
  enviarXmlParaAreaCliente,
  importarNfeConsultada,
  listarNfesImportadas,
  obterNfeImportada,
  obterEstatisticasUso,
  validarConfiguracoes
} from '../services/meuDanfeService.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// ==========================================
// CONFIGURAÇÕES (somente leitura - configurada no servidor)
// ==========================================

/**
 * Obter status da configuração da API MeuDanfe
 * A API Key é configurada no servidor via variável de ambiente
 */
router.get('/config', async (req, res) => {
  try {
    const config = getConfigInfo();
    res.json({ config });
  } catch (error) {
    console.error('Erro ao buscar configurações MeuDanfe:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

/**
 * Validar configurações
 */
router.get('/config/validar', async (req, res) => {
  try {
    const resultado = validarConfiguracoes();
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao validar configurações MeuDanfe:', error);
    res.status(500).json({ error: 'Erro ao validar configurações' });
  }
});

// ==========================================
// CONSULTA DE NF-e
// ==========================================

/**
 * Consultar NF-e por chave de acesso
 * ATENÇÃO: Este serviço é PAGO - R$ 0,03 por consulta
 */
router.post('/consultar', async (req, res) => {
  try {
    const { chave_acesso } = req.body;
    
    if (!chave_acesso) {
      return res.status(400).json({ error: 'Chave de acesso é obrigatória' });
    }

    if (!isApiConfigured()) {
      return res.status(503).json({ 
        error: 'API MeuDanfe não configurada no servidor. Contate o administrador.' 
      });
    }
    
    const resultado = await consultarNfePorChave(req.user.tenant_id, chave_acesso);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao consultar NF-e:', error);
    res.status(400).json({ error: error.message || 'Erro ao consultar NF-e' });
  }
});

/**
 * Obter XML de NF-e por chave de acesso
 */
router.get('/xml/:chave_acesso', async (req, res) => {
  try {
    const { chave_acesso } = req.params;

    if (!isApiConfigured()) {
      return res.status(503).json({ 
        error: 'API MeuDanfe não configurada no servidor' 
      });
    }
    
    const resultado = await obterXmlNfePorChave(req.user.tenant_id, chave_acesso);
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);
    res.send(resultado.xml);
  } catch (error) {
    console.error('Erro ao obter XML:', error);
    res.status(400).json({ error: error.message || 'Erro ao obter XML' });
  }
});

/**
 * Obter DANFE PDF por chave de acesso
 */
router.get('/danfe/:chave_acesso', async (req, res) => {
  try {
    const { chave_acesso } = req.params;

    if (!isApiConfigured()) {
      return res.status(503).json({ 
        error: 'API MeuDanfe não configurada no servidor' 
      });
    }
    
    const resultado = await obterDanfePorChave(chave_acesso);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao obter DANFE:', error);
    res.status(400).json({ error: error.message || 'Erro ao obter DANFE' });
  }
});

/**
 * Enviar XML para área do cliente MeuDanfe (gratuito)
 * AVISO: Vários envios do mesmo XML bloqueará a conta!
 */
router.post('/enviar-xml', async (req, res) => {
  try {
    const { xml } = req.body;
    
    if (!xml) {
      return res.status(400).json({ error: 'XML é obrigatório' });
    }

    if (!isApiConfigured()) {
      return res.status(503).json({ 
        error: 'API MeuDanfe não configurada no servidor' 
      });
    }
    
    const resultado = await enviarXmlParaAreaCliente(req.user.tenant_id, xml);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao enviar XML:', error);
    res.status(400).json({ error: error.message || 'Erro ao enviar XML' });
  }
});

/**
 * Converter XML para DANFE PDF (gratuito)
 */
router.post('/converter-xml', async (req, res) => {
  try {
    const { xml } = req.body;
    
    if (!xml) {
      return res.status(400).json({ error: 'XML é obrigatório' });
    }

    if (!isApiConfigured()) {
      return res.status(503).json({ 
        error: 'API MeuDanfe não configurada no servidor' 
      });
    }
    
    const resultado = await converterXmlParaDanfe(xml);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao converter XML:', error);
    res.status(400).json({ error: error.message || 'Erro ao converter XML' });
  }
});

// ==========================================
// NF-e IMPORTADAS
// ==========================================

/**
 * Importar NF-e consultada para o sistema
 */
router.post('/importar', async (req, res) => {
  try {
    const nfeData = req.body;
    
    if (!nfeData.chave_acesso) {
      return res.status(400).json({ error: 'Dados da NF-e são obrigatórios' });
    }
    
    const resultado = await importarNfeConsultada(req.user.tenant_id, nfeData);
    
    res.status(201).json(resultado);
  } catch (error) {
    console.error('Erro ao importar NF-e:', error);
    res.status(400).json({ error: error.message || 'Erro ao importar NF-e' });
  }
});

/**
 * Listar NF-e importadas
 */
router.get('/importadas', async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '' } = req.query;
    
    const resultado = await listarNfesImportadas(req.user.tenant_id, { page, limit, q });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao listar NF-e importadas:', error);
    res.status(500).json({ error: 'Erro ao listar NF-e importadas' });
  }
});

/**
 * Obter detalhes de NF-e importada
 */
router.get('/importadas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const nfe = await obterNfeImportada(req.user.tenant_id, id);
    
    res.json({ nfe });
  } catch (error) {
    console.error('Erro ao buscar NF-e importada:', error);
    res.status(404).json({ error: error.message || 'NF-e não encontrada' });
  }
});

// ==========================================
// ESTATÍSTICAS
// ==========================================

/**
 * Obter estatísticas de uso da API
 */
router.get('/estatisticas', async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    
    const stats = await obterEstatisticasUso(req.user.tenant_id, periodo);
    
    res.json({ stats });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
