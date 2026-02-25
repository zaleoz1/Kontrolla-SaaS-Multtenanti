/**
 * Serviço de geração do próximo número de documento fiscal (NF-e e NFC-e).
 * Usa sequência por AMBIENTE (homologação e produção são independentes na SEFAZ).
 *
 * IMPORTANTE:
 * - A sequência é separada por tipo (NF-e vs NFC-e) e por ambiente.
 * - Em rejeição 539 (duplicidade) ou 218 (já cancelada), a sequência é avançada no focusNfeService
 *   para a próxima emissão usar o número seguinte.
 * - Opcionalmente, em Configurações > NF-e, o "Próximo número" (por ambiente e por tipo)
 *   pode alinhar com o painel Focus NFe para evitar duplicidade.
 */

import { query } from '../database/connection.js';

/** Mínimo para o próximo número (base). Próxima emissão será >= 50. Ajuste aqui se precisar. */
const MIN_PROXIMO_NUMERO_NFE = 49;

function normalizeTipoDocumento(tipoDocumento) {
  const t = String(tipoDocumento || 'nfe').toLowerCase().trim();
  return t === 'nfce' ? 'nfce' : 'nfe';
}

function getModeloFromTipoDocumento(tipoDocumento) {
  return normalizeTipoDocumento(tipoDocumento) === 'nfce' ? '65' : '55';
}

function getChaveSequencia(ambiente, tipoDocumento = 'nfe') {
  const amb = (ambiente || 'homologacao').toLowerCase();
  const prefix = normalizeTipoDocumento(tipoDocumento);
  const sufixo = amb === 'producao' ? 'producao' : 'homologacao';
  return `${prefix}_ultimo_numero_${sufixo}`;
}

/**
 * Avança a sequência do ambiente após rejeição por duplicidade, para a próxima emissão usar número seguinte.
 * Chamado quando a SEFAZ retorna duplicidade (o número já foi usado) ou já cancelada (número consumido).
 * @param {number} tenantId - ID do tenant
 * @param {string} ambiente - 'homologacao' ou 'producao'
 * @param {string|number} numeroUsado - Número que foi rejeitado (ex.: 14)
 */
export async function avancarSequenciaAposDuplicidadeDocumento(tenantId, ambiente, tipoDocumento, numeroUsado) {
  const chave = getChaveSequencia(ambiente, tipoDocumento);
  const num = parseInt(String(numeroUsado).replace(/\D/g, ''), 10) || 0;
  if (num <= 0) return;
  await query(
    `INSERT INTO tenant_configuracoes (tenant_id, chave, valor)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE valor = GREATEST(CAST(valor AS UNSIGNED), ?)`,
    [tenantId, chave, String(num), num]
  );
}

/**
 * Mantido por compatibilidade: avança sequência de NF-e (modelo 55).
 */
export async function avancarSequenciaAposDuplicidade(tenantId, ambiente, numeroUsado) {
  return avancarSequenciaAposDuplicidadeDocumento(tenantId, ambiente, 'nfe', numeroUsado);
}

/**
 * Gera o próximo número de documento fiscal dentro de uma transação (usa a conexão passada).
 * Sequência separada por tipo e ambiente: homologação e produção não compartilham números.
 * @param {import('mysql2/promise').PoolConnection} conn - Conexão da transação (com lock)
 * @param {number} tenantId - ID do tenant
 * @param {string} [ambiente='homologacao'] - 'homologacao' ou 'producao'
 * @param {('nfe'|'nfce')} [tipoDocumento='nfe'] - 'nfe' (modelo 55) ou 'nfce' (modelo 65)
 * @returns {Promise<string>} - Número formatado (9 dígitos)
 */
export async function gerarProximoNumeroDocumento(conn, tenantId, ambiente = 'homologacao', tipoDocumento = 'nfe') {
  const amb = String(ambiente || 'homologacao').toLowerCase().trim();
  const tipo = normalizeTipoDocumento(tipoDocumento);
  const modelo = getModeloFromTipoDocumento(tipo);
  const chaveSeq = getChaveSequencia(amb, tipo);

  // Garantir que a linha de sequência exista; se não existir, criar com MAX(numero) da tabela
  // (evita resetar para 0 quando alguém apagou a config mas manteve NF-e, ou quando apagou NF-e e a config)
  const [maxInit] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) as m
     FROM nfe
     WHERE tenant_id = ?
       AND LOWER(TRIM(ambiente)) = ?
       AND (COALESCE(modelo, '55') = ?)`,
    [tenantId, amb, modelo]
  );
  const valorInicial = String(maxInit[0]?.m ?? 0);
  await conn.execute(
    `INSERT INTO tenant_configuracoes (tenant_id, chave, valor)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE valor = GREATEST(
       CAST(valor AS UNSIGNED),
       (SELECT COALESCE(MAX(CAST(n.numero AS UNSIGNED)), 0)
        FROM nfe n
        WHERE n.tenant_id = ?
          AND LOWER(TRIM(n.ambiente)) = ?
          AND (COALESCE(n.modelo, '55') = ?)
       )
     )`,
    [tenantId, chaveSeq, valorInicial, tenantId, amb, modelo]
  );

  const [rows] = await conn.execute(
    `SELECT valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND chave = ? FOR UPDATE`,
    [tenantId, chaveSeq]
  );
  const ultimoSeq = parseInt(rows[0]?.valor || '0', 10);

  // Maior número já na tabela nfe NESTE AMBIENTE (LOWER para garantir match)
  const [maxRows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) as m
     FROM nfe
     WHERE tenant_id = ?
       AND LOWER(TRIM(ambiente)) = ?
       AND (COALESCE(modelo, '55') = ?)`,
    [tenantId, amb, modelo]
  );
  const maxTabela = parseInt(maxRows[0]?.m || '0', 10);

  // Opcional: próximo número em config (geral ou por ambiente, por tipo)
  const chaveProximoGeral = tipo === 'nfce' ? 'nfce_proximo_numero' : 'nfe_proximo_numero';
  const chaveProximoAmb = `${chaveProximoGeral}_${amb}`;
  const [configRows] = await conn.execute(
    `SELECT chave, valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND (chave = ? OR chave = ?)`,
    [tenantId, chaveProximoGeral, chaveProximoAmb]
  );
  let configProximo = 0;
  for (const r of configRows) {
    const v = parseInt(r.valor || '0', 10);
    if (r.chave === chaveProximoAmb) configProximo = Math.max(configProximo, v);
    if (r.chave === chaveProximoGeral) configProximo = Math.max(configProximo, v);
  }
  const configMinBase = configProximo > 0 ? configProximo - 1 : 0;

  let base = Math.max(ultimoSeq, maxTabela, configMinBase, MIN_PROXIMO_NUMERO_NFE);
  let proximo = base + 1;
  // Garantir que nunca retornamos número já existente na tabela (proteção extra)
  if (proximo <= maxTabela) {
    proximo = maxTabela + 1;
    base = maxTabela;
  }

  await conn.execute(
    `UPDATE tenant_configuracoes SET valor = ? WHERE tenant_id = ? AND chave = ?`,
    [String(proximo), tenantId, chaveSeq]
  );
  const numeroFormatado = proximo.toString().padStart(9, '0');
  return numeroFormatado;
}

/**
 * Mantido por compatibilidade: gera próximo número de NF-e (modelo 55).
 */
export async function gerarProximoNumeroNfe(conn, tenantId, ambiente = 'homologacao') {
  return gerarProximoNumeroDocumento(conn, tenantId, ambiente, 'nfe');
}
