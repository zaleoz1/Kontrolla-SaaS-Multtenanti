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

export interface DadosRelatorioProdutos {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  responsavel: {
    nome: string;
    email: string;
  };
  resumo_geral: {
    total_produtos: number;
    total_vendido: number;
    receita_total: number;
    ticket_medio: number;
  };
  produtos: Array<{
    nome: string;
    categoria_nome: string;
    total_vendido: number;
    receita_total: number;
    percentual: number;
  }>;
  vendas_por_categoria: Array<{
    categoria_nome: string;
    quantidade_vendida: number;
    faturamento: number;
    percentual: number;
  }>;
}

export const gerarRelatorioProdutosPDF = (
  dados: DadosRelatorioProdutos,
  formatarMoeda: (valor: number) => string
) => {
  const { periodo, responsavel, resumo_geral, produtos, vendas_por_categoria } = dados;

  // Datas formatadas
  const dataInicio = new Date(periodo.data_inicio).toLocaleDateString('pt-BR');
  const dataFim = new Date(periodo.data_fim).toLocaleDateString('pt-BR');

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
    text('RELATÓRIO DE PRODUTOS MAIS VENDIDOS', pageWidth / 2, 15, {
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
    const y = pageHeight - 30;
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
  text('Total de Produtos: ', 20, y, { size: 12, bold: true });
  text(resumo_geral.total_produtos.toString(), 20 + doc.getTextWidth('Total de Produtos: '), y, { size: 12 });
  y += 6;
  text('Unidades Vendidas: ', 20, y, { size: 12, bold: true });
  text(resumo_geral.total_vendido.toString(), 20 + doc.getTextWidth('Unidades Vendidas: '), y, { size: 12 });
  y += 15;

  // Verificar espaço para produtos mais vendidos
  checkNewPage(60);

  // Produtos mais vendidos
  text('2. PRODUTOS MAIS VENDIDOS', 20, y, { size: 14, bold: true });
  y += 8;
  autoTable(doc, {
    startY: y,
    head: [['Produto', 'Categoria', 'Qtd. Vendida', 'Receita (R$)', '% do Total']],
    body: produtos.map(p => [
      p.nome,
      p.categoria_nome || 'Sem categoria',
      p.total_vendido.toString(),
      formatarMoeda(p.receita_total),
      `${p.percentual.toFixed(1)}%`,
    ]),
    theme: 'grid',
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10, lineColor: [border[0], border[1], border[2]], lineWidth: 0.2 },
    headStyles: { fillColor: [primary[0], primary[1], primary[2]], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 
      0: { cellWidth: 'auto' }, 
      1: { cellWidth: 40 }, 
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 40 },
      4: { halign: 'center', cellWidth: 25 }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Verificar espaço para vendas por categoria
  checkNewPage(60);

  // Vendas por categoria
  text('3. VENDAS POR CATEGORIA', 20, y, { size: 14, bold: true });
  y += 8;
  autoTable(doc, {
    startY: y,
    head: [['Categoria', 'Qtd. Vendida', 'Faturamento', '%']],
    body: vendas_por_categoria.map(c => [
      c.categoria_nome || 'Sem categoria',
      c.quantidade_vendida.toString(),
      formatarMoeda(c.faturamento),
      `${c.percentual.toFixed(1)}%`,
    ]),
    theme: 'grid',
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10, lineColor: [border[0], border[1], border[2]], lineWidth: 0.2 },
    headStyles: { fillColor: [primary[0], primary[1], primary[2]], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 
      0: { cellWidth: 'auto' }, 
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 50 }, 
      3: { halign: 'center', cellWidth: 30 } 
    },
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Verificar espaço para observações
  checkNewPage(80);

  // Observações
  text('4. OBSERVAÇÕES', 20, y, { size: 14, bold: true });
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

  doc.save(`relatorio_produtos_${new Date().toISOString().split('T')[0]}.pdf`);
};

export interface DadosRelatorioClientes {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  responsavel: {
    nome: string;
    email: string;
  };
  resumo_geral: {
    total_clientes: number;
    clientes_vip: number;
    receita_total: number;
  };
  clientes: Array<{
    id: number;
    nome: string;
    email: string;
    telefone: string;
    vip: boolean;
    total_vendas: number;
    valor_total: number;
    ultima_compra: string;
    primeira_compra: string;
    vendas_detalhadas?: Array<{
      id: number;
      numero_venda: string;
      data_venda: string;
      status: string;
      total: number;
      forma_pagamento: string;
      vendedor_nome: string;
    }>;
    produtos_comprados?: Array<{
      id: number;
      nome: string;
      categoria_nome: string;
      total_quantidade: number;
      total_gasto: number;
      preco_medio: number;
      vezes_comprado: number;
    }>;
  }>;
  clientes_por_faixa_valor: Array<{
    faixa: string;
    quantidade: number;
    percentual: number;
  }>;
}

export const gerarRelatorioClientesPDF = (
  dados: DadosRelatorioClientes,
  formatarMoeda: (valor: number) => string
) => {
  const { periodo, responsavel, resumo_geral, clientes, clientes_por_faixa_valor } = dados;

  // Datas formatadas
  const dataInicio = new Date(periodo.data_inicio).toLocaleDateString('pt-BR');
  const dataFim = new Date(periodo.data_fim).toLocaleDateString('pt-BR');

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
    text('RELATÓRIO DE ANÁLISE DE CLIENTES', pageWidth / 2, 15, {
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
    const y = pageHeight - 30;
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
      } else if (i === count) {
        // Apenas footer na última página
        footer();
      }
      // Páginas intermediárias não recebem header nem footer
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
  text('Total de Clientes: ', 20, y, { size: 12, bold: true });
  text(resumo_geral.total_clientes.toString(), 20 + doc.getTextWidth('Total de Clientes: '), y, { size: 12 });
  y += 6;
  text('Clientes VIP: ', 20, y, { size: 12, bold: true });
  text(resumo_geral.clientes_vip.toString(), 20 + doc.getTextWidth('Clientes VIP: '), y, { size: 12 });
  y += 15;

  // Verificar espaço para análise de clientes
  checkNewPage(60);

  // Análise de clientes
  text('2. ANÁLISE DE CLIENTES', 20, y, { size: 14, bold: true });
  y += 8;

  // Estatísticas rápidas dos clientes
  const clientesVip = clientes.filter(c => c.vip);
  const clienteComMaiorValor = clientes.reduce((max, c) => c.valor_total > max.valor_total ? c : max, clientes[0]);
  const clienteComMaisVendas = clientes.reduce((max, c) => c.total_vendas > max.total_vendas ? c : max, clientes[0]);
  
  // Card de estatísticas
  rect(20, y, pageWidth - 40, 35);
  text('ESTATÍSTICAS DOS CLIENTES', 25, y + 6, { size: 10, bold: true, color: [59, 130, 246] });
  
  // Primeira linha de estatísticas
  text(`• Clientes VIP: ${clientesVip.length}`, 25, y + 12, { size: 8 });
  text(`• Maior valor: ${formatarMoeda(clienteComMaiorValor?.valor_total || 0)}`, 25, y + 18, { size: 8 });
  text(`• Mais compras: ${clienteComMaisVendas?.total_vendas || 0}`, 25, y + 24, { size: 8 });
  
  // Segunda linha de estatísticas
  text(`• Cliente top: ${clienteComMaiorValor?.nome || 'N/A'}`, 120, y + 12, { size: 8 });
  text(`• Ativo: ${clienteComMaisVendas?.nome || 'N/A'}`, 120, y + 18, { size: 8 });
  
  y += 40;
  
  // Função para formatar data
  const formatarData = (data: string) => {
    if (!data || data === 'Nunca') return 'Nunca';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  // Ordenar clientes por valor total (maior para menor)
  const clientesOrdenados = [...clientes].sort((a, b) => b.valor_total - a.valor_total);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Cliente', 'Contato', 'VIP', 'Compras', 'Valor Total', 'Última Compra']],
    body: clientesOrdenados.map((c, index) => [
      (index + 1).toString(),
      c.nome,
      `${c.email}\n${c.telefone}`,
      c.vip ? 'SIM' : 'NAO',
      c.total_vendas.toString(),
      formatarMoeda(c.valor_total),
      formatarData(c.ultima_compra),
    ]),
    theme: 'grid',
    margin: { left: 20, right: 20 },
    styles: { 
      fontSize: 8, 
      lineColor: [border[0], border[1], border[2]], 
      lineWidth: 0.2,
      cellPadding: 3
    },
    headStyles: { 
      fillColor: [primary[0], primary[1], primary[2]], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: { 
      0: { cellWidth: 15, halign: 'center' }, // Ranking
      1: { cellWidth: 30, halign: 'left' },  // Nome
      2: { cellWidth: 40, halign: 'left' },  // Contato
      3: { halign: 'center', cellWidth: 12 }, // VIP
      4: { halign: 'center', cellWidth: 18 }, // Vendas
      5: { halign: 'right', cellWidth: 30 },  // Valor
      6: { halign: 'center', cellWidth: 25 }  // Data
    },
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Resumo dos top clientes
  if (clientesOrdenados.length > 0) {
    text('TOP 3 CLIENTES', 20, y, { size: 12, bold: true, color: [59, 130, 246] });
    y += 8;
    
    const top3 = clientesOrdenados.slice(0, 3);
    top3.forEach((cliente, index) => {
      const posicao = index === 0 ? '1º' : index === 1 ? '2º' : '3º';
      const medalha = index === 0 ? 'OURO' : index === 1 ? 'PRATA' : 'BRONZE';
      
      rect(20, y, pageWidth - 40, 15);
      text(`${posicao} Lugar: ${cliente.nome}`, 25, y + 6, { size: 9, bold: true });
      text(`Valor: ${formatarMoeda(cliente.valor_total)} | Compras: ${cliente.total_vendas} | ${medalha}`, 25, y + 11, { size: 8 });
      y += 18;
    });
    y += 5;
  }



  // Verificar espaço para observações
  checkNewPage(80);

  // Observações
  text('3. OBSERVAÇÕES', 20, y, { size: 14, bold: true });
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

  doc.save(`relatorio_clientes_${new Date().toISOString().split('T')[0]}.pdf`);
};

export interface DadosRelatorioFinanceiro {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  responsavel: {
    nome: string;
    email: string;
  };
  resumo: {
    total_transacoes: number;
    total_entradas: number;
    total_saidas: number;
    valor_entradas: number;
    valor_saidas: number;
  };
  transacoes: Array<{
    id: number;
    tipo: 'entrada' | 'saida';
    categoria: string;
    descricao: string;
    valor: number;
    data_transacao: string;
    metodo_pagamento: string;
    status: string;
    cliente_nome?: string;
  }>;
}

export const gerarRelatorioFinanceiroPDF = (
  dados: DadosRelatorioFinanceiro,
  formatarMoeda: (valor: number) => string
) => {
  const { periodo, responsavel, resumo, transacoes } = dados;

  // Datas formatadas
  const dataInicio = new Date(periodo.data_inicio).toLocaleDateString('pt-BR');
  const dataFim = new Date(periodo.data_fim).toLocaleDateString('pt-BR');

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Paleta de cores
  const primary: [number, number, number] = [31, 41, 55]; // cinza escuro
  const secondary: [number, number, number] = [107, 114, 128]; // cinza médio
  const accent: [number, number, number] = [59, 130, 246]; // azul
  const light: [number, number, number] = [249, 250, 251];
  const border: [number, number, number] = [229, 231, 235];
  const success: [number, number, number] = [34, 197, 94]; // verde
  const danger: [number, number, number] = [239, 68, 68]; // vermelho

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
    text('RELATÓRIO FINANCEIRO', pageWidth / 2, 15, {
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
    const y = pageHeight - 30;
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
      } else if (i === count) {
        // Apenas footer na última página
        footer();
      }
      // Páginas intermediárias não recebem header nem footer
    }
  };

  let y = 45; // Posição inicial considerando o header na primeira página

  // Responsável
  text(`Responsável: ${responsavel.nome.replace(/\s+/g, ' ').trim()}`, 20, y, { size: 10, color: secondary });
  text(`Email: ${responsavel.email}`, 20, y + 6, { size: 10, color: secondary });
  y += 18;
  line(y);
  y += 12;

  // Resumo financeiro
  text('1. RESUMO FINANCEIRO', 20, y, { size: 14, bold: true });
  y += 10;

  // Resumo em formato de frases
  const saldo = resumo.valor_entradas - resumo.valor_saidas;
  const percentualEntradas = resumo.total_transacoes > 0 ? (resumo.total_entradas / resumo.total_transacoes) * 100 : 0;
  const percentualSaidas = resumo.total_transacoes > 0 ? (resumo.total_saidas / resumo.total_transacoes) * 100 : 0;

  // Frases informativas com destaque para as principais
  text(`• Total de transações: ${resumo.total_transacoes}`, 20, y, { size: 13, bold: true });
  y += 5;
  
  text(`• Entradas: ${resumo.total_entradas} (${percentualEntradas.toFixed(1)}%)`, 20, y, { size: 9 });
  y += 4;
  
  text(`• Saídas: ${resumo.total_saidas} (${percentualSaidas.toFixed(1)}%)`, 20, y, { size: 9 });
  y += 8;
  
  text(`• Saldo do período: ${formatarMoeda(saldo)}`, 20, y, { size: 13, bold: true });
  y += 5;
  
  text(`• Valor total de entradas: `, 20, y, { size: 9 });
  text(`${formatarMoeda(resumo.valor_entradas)}`, 20 + doc.getTextWidth('• Valor total de entradas: '), y, { size: 9, color: success });
  y += 4;
  
  text(`• Valor total de saídas: `, 20, y, { size: 9 });
  text(`${formatarMoeda(resumo.valor_saidas)}`, 20 + doc.getTextWidth('• Valor total de saídas: '), y, { size: 9, color: danger });
  y += 5;

  // Linha separadora
  y += 5;
  line(y);
  y += 10;

  // Verificar espaço para transações
  checkNewPage(60);

  // Transações
  text('2. TRANSAÇÕES DETALHADAS', 20, y, { size: 14, bold: true });
  y += 8;

  if (transacoes && transacoes.length > 0) {
  autoTable(doc, {
    startY: y,
      head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status']],
      body: transacoes.map(t => [
        new Date(t.data_transacao).toLocaleDateString('pt-BR'),
        t.tipo === 'entrada' ? 'Entrada' : 'Saída',
        t.categoria || 'Sem categoria',
        t.descricao || 'Sem descrição',
        formatarMoeda(t.valor),
        t.status || 'Pendente',
    ]),
    theme: 'grid',
    margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 8, 
        lineColor: [border[0], border[1], border[2]], 
        lineWidth: 0.2,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [primary[0], primary[1], primary[2]], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 9
      },
    columnStyles: { 
        0: { cellWidth: 25, halign: 'center' }, // Data
        1: { cellWidth: 20, halign: 'center' }, // Tipo
        2: { cellWidth: 30, halign: 'left' },   // Categoria
        3: { cellWidth: 'auto', halign: 'left' }, // Descrição
        4: { cellWidth: 30, halign: 'right' },  // Valor
        5: { cellWidth: 20, halign: 'center' }  // Status
      },
      didDrawCell: (data: any) => {
        // Destacar tipo de transação
        if (data.column.index === 1) {
          if (data.cell.raw === 'Entrada') {
            doc.setTextColor(success[0], success[1], success[2]);
          } else if (data.cell.raw === 'Saída') {
            doc.setTextColor(danger[0], danger[1], danger[2]);
          }
        }
        // Destacar valores
        if (data.column.index === 4) {
          const valor = parseFloat(data.cell.raw.replace(/[^\d,-]/g, '').replace(',', '.'));
          if (valor > 0) {
            doc.setTextColor(success[0], success[1], success[2]);
          } else {
            doc.setTextColor(danger[0], danger[1], danger[2]);
          }
        }
      }
  });
  y = (doc as any).lastAutoTable.finalY + 15;
  } else {
    rect(20, y, pageWidth - 40, 30);
    text('Nenhuma transação encontrada no período', pageWidth / 2, y + 15, { 
      size: 12, 
      color: secondary, 
      align: 'center' 
    });
    y += 40;
  }

  // Verificar espaço para observações
  checkNewPage(80);

  // Observações
  text('3. OBSERVAÇÕES', 20, y, { size: 14, bold: true });
  y += 8;
  rect(20, y, pageWidth - 40, 35);
  const obs = [
    '• Relatório gerado automaticamente pelo sistema KontrollaPro',
    `• Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    '• Dados baseados em transações financeiras do período',
    `• Período: ${dataInicio} a ${dataFim}`,
    '• Relatório confidencial - uso interno',
  ];
  obs.forEach((o, i) => text(o, 25, y + 8 + i * 6, { size: 9 }));
  y += 40;

  // Aplicar header/rodapé em todas as páginas
  applyHeaderFooter();

  doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
};

export interface DadosRelatorioEstoque {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  responsavel: {
    nome: string;
    email: string;
  };
  estatisticas: {
    total_produtos: number;
    sem_estoque: number;
    estoque_baixo: number;
    estoque_normal: number;
    total_unidades: number;
    valor_total_estoque: number;
  };
  produtos: Array<{
    id: number;
    nome: string;
    codigo_barras: string;
    sku: string;
    estoque: number;
    estoque_minimo: number;
    tipo_preco: 'unidade' | 'kg' | 'litros';
    estoque_kg?: number;
    estoque_litros?: number;
    estoque_minimo_kg?: number;
    estoque_minimo_litros?: number;
    estoque_atual?: number;
    estoque_minimo_atual?: number;
    preco: number;
    categoria_nome: string;
    valor_estoque: number;
    status_estoque: 'Sem estoque' | 'Estoque baixo' | 'Normal';
  }>;
  tipo: string;
  categoria_id?: string;
}

export const gerarRelatorioEstoquePDF = (
  dados: DadosRelatorioEstoque,
  formatarMoeda: (valor: number) => string
) => {
  const { periodo, responsavel, estatisticas, produtos, tipo, categoria_id } = dados;

  // Datas formatadas
  const dataInicio = new Date(periodo.data_inicio).toLocaleDateString('pt-BR');
  const dataFim = new Date(periodo.data_fim).toLocaleDateString('pt-BR');

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Paleta de cores
  const primary: [number, number, number] = [31, 41, 55]; // cinza escuro
  const secondary: [number, number, number] = [107, 114, 128]; // cinza médio
  const accent: [number, number, number] = [59, 130, 246]; // azul
  const light: [number, number, number] = [249, 250, 251];
  const border: [number, number, number] = [229, 231, 235];
  const success: [number, number, number] = [34, 197, 94]; // verde
  const warning: [number, number, number] = [245, 158, 11]; // amarelo
  const danger: [number, number, number] = [239, 68, 68]; // vermelho

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
    text('RELATÓRIO DE CONTROLE DE ESTOQUE', pageWidth / 2, 15, {
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
    const y = pageHeight - 30;
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
      } else if (i === count) {
        // Apenas footer na última página
        footer();
      }
      // Páginas intermediárias não recebem header nem footer
    }
  };

  let y = 45; // Posição inicial considerando o header na primeira página

  // Responsável
  text(`Responsável: ${responsavel.nome.replace(/\s+/g, ' ').trim()}`, 20, y, { size: 10, color: secondary });
  text(`Email: ${responsavel.email}`, 20, y + 6, { size: 10, color: secondary });
  y += 18;
  line(y);
  y += 12;

  // Resumo do estoque
  text('1. RESUMO DO ESTOQUE', 20, y, { size: 14, bold: true });
  y += 10;

  // Resumo em formato de frases
  const percentualSemEstoque = estatisticas.total_produtos > 0 ? (estatisticas.sem_estoque / estatisticas.total_produtos) * 100 : 0;
  const percentualEstoqueBaixo = estatisticas.total_produtos > 0 ? (estatisticas.estoque_baixo / estatisticas.total_produtos) * 100 : 0;
  const percentualEstoqueNormal = estatisticas.total_produtos > 0 ? (estatisticas.estoque_normal / estatisticas.total_produtos) * 100 : 0;

  // Frases informativas com destaque para as principais
  text(`• Total de produtos cadastrados: ${estatisticas.total_produtos}`, 20, y, { size: 13, bold: true });
  y += 5;
  
  text(`• Produtos sem estoque: ${estatisticas.sem_estoque} (${percentualSemEstoque.toFixed(1)}%)`, 20, y, { size: 9 });
  y += 4;
  
  text(`• Produtos com estoque baixo: ${estatisticas.estoque_baixo} (${percentualEstoqueBaixo.toFixed(1)}%)`, 20, y, { size: 9 });
  y += 4;
  
  text(`• Produtos com estoque normal: ${estatisticas.estoque_normal} (${percentualEstoqueNormal.toFixed(1)}%)`, 20, y, { size: 9 });
  y += 8;
  
  text(`• Total de unidades em estoque: ${estatisticas.total_unidades.toLocaleString('pt-BR')}`, 20, y, { size: 13, bold: true });
  y += 5;
  
  text(`• Valor total do estoque: `, 20, y, { size: 9 });
  text(`${formatarMoeda(estatisticas.valor_total_estoque)}`, 20 + doc.getTextWidth('• Valor total do estoque: '), y, { size: 9, color: success });
  y += 5;

  // Linha separadora
  y += 5;
  line(y);
  y += 10;

  // Função para formatar estoque baseado no tipo de produto
  const formatarEstoque = (produto: any) => {
    const estoqueAtual = produto.estoque_atual || produto.estoque || 0;
    
    if (produto.tipo_preco === 'kg') {
      const estoqueFormatado = parseFloat(estoqueAtual).toFixed(3).replace(/\.?0+$/, '');
      return `${estoqueFormatado} kg`;
    } else if (produto.tipo_preco === 'litros') {
      const estoqueFormatado = parseFloat(estoqueAtual).toFixed(3).replace(/\.?0+$/, '');
      return `${estoqueFormatado} L`;
    } else {
      return `${Math.round(parseFloat(estoqueAtual))} Un.`;
    }
  };

  // Função para formatar estoque mínimo baseado no tipo de produto
  const formatarEstoqueMinimo = (produto: any) => {
    const estoqueMinimoAtual = produto.estoque_minimo_atual || produto.estoque_minimo || 0;
    
    if (produto.tipo_preco === 'kg') {
      const estoqueFormatado = parseFloat(estoqueMinimoAtual).toFixed(3).replace(/\.?0+$/, '');
      return `${estoqueFormatado} kg`;
    } else if (produto.tipo_preco === 'litros') {
      const estoqueFormatado = parseFloat(estoqueMinimoAtual).toFixed(3).replace(/\.?0+$/, '');
      return `${estoqueFormatado} L`;
    } else {
      return `${Math.round(parseFloat(estoqueMinimoAtual))} Un.`;
    }
  };

  // Verificar espaço para produtos
  checkNewPage(60);

  // Produtos
  text('2. PRODUTOS EM ESTOQUE', 20, y, { size: 14, bold: true });
  y += 8;

  if (produtos && produtos.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Produto', 'Código/SKU', 'Categoria', 'Estoque', 'Mínimo', 'Valor', 'Status']],
      body: produtos.map(p => [
        p.nome || 'Sem nome',
        p.sku || p.codigo_barras || 'N/A',
        p.categoria_nome || 'Sem categoria',
        formatarEstoque(p),
        formatarEstoqueMinimo(p),
        formatarMoeda(p.valor_estoque),
        p.status_estoque,
      ]),
      theme: 'grid',
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 8, 
        lineColor: [border[0], border[1], border[2]], 
        lineWidth: 0.2,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [primary[0], primary[1], primary[2]], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 9
      },
      columnStyles: { 
        0: { cellWidth: 'auto', halign: 'left' },   // Produto
        1: { cellWidth: 30, halign: 'center' },     // Código/SKU
        2: { cellWidth: 25, halign: 'left' },       // Categoria
        3: { cellWidth: 20, halign: 'center' },     // Estoque
        4: { cellWidth: 20, halign: 'center' },     // Mínimo
        5: { cellWidth: 30, halign: 'right' },      // Valor
        6: { cellWidth: 25, halign: 'center' }      // Status
      },
      didDrawCell: (data: any) => {
        // Destacar status de estoque
        if (data.column.index === 6) {
          if (data.cell.raw === 'Sem estoque') {
            doc.setTextColor(danger[0], danger[1], danger[2]);
          } else if (data.cell.raw === 'Estoque baixo') {
            doc.setTextColor(warning[0], warning[1], warning[2]);
          } else if (data.cell.raw === 'Normal') {
            doc.setTextColor(success[0], success[1], success[2]);
          }
        }
        // Destacar valores
        if (data.column.index === 5) {
          const valor = parseFloat(data.cell.raw.replace(/[^\d,-]/g, '').replace(',', '.'));
          if (valor > 0) {
            doc.setTextColor(success[0], success[1], success[2]);
          }
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  } else {
    rect(20, y, pageWidth - 40, 30);
    text('Nenhum produto encontrado', pageWidth / 2, y + 15, { 
      size: 12, 
      color: secondary, 
      align: 'center' 
    });
    y += 40;
  }

  // Verificar espaço para observações
  checkNewPage(80);

  // Observações
  text('3. OBSERVAÇÕES', 20, y, { size: 14, bold: true });
  y += 8;
  rect(20, y, pageWidth - 40, 35);
  const obs = [
    '• Relatório gerado automaticamente pelo sistema KontrollaPro',
    `• Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    '• Dados baseados no estoque atual dos produtos',
    `• Período: ${dataInicio} a ${dataFim}`,
    '• Relatório confidencial - uso interno',
  ];
  obs.forEach((o, i) => text(o, 25, y + 8 + i * 6, { size: 9 }));
  y += 40;

  // Aplicar header/rodapé em todas as páginas
  applyHeaderFooter();

  doc.save(`relatorio_estoque_${new Date().toISOString().split('T')[0]}.pdf`);
};
