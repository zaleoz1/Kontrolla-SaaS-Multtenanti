import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 

  BarChart3, 

  TrendingUp, 

  TrendingDown,

  Download,

  Calendar,

  Filter,

  DollarSign,

  ShoppingCart,

  Package,

  Users,

  Eye,

  FileText,

  PieChart,

  LineChart,

  Loader2,

  RefreshCw

} from "lucide-react";

import { useRelatorios } from "@/hooks/useRelatorios";

import { useAuth } from "@/hooks/useAuth";

import { useState, useEffect } from "react";

import { gerarRelatorioVendasPDF, gerarRelatorioProdutosPDF, gerarRelatorioClientesPDF, gerarRelatorioFinanceiroPDF, gerarRelatorioEstoquePDF } from "@/utils/gerarPDF";



export default function Relatorios() {

  const { user } = useAuth();

  const {

    useMetricasRapidas,

    useRelatorioVendasPeriodo,

    useRelatorioVendasDetalhado,

    useRelatorioProdutosVendidos,

    useRelatorioAnaliseClientes,

    useRelatorioFinanceiro,

    useRelatorioControleEstoque,

    useCategorias

  } = useRelatorios();



  // Estados para filtros

  const [dataInicio, setDataInicio] = useState(() => {

    const hoje = new Date();

    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    return primeiroDiaMes.toISOString().split('T')[0];

  });

  

  const [dataFim, setDataFim] = useState(() => {

    const hoje = new Date();

    return hoje.toISOString().split('T')[0];

  });



  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas');              

  const [agrupamentoSelecionado, setAgrupamentoSelecionado] = useState<string>('diario');

  const [tipoRelatorioSelecionado, setTipoRelatorioSelecionado] = useState<string>('vendas');

  const [modalVendasAberto, setModalVendasAberto] = useState(false);
  const [modalProdutosAberto, setModalProdutosAberto] = useState(false);
  const [modalClientesAberto, setModalClientesAberto] = useState(false);
  const [modalFinanceiroAberto, setModalFinanceiroAberto] = useState(false);
  const [modalEstoqueAberto, setModalEstoqueAberto] = useState(false);


  // Hooks para buscar dados

  const { metricas, loading: loadingMetricas } = useMetricasRapidas();

  const { categorias, loading: loadingCategorias } = useCategorias();

  const { dados: dadosVendas, loading: loadingVendas } = useRelatorioVendasPeriodo(dataInicio, dataFim, agrupamentoSelecionado);

  const { dados: dadosVendasDetalhado, loading: loadingVendasDetalhado } = useRelatorioVendasDetalhado(dataInicio, dataFim);

  const { dados: dadosProdutos, loading: loadingProdutos } = useRelatorioProdutosVendidos(dataInicio, dataFim, categoriaSelecionada === 'todas' ? undefined : categoriaSelecionada);

  const { dados: dadosClientes, loading: loadingClientes } = useRelatorioAnaliseClientes(dataInicio, dataFim, 'compras');

  const { dados: dadosFinanceiro, loading: loadingFinanceiro } = useRelatorioFinanceiro(dataInicio, dataFim, 'transacoes');

  const { dados: dadosEstoque, loading: loadingEstoque } = useRelatorioControleEstoque('geral', categoriaSelecionada === 'todas' ? undefined : categoriaSelecionada);



  const relatorios = [

    {

      titulo: "Vendas por Período",

      descricao: "Análise detalhada das vendas por dia, semana ou mês",

      icone: BarChart3,

      tipo: "vendas",

      ultimaGeracao: new Date().toISOString().split('T')[0],

      cor: "bg-primary/10 text-primary",

      loading: loadingVendas,

      dados: dadosVendas

    },

    {

      titulo: "Produtos Mais Vendidos",

      descricao: "Ranking dos produtos com melhor performance",

      icone: Package,

      tipo: "produtos",

      ultimaGeracao: new Date().toISOString().split('T')[0],

      cor: "bg-success/10 text-success",

      loading: loadingProdutos,

      dados: dadosProdutos

    },

    {

      titulo: "Análise de Clientes",

      descricao: "Perfil e comportamento dos seus clientes",

      icone: Users,

      tipo: "clientes",

      ultimaGeracao: new Date().toISOString().split('T')[0],

      cor: "bg-info/10 text-info",

      loading: loadingClientes,

      dados: dadosClientes

    },

    {

      titulo: "Relatório Financeiro",

      descricao: "Receitas, despesas e fluxo de caixa",

      icone: DollarSign,

      tipo: "financeiro",

      ultimaGeracao: new Date().toISOString().split('T')[0],

      cor: "bg-warning/10 text-warning",

      loading: loadingFinanceiro,

      dados: dadosFinanceiro

    },

    {

      titulo: "Controle de Estoque",

      descricao: "Movimentação e níveis de estoque",

      icone: PieChart,

      tipo: "estoque",

      ultimaGeracao: new Date().toISOString().split('T')[0],

      cor: "bg-accent/10 text-accent",

      loading: loadingEstoque,

      dados: dadosEstoque

    },

  ];



  const relatoriosRecentes = [

    {

      nome: "Relatório de Vendas - Janeiro 2024",

      tipo: "PDF",

      tamanho: "2.4 MB",

      geradoEm: "2024-01-18 14:30",

      downloads: 3

    },

    {

      nome: "Análise de Produtos - Dezembro 2023", 

      tipo: "Excel",

      tamanho: "1.8 MB",

      geradoEm: "2024-01-15 10:15",

      downloads: 8

    },

    {

      nome: "Relatório Financeiro - 4º Trimestre",

      tipo: "PDF", 

      tamanho: "3.1 MB",

      geradoEm: "2024-01-10 16:45",

      downloads: 12

    }

  ];



  const formatarMoeda = (valor: number) => {

    return new Intl.NumberFormat('pt-BR', {

      style: 'currency',

      currency: 'BRL'

    }).format(valor);

  };



  const formatarPercentual = (valor: number) => {

    return `${valor >= 0 ? '+' : ''}${valor.toFixed(1)}%`;

  };


  const formatarData = (data: string) => {
    if (!data) return 'N/A';
    
    try {
      const dataObj = new Date(data);
      return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return data;
    }
  };

  const formatarDataHora = (data: string) => {
    if (!data) return 'N/A';
    
    try {
      const dataObj = new Date(data);
      return dataObj.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return data;
    }
  };


  // Função para gerar relatório em CSV

  const gerarCSV = (dados: any[], nomeArquivo: string) => {

    if (!dados || dados.length === 0) return;



    const headers = Object.keys(dados[0]);

    const csvContent = [

      headers.join(','),

      ...dados.map(row => 

        headers.map(header => {

          const value = row[header];

          if (typeof value === 'string' && value.includes(',')) {

            return `"${value}"`;

          }

          return value;

        }).join(',')

      )

    ].join('\n');



    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);

    link.setAttribute('download', `${nomeArquivo}.csv`);

    link.style.visibility = 'hidden';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  };



  // Função para gerar relatório em JSON

  const gerarJSON = (dados: any, nomeArquivo: string) => {

    const jsonContent = JSON.stringify(dados, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);

    link.setAttribute('download', `${nomeArquivo}.json`);

    link.style.visibility = 'hidden';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  };



  // Função para gerar relatório em PDF (simulado)

  const gerarPDF = (dados: any, nomeArquivo: string, tipo: string) => {

    // Simulação de geração de PDF

    // Em uma implementação real, você usaria uma biblioteca como jsPDF ou Puppeteer

    const conteudo = `

      RELATÓRIO ${tipo.toUpperCase()}

      Período: ${dataInicio} a ${dataFim}

      

      ${JSON.stringify(dados, null, 2)}

    `;

    

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8;' });

    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);

    link.setAttribute('download', `${nomeArquivo}.txt`);

    link.style.visibility = 'hidden';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  };



  // Função para gerar relatório detalhado de vendas em PDF profissional

  const gerarRelatorioVendasDetalhado = () => {

    if (!dadosVendasDetalhado) return;



    gerarRelatorioVendasPDF(dadosVendasDetalhado, formatarMoeda);

  };



  // Função para gerar relatório de produtos em PDF profissional

  const gerarRelatorioProdutosDetalhado = () => {

    if (!dadosProdutos || !user) return;



    // Validar e calcular valores com segurança

    const totalVendido = dadosProdutos.produtos?.reduce((acc, p) => {

      const valor = Number(p.total_vendido) || 0;

      return acc + valor;

    }, 0) || 0;

    

    const receitaTotal = dadosProdutos.produtos?.reduce((acc, p) => {

      const valor = Number(p.receita_total) || 0;

      return acc + valor;

    }, 0) || 0;

    

    const ticketMedio = totalVendido > 0 ? receitaTotal / totalVendido : 0;



    // Debug logs

    console.log('Debug - dadosProdutos:', dadosProdutos);

    console.log('Debug - totalVendido:', totalVendido);

    console.log('Debug - receitaTotal:', receitaTotal);

    console.log('Debug - ticketMedio:', ticketMedio);



    // Transformar produtos para incluir percentual

    const produtosComPercentual = dadosProdutos.produtos?.map(produto => {

      const totalVendidoProduto = Number(produto.total_vendido) || 0;

      const receitaTotalProduto = Number(produto.receita_total) || 0;

      

      return {

        nome: produto.nome || 'Produto sem nome',

        categoria_nome: produto.categoria_nome || 'Sem categoria',

        total_vendido: totalVendidoProduto,

        receita_total: receitaTotalProduto,

        percentual: receitaTotal > 0 ? (receitaTotalProduto / receitaTotal) * 100 : 0

      };

    }) || [];



    // Agrupar por categoria para vendas_por_categoria

    const vendasPorCategoria = produtosComPercentual.reduce((acc, produto) => {

      const categoria = produto.categoria_nome || 'Sem categoria';

      const existing = acc.find(item => item.categoria_nome === categoria);

      

      if (existing) {

        existing.quantidade_vendida += Number(produto.total_vendido) || 0;

        existing.faturamento += Number(produto.receita_total) || 0;

      } else {

        acc.push({

          categoria_nome: categoria,

          quantidade_vendida: Number(produto.total_vendido) || 0,

          faturamento: Number(produto.receita_total) || 0,

          percentual: 0

        });

      }

      

      return acc;

    }, [] as Array<{categoria_nome: string, quantidade_vendida: number, faturamento: number, percentual: number}>);



    // Calcular percentuais das categorias

    vendasPorCategoria.forEach(categoria => {

      categoria.percentual = receitaTotal > 0 ? (categoria.faturamento / receitaTotal) * 100 : 0;

    });



    // Transformar dados para o formato esperado pela função PDF

    const dadosFormatados = {

      periodo: {

        data_inicio: dataInicio,

        data_fim: dataFim

      },

      responsavel: {

        nome: `${user.nome} ${user.sobrenome}`.trim(),

        email: user.email

      },

      resumo_geral: {

        total_produtos: Number(dadosProdutos.produtos?.length) || 0,

        total_vendido: Number(totalVendido) || 0,

        receita_total: Number(receitaTotal) || 0,

        ticket_medio: Number(ticketMedio) || 0

      },

      produtos: produtosComPercentual,

      vendas_por_categoria: vendasPorCategoria

    };



    // Debug final

    console.log('Debug - dadosFormatados:', dadosFormatados);



    gerarRelatorioProdutosPDF(dadosFormatados, formatarMoeda);

  };



  // Função para gerar relatório financeiro em PDF profissional

  const gerarRelatorioFinanceiroDetalhado = () => {

    if (!dadosFinanceiro || !user) return;



    // Transformar dados para o formato esperado pela função PDF

    const dadosFormatados = {

      periodo: {

        data_inicio: dataInicio,

        data_fim: dataFim

      },

      responsavel: {

        nome: `${user.nome} ${user.sobrenome}`.trim(),

        email: user.email

      },

      resumo: {

        total_transacoes: dadosFinanceiro.resumo?.total_transacoes || 0,

        total_entradas: dadosFinanceiro.resumo?.total_entradas || 0,

        total_saidas: dadosFinanceiro.resumo?.total_saidas || 0,

        valor_entradas: dadosFinanceiro.resumo?.valor_entradas || 0,

        valor_saidas: dadosFinanceiro.resumo?.valor_saidas || 0

      },

      transacoes: dadosFinanceiro.transacoes || []

    };



    gerarRelatorioFinanceiroPDF(dadosFormatados, formatarMoeda);

  };



  // Função para gerar relatório de estoque em PDF profissional

  const gerarRelatorioEstoqueDetalhado = () => {

    if (!dadosEstoque || !user) return;



    // Transformar produtos para incluir dados de estoque decimal
    const produtosFormatados = dadosEstoque.produtos?.map(produto => ({
      ...produto,
      tipo_preco: produto.tipo_preco || 'unidade',
      estoque_kg: produto.estoque_kg || 0,
      estoque_litros: produto.estoque_litros || 0,
      estoque_minimo_kg: produto.estoque_minimo_kg || 0,
      estoque_minimo_litros: produto.estoque_minimo_litros || 0,
      estoque_atual: produto.estoque_atual || produto.estoque || 0,
      estoque_minimo_atual: produto.estoque_minimo_atual || produto.estoque_minimo || 0
    })) || [];

    // Transformar dados para o formato esperado pela função PDF
    const dadosFormatados = {

      periodo: {

        data_inicio: dataInicio,

        data_fim: dataFim

      },

      responsavel: {

        nome: `${user.nome} ${user.sobrenome}`.trim(),

        email: user.email

      },

      estatisticas: {

        total_produtos: dadosEstoque.estatisticas?.total_produtos || 0,

        sem_estoque: dadosEstoque.estatisticas?.sem_estoque || 0,

        estoque_baixo: dadosEstoque.estatisticas?.estoque_baixo || 0,

        estoque_normal: dadosEstoque.estatisticas?.estoque_normal || 0,

        total_unidades: dadosEstoque.estatisticas?.total_unidades || 0,

        valor_total_estoque: dadosEstoque.estatisticas?.valor_total_estoque || 0

      },

      produtos: produtosFormatados,

      tipo: 'geral',

      categoria_id: categoriaSelecionada === 'todas' ? undefined : categoriaSelecionada

    };



    gerarRelatorioEstoquePDF(dadosFormatados, formatarMoeda);

  };



  // Função para gerar relatório de clientes em PDF profissional

  const gerarRelatorioClientesDetalhado = async () => {

    if (!dadosClientes || !user) return;



    // Validar e calcular valores com segurança

    const totalClientes = dadosClientes.clientes?.length || 0;

    const clientesVip = dadosClientes.clientes?.filter(c => c.vip).length || 0;

    const receitaTotal = dadosClientes.clientes?.reduce((acc, c) => {

      const valor = Number(c.valor_total) || 0;

      return acc + valor;

    }, 0) || 0;



    // Debug logs

    console.log('Debug - dadosClientes:', dadosClientes);

    console.log('Debug - totalClientes:', totalClientes);

    console.log('Debug - clientesVip:', clientesVip);

    console.log('Debug - receitaTotal:', receitaTotal);



    // Buscar dados detalhados de compras para os top 5 clientes

    const top5Clientes = dadosClientes.clientes?.slice(0, 5) || [];

    const clientesComDetalhes = await Promise.all(

      top5Clientes.map(async (cliente) => {

        try {

          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/relatorios/cliente-compras/${cliente.id}?data_inicio=${dataInicio}&data_fim=${dataFim}`, {

            headers: {

              'Authorization': `Bearer ${localStorage.getItem('token')}`

            }

          });

          const dadosDetalhados = await response.json();

          

          return {

            id: cliente.id,

            nome: cliente.nome || 'Cliente sem nome',

            email: cliente.email || 'email@exemplo.com',

            telefone: cliente.telefone || 'Não informado',

            vip: Boolean(cliente.vip),

            total_vendas: Number(cliente.total_vendas) || 0,

            valor_total: Number(cliente.valor_total) || 0,

            ultima_compra: cliente.ultima_compra ? formatarData(cliente.ultima_compra) : 'Nunca',
            primeira_compra: cliente.primeira_compra ? formatarData(cliente.primeira_compra) : 'Nunca',
            vendas_detalhadas: dadosDetalhados.vendas || [],

            produtos_comprados: dadosDetalhados.produtos_comprados || []

          };

        } catch (error) {

          console.error('Erro ao buscar dados detalhados do cliente:', error);

          return {

            id: cliente.id,

            nome: cliente.nome || 'Cliente sem nome',

            email: cliente.email || 'email@exemplo.com',

            telefone: cliente.telefone || 'Não informado',

            vip: Boolean(cliente.vip),

            total_vendas: Number(cliente.total_vendas) || 0,

            valor_total: Number(cliente.valor_total) || 0,

            ultima_compra: cliente.ultima_compra ? formatarData(cliente.ultima_compra) : 'Nunca',
            primeira_compra: cliente.primeira_compra ? formatarData(cliente.primeira_compra) : 'Nunca',
            vendas_detalhadas: [],

            produtos_comprados: []

          };

        }

      })

    );



    // Transformar todos os clientes para incluir dados seguros

    const clientesFormatados = dadosClientes.clientes?.map(cliente => {

      const clienteComDetalhes = clientesComDetalhes.find(c => c.id === cliente.id);

      return {

        id: cliente.id,

        nome: cliente.nome || 'Cliente sem nome',

        email: cliente.email || 'email@exemplo.com',

        telefone: cliente.telefone || 'Não informado',

        vip: Boolean(cliente.vip),

        total_vendas: Number(cliente.total_vendas) || 0,

        valor_total: Number(cliente.valor_total) || 0,

        ultima_compra: cliente.ultima_compra ? formatarData(cliente.ultima_compra) : 'Nunca',
        primeira_compra: cliente.primeira_compra ? formatarData(cliente.primeira_compra) : 'Nunca',
        vendas_detalhadas: clienteComDetalhes?.vendas_detalhadas || [],

        produtos_comprados: clienteComDetalhes?.produtos_comprados || []

      };

    }) || [];



    // Criar faixas de valor para análise

    const faixasValor = [

      { faixa: 'Até R$ 100', min: 0, max: 100 },

      { faixa: 'R$ 100 - R$ 500', min: 100, max: 500 },

      { faixa: 'R$ 500 - R$ 1.000', min: 500, max: 1000 },

      { faixa: 'R$ 1.000 - R$ 5.000', min: 1000, max: 5000 },

      { faixa: 'Acima de R$ 5.000', min: 5000, max: Infinity }

    ];



    const clientesPorFaixa = faixasValor.map(faixa => {

      const quantidade = clientesFormatados.filter(cliente => 

        cliente.valor_total >= faixa.min && cliente.valor_total < faixa.max

      ).length;

      

      return {

        faixa: faixa.faixa,

        quantidade,

        percentual: totalClientes > 0 ? (quantidade / totalClientes) * 100 : 0

      };

    });



    // Transformar dados para o formato esperado pela função PDF

    const dadosFormatados = {

      periodo: {

        data_inicio: dataInicio,

        data_fim: dataFim

      },

      responsavel: {

        nome: `${user.nome} ${user.sobrenome}`.trim(),

        email: user.email

      },

      resumo_geral: {

        total_clientes: Number(totalClientes) || 0,

        clientes_vip: Number(clientesVip) || 0,

        receita_total: Number(receitaTotal) || 0

      },

      clientes: clientesFormatados,

      clientes_por_faixa_valor: clientesPorFaixa

    };



    // Debug final

    console.log('Debug - dadosFormatados clientes:', dadosFormatados);



    gerarRelatorioClientesPDF(dadosFormatados, formatarMoeda);

  };







  // Função para baixar relatório

  const baixarRelatorio = async (tipo: string, formato: string) => {

    const nomeArquivo = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}`;

    

    switch (tipo) {

      case 'vendas':

        // Usar o relatório detalhado em PDF profissional

        gerarRelatorioVendasDetalhado();

        break;

      case 'produtos':

        if (dadosProdutos?.produtos) {

          if (formato === 'csv') {

            gerarCSV(dadosProdutos.produtos, nomeArquivo);

          } else if (formato === 'json') {

            gerarJSON(dadosProdutos, nomeArquivo);

          } else {

            // Usar o relatório detalhado em PDF profissional

            gerarRelatorioProdutosDetalhado();

          }

        }

        break;

      case 'clientes':

        if (dadosClientes?.clientes) {

          if (formato === 'csv') {

            gerarCSV(dadosClientes.clientes, nomeArquivo);

          } else if (formato === 'json') {

            gerarJSON(dadosClientes, nomeArquivo);

          } else {

            // Usar o relatório detalhado em PDF profissional

            await gerarRelatorioClientesDetalhado();

          }

        }

        break;

      case 'financeiro':

        if (dadosFinanceiro?.transacoes) {

          if (formato === 'csv') {

            gerarCSV(dadosFinanceiro.transacoes, nomeArquivo);

          } else if (formato === 'json') {

            gerarJSON(dadosFinanceiro, nomeArquivo);

          } else {

            // Usar o relatório detalhado em PDF profissional

            gerarRelatorioFinanceiroDetalhado();

          }

        }

        break;

      case 'estoque':

        if (dadosEstoque?.produtos) {

          if (formato === 'csv') {

            gerarCSV(dadosEstoque.produtos, nomeArquivo);

          } else if (formato === 'json') {

            gerarJSON(dadosEstoque, nomeArquivo);

          } else {

            // Usar o relatório detalhado em PDF profissional

            gerarRelatorioEstoqueDetalhado();

          }

        }

        break;

    }

  };


  // Modal de visualização de vendas
  const ModalVendas = () => (
    <Dialog open={modalVendasAberto} onOpenChange={setModalVendasAberto}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-[95vw] sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-sm sm:text-base">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
            <span className="truncate">Vendas por Período - {formatarData(dataInicio)} a {formatarData(dataFim)}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resumo Geral */}
          {dadosVendas && dadosVendas.total_geral && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-primary">
                      {formatarMoeda(dadosVendas.total_geral.receita_total)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Receita Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-success">
                      {dadosVendas.total_geral.total_vendas}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total de Vendas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-info">
                      {dadosVendas.vendas.reduce((acc, venda) => acc + venda.vendas_pagas, 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Vendas Pagas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-warning">
                      {formatarMoeda(
                        dadosVendas.total_geral.ticket_medio || 
                        (dadosVendas.total_geral.total_vendas > 0 ? 
                          dadosVendas.total_geral.receita_total / dadosVendas.total_geral.total_vendas : 0)
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Ticket Médio</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabela de Vendas */}
          {loadingVendas ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : dadosVendas && dadosVendas.vendas.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base">Detalhamento por Período</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto max-w-full">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Período</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Total Vendas</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Vendas Pagas</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Vendas Pendentes</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Receita</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Ticket Médio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosVendas.vendas.map((venda, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-xs sm:text-sm">{formatarData(venda.periodo)}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{venda.total_vendas}</TableCell>
                          <TableCell className="text-right text-success text-xs sm:text-sm">{venda.vendas_pagas}</TableCell>
                          <TableCell className="text-right text-warning text-xs sm:text-sm">{venda.vendas_pendentes}</TableCell>
                          <TableCell className="text-right font-semibold text-xs sm:text-sm">
                            {formatarMoeda(venda.receita_total)}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            {formatarMoeda(venda.ticket_medio || (venda.total_vendas > 0 ? venda.receita_total / venda.total_vendas : 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Nenhuma venda encontrada</p>
                  <p className="text-sm text-muted-foreground">
                    Ajuste o período selecionado para visualizar as vendas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setModalVendasAberto(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                gerarRelatorioVendasDetalhado();
                setModalVendasAberto(false);
              }}
              disabled={!dadosVendas || dadosVendas.vendas.length === 0}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Modal de visualização de produtos
  const ModalProdutos = () => (
    <Dialog open={modalProdutosAberto} onOpenChange={setModalProdutosAberto}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-[95vw] sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-sm sm:text-base">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
            <span className="truncate">Produtos Mais Vendidos - {formatarData(dataInicio)} a {formatarData(dataFim)}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resumo Geral */}
          {dadosProdutos && dadosProdutos.produtos && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-primary">
                      {dadosProdutos.produtos.length}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total de Produtos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-success">
                      {dadosProdutos.produtos.reduce((acc, produto) => acc + (Number(produto.total_vendido) || 0), 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Unidades Vendidas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-info">
                      {formatarMoeda(dadosProdutos.produtos.reduce((acc, produto) => acc + (Number(produto.receita_total) || 0), 0))}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Receita Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-warning">
                      {formatarMoeda(
                        dadosProdutos.produtos.reduce((acc, produto) => acc + (Number(produto.receita_total) || 0), 0) / 
                        Math.max(dadosProdutos.produtos.reduce((acc, produto) => acc + (Number(produto.total_vendido) || 0), 0), 1)
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Ticket Médio</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabela de Produtos */}
          {loadingProdutos ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : dadosProdutos && dadosProdutos.produtos.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base">Ranking de Produtos</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto max-w-full">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">#</TableHead>
                        <TableHead className="text-xs sm:text-sm">Produto</TableHead>
                        <TableHead className="text-xs sm:text-sm">Categoria</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Unidades Vendidas</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Receita</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosProdutos.produtos.map((produto, index) => {
                        const receitaTotal = dadosProdutos.produtos.reduce((acc, p) => acc + (Number(p.receita_total) || 0), 0);
                        const percentual = receitaTotal > 0 ? ((Number(produto.receita_total) || 0) / receitaTotal) * 100 : 0;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-xs sm:text-sm">{index + 1}</TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{produto.nome || 'Produto sem nome'}</TableCell>
                            <TableCell className="text-muted-foreground text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{produto.categoria_nome || 'Sem categoria'}</TableCell>
                            <TableCell className="text-right font-semibold text-xs sm:text-sm">{produto.total_vendido || 0}</TableCell>
                            <TableCell className="text-right font-semibold text-primary text-xs sm:text-sm">
                              {formatarMoeda(Number(produto.receita_total) || 0)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">
                              {percentual.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Nenhum produto vendido</p>
                  <p className="text-sm text-muted-foreground">
                    Ajuste o período selecionado para visualizar as vendas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setModalProdutosAberto(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                gerarRelatorioProdutosDetalhado();
                setModalProdutosAberto(false);
              }}
              disabled={!dadosProdutos || dadosProdutos.produtos.length === 0}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Modal de visualização de clientes
  const ModalClientes = () => (
    <Dialog open={modalClientesAberto} onOpenChange={setModalClientesAberto}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-[95vw] sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-sm sm:text-base">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
            <span className="truncate">Análise de Clientes - {formatarData(dataInicio)} a {formatarData(dataFim)}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resumo Geral */}
          {dadosClientes && dadosClientes.clientes && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {dadosClientes.clientes.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total de Clientes</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">
                      {dadosClientes.clientes.filter(c => c.vip).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Clientes VIP</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-info">
                      {formatarMoeda(dadosClientes.clientes.reduce((acc, cliente) => acc + (Number(cliente.valor_total) || 0), 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">
                      {formatarMoeda(
                        dadosClientes.clientes.reduce((acc, cliente) => acc + (Number(cliente.valor_total) || 0), 0) / 
                        Math.max(dadosClientes.clientes.length, 1)
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}


          {/* Tabela de Clientes */}
          {loadingClientes ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : dadosClientes && dadosClientes.clientes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Total Vendas</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-center">VIP</TableHead>
                        <TableHead>Última Compra</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosClientes.clientes.map((cliente, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{cliente.nome || 'Cliente sem nome'}</TableCell>
                          <TableCell className="text-muted-foreground">{cliente.email || 'email@exemplo.com'}</TableCell>
                          <TableCell className="text-right font-semibold">{cliente.total_vendas || 0}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatarMoeda(Number(cliente.valor_total) || 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            {cliente.vip ? (
                              <Badge variant="default" className="bg-yellow-500">VIP</Badge>
                            ) : (
                              <Badge variant="secondary">Regular</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {cliente.ultima_compra ? formatarData(cliente.ultima_compra) : 'Nunca'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Nenhum cliente encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Ajuste o período selecionado para visualizar os clientes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setModalClientesAberto(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                gerarRelatorioClientesDetalhado();
                setModalClientesAberto(false);
              }}
              disabled={!dadosClientes || dadosClientes.clientes.length === 0}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Modal de visualização de financeiro
  const ModalFinanceiro = () => (
    <Dialog open={modalFinanceiroAberto} onOpenChange={setModalFinanceiroAberto}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-[95vw] sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-sm sm:text-base">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
            <span className="truncate">Relatório Financeiro - {formatarData(dataInicio)} a {formatarData(dataFim)}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resumo Geral */}
          {dadosFinanceiro && dadosFinanceiro.resumo && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">
                      {formatarMoeda(dadosFinanceiro.resumo.valor_entradas || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Entradas</p>
                    <p className="text-xs text-muted-foreground">{dadosFinanceiro.resumo.total_entradas || 0} transações</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">
                      {formatarMoeda(dadosFinanceiro.resumo.valor_saidas || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Saídas</p>
                    <p className="text-xs text-muted-foreground">{dadosFinanceiro.resumo.total_saidas || 0} transações</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${((dadosFinanceiro.resumo.valor_entradas || 0) - (dadosFinanceiro.resumo.valor_saidas || 0)) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatarMoeda((dadosFinanceiro.resumo.valor_entradas || 0) - (dadosFinanceiro.resumo.valor_saidas || 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                    <p className="text-xs text-muted-foreground">Período selecionado</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {dadosFinanceiro.resumo.total_transacoes || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Transações</p>
                    <p className="text-xs text-muted-foreground">Entradas + Saídas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabela de Transações */}
          {loadingFinanceiro ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : dadosFinanceiro && dadosFinanceiro.transacoes && dadosFinanceiro.transacoes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Transações do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cliente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosFinanceiro.transacoes.map((transacao, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {transacao.data_transacao ? formatarData(transacao.data_transacao) : 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {transacao.descricao || 'Transação sem descrição'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transacao.tipo === 'entrada' ? 'default' : 'destructive'}>
                              {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${transacao.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                            {transacao.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(Number(transacao.valor) || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transacao.status === 'pago' ? 'default' : 'secondary'}>
                              {transacao.status === 'pago' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {transacao.cliente_nome || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Nenhuma transação encontrada</p>
                  <p className="text-sm text-muted-foreground">
                    Ajuste o período selecionado para visualizar as transações
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setModalFinanceiroAberto(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                gerarRelatorioFinanceiroDetalhado();
                setModalFinanceiroAberto(false);
              }}
              disabled={!dadosFinanceiro || !dadosFinanceiro.transacoes || dadosFinanceiro.transacoes.length === 0}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Modal de visualização de estoque
  const ModalEstoque = () => (
    <Dialog open={modalEstoqueAberto} onOpenChange={setModalEstoqueAberto}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-[95vw] sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-sm sm:text-base">
            <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
            <span className="truncate">Controle de Estoque - {formatarData(dataInicio)} a {formatarData(dataFim)}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resumo Geral */}
          {dadosEstoque && dadosEstoque.estatisticas && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {dadosEstoque.estatisticas.total_produtos || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total de Produtos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">
                      {dadosEstoque.estatisticas.sem_estoque || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Sem Estoque</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">
                      {dadosEstoque.estatisticas.estoque_baixo || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">
                      {formatarMoeda(dadosEstoque.estatisticas.valor_total_estoque || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-xs text-muted-foreground">{dadosEstoque.estatisticas.total_unidades || 0} unidades</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabela de Produtos */}
          {loadingEstoque ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : dadosEstoque && dadosEstoque.produtos && dadosEstoque.produtos.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Produtos em Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Estoque</TableHead>
                        <TableHead className="text-right">Estoque Mínimo</TableHead>
                        <TableHead className="text-right">Valor Unitário</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosEstoque.produtos.map((produto, index) => {
                        const estoqueAtual = produto.estoque_atual || produto.estoque || 0;
                        const estoqueMinimoAtual = produto.estoque_minimo_atual || produto.estoque_minimo || 0;
                        const valorUnitario = Number(produto.preco) || 0;
                        const valorTotal = Number(estoqueAtual) * valorUnitario;
                        
                        // Formatação do estoque baseada no tipo
                        const formatarEstoque = (produto: any, valor: number) => {
                          if (produto.tipo_preco === 'kg') {
                            const estoqueFormatado = parseFloat(valor.toString()).toFixed(3).replace(/\.?0+$/, '');
                            return `${estoqueFormatado} kg`;
                          } else if (produto.tipo_preco === 'litros') {
                            const estoqueFormatado = parseFloat(valor.toString()).toFixed(3).replace(/\.?0+$/, '');
                            return `${estoqueFormatado} L`;
                          } else {
                            return `${Math.round(parseFloat(valor.toString()))} Un.`;
                          }
                        };
                        
                        let status = produto.status_estoque || 'Normal';
                        let statusColor = 'default';
                        
                        if (status === 'Sem estoque') {
                          statusColor = 'destructive';
                        } else if (status === 'Estoque baixo') {
                          statusColor = 'secondary';
                        }
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {produto.nome || 'Produto sem nome'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {produto.categoria_nome || 'Sem categoria'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatarEstoque(produto, estoqueAtual)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatarEstoque(produto, estoqueMinimoAtual)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatarMoeda(valorUnitario)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-primary">
                              {formatarMoeda(valorTotal)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={statusColor as any}>
                                {status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Ajuste o período selecionado para visualizar o estoque
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setModalEstoqueAberto(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                gerarRelatorioEstoqueDetalhado();
                setModalEstoqueAberto(false);
              }}
              disabled={!dadosEstoque || !dadosEstoque.produtos || dadosEstoque.produtos.length === 0}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );


  return (

    <div className="space-y-6 w-full max-w-full overflow-x-hidden prevent-zoom touch-optimized mobile-scroll">

      {/* Header */}

      <div className="w-full">

        {/* Título e Descrição - Sempre no topo */}
        <div className="mb-4 md:mb-0">

          <h1 className="text-2xl sm:text-3xl font-bold">Relatórios</h1>

          <p className="text-sm sm:text-base text-muted-foreground">

            Análises e insights sobre seu negócio

          </p>

        </div>

        {/* Filtros - Desktop */}
        <div className="hidden md:flex items-center space-x-2 justify-end">

          <div className="flex items-center space-x-2">

            <Label htmlFor="data-inicio" className="text-sm font-medium">De:</Label>

            <Input

              id="data-inicio"

              type="date"

              value={dataInicio}

              onChange={(e) => setDataInicio(e.target.value)}

              className="w-40"

            />

          </div>

          <div className="flex items-center space-x-2">

            <Label htmlFor="data-fim" className="text-sm font-medium">Até:</Label>

            <Input

              id="data-fim"

              type="date"

              value={dataFim}

              onChange={(e) => setDataFim(e.target.value)}

              className="w-40"

            />

          </div>

          <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>

            <SelectTrigger className="w-48">

              <SelectValue placeholder="Todas as categorias" />

            </SelectTrigger>

            <SelectContent>

              <SelectItem value="todas">Todas as categorias</SelectItem>

              {categorias.map((categoria) => (

                <SelectItem key={categoria.id} value={categoria.id.toString()}>

                  {categoria.nome}

                </SelectItem>

              ))}

            </SelectContent>

          </Select>

          <Button 

            variant="outline" 

            size="sm" 

            onClick={() => {

              // Recarregar todos os dados

              window.location.reload();

            }}

          >

            <RefreshCw className="h-4 w-4 mr-2" />

            Atualizar

          </Button>

        </div>

        {/* Filtros - Mobile */}
        <div className="md:hidden space-y-3 w-full">

          <div className="grid grid-cols-2 gap-2 w-full">

            <div className="space-y-1 min-w-0">

              <Label htmlFor="data-inicio-mobile" className="text-xs font-medium">De:</Label>

              <Input

                id="data-inicio-mobile"

                type="date"

                value={dataInicio}

                onChange={(e) => setDataInicio(e.target.value)}

                className="w-full text-sm"

              />

            </div>

            <div className="space-y-1 min-w-0">

              <Label htmlFor="data-fim-mobile" className="text-xs font-medium">Até:</Label>

              <Input

                id="data-fim-mobile"

                type="date"

                value={dataFim}

                onChange={(e) => setDataFim(e.target.value)}

                className="w-full text-sm"

              />

            </div>

          </div>

          <div className="space-y-1 w-full">

            <Label className="text-xs font-medium">Categoria:</Label>

            <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>

              <SelectTrigger className="w-full">

                <SelectValue placeholder="Todas as categorias" />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="todas">Todas as categorias</SelectItem>

                {categorias.map((categoria) => (

                  <SelectItem key={categoria.id} value={categoria.id.toString()}>

                    {categoria.nome}

                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

          </div>

          <Button 

            variant="outline" 

            size="sm" 

            className="w-full"

            onClick={() => {

              // Recarregar todos os dados

              window.location.reload();

            }}

          >

            <RefreshCw className="h-4 w-4 mr-2" />

            Atualizar Dados

          </Button>

        </div>

      </div>



      {/* Métricas Rápidas */}

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">

        {loadingMetricas ? (

          Array.from({ length: 4 }).map((_, index) => (

            <Card key={index} className="bg-gradient-card shadow-card">

              <CardContent className="p-6">

                <div className="flex items-center justify-center h-20">

                  <Loader2 className="h-6 w-6 animate-spin" />

                </div>

              </CardContent>

            </Card>

          ))

        ) : (

          [

            {

              titulo: "Vendas Hoje",

              valor: metricas?.vendas_hoje?.valor ? formatarMoeda(metricas.vendas_hoje.valor) : "R$ 0,00",

              mudanca: metricas?.vendas_hoje?.mudanca ? formatarPercentual(metricas.vendas_hoje.mudanca) : "+0%",

              tipoMudanca: (metricas?.vendas_hoje?.mudanca || 0) >= 0 ? "positiva" as const : "negativa" as const,

              icone: DollarSign

            },

            {

              titulo: "Pedidos Hoje",

              valor: metricas?.pedidos_hoje?.valor?.toString() || "0",

              mudanca: metricas?.pedidos_hoje?.mudanca ? `+${metricas.pedidos_hoje.mudanca}` : "+0",

              tipoMudanca: (metricas?.pedidos_hoje?.mudanca || 0) >= 0 ? "positiva" as const : "negativa" as const,

              icone: ShoppingCart

            },

            {

              titulo: "Produtos Vendidos",

              valor: metricas?.produtos_vendidos?.valor?.toString() || "0",

              mudanca: metricas?.produtos_vendidos?.mudanca ? formatarPercentual(metricas.produtos_vendidos.mudanca) : "+0%",

              tipoMudanca: (metricas?.produtos_vendidos?.mudanca || 0) >= 0 ? "positiva" as const : "negativa" as const,

              icone: Package

            },

            {

              titulo: "Novos Clientes",

              valor: metricas?.novos_clientes?.valor?.toString() || "0",

              mudanca: metricas?.novos_clientes?.mudanca ? `+${metricas.novos_clientes.mudanca}` : "+0",

              tipoMudanca: (metricas?.novos_clientes?.mudanca || 0) >= 0 ? "positiva" as const : "negativa" as const,

              icone: Users

            }

          ].map((metrica, index) => (

            <Card key={index} className="bg-gradient-card shadow-card">

              <CardContent className="p-3 sm:p-6">

                <div className="flex items-center justify-between">

                  <div className="flex-1 min-w-0">

                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{metrica.titulo}</p>

                    <p className="text-lg sm:text-2xl font-bold truncate">{metrica.valor}</p>

                    <div className="flex items-center space-x-1 mt-1">

                      {metrica.tipoMudanca === "positiva" ? (

                        <TrendingUp className="h-3 w-3 text-success flex-shrink-0" />

                      ) : (

                        <TrendingDown className="h-3 w-3 text-destructive flex-shrink-0" />

                      )}

                      <span className={`text-xs ${metrica.tipoMudanca === "positiva" ? "text-success" : "text-destructive"} truncate`}>

                        {metrica.mudanca}

                      </span>

                    </div>

                  </div>

                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0 ml-2">

                    <metrica.icone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />

                  </div>

                </div>

              </CardContent>

            </Card>

          ))

        )}

      </div>



      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">

        {/* Relatórios Disponíveis */}

        <div className="lg:col-span-2 order-2 lg:order-1">

          <Card className="bg-gradient-card shadow-card">

            <CardHeader>

              <CardTitle>Relatórios Disponíveis</CardTitle>

            </CardHeader>

            <CardContent>

              <div className="grid gap-4">

                {relatorios.map((relatorio, index) => (

                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border bg-muted/30 space-y-3 sm:space-y-0 w-full min-w-0">

                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">

                      <div className={`p-2 sm:p-3 rounded-lg ${relatorio.cor} flex-shrink-0`}>

                        {relatorio.loading ? (

                          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />

                        ) : (

                          <relatorio.icone className="h-5 w-5 sm:h-6 sm:w-6" />

                        )}

                      </div>

                      <div className="flex-1 min-w-0">

                        <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{relatorio.titulo}</h3>

                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{relatorio.descricao}</p>

                        <p className="text-xs text-muted-foreground mt-1">

                          Atualizado: {new Date(relatorio.ultimaGeracao).toLocaleDateString("pt-BR")}

                        </p>

                        {relatorio.dados && (

                          <div className="mt-2 text-xs text-muted-foreground">

                            {relatorio.tipo === 'vendas' && 'vendas' in relatorio.dados && (

                              <span>{relatorio.dados.vendas.length} registros</span>

                            )}

                            {relatorio.tipo === 'produtos' && 'produtos' in relatorio.dados && (

                              <span>{relatorio.dados.produtos.length} produtos</span>

                            )}

                            {relatorio.tipo === 'clientes' && 'clientes' in relatorio.dados && (

                              <span>{relatorio.dados.clientes.length} clientes</span>

                            )}

                            {relatorio.tipo === 'financeiro' && 'transacoes' in relatorio.dados && (

                              <span>{relatorio.dados.transacoes.length} transações</span>

                            )}

                            {relatorio.tipo === 'estoque' && 'produtos' in relatorio.dados && (

                              <span>{relatorio.dados.produtos.length} produtos</span>

                            )}

                          </div>

                        )}

                      </div>

                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">

                      {relatorio.tipo === 'vendas' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setModalVendasAberto(true)}
                          disabled={relatorio.loading}
                          className="text-xs sm:text-sm hidden min-[550px]:flex"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Ver
                        </Button>
                      ) : relatorio.tipo === 'produtos' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setModalProdutosAberto(true)}
                          disabled={relatorio.loading}
                          className="text-xs sm:text-sm hidden min-[550px]:flex"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Ver
                        </Button>
                      ) : relatorio.tipo === 'clientes' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setModalClientesAberto(true)}
                          disabled={relatorio.loading}
                          className="text-xs sm:text-sm hidden min-[550px]:flex"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Ver
                        </Button>
                      ) : relatorio.tipo === 'financeiro' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setModalFinanceiroAberto(true)}
                          disabled={relatorio.loading}
                          className="text-xs sm:text-sm hidden min-[550px]:flex"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Ver
                        </Button>
                      ) : relatorio.tipo === 'estoque' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setModalEstoqueAberto(true)}
                          disabled={relatorio.loading}
                          className="text-xs sm:text-sm hidden min-[550px]:flex"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Ver
                        </Button>
                      ) : (
                      <Button variant="outline" size="sm" disabled={relatorio.loading} className="text-xs sm:text-sm hidden min-[550px]:flex">

                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />

                        Ver

                      </Button>

                      )}
                      {relatorio.tipo === 'vendas' ? (

                        <Button 

                          variant="outline" 

                          size="sm" 

                          onClick={() => baixarRelatorio(relatorio.tipo, 'pdf')}

                          disabled={relatorio.loading || loadingVendasDetalhado || !dadosVendasDetalhado}

                          className="text-xs sm:text-sm"

                        >

                          {loadingVendasDetalhado ? (

                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />

                          ) : (

                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />

                          )}

                          <span className="hidden sm:inline">PDF</span>
                          <span className="sm:hidden">📄</span>

                        </Button>

                      ) : relatorio.tipo === 'produtos' ? (

                        <Button 

                          variant="outline" 

                          size="sm" 

                          onClick={() => baixarRelatorio(relatorio.tipo, 'pdf')}

                          disabled={relatorio.loading || !dadosProdutos || !user}

                          className="text-xs sm:text-sm"

                        >

                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />

                          <span className="hidden sm:inline">PDF</span>
                          <span className="sm:hidden">📄</span>

                        </Button>

                      ) : relatorio.tipo === 'clientes' ? (

                        <Button 

                          variant="outline" 

                          size="sm" 

                          onClick={() => baixarRelatorio(relatorio.tipo, 'pdf')}

                          disabled={relatorio.loading || !dadosClientes || !user}

                          className="text-xs sm:text-sm"

                        >

                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />

                          <span className="hidden sm:inline">PDF</span>
                          <span className="sm:hidden">📄</span>

                        </Button>

                      ) : relatorio.tipo === 'financeiro' ? (

                        <Button 

                          variant="outline" 

                          size="sm" 

                          onClick={() => baixarRelatorio(relatorio.tipo, 'pdf')}

                          disabled={relatorio.loading || !dadosFinanceiro || !user}

                          className="text-xs sm:text-sm"

                        >

                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />

                          <span className="hidden sm:inline">PDF</span>
                          <span className="sm:hidden">📄</span>

                        </Button>

                      ) : relatorio.tipo === 'estoque' ? (

                        <Button 

                          variant="outline" 

                          size="sm" 

                          onClick={() => baixarRelatorio(relatorio.tipo, 'pdf')}

                          disabled={relatorio.loading || !dadosEstoque || !user}

                          className="text-xs sm:text-sm"

                        >

                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />

                          <span className="hidden sm:inline">PDF</span>
                          <span className="sm:hidden">📄</span>

                        </Button>

                      ) : (

                        <Select onValueChange={(formato) => baixarRelatorio(relatorio.tipo, formato)}>

                          <SelectTrigger className="w-20 sm:w-32 text-xs sm:text-sm">

                            <SelectValue placeholder="📄" />

                          </SelectTrigger>

                          <SelectContent>

                            <SelectItem value="csv">CSV</SelectItem>

                            <SelectItem value="json">JSON</SelectItem>

                            <SelectItem value="pdf">PDF</SelectItem>

                          </SelectContent>

                        </Select>

                      )}

                    </div>

                  </div>

                ))}

              </div>

            </CardContent>

          </Card>

        </div>



        {/* Relatórios Recentes */}

        <div className="order-1 lg:order-2">

          <Card className="bg-gradient-card shadow-card">

            <CardHeader>

              <CardTitle className="flex items-center justify-between">

                <span>Relatórios Recentes</span>

                <Badge variant="secondary">{relatoriosRecentes.length}</Badge>

              </CardTitle>

            </CardHeader>

            <CardContent>

              <div className="space-y-4">

                {relatoriosRecentes.map((relatorio, index) => (

                  <div key={index} className="space-y-2">

                    <div className="flex items-start justify-between">

                      <div className="space-y-1">

                        <p className="font-medium text-sm line-clamp-2">{relatorio.nome}</p>

                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">

                          <FileText className="h-3 w-3" />

                          <span>{relatorio.tipo}</span>

                          <span>•</span>

                          <span>{relatorio.tamanho}</span>

                        </div>

                        <p className="text-xs text-muted-foreground">

                          {formatarDataHora(relatorio.geradoEm)}
                        </p>

                      </div>

                      <Button variant="ghost" size="sm">

                        <Download className="h-4 w-4" />

                      </Button>

                    </div>

                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">

                      <Download className="h-3 w-3" />

                      <span>{relatorio.downloads} downloads</span>

                    </div>

                    {index < relatoriosRecentes.length - 1 && (

                      <div className="border-t border-border/50" />

                    )}

                  </div>

                ))}

              </div>

              

              <Button variant="outline" size="sm" className="w-full mt-4">

                Ver Todos os Relatórios

              </Button>

            </CardContent>

          </Card>

        </div>

      </div>





      {/* Gráficos com Dados Reais */}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 w-full">

        <Card className="bg-gradient-card shadow-card w-full min-w-0">

          <CardHeader>

            <CardTitle className="flex items-center">

              <BarChart3 className="h-5 w-5 mr-2" />

              Vendas por Período

            </CardTitle>

          </CardHeader>

          <CardContent>

            {loadingVendas ? (

              <div className="h-64 flex items-center justify-center">

                <Loader2 className="h-8 w-8 animate-spin" />

              </div>

            ) : dadosVendas && dadosVendas.vendas.length > 0 ? (

              <div className="space-y-4">

                <div className="text-center">

                  <p className="text-2xl font-bold text-primary">

                    {formatarMoeda(dadosVendas.total_geral.receita_total)}

                  </p>

                  <p className="text-sm text-muted-foreground">Receita Total</p>

                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">

                  {dadosVendas.vendas.slice(0, 10).map((venda, index) => (

                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">

                      <span className="text-sm font-medium">{formatarData(venda.periodo)}</span>
                      <div className="text-right">

                        <p className="text-sm font-semibold">{formatarMoeda(venda.receita_total)}</p>

                        <p className="text-xs text-muted-foreground">{venda.total_vendas} vendas</p>

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            ) : (

              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">

                <div className="text-center">

                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />

                  <p className="text-sm text-muted-foreground">Nenhum dado encontrado</p>

                  <p className="text-xs text-muted-foreground">Ajuste o período para ver vendas</p>

                </div>

              </div>

            )}

          </CardContent>

        </Card>



        <Card className="bg-gradient-card shadow-card w-full min-w-0">

          <CardHeader>

            <CardTitle className="flex items-center">

              <PieChart className="h-5 w-5 mr-2" />

              Produtos Mais Vendidos

            </CardTitle>

          </CardHeader>

          <CardContent>

            {loadingProdutos ? (

              <div className="h-64 flex items-center justify-center">

                <Loader2 className="h-8 w-8 animate-spin" />

              </div>

            ) : dadosProdutos && dadosProdutos.produtos.length > 0 ? (

              <div className="space-y-2 max-h-64 overflow-y-auto">

                {dadosProdutos.produtos.slice(0, 8).map((produto, index) => (

                  <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">

                    <div className="flex-1 min-w-0">

                      <p className="text-sm font-medium truncate">{produto.nome}</p>

                      <p className="text-xs text-muted-foreground">{produto.categoria_nome}</p>

                    </div>

                    <div className="text-right ml-2">

                      <p className="text-sm font-semibold">{produto.total_vendido} unid.</p>

                      <p className="text-xs text-muted-foreground">{formatarMoeda(produto.receita_total)}</p>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">

                <div className="text-center">

                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />

                  <p className="text-sm text-muted-foreground">Nenhum produto vendido</p>

                  <p className="text-xs text-muted-foreground">Ajuste o período para ver vendas</p>

                </div>

              </div>

            )}

          </CardContent>

        </Card>

      </div>




      {/* Modais */}
      <ModalVendas />
      <ModalProdutos />
      <ModalClientes />
      <ModalFinanceiro />
      <ModalEstoque />
    </div>

  );

}