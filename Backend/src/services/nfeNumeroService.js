/**
 * Serviço de geração do próximo número de NF-e.
 * Usa sequência em tenant_configuracoes que nunca reutiliza números,
 * evitando duplicidade na SEFAZ quando NF-e são excluídas.
 */

const NFE_ULTIMO_NUMERO_KEY = 'nfe_ultimo_numero';

/**
 * Gera o próximo número de NF-e dentro de uma transação (usa a conexão passada).
 * Usa o maior entre: valor da sequência e MAX(numero) na tabela nfe (e opcionalmente
 * o config nfe_proximo_numero), assim nunca reutiliza número já usado.
 * @param {import('mysql2/promise').PoolConnection} conn - Conexão da transação (com lock)
 * @param {number} tenantId - ID do tenant
 * @returns {Promise<string>} - Número formatado (9 dígitos)
 */
export async function gerarProximoNumeroNfe(conn, tenantId) {
  // Garantir que existe linha de sequência
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
  const ultimoSeq = parseInt(rows[0]?.valor || '0', 10);

  // Maior número já usado na tabela (evita reutilizar se a sequência estiver atrás)
  const [maxRows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) as m FROM nfe WHERE tenant_id = ?`,
    [tenantId]
  );
  const maxTabela = parseInt(maxRows[0]?.m || '0', 10);

  // Opcional: próximo número definido em config (ex.: quando SEFAZ já tem números à frente)
  const [configRows] = await conn.execute(
    `SELECT valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND chave = 'nfe_proximo_numero'`,
    [tenantId]
  );
  const configProximo = configRows[0]?.valor ? parseInt(configRows[0].valor, 10) : 0;
  // Se config definiu "4", queremos que o próximo seja 4 → base = 3
  const configMinBase = configProximo > 0 ? configProximo - 1 : 0;

  const base = Math.max(ultimoSeq, maxTabela, configMinBase);
  const proximo = base + 1;

  await conn.execute(
    `UPDATE tenant_configuracoes SET valor = ? WHERE tenant_id = ? AND chave = ?`,
    [String(proximo), tenantId, NFE_ULTIMO_NUMERO_KEY]
  );
  return proximo.toString().padStart(9, '0');
}
