/**
 * Serviço de geração do próximo número de NF-e.
 * Usa sequência em tenant_configuracoes que nunca reutiliza números,
 * evitando duplicidade na SEFAZ quando NF-e são excluídas.
 */

const NFE_ULTIMO_NUMERO_KEY = 'nfe_ultimo_numero';

/**
 * Gera o próximo número de NF-e dentro de uma transação (usa a conexão passada).
 * Deve ser chamado dentro de uma transação para evitar condição de corrida.
 * @param {import('mysql2/promise').PoolConnection} conn - Conexão da transação (com lock)
 * @param {number} tenantId - ID do tenant
 * @returns {Promise<string>} - Número formatado (9 dígitos)
 */
export async function gerarProximoNumeroNfe(conn, tenantId) {
  await conn.execute(
    `INSERT INTO tenant_configuracoes (tenant_id, chave, valor)
     SELECT ?, ?, COALESCE(MAX(CAST(n.numero AS UNSIGNED)), 0)
     FROM nfe n WHERE n.tenant_id = ?
     ON DUPLICATE KEY UPDATE valor = valor`,
    [tenantId, NFE_ULTIMO_NUMERO_KEY, tenantId]
  );
  const [rows] = await conn.execute(
    `SELECT valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND chave = ? FOR UPDATE`,
    [tenantId, NFE_ULTIMO_NUMERO_KEY]
  );
  const ultimo = parseInt(rows[0]?.valor || '0', 10);
  const proximo = ultimo + 1;
  await conn.execute(
    `UPDATE tenant_configuracoes SET valor = ? WHERE tenant_id = ? AND chave = ?`,
    [String(proximo), tenantId, NFE_ULTIMO_NUMERO_KEY]
  );
  return proximo.toString().padStart(9, '0');
}
