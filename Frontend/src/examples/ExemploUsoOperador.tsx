import React from 'react';
import { useOperador } from '@/contexts/OperadorContext';
import { useAdministradores } from '@/hooks/useAdministradores';

/**
 * Exemplo de como usar o operador selecionado em uma venda
 */
export function ExemploUsoOperador() {
  const { operadorSelecionado } = useOperador();
  const { administradores } = useAdministradores();

  // Encontrar dados do operador selecionado
  const operadorAtual = administradores.find(adm => adm.id === operadorSelecionado);

  const criarVenda = () => {
    if (!operadorSelecionado) {
      alert('Por favor, selecione um operador antes de criar a venda');
      return;
    }

    const dadosVenda = {
      // ... outros dados da venda
      operador_id: operadorSelecionado,
      operador_nome: operadorAtual?.nome,
      operador_cargo: operadorAtual?.role,
      data_criacao: new Date().toISOString(),
    };

    // Aqui você enviaria os dados para a API
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Exemplo de Uso do Operador</h2>
      
      {operadorSelecionado ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-green-800">Operador Selecionado:</h3>
          <p className="text-green-700">
            {operadorAtual?.nome} {operadorAtual?.sobrenome} 
            <span className="text-sm text-green-600 ml-2">
              ({operadorAtual?.role})
            </span>
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-700">
            Nenhum operador selecionado. Selecione um operador no header.
          </p>
        </div>
      )}

      <button
        onClick={criarVenda}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={!operadorSelecionado}
      >
        Criar Venda
      </button>
    </div>
  );
}

/**
 * Hook personalizado para facilitar o uso do operador
 */
export function useOperadorAtual() {
  const { operadorSelecionado } = useOperador();
  const { administradores } = useAdministradores();

  const operadorAtual = administradores.find(adm => adm.id === operadorSelecionado);
  
  return {
    operadorSelecionado,
    operadorAtual,
    temOperador: !!operadorSelecionado,
    nomeCompleto: operadorAtual ? `${operadorAtual.nome} ${operadorAtual.sobrenome}` : null,
    cargo: operadorAtual?.role || null,
  };
}
