# Implementação do Modal de Parcelas para Cartão de Crédito

## Resumo da Funcionalidade

Foi implementado um modal automático e responsivo que aparece quando o usuário seleciona "Cartão de Crédito" como método de pagamento, permitindo escolher o número de parcelas disponíveis configuradas na tabela `metodos_pagamento_parcelas`. O modal foi otimizado com melhor UX, scroll para muitas opções e feedback visual aprimorado.

## Arquivos Modificados

### Frontend
- `Frontend/src/pages/Pagamentos.tsx` - Implementação principal do modal

### Backend
- `Backend/src/database/seed.js` - Adicionados dados de exemplo de métodos de pagamento e parcelas

## Funcionalidades Implementadas

### 1. Modal de Seleção de Parcelas
- **Trigger**: Abre automaticamente quando "Cartão de Crédito" é selecionado
- **Interface**: Lista todas as parcelas disponíveis com:
  - Número de parcelas
  - Valor por parcela
  - Taxa de juros (se aplicável)
  - Valor total com juros
- **Seleção**: Radio buttons para escolher a parcela desejada

### 2. Estados Adicionados
```typescript
interface MetodoPagamentoSelecionado {
  metodo: string;
  valor: string;
  parcelas?: number;        // Novo
  taxaParcela?: number;     // Novo
}

interface ParcelaDisponivel {
  id: number;
  quantidade: number;
  taxa: number;
  ativo: boolean;
}
```

### 3. Estados de Controle
- `mostrarModalParcelas`: Controla visibilidade do modal
- `parcelasDisponiveis`: Lista de parcelas do método selecionado
- `metodoSelecionadoParaParcelas`: Método que está sendo configurado
- `parcelaSelecionada`: Parcela escolhida pelo usuário

### 4. Funções Implementadas

#### `handleSelecionarMetodoPagamento(metodo: string)`
- Verifica se o método é "cartao_credito"
- Busca parcelas disponíveis na configuração
- Abre modal se houver parcelas configuradas
- Para outros métodos, define diretamente

#### `handleConfirmarParcela()`
- Aplica a parcela selecionada ao método de pagamento
- Suporta tanto método único quanto múltiplos métodos
- Fecha o modal após confirmação

#### `handleCancelarParcela()`
- Cancela a seleção de parcela
- Limpa estados relacionados
- Fecha o modal

### 5. Interface Visual Aprimorada

#### Modal de Parcelas (Versão 2.0)
- **Layout Responsivo**: Modal com largura máxima de 2xl e altura máxima de 90vh
- **Header Informativos**: 
  - Título com ícone maior e mais visível
  - Valor total destacado em verde
  - Indicação da parcela selecionada em tempo real
- **Lista de Parcelas com Scroll**: 
  - Área scrollável para muitas opções
  - Cards redesenhados com melhor hierarquia visual
  - Radio buttons customizados (círculos coloridos)
  - Informações organizadas em duas colunas
  - Destaque para "Sem juros" vs "Com juros"
  - Valores calculados em tempo real
- **Estado Vazio**: Mensagem amigável quando não há parcelas configuradas
- **Botões Aprimorados**: Maior altura e melhor contraste

#### Indicação Visual Aprimorada
- **Card de Parcelas Redesenhado**: 
  - Gradiente azul para destaque visual
  - Ícone em círculo colorido
  - Layout em duas colunas com informações organizadas
  - Valores destacados com cores apropriadas
  - Botão "Alterar" para mudar a parcela
- **Resumo de Pagamentos Melhorado**:
  - Cards individuais para cada método
  - Badges coloridos para parcelas e taxas
  - Total destacado em verde
  - Ícone de calculadora no título

### 6. Suporte a Múltiplos Métodos
- Funciona tanto para método único quanto múltiplos métodos
- Identifica o método específico usando índice
- Atualiza o método correto na lista
- Ordenação automática das parcelas por quantidade

### 7. Melhorias de Performance e UX
- **Ordenação Inteligente**: Parcelas ordenadas por quantidade (1x, 2x, 3x...)
- **Cálculos Otimizados**: Valores calculados uma única vez por renderização
- **Feedback Visual**: Estados de hover, seleção e loading bem definidos
- **Responsividade**: Funciona bem em diferentes tamanhos de tela
- **Acessibilidade**: Radio buttons customizados mantêm funcionalidade nativa

### 8. Dados de Exemplo (Seed)
Adicionados no `seed.js`:
- 5 métodos de pagamento básicos
- 8 opções de parcelas para cartão de crédito:
  - 1x sem juros
  - 2x sem juros  
  - 3x com 2.5% de juros
  - 4x com 3.0% de juros
  - 5x com 3.5% de juros
  - 6x com 4.0% de juros
  - 10x com 5.0% de juros
  - 12x com 6.0% de juros

## Fluxo de Uso

1. **Seleção do Método**: Usuário escolhe "Cartão de Crédito"
2. **Abertura do Modal**: Sistema verifica se há parcelas configuradas
3. **Escolha da Parcela**: Usuário seleciona número de parcelas desejado
4. **Confirmação**: Sistema aplica a parcela ao método de pagamento
5. **Indicação Visual**: Card mostra informações da parcela selecionada
6. **Finalização**: Parcela é incluída no resumo da venda

## Integração com Backend

A funcionalidade utiliza a API existente `/configuracoes/metodos-pagamento` que já retorna as parcelas configuradas para cada método de pagamento através do JOIN com a tabela `metodos_pagamento_parcelas`.

## Validações

- Verifica se há parcelas disponíveis antes de abrir o modal
- Valida seleção obrigatória de parcela
- Suporta cancelamento da operação
- Mantém consistência entre método único e múltiplos métodos
