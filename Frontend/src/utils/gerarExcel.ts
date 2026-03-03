/**
 * Utilitário para exportar dados de relatórios para Excel (.xlsx)
 */
import * as XLSX from 'xlsx';

/**
 * Exporta um array de objetos para um arquivo Excel e dispara o download.
 * @param dados - Array de objetos (cada objeto = uma linha, chaves = colunas)
 * @param nomeArquivo - Nome do arquivo sem extensão
 * @param nomeAba - Nome da aba na planilha (opcional)
 */
export function exportarParaExcel(
  dados: Record<string, unknown>[],
  nomeArquivo: string,
  nomeAba = 'Dados'
): void {
  if (!dados || dados.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nomeAba);
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}

/**
 * Exporta múltiplas abas para um único arquivo Excel.
 * @param abas - Array de { nomeAba, dados }
 * @param nomeArquivo - Nome do arquivo sem extensão
 */
export function exportarMultiplasAbas(
  abas: { nomeAba: string; dados: Record<string, unknown>[] }[],
  nomeArquivo: string
): void {
  if (!abas.length) return;
  const wb = XLSX.utils.book_new();
  abas.forEach(({ nomeAba, dados }) => {
    if (!dados?.length) return;
    const ws = XLSX.utils.json_to_sheet(dados);
    XLSX.utils.book_append_sheet(wb, ws, nomeAba.substring(0, 31)); // Excel limita nome da aba a 31 chars
  });
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}
