import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { API_ENDPOINTS } from '@/config/api';
import { Cliente } from './useClientes';

export function useBuscaClientes() {
  const [termoBusca, setTermoBusca] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const { makeRequest } = useApi();

  const buscar = useCallback(async (termo: string) => {
    setCarregando(true);
    if (termo === '') {
      setCarregandoInicial(true);
    }
    
    try {
      const response = await makeRequest(API_ENDPOINTS.CLIENTS.LIST, {
        method: 'GET',
        body: undefined,
      });
      
      // Filtrar clientes localmente se houver termo de busca
      let clientes = response.clientes || [];
      if (termo.trim()) {
        clientes = clientes.filter((cliente: Cliente) => 
          cliente.nome.toLowerCase().includes(termo.toLowerCase()) ||
          cliente.cpf_cnpj?.toLowerCase().includes(termo.toLowerCase()) ||
          cliente.email?.toLowerCase().includes(termo.toLowerCase())
        );
      }
      
      setClientesFiltrados(clientes);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientesFiltrados([]);
    } finally {
      setCarregando(false);
      setCarregandoInicial(false);
    }
  }, [makeRequest]);

  // Debounce da busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscar(termoBusca);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [termoBusca, buscar]);

  // Carregar clientes iniciais quando o componente monta
  useEffect(() => {
    buscar('');
  }, []);

  return {
    termoBusca,
    setTermoBusca,
    termoBuscaCliente: termoBusca,
    setTermoBuscaCliente: setTermoBusca,
    clientesFiltrados,
    carregando: carregando || carregandoInicial,
  };
}
