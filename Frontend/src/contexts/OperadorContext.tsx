import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OperadorContextType {
  operadorSelecionado: number | null;
  setOperadorSelecionado: (id: number | null) => void;
  limparOperador: () => void;
  operadorAtual: any | null;
  setOperadorAtual: (operador: any | null) => void;
}

const OperadorContext = createContext<OperadorContextType | undefined>(undefined);

interface OperadorProviderProps {
  children: ReactNode;
}

const OPERADOR_STORAGE_KEY = 'kontrolla_operador_selecionado';

export function OperadorProvider({ children }: OperadorProviderProps) {
  const [operadorSelecionado, setOperadorSelecionado] = useState<number | null>(null);
  const [operadorAtual, setOperadorAtual] = useState<any | null>(null);

  // Carregar operador do localStorage na inicialização
  useEffect(() => {
    const operadorSalvo = localStorage.getItem(OPERADOR_STORAGE_KEY);
    if (operadorSalvo) {
      try {
        const operadorId = parseInt(operadorSalvo, 10);
        if (!isNaN(operadorId)) {
          setOperadorSelecionado(operadorId);
        }
      } catch (error) {
        console.error('Erro ao carregar operador do localStorage:', error);
        localStorage.removeItem(OPERADOR_STORAGE_KEY);
      }
    }
  }, []);

  // Função para atualizar o operador e salvar no localStorage
  const atualizarOperador = (id: number | null) => {
    setOperadorSelecionado(id);
    if (id !== null) {
      localStorage.setItem(OPERADOR_STORAGE_KEY, id.toString());
    } else {
      localStorage.removeItem(OPERADOR_STORAGE_KEY);
      setOperadorAtual(null);
    }
  };

  // Função para limpar o operador (usado no logout)
  const limparOperador = () => {
    setOperadorSelecionado(null);
    setOperadorAtual(null);
    localStorage.removeItem(OPERADOR_STORAGE_KEY);
  };

  return (
    <OperadorContext.Provider value={{ 
      operadorSelecionado, 
      setOperadorSelecionado: atualizarOperador, 
      limparOperador,
      operadorAtual,
      setOperadorAtual
    }}>
      {children}
    </OperadorContext.Provider>
  );
}

export function useOperador() {
  const context = useContext(OperadorContext);
  if (context === undefined) {
    throw new Error('useOperador deve ser usado dentro de um OperadorProvider');
  }
  return context;
}
