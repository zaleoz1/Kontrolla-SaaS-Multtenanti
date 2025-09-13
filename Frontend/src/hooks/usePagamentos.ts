import { useState } from 'react';
import { useApi } from './useApi';
import { MetodoPagamento, PagamentoPrazo, ItemVenda } from './useVendas';

export interface DadosPagamento {
  carrinho: any[];
  clienteSelecionado: any;
  subtotal: number;
  desconto: string;
  total: number;
}

export interface DadosVendaCompleta {
  cliente_id?: number | null;
  itens: ItemVenda[];
  metodos_pagamento: MetodoPagamento[];
  pagamento_prazo?: {
    dias: string;
    juros: string;
    valorComJuros: number;
    dataVencimento: Date;
    valorOriginal: number;
  };
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: string | null;
  parcelas: number;
  observacoes?: string;
  status: 'pendente' | 'pago' | 'cancelado' | 'devolvido';
}

export const usePagamentos = () => {
  const { makeRequest } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para calcular valor com juros e data de vencimento
  const calcularPagamentoPrazo = (
    dias: string, 
    juros: string, 
    valorBase: number,
    setPagamentoPrazo: React.Dispatch<React.SetStateAction<PagamentoPrazo>>
  ) => {
    const diasNum = parseFloat(dias) || 0;
    const jurosNum = parseFloat(juros) || 0;
    const valorComJuros = valorBase * (1 + jurosNum / 100);
    const dataVencimento = new Date(Date.now() + diasNum * 24 * 60 * 60 * 1000);
    
    setPagamentoPrazo({
      dias,
      juros,
      valorComJuros,
      dataVencimento
    });
  };

  // Função para calcular o valor restante para pagamento a prazo
  const calcularValorRestantePrazo = (metodosPagamento: MetodoPagamento[], total: number) => {
    if (metodosPagamento.length === 0) return 0;
    
    const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
    return Math.max(0, total - totalPago);
  };

  // Função para validar formulário de pagamento
  const validarFormulario = (
    carrinho: any[],
    metodosPagamento: MetodoPagamento[],
    metodoPagamentoUnico: string,
    valorDinheiro: string,
    usarPagamentoPrazo: boolean,
    pagamentoPrazo: PagamentoPrazo,
    total: number
  ) => {
    if (!carrinho.length) return "Adicione produtos ao carrinho";
    
    if (usarPagamentoPrazo) {
      if (metodosPagamento.length > 0) {
        const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
        const valorRestante = total - totalPago;
        if (valorRestante > 0) {
          if (pagamentoPrazo.valorComJuros < valorRestante) {
            return `O pagamento a prazo deve cobrir pelo menos R$ ${valorRestante.toFixed(2)}`;
          }
        }
        const metodoIncompleto = metodosPagamento.find(m => !m.metodo || parseFloat(m.valor) <= 0);
        if (metodoIncompleto) {
          return "Complete todos os métodos de pagamento com valores válidos";
        }
      }
      return "Pagamento a prazo configurado";
    }
    
    if (metodosPagamento.length > 0) {
      const totalPago = metodosPagamento.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
      if (totalPago < total) {
        return `Falta R$ ${(total - totalPago).toFixed(2)} para completar o pagamento`;
      }
      const metodoIncompleto = metodosPagamento.find(m => !m.metodo || parseFloat(m.valor) <= 0);
      if (metodoIncompleto) {
        return "Complete todos os métodos de pagamento com valores válidos";
      }
    }
    if (metodoPagamentoUnico === "dinheiro" && (parseFloat(valorDinheiro) || 0) < total) {
      return `Valor em dinheiro deve ser maior ou igual a R$ ${total.toFixed(2)}`;
    }
    if (!metodoPagamentoUnico && metodosPagamento.length === 0) return "Selecione uma forma de pagamento";
    return "Preencha todos os campos obrigatórios";
  };

  // Função para processar dados da venda
  const processarDadosVenda = (
    dadosPagamento: DadosPagamento,
    metodosPagamento: MetodoPagamento[],
    metodoPagamentoUnico: string,
    valorDinheiro: string,
    usarPagamentoPrazo: boolean,
    pagamentoPrazo: PagamentoPrazo
  ): DadosVendaCompleta => {
    const { carrinho, clienteSelecionado, subtotal, desconto, total } = dadosPagamento;
    
    // Determinar os métodos de pagamento finais
    let metodosFinais = metodosPagamento;
    
    // Se não há métodos configurados, mas há um método único selecionado, usar o padrão
    if (metodosPagamento.length === 0 && metodoPagamentoUnico) {
      if (metodoPagamentoUnico === "dinheiro") {
        const valorAlvo = usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total;
        metodosFinais = [{ 
          metodo: metodoPagamentoUnico, 
          valor: valorDinheiro,
          troco: Math.max(0, (parseFloat(valorDinheiro) || 0) - valorAlvo)
        }];
      } else {
        const valorAlvo = usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total;
        metodosFinais = [{ metodo: metodoPagamentoUnico, valor: valorAlvo.toString() }];
      }
    } else if (metodosPagamento.length > 0) {
      // Processar métodos múltiplos para calcular troco se houver dinheiro
      const valorAlvo = usarPagamentoPrazo ? pagamentoPrazo.valorComJuros : total;
      metodosFinais = metodosPagamento.map(metodo => {
        if (metodo.metodo === "dinheiro") {
          return {
            ...metodo,
            troco: Math.max(0, parseFloat(metodo.valor) - (valorAlvo - metodosPagamento.reduce((sum, m) => 
              m.metodo !== "dinheiro" ? sum + parseFloat(m.valor) : sum, 0)))
          };
        }
        return metodo;
      });
    }
    
    // Calcular o total final da venda
    // O valor total da venda deve ser sempre o valor real dos produtos (sem troco)
    let totalFinal = total;
    if (usarPagamentoPrazo && metodosPagamento.length === 0) {
      totalFinal = pagamentoPrazo.valorComJuros;
    }
    // Para pagamentos com troco, o total da venda permanece o valor dos produtos
    // O troco é calculado e armazenado separadamente nos métodos de pagamento
    
    // Preparar itens da venda
    const itensVenda: ItemVenda[] = carrinho.map(item => ({
      produto_id: parseInt(item.produto.id.toString()),
      quantidade: parseInt(item.quantidade.toString()),
      preco_unitario: parseFloat(item.precoUnitario.toString()),
      preco_total: parseFloat(item.precoTotal.toString()),
      desconto: 0
    }));
    
    // Preparar dados da venda
    const statusVenda: 'pendente' | 'pago' = usarPagamentoPrazo ? 'pendente' : 'pago';
    const descontoNum = parseFloat(desconto) || 0;
    const valorDesconto = (subtotal * descontoNum) / 100;
    
    return {
      cliente_id: clienteSelecionado?.id || null,
      itens: itensVenda,
      metodos_pagamento: metodosFinais,
      pagamento_prazo: usarPagamentoPrazo ? {
        ...pagamentoPrazo,
        juros: pagamentoPrazo.juros === "" ? null : pagamentoPrazo.juros,
        dias: pagamentoPrazo.dias === "" ? null : pagamentoPrazo.dias,
        valorOriginal: metodosPagamento.length > 0 ? calcularValorRestantePrazo(metodosPagamento, total) : total
      } : undefined,
      subtotal: parseFloat(subtotal.toString()),
      desconto: parseFloat(valorDesconto.toString()),
      total: parseFloat(totalFinal.toString()),
      forma_pagamento: metodosFinais.length > 0 ? metodosFinais[0]?.metodo : (metodoPagamentoUnico || null),
      parcelas: 1,
      observacoes: "",
      status: statusVenda
    };
  };

  // Função para criar venda
  const criarVenda = async (dadosVenda: DadosVendaCompleta) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest('/vendas', {
        method: 'POST',
        body: dadosVenda
      }) as { venda: any; message: string };

      return response.venda;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar venda';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    calcularPagamentoPrazo,
    calcularValorRestantePrazo,
    validarFormulario,
    processarDadosVenda,
    criarVenda
  };
};
