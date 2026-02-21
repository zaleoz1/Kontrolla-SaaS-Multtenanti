/**
 * Serviço de geração do próximo número de NF-e.
 * Usa sequência por AMBIENTE (homologação e produção são independentes na SEFAZ).
 * Evita duplicidade e garante que produção não use a mesma sequência que homologação.
 */

function getChaveSequencia(ambiente) {
  const amb = (ambiente || 'homologacao').toLowerCase();
  return amb === 'producao' ? 'nfe_ultimo_numero_producao' : 'nfe_ultimo_numero_homologacao';
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
  const chaveSeq = getChaveSequencia(ambiente);

  // Garantir que a linha de sequência SEMPRE exista para este ambiente
  await conn.execute(
    `INSERT INTO tenant_configuracoes (tenant_id, chave, valor)
     VALUES (?, ?, '0')
     ON DUPLICATE KEY UPDATE valor = GREATEST(CAST(valor AS UNSIGNED), (SELECT COALESCE(MAX(CAST(n.numero AS UNSIGNED)), 0) FROM nfe n WHERE n.tenant_id = ? AND n.ambiente = ?))`,
    [tenantId, chaveSeq, tenantId, ambiente]
  );

  const [rows] = await conn.execute(
    `SELECT valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND chave = ? FOR UPDATE`,
    [tenantId, chaveSeq]
  );
  const ultimoSeq = parseInt(rows[0]?.valor || '0', 10);

  // Maior número já na tabela nfe NESTE AMBIENTE
  const [maxRows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) as m FROM nfe WHERE tenant_id = ? AND ambiente = ?`,
    [tenantId, ambiente]
  );
  const maxTabela = parseInt(maxRows[0]?.m || '0', 10);

  // Opcional: próximo número em config (geral ou por ambiente)
  const [configRows] = await conn.execute(
    `SELECT chave, valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND (chave = 'nfe_proximo_numero' OR chave = ?)`,
    [tenantId, `nfe_proximo_numero_${ambiente}`]
  );
  let configProximo = 0;
  for (const r of configRows) {
    const v = parseInt(r.valor || '0', 10);
    if (r.chave === `nfe_proximo_numero_${ambiente}`) configProximo = Math.max(configProximo, v);
    if (r.chave === 'nfe_proximo_numero') configProximo = Math.max(configProximo, v);
  }
  const configMinBase = configProximo > 0 ? configProximo - 1 : 0;

  const base = Math.max(ultimoSeq, maxTabela, configMinBase);
  const proximo = base + 1;

  await conn.execute(
    `UPDATE tenant_configuracoes SET valor = ? WHERE tenant_id = ? AND chave = ?`,
    [String(proximo), tenantId, chaveSeq]
  );
  return proximo.toString().padStart(9, '0');
}
