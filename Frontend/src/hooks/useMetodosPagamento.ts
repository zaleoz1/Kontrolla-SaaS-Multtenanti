import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface ParcelaMetodoPagamento {
  id: number;
  quantidade: number;
  taxa: number;
  ativo: boolean;
}

interface MetodoPagamento {
  id: number;
  tipo: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'boleto' | 'cheque';
  nome: string;
  taxa: number;
  ativo: boolean;
  ordem: number;
  configuracoes?: any;
  parcelas: ParcelaMetodoPagamento[];
}

export const useMetodosPagamento = () => {
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamento[]>([]);
  const { makeRequest } = useApi();

  const buscarMetodosPagamento = async () => {
    try {
      const response = await makeRequest('/configuracoes/metodos-pagamento', {
        method: 'GET'
      });

      if (response && Array.isArray(response)) {
        setMetodosPagamento(response);
        return response;
      }
      
      return [];
    } catch (err: any) {
      console.error('Erro ao buscar métodos de pagamento:', err);
      throw err;
    }
  };

  // Buscar métodos de pagamento ao montar o componente
  useEffect(() => {
    buscarMetodosPagamento();
  }, []);

  // Filtrar apenas métodos ativos
  const metodosAtivos = metodosPagamento.filter(metodo => metodo.ativo);

  // Ordenar por ordem e nome
  const metodosOrdenados = metodosAtivos.sort((a, b) => {
    if (a.ordem !== b.ordem) {
      return a.ordem - b.ordem;
    }
    return a.nome.localeCompare(b.nome);
  });

  return {
    metodosPagamento: metodosOrdenados,
    buscarMetodosPagamento
  };
};
