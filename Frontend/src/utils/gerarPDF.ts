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

export const gerarRelatorioVendasPDF = (dados: DadosRelatorioVendas, formatarMoeda: (valor: number) => string) => {
  const { periodo, responsavel, resumo_geral, formas_pagamento, vendas_por_categoria, vendas_por_data } = dados;
  
  // Formatar datas
  const dataInicioFormatada = new Date(periodo.data_inicio).toLocaleDateString('pt-BR');
  const dataFimFormatada = new Date(periodo.data_fim).toLocaleDateString('pt-BR');
  
  // Mapear formas de pagamento
  const formasPagamentoMap: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'cartao_credito': 'Cartão Crédito',
    'cartao_debito': 'Cartão Débito',
    'pix': 'Pix',
    'transferencia': 'Transferência',
    'boleto': 'Boleto',
    'cheque': 'Cheque',
    'prazo': 'A Prazo',
    'outros': 'Outros'
  };

  // Criar novo documento PDF
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Cores do tema profissional
  const primaryColor = [31, 41, 55]; // #1f2937 - Cinza escuro
  const secondaryColor = [107, 114, 128]; // #6b7280 - Cinza médio
  const accentColor = [59, 130, 246]; // #3b82f6 - Azul corporativo
  const successColor = [16, 185, 129]; // #10b981 - Verde corporativo
  const warningColor = [245, 158, 11]; // #f59e0b - Amarelo corporativo
  const lightGray = [249, 250, 251]; // #f9fafb - Cinza claro
  const borderColor = [229, 231, 235]; // #e5e7eb - Cinza borda

  // Função para adicionar linha horizontal
  const addHorizontalLine = (y: number, color = secondaryColor) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
  };

  // Função para adicionar texto com estilo
  const addStyledText = (text: string, x: number, y: number, options: any = {}) => {
    const defaultOptions = {
      fontSize: 12,
      color: [0, 0, 0],
      align: 'left' as const,
      font: 'helvetica' as const
    };
    const finalOptions = { ...defaultOptions, ...options };
    
    doc.setFontSize(finalOptions.fontSize);
    doc.setTextColor(finalOptions.color[0], finalOptions.color[1], finalOptions.color[2]);
    doc.setFont(finalOptions.font, finalOptions.align === 'center' ? 'bold' : 'normal');
    doc.text(text, x, y, { align: finalOptions.align });
  };

  // Função para adicionar retângulo colorido
  const addColoredRect = (x: number, y: number, width: number, height: number, color: number[]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y, width, height, 'F');
  };

  // Cabeçalho profissional
  addColoredRect(0, 0, pageWidth, 35, primaryColor);
  
  // Logo/Identificação da empresa
  addStyledText('KONTROLLA SAAS', 20, 12, {
    fontSize: 16,
    color: [255, 255, 255],
    align: 'left',
    font: 'helvetica'
  });
  
  addStyledText('Sistema de Gestão Empresarial', 20, 18, {
    fontSize: 10,
    color: [209, 213, 219],
    align: 'left',
    font: 'helvetica'
  });
  
  // Título do relatório
  addStyledText('RELATÓRIO DE VENDAS POR PERÍODO', pageWidth / 2, 15, {
    fontSize: 18,
    color: [255, 255, 255],
    align: 'center',
    font: 'helvetica'
  });
  
  addStyledText(`Período: ${dataInicioFormatada} a ${dataFimFormatada}`, pageWidth / 2, 22, {
    fontSize: 12,
    color: [209, 213, 219],
    align: 'center',
    font: 'helvetica'
  });
  
  // Data de geração
  addStyledText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 12, {
    fontSize: 10,
    color: [209, 213, 219],
    align: 'right',
    font: 'helvetica'
  });

  yPosition = 50;

  // Informações do responsável
  addStyledText(`Responsável: ${responsavel.nome}`, 20, yPosition, { fontSize: 10, color: secondaryColor });
  addStyledText(`Email: ${responsavel.email}`, 20, yPosition + 5, { fontSize: 10, color: secondaryColor });

  yPosition += 20;
  addHorizontalLine(yPosition);
  yPosition += 10;

  // 1. Resumo Geral do Período
  addStyledText('1. RESUMO GERAL DO PERÍODO', 20, yPosition, { fontSize: 16, color: primaryColor, font: 'helvetica' });
  yPosition += 15;

  // Cards de resumo responsivos (2 colunas)
  const cardWidth = (pageWidth - 50) / 2;
  const cardHeight = 35;
  const cardSpacing = 15;

  // Card 1: Total de Vendas
  addColoredRect(20, yPosition, cardWidth, cardHeight, lightGray);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(1);
  doc.rect(20, yPosition, cardWidth, cardHeight);
  
  addStyledText('TOTAL DE VENDAS', 30, yPosition + 10, { fontSize: 10, color: secondaryColor, font: 'helvetica' });
  addStyledText(formatarMoeda(resumo_geral.receita_total), 30, yPosition + 22, { fontSize: 18, color: accentColor, font: 'helvetica' });

  // Card 2: Número de Vendas
  addColoredRect(20 + cardWidth + cardSpacing, yPosition, cardWidth, cardHeight, lightGray);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(1);
  doc.rect(20 + cardWidth + cardSpacing, yPosition, cardWidth, cardHeight);
  
  addStyledText('NÚMERO DE VENDAS', 30 + cardWidth + cardSpacing, yPosition + 10, { fontSize: 10, color: secondaryColor, font: 'helvetica' });
  addStyledText(resumo_geral.total_vendas.toString(), 30 + cardWidth + cardSpacing, yPosition + 22, { fontSize: 18, color: successColor, font: 'helvetica' });

  yPosition += cardHeight + 20;

  // Formas de Pagamento
  addStyledText('2. FORMAS DE PAGAMENTO', 20, yPosition, { fontSize: 16, color: primaryColor, font: 'helvetica' });
  yPosition += 10;

  // Tabela de formas de pagamento responsiva
  const formasPagamentoData = formas_pagamento.map((forma) => [
    formasPagamentoMap[forma.metodo_pagamento] || forma.metodo_pagamento,
    formatarMoeda(forma.valor_total)
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Forma de Pagamento', 'Valor Total']],
    body: formasPagamentoData,
    theme: 'grid',
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 50 }
    },
    styles: {
      lineColor: [borderColor[0], borderColor[1], borderColor[2]],
      lineWidth: 0.5
    },
    margin: { left: 20, right: 20 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // 3. Vendas por Categoria de Produto
  addStyledText('3. VENDAS POR CATEGORIA DE PRODUTO', 20, yPosition, { fontSize: 16, color: primaryColor, font: 'helvetica' });
  yPosition += 10;

  const categoriaData = vendas_por_categoria.map((cat) => [
    cat.categoria_nome || 'Sem categoria',
    formatarMoeda(cat.faturamento),
    `${cat.percentual.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Categoria', 'Faturamento (R$)', '% do Total']],
    body: categoriaData,
    theme: 'grid',
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 50 },
      2: { halign: 'center', cellWidth: 30 }
    },
    styles: {
      lineColor: [borderColor[0], borderColor[1], borderColor[2]],
      lineWidth: 0.5
    },
    margin: { left: 20, right: 20 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // 4. Vendas por Data
  addStyledText('4. VENDAS POR DATA', 20, yPosition, { fontSize: 16, color: primaryColor, font: 'helvetica' });
  yPosition += 10;

  const vendasData = vendas_por_data.map((venda) => [
    new Date(venda.data_venda).toLocaleDateString('pt-BR'),
    formatarMoeda(venda.valor_total)
  ]);

  // Adicionar linha de total
  const totalValor = vendas_por_data.reduce((acc, venda) => acc + venda.valor_total, 0);
  vendasData.push(['TOTAL', formatarMoeda(totalValor)]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Data', 'Valor Total (R$)']],
    body: vendasData,
    theme: 'grid',
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 50 }
    },
    styles: {
      lineColor: [borderColor[0], borderColor[1], borderColor[2]],
      lineWidth: 0.5
    },
    margin: { left: 20, right: 20 },
    didDrawPage: (data: any) => {
      // Destacar linha de total
      const lastRow = data.table.body[data.table.body.length - 1];
      if (lastRow && lastRow[0] === 'TOTAL') {
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(data.table.startX, data.cursor.y - 6, data.table.width, 6, 'F');
      }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // 5. Observações
  addStyledText('5. OBSERVAÇÕES', 20, yPosition, { fontSize: 16, color: primaryColor, font: 'helvetica' });
  yPosition += 10;

  addColoredRect(20, yPosition, pageWidth - 40, 25, lightGray);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(1);
  doc.rect(20, yPosition, pageWidth - 40, 25);

  const observacoes = [
    '• Relatório gerado automaticamente pelo sistema Kontrolla SaaS',
    '• Dados baseados em vendas com status "pago"',
    `• Período: ${dataInicioFormatada} a ${dataFimFormatada}`,
    '• Relatório confidencial - uso interno'
  ];

  observacoes.forEach((obs, index) => {
    addStyledText(obs, 30, yPosition + 6 + (index * 4), { fontSize: 9, color: [31, 41, 55] });
  });

  yPosition += 35;

  // 6. Conclusão
  addStyledText('6. CONCLUSÃO', 20, yPosition, { fontSize: 16, color: primaryColor, font: 'helvetica' });
  yPosition += 10;

  addColoredRect(20, yPosition, pageWidth - 40, 20, lightGray);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(1);
  doc.rect(20, yPosition, pageWidth - 40, 20);

  addStyledText('Este relatório apresenta uma análise detalhada das vendas do período, fornecendo insights valiosos para tomada de decisões estratégicas e identificação de oportunidades de crescimento.', 30, yPosition + 6, { fontSize: 9, color: [31, 41, 55] });

  // Rodapé profissional
  const footerY = pageHeight - 25;
  addHorizontalLine(footerY - 15, borderColor);
  
  addStyledText('Kontrolla SaaS - Sistema de Gestão Empresarial', pageWidth / 2, footerY - 8, { 
    fontSize: 9, 
    color: primaryColor, 
    align: 'center',
    font: 'helvetica'
  });
  
  addStyledText(`Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, footerY, { 
    fontSize: 8, 
    color: secondaryColor, 
    align: 'center' 
  });

  // Salvar o PDF
  const nomeArquivo = `relatorio_vendas_detalhado_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nomeArquivo);
};
