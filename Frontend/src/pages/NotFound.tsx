import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const PaginaNaoEncontrada = () => {
  const localizacao = useLocation();

  useEffect(() => {
    console.error(
      "Erro 404: Usuário tentou acessar uma rota inexistente:",
      localizacao.pathname
    );
  }, [localizacao.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 prevent-zoom touch-optimized mobile-scroll overflow-x-hidden">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Ops! Página não encontrada</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default PaginaNaoEncontrada;
