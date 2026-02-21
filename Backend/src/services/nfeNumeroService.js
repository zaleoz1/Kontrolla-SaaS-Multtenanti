/**
 * Serviço de geração do próximo número de NF-e.
 * Usa sequência por AMBIENTE (homologação e produção são independentes na SEFAZ).
 * Evita duplicidade e garante que produção não use a mesma sequência que homologação.
 * Em rejeição 539 (duplicidade) ou 218 (já cancelada), a sequência é avançada no focusNfeService
 * para a próxima emissão usar o número seguinte. Opcionalmente, em Configurações > NF-e,
 * "Próximo número" (por ambiente) alinha com o painel Focus NFe para evitar duplicidade.
 */

import { query } from '../database/connection.js';

/** Mínimo para o próximo número (base). Próxima emissão será >= 50. Ajuste aqui se precisar. */
const MIN_PROXIMO_NUMERO_NFE = 49;

function getChaveSequencia(ambiente) {
  const amb = (ambiente || 'homologacao').toLowerCase();
  return amb === 'producao' ? 'nfe_ultimo_numero_producao' : 'nfe_ultimo_numero_homologacao';
}

/**
 * Avança a sequência do ambiente após rejeição por duplicidade, para a próxima emissão usar número seguinte.
 * Chamado quando a SEFAZ retorna "Duplicidade de NF-e" (o número já foi usado).
 * @param {number} tenantId - ID do tenant
 * @param {string} ambiente - 'homologacao' ou 'producao'
 * @param {string|number} numeroUsado - Número que foi rejeitado (ex.: 14)
 */
export async function avancarSequenciaAposDuplicidade(tenantId, ambiente, numeroUsado) {
  const chave = getChaveSequencia(ambiente);
  const num = parseInt(String(numeroUsado).replace(/\D/g, ''), 10) || 0;
  if (num <= 0) return;
  await query(
    `INSERT INTO tenant_configuracoes (tenant_id, chave, valor)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE valor = GREATEST(CAST(valor AS UNSIGNED), ?)`,
    [tenantId, chave, String(num), num]
  );
  console.log(`[NFe] Sequência ${chave} ajustada para pelo menos ${num} (próxima emissão usará ${num + 1})`);
}

/**
 * Gera o próximo número de NF-e dentro de uma transação (usa a conexão passada).
 * Sequência separada por ambiente: homologação e produção não compartilham números.
 * @param {import('mysql2/promise').PoolConnection} conn - Conexão da transação (com lock)
 * @param {number} tenantId - ID do tenant
 * @param {string} [ambiente='homologacao'] - 'homologacao' ou 'producao'
 * @returns {Promise<string>} - Número formatado (9 dígitos)
 */
export async function gerarProximoNumeroNfe(conn, tenantId, ambiente = 'homologacao') {
  const amb = String(ambiente || 'homologacao').toLowerCase().trim();
  const chaveSeq = getChaveSequencia(amb);

  // Garantir que a linha de sequência exista; se não existir, criar com MAX(numero) da tabela
  // (evita resetar para 0 quando alguém apagou a config mas manteve NF-e, ou quando apagou NF-e e a config)
  const [maxInit] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) as m FROM nfe WHERE tenant_id = ? AND LOWER(TRIM(ambiente)) = ?`,
    [tenantId, amb]
  );
  const valorInicial = String(maxInit[0]?.m ?? 0);
  await conn.execute(
    `INSERT INTO tenant_configuracoes (tenant_id, chave, valor)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE valor = GREATEST(CAST(valor AS UNSIGNED), (SELECT COALESCE(MAX(CAST(n.numero AS UNSIGNED)), 0) FROM nfe n WHERE n.tenant_id = ? AND LOWER(TRIM(n.ambiente)) = ?))`,
    [tenantId, chaveSeq, valorInicial, tenantId, amb]
  );

  const [rows] = await conn.execute(
    `SELECT valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND chave = ? FOR UPDATE`,
    [tenantId, chaveSeq]
  );
  const ultimoSeq = parseInt(rows[0]?.valor || '0', 10);

  // Maior número já na tabela nfe NESTE AMBIENTE (LOWER para garantir match)
  const [maxRows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) as m FROM nfe WHERE tenant_id = ? AND LOWER(TRIM(ambiente)) = ?`,
    [tenantId, amb]
  );
  const maxTabela = parseInt(maxRows[0]?.m || '0', 10);

  // Opcional: próximo número em config (geral ou por ambiente)
  const [configRows] = await conn.execute(
    `SELECT chave, valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND (chave = 'nfe_proximo_numero' OR chave = ?)`,
    [tenantId, `nfe_proximo_numero_${amb}`]
  );
  let configProximo = 0;
  for (const r of configRows) {
    const v = parseInt(r.valor || '0', 10);
    if (r.chave === `nfe_proximo_numero_${amb}`) configProximo = Math.max(configProximo, v);
    if (r.chave === 'nfe_proximo_numero') configProximo = Math.max(configProximo, v);
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
  console.log(`[NFe] Número gerado: ${numeroFormatado} (ambiente=${amb}, seq=${ultimoSeq}, maxTabela=${maxTabela}, configMin=${configProximo})`);
  return numeroFormatado;
}
