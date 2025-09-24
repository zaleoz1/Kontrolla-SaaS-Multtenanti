import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface DadosRelatorioVendas {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  responsavel: {
    nome: string;
    email: string;
  };
  resumo_geral: {
    total_vendas: number;
    receita_total: number;
    ticket_medio: number;
    vendas_pagas: number;
    vendas_pendentes: number;
  };
  formas_pagamento: Array<{
    metodo_pagamento: string;
    quantidade: number;
    valor_total: number;
  }>;
  vendas_por_categoria: Array<{
    categoria_nome: string;
    quantidade_vendida: number;
    faturamento: number;
    percentual: number;
  }>;
  vendas_por_data: Array<{
    data_venda: string;
    quantidade_vendas: number;
    valor_total: number;
  }>;
}

export const gerarRelatorioVendasPDF = (
  dados: DadosRelatorioVendas,
  formatarMoeda: (valor: number) => string
) => {
  const { periodo, responsavel, resumo_geral, formas_pagamento, vendas_por_categoria, vendas_por_data } = dados;

  // Datas formatadas
  const dataInicio = new Date(periodo.data_inicio).toLocaleDateString('pt-BR');
  const dataFim = new Date(periodo.data_fim).toLocaleDateString('pt-BR');

  // Mapear formas de pagamento
  const formasPagamentoMap: Record<string, string> = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão Crédito',
    cartao_debito: 'Cartão Débito',
    pix: 'Pix',
    transferencia: 'Transferência',
    boleto: 'Boleto',
    cheque: 'Cheque',
    prazo: 'A Prazo',
    outros: 'Outros',
  };

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Paleta de cores
  const primary: [number, number, number] = [31, 41, 55]; // cinza escuro
  const secondary: [number, number, number] = [107, 114, 128]; // cinza médio
  const accent: [number, number, number] = [59, 130, 246]; // azul
  const light: [number, number, number] = [249, 250, 251];
  const border: [number, number, number] = [229, 231, 235];

  // Helpers
  const line = (y: number, color: [number, number, number] = border) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
  };

  const text = (
    content: string,
    x: number,
    y: number,
    opts: { size?: number; color?: [number, number, number]; align?: 'left' | 'center' | 'right'; bold?: boolean } = {}
  ) => {
    const { size = 11, color = primary, align = 'left', bold = false } = opts;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(content, x, y, { align });
  };

  const rect = (x: number, y: number, w: number, h: number, fill: [number, number, number] = light) => {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.rect(x, y, w, h, 'FD');
  };

  // Cabeçalho fixo
  const header = () => {
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageWidth, 30, 'F');
    text('RELATÓRIO DE VENDAS POR PERÍODO', pageWidth / 2, 15, {
      size: 16,
      color: [255, 255, 255],
      align: 'center',
      bold: true,
    });
    text(`Período: ${dataInicio} a ${dataFim}`, pageWidth / 2, 22, {
      size: 12,
      color: [209, 213, 219],
      align: 'center',
    });
  };

  // Rodapé fixo
  const footer = () => {
    const y = pageHeight - 15;
    line(y - 5);
    text('Kontrolla SaaS - Sistema de Gestão Empresarial', pageWidth / 2, y, {
      size: 9,
      color: primary,
      align: 'center',
    });
  };

  // Função para verificar se precisa de nova página
  const checkNewPage = (requiredSpace: number = 50) => {
    if (y > pageHeight - requiredSpace) {
      doc.addPage();
      y = 20; // Posição inicial sem header nas páginas seguintes
    }
  };

  // Aplicar header e footer seletivamente
  const applyHeaderFooter = () => {
    const count = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= count; i++) {
      doc.setPage(i);
      if (i === 1) {
        // Apenas header na primeira página
        header();
      } else {
        // Apenas footer nas páginas seguintes
        footer();
      }
    }
  };

  let y = 45; // Posição inicial considerando o header na primeira página

  // Responsável
  text(`Responsável: ${responsavel.nome.replace(/\s+/g, ' ').trim()}`, 20, y, { size: 10, color: secondary });
  text(`Email: ${responsavel.email}`, 20, y + 6, { size: 10, color: secondary });
  y += 18;
  line(y);
  y += 12;

  // Resumo
  text('1. RESUMO GERAL DO PERÍODO', 20, y, { size: 14, bold: true });
  y += 10;
  text('Receita Total: ', 20, y, { size: 12, bold: true });
  text(formatarMoeda(resumo_geral.receita_total), 20 + doc.getTextWidth('Receita Total: '), y, { size: 12 });
  y += 6;
  text('Número de Vendas: ', 20, y, { size: 12, bold: true });
  text(resumo_geral.total_vendas.toString(), 20 + doc.getTextWidth('Número de Vendas: '), y, { size: 12 });
  y += 15;

  // Verificar espaço para formas de pagamento
  checkNewPage(60);

  // Formas de pagamento
  text('2. FORMAS DE PAGAMENTO', 20, y, { size: 14, bold: true });
  y += 8;
  autoTable(doc, {
    startY: y,
    head: [['Forma de Pagamento', 'Valor Total']],
    body: formas_pagamento.map(f => [
      formasPagamentoMap[f.metodo_pagamento] || f.metodo_pagamento,
      formatarMoeda(f.valor_total),
    ]),
    theme: 'grid',
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10, lineColor: [border[0], border[1], border[2]], lineWidth: 0.2 },
    headStyles: { fillColor: [primary[0], primary[1], primary[2]], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 50 } },
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Verificar espaço para vendas por categoria
  checkNewPage(60);

  // Vendas por categoria
  text('3. VENDAS POR CATEGORIA DE PRODUTO', 20, y, { size: 14, bold: true });
  y += 8;
  autoTable(doc, {
    startY: y,
    head: [['Categoria', 'Faturamento', '%']],
    body: vendas_por_categoria.map(c => [
      c.categoria_nome || 'Sem categoria',
      formatarMoeda(c.faturamento),
      `${c.percentual.toFixed(1)}%`,
    ]),
    theme: 'grid',
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10, lineColor: [border[0], border[1], border[2]], lineWidth: 0.2 },
    headStyles: { fillColor: [primary[0], primary[1], primary[2]], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 50 }, 2: { halign: 'center', cellWidth: 30 } },
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Verificar espaço para vendas por data
  checkNewPage(60);

  // Vendas por data
  text('4. VENDAS POR DATA', 20, y, { size: 14, bold: true });
  y += 8;
  const vendasData = vendas_por_data.map(v => [
    new Date(v.data_venda).toLocaleDateString('pt-BR'),
    formatarMoeda(v.valor_total),
  ]);
  const total = vendas_por_data.reduce((s, v) => s + v.valor_total, 0);
  vendasData.push(['TOTAL', formatarMoeda(total)]);

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Valor']],
    body: vendasData,
    theme: 'grid',
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10, lineColor: [border[0], border[1], border[2]], lineWidth: 0.2 },
    headStyles: { fillColor: [primary[0], primary[1], primary[2]], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 50 } },
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Verificar espaço para observações
  checkNewPage(80);

  // Observações
  text('5. OBSERVAÇÕES', 20, y, { size: 14, bold: true });
  y += 8;
  rect(20, y, pageWidth - 40, 35);
  const obs = [
    '• Relatório gerado automaticamente pelo sistema KontrollaPro',
    `• Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    '• Dados baseados em vendas com status "pago"',
    `• Período: ${dataInicio} a ${dataFim}`,
    '• Relatório confidencial - uso interno',
  ];
  obs.forEach((o, i) => text(o, 25, y + 8 + i * 6, { size: 9 }));
  y += 40;

  // Aplicar header/rodapé em todas as páginas
  applyHeaderFooter();

  doc.save(`relatorio_vendas_${new Date().toISOString().split('T')[0]}.pdf`);
};
