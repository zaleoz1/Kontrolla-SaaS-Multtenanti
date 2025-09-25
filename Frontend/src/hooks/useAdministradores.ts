import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Administrador {
  id: number;
  nome: string;
  sobrenome: string;
  codigo: string;
  role: 'administrador' | 'gerente' | 'vendedor';
  status: 'ativo' | 'inativo' | 'suspenso';
  permissoes: any;
  ultimo_acesso: string | null;
  data_criacao: string;
  criado_por: number | null;
}

export function useAdministradores() {
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarAdministradores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/configuracoes/administradores');
      setAdministradores(response.data as Administrador[]);
    } catch (err: any) {
      console.error('Erro ao buscar administradores:', err);
      setError(err.response?.data?.error || 'Erro ao carregar administradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarAdministradores();
  }, []);

  return {
    administradores,
    loading,
    error,
    refetch: buscarAdministradores
  };
}
