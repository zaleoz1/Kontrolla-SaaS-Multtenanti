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
    ticket_medio: number;
  };
  clientes: Array<{
    nome: string;
    email: string;
    telefone: string;
    vip: boolean;
    total_vendas: number;
    valor_total: number;
    ticket_medio: number;
    ultima_compra: string;
    primeira_compra: string;
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
  text('Total de Clientes: ', 20, y, { size: 12, bold: true });
  text(resumo_geral.total_clientes.toString(), 20 + doc.getTextWidth('Total de Clientes: '), y, { size: 12 });
  y += 6;
  text('Clientes VIP: ', 20, y, { size: 12, bold: true });
  text(resumo_geral.clientes_vip.toString(), 20 + doc.getTextWidth('Clientes VIP: '), y, { size: 12 });
  y += 6;
  text('Ticket Médio: ', 20, y, { size: 12, bold: true });
  text(formatarMoeda(resumo_geral.ticket_medio), 20 + doc.getTextWidth('Ticket Médio: '), y, { size: 12 });
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
  text(`• Mais vendas: ${clienteComMaisVendas?.total_vendas || 0}`, 25, y + 24, { size: 8 });
  
  // Segunda linha de estatísticas
  text(`• Cliente top: ${clienteComMaiorValor?.nome || 'N/A'}`, 120, y + 12, { size: 8 });
  text(`• Ativo: ${clienteComMaisVendas?.nome || 'N/A'}`, 120, y + 18, { size: 8 });
  text(`• Ticket médio: ${formatarMoeda(resumo_geral.ticket_medio)}`, 120, y + 24, { size: 8 });
  
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
    head: [['#', 'Cliente', 'Contato', 'VIP', 'Vendas', 'Valor Total', 'Última Compra']],
    body: clientesOrdenados.map((c, index) => [
      (index + 1).toString(),
      c.nome,
      `${c.email}\n${c.telefone}`,
      c.vip ? '✓' : '✗',
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
    didDrawCell: (data: any) => {
      // Destacar top 3 clientes
      if (data.column.index === 0 && data.cell.raw <= '3') {
        doc.setFillColor(255, 193, 7); // Amarelo para top 3
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(data.cell.raw, data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2 + 2, { align: 'center' });
      }
      // Destacar clientes VIP
      if (data.column.index === 3 && data.cell.raw === '✓') {
        doc.setFillColor(16, 185, 129); // Verde para VIP
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('✓', data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2 + 2, { align: 'center' });
      }
    }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Resumo dos top clientes
  if (clientesOrdenados.length > 0) {
    text('TOP 3 CLIENTES', 20, y, { size: 12, bold: true, color: [59, 130, 246] });
    y += 8;
    
    const top3 = clientesOrdenados.slice(0, 3);
    top3.forEach((cliente, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      rect(20, y, pageWidth - 40, 15);
      text(`${medal} ${index + 1}º Lugar: ${cliente.nome}`, 25, y + 6, { size: 9, bold: true });
      text(`Valor: ${formatarMoeda(cliente.valor_total)} | Vendas: ${cliente.total_vendas}`, 25, y + 11, { size: 8 });
      y += 18;
    });
    y += 5;
  }

  // Verificar espaço para clientes por faixa de valor
  checkNewPage(60);

  // Clientes por faixa de valor
  text('3. CLIENTES POR FAIXA DE VALOR', 20, y, { size: 14, bold: true });
  y += 8;
  autoTable(doc, {
    startY: y,
    head: [['Faixa de Valor', 'Quantidade', '% do Total']],
    body: clientes_por_faixa_valor.map(f => [
      f.faixa,
      f.quantidade.toString(),
      `${f.percentual.toFixed(1)}%`,
    ]),
    theme: 'grid',
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10, lineColor: [border[0], border[1], border[2]], lineWidth: 0.2 },
    headStyles: { fillColor: [primary[0], primary[1], primary[2]], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 
      0: { cellWidth: 'auto' }, 
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 30 } 
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

  doc.save(`relatorio_clientes_${new Date().toISOString().split('T')[0]}.pdf`);
};
