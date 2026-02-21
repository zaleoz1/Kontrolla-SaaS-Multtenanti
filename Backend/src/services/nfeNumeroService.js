/**
 * Serviço de geração do próximo número de NF-e.
 * Usa sequência em tenant_configuracoes que nunca reutiliza números,
 * evitando duplicidade na SEFAZ quando NF-e são excluídas.
 */

const NFE_ULTIMO_NUMERO_KEY = 'nfe_ultimo_numero';

/**
 * Gera o próximo número de NF-e dentro de uma transação (usa a conexão passada).
 * Garante que a linha de sequência sempre exista e que o número seja único e crescente.
 * @param {import('mysql2/promise').PoolConnection} conn - Conexão da transação (com lock)
 * @param {number} tenantId - ID do tenant
 * @returns {Promise<string>} - Número formatado (9 dígitos)
 */
export async function gerarProximoNumeroNfe(conn, tenantId) {
  // Garantir que a linha de sequência SEMPRE exista. Se não existir, criar com 0.
  // (Antes usávamos INSERT...SELECT FROM nfe: com 0 NF-e o SELECT retorna 0 linhas, o INSERT não
  // inseria nada e o UPDATE não afetava linha → todas as vendas recebiam o mesmo número.)
  await conn.execute(
    `INSERT INTO tenant_configuracoes (tenant_id, chave, valor)
     VALUES (?, ?, '0')
     ON DUPLICATE KEY UPDATE valor = GREATEST(CAST(valor AS UNSIGNED), (SELECT COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) FROM nfe n WHERE n.tenant_id = ?))`,
    [tenantId, NFE_ULTIMO_NUMERO_KEY, tenantId]
  );

  // Bloquear a linha e ler valor atual
  const [rows] = await conn.execute(
    `SELECT valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND chave = ? FOR UPDATE`,
    [tenantId, NFE_ULTIMO_NUMERO_KEY]
  );
  const ultimoSeq = parseInt(rows[0]?.valor || '0', 10);

  // Maior número já na tabela nfe (nunca reutilizar)
  const [maxRows] = await conn.execute(
    `SELECT COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) as m FROM nfe WHERE tenant_id = ?`,
    [tenantId]
  );
  const maxTabela = parseInt(maxRows[0]?.m || '0', 10);

  // Opcional: próximo número em config (quando SEFAZ já tem números à frente)
  const [configRows] = await conn.execute(
    `SELECT valor FROM tenant_configuracoes
     WHERE tenant_id = ? AND chave = 'nfe_proximo_numero'`,
    [tenantId]
  );
  const configProximo = configRows[0]?.valor ? parseInt(configRows[0].valor, 10) : 0;
  const configMinBase = configProximo > 0 ? configProximo - 1 : 0;

  const base = Math.max(ultimoSeq, maxTabela, configMinBase);
  const proximo = base + 1;

  await conn.execute(
    `UPDATE tenant_configuracoes SET valor = ? WHERE tenant_id = ? AND chave = ?`,
    [String(proximo), tenantId, NFE_ULTIMO_NUMERO_KEY]
  );
  return proximo.toString().padStart(9, '0');
}
