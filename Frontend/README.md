# 🚀 KontrollaPro - Sistema SaaS Multitenant para Gestão de Lojas


Get-Content "C:\Users\Isaléo Guimarães\OneDrive\Documentos\Projetos\Kontrolla-SaaS-Multtenanti\Backend\src\database\schema.sql" | mysql -u root -p


Sistema completo e profissional para gestão de lojas físicas e online, desenvolvido com React, TypeScript e Tailwind CSS. Oferece controle total sobre produtos, vendas, clientes, financeiro e emissão de NF-e.

## ✨ Funcionalidades Principais

### 📊 **Dashboard Inteligente**
- **Métricas em Tempo Real**: Vendas diárias, pedidos, produtos em estoque e crescimento de clientes
- **Indicadores de Performance**: Comparativos com períodos anteriores (+12.5% vs. ontem)
- **Alertas de Estoque**: Notificações automáticas para produtos com estoque baixo
- **Vendas Recentes**: Histórico das últimas transações com status de pagamento
- **Gráficos Interativos**: Visualizações de tendências e performance

### 🛍️ **Sistema de Vendas Avançado**
- **Venda Rápida**: Interface otimizada para PDV com busca por código de barras
- **Múltiplos Métodos de Pagamento**: PIX, cartões, dinheiro, transferência e boleto
- **Pagamento a Prazo**: Configuração de juros e vencimentos para clientes cadastrados
- **Cálculo Automático de Troco**: Sistema inteligente para pagamentos em dinheiro
- **Carrinho Inteligente**: Controle de quantidade, preços e estoque em tempo real
- **Integração com Clientes**: Seleção automática e histórico de compras

### 📦 **Gestão Completa de Produtos**
- **Cadastro Detalhado**: Nome, descrição, categoria, preços e códigos
- **Controle de Estoque**: Estoque atual, mínimo e alertas automáticos
- **Dimensões e Peso**: Informações para cálculo de frete e logística
- **Múltiplas Imagens**: Galeria de fotos para cada produto
- **Códigos de Barras**: Suporte a códigos EAN, UPC e personalizados
- **Status e Destaques**: Controle de visibilidade e promoções
- **Fornecedores e Marcas**: Organização por origem e fabricante

### 👥 **Gestão de Clientes Profissional**
- **Pessoa Física e Jurídica**: Suporte completo a ambos os tipos
- **Dados Completos**: CPF/CNPJ, endereço, contatos e observações
- **Endereço com CEP**: Busca automática e validação de endereços
- **Configurações Comerciais**: Limite de crédito, prazo de pagamento
- **Sistema VIP**: Benefícios especiais e atendimento prioritário
- **Histórico de Compras**: Rastreamento completo de transações
- **Avaliações**: Sistema de estrelas e feedback dos clientes

### 💰 **Controle Financeiro Avançado**
- **Transações Detalhadas**: Receitas, despesas e categorização automática
- **Contas a Receber**: Controle de vencimentos e status de pagamento
- **Contas a Pagar**: Gestão de fornecedores e obrigações
- **Fluxo de Caixa**: Visão clara de entradas e saídas
- **Múltiplas Contas**: Caixa, bancos, investimentos e poupança
- **Relatórios Financeiros**: DRE, balanço e fluxo de caixa
- **Anexos e Comprovantes**: Sistema de arquivos para documentação

### 🌐 **Catálogo Online Profissional**
- **Visibilidade Controlada**: Público ou privado com configurações
- **QR Code**: Compartilhamento fácil via código QR
- **Link Público**: URL personalizada para compartilhamento
- **Produtos em Destaque**: Controle de produtos promocionais
- **Avaliações e Reviews**: Sistema de feedback dos clientes
- **Estoque em Tempo Real**: Informações atualizadas automaticamente
- **Responsivo**: Interface otimizada para todos os dispositivos

### 🧾 **Sistema NF-e Completo**
- **Emissão Automática**: Integração direta com vendas
- **Configurações Empresariais**: Dados da empresa e certificados
- **Status de Transmissão**: Autorizada, pendente, cancelada ou erro
- **Download de Arquivos**: PDF e XML para cada nota
- **Chaves de Acesso**: Controle completo de numeração
- **Ambiente de Teste**: Produção e homologação
- **Backup Automático**: Sistema de segurança para documentos

### 📈 **Relatórios e Analytics**
- **Vendas por Período**: Análises diárias, semanais e mensais
- **Performance de Produtos**: Mais vendidos e estoque
- **Análise de Clientes**: Comportamento de compra e fidelidade
- **Métricas Financeiras**: Receita, despesas e lucratividade
- **Exportação de Dados**: Múltiplos formatos para análise externa
- **Dashboards Personalizáveis**: Configuração de métricas importantes

## 🛠️ **Tecnologias e Arquitetura**

### **Frontend**
- **React 18.3.1**: Biblioteca moderna para interfaces de usuário
- **TypeScript 5.8.3**: Tipagem estática para código robusto
- **Vite 5.4.19**: Build tool ultra-rápido e dev server
- **React Router 6.30.1**: Roteamento avançado com lazy loading

### **UI/UX**
- **Tailwind CSS 3.4.17**: Framework CSS utilitário e responsivo
- **Radix UI**: Componentes acessíveis e customizáveis
- **Lucide React**: Ícones SVG modernos e consistentes
- **Framer Motion**: Animações suaves e transições

### **Estado e Formulários**
- **TanStack Query 5.83.0**: Gerenciamento de estado do servidor
- **React Hook Form 7.61.1**: Formulários performáticos
- **Zod 3.25.76**: Validação de schemas TypeScript
- **React Hook Form Resolvers**: Integração com Zod

### **Componentes Avançados**
- **Embla Carousel**: Carrosséis responsivos e touch-friendly
- **React Day Picker**: Seletores de data intuitivos
- **React Resizable Panels**: Painéis redimensionáveis
- **Vaul**: Drawers e modais acessíveis

## 🚀 **Instalação e Configuração**

### **Pré-requisitos**
- Node.js 18+ 
- npm, yarn ou bun
- Git para controle de versão

### **Instalação Rápida**
```bash
# Clone o repositório
git clone https://github.com/zaleoz1/Kontrolla-SaaS-multitenant.git

# Entre na pasta do projeto
cd Kontrolla-SaaS-multitenant

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

### **Scripts Disponíveis**
```json
{
  "dev": "vite",                    // Servidor de desenvolvimento
  "build": "vite build",           // Build de produção
  "build:dev": "vite build --mode development", // Build de desenvolvimento
  "preview": "vite preview",       // Preview da build
  "lint": "eslint ."               // Verificação de código
}
```

## 📁 **Estrutura do Projeto**

```
src/
├── components/                    # Componentes reutilizáveis
│   ├── ui/                      # Biblioteca de componentes base
│   │   ├── button.tsx          # Botões com variantes
│   │   ├── card.tsx            # Cards e containers
│   │   ├── input.tsx           # Campos de entrada
│   │   ├── dialog.tsx          # Modais e diálogos
│   │   ├── table.tsx           # Tabelas responsivas
│   │   ├── tabs.tsx            # Sistema de abas
│   │   ├── toast.tsx           # Notificações toast
│   │   └── ...                 # +40 componentes UI
│   ├── layout/                  # Componentes de layout
│   │   ├── AppLayout.tsx       # Layout principal da aplicação
│   │   ├── Header.tsx          # Cabeçalho com busca e ações
│   │   └── Sidebar.tsx         # Navegação lateral responsiva
│   └── dashboard/               # Componentes específicos do dashboard
│       └── MetricsCard.tsx     # Cards de métricas
├── pages/                       # Páginas da aplicação
│   ├── Dashboard.tsx           # Dashboard principal
│   ├── Produtos.tsx            # Lista e gestão de produtos
│   ├── NovoProduto.tsx         # Formulário de cadastro
│   ├── Vendas.tsx              # Histórico de vendas
│   ├── NovaVenda.tsx           # Sistema de vendas
│   ├── Clientes.tsx            # Lista de clientes
│   ├── NovoCliente.tsx         # Cadastro de clientes
│   ├── Financeiro.tsx          # Controle financeiro
│   ├── NovaTransacao.tsx       # Registro de transações
│   ├── Catalogo.tsx            # Catálogo online
│   ├── NFe.tsx                 # Sistema de NF-e
│   ├── Relatorios.tsx          # Relatórios e analytics
│   └── NotFound.tsx            # Página 404
├── hooks/                       # Hooks customizados
│   ├── use-mobile.tsx          # Detecção de dispositivos móveis
│   └── use-toast.ts            # Sistema de notificações
├── lib/                         # Utilitários e configurações
│   └── utils.ts                # Funções utilitárias
├── config/                      # Configurações centralizadas
│   └── routes.ts               # Definição de rotas e navegação
└── main.tsx                    # Ponto de entrada da aplicação
```

## 🎯 **Funcionalidades em Destaque**

### **Interface Responsiva e Moderna**
- **Design System Consistente**: Componentes padronizados e acessíveis
- **Responsividade Total**: Otimizado para desktop, tablet e mobile
- **Tema Escuro/Claro**: Suporte a múltiplos temas
- **Animações Suaves**: Transições e micro-interações
- **Acessibilidade**: Conformidade com WCAG 2.1

### **Sistema de Navegação Inteligente**
- **Sidebar Responsiva**: Navegação lateral que se adapta ao dispositivo
- **Breadcrumbs**: Navegação hierárquica clara
- **Ações Rápidas**: Botões de acesso direto às funcionalidades principais
- **Busca Global**: Pesquisa em produtos, vendas e clientes
- **Histórico de Navegação**: Controle de rotas visitadas

### **Validação e Segurança**
- **Validação em Tempo Real**: Feedback imediato nos formulários
- **Schemas TypeScript**: Validação robusta com Zod
- **Tratamento de Erros**: Sistema de notificações e fallbacks
- **Sanitização de Dados**: Proteção contra injeção e XSS

### **Performance e Otimização**
- **Lazy Loading**: Carregamento sob demanda de componentes
- **Code Splitting**: Divisão inteligente do bundle
- **Memoização**: Otimização de re-renderizações
- **Virtualização**: Listas grandes com scroll virtual
- **Cache Inteligente**: Gerenciamento de estado com TanStack Query

## 🔧 **Configurações e Personalização**

### **Variáveis de Ambiente**
```env
# Configurações da aplicação
VITE_APP_NAME=KontrollaPro
VITE_API_URL=https://api.kontrollapro.com
VITE_ENVIRONMENT=production

# Configurações de desenvolvimento
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

### **Temas e Estilos**
- **Tailwind Config**: Sistema de cores e espaçamentos personalizáveis
- **CSS Variables**: Variáveis CSS para temas dinâmicos
- **Component Variants**: Variantes de componentes com class-variance-authority
- **Responsive Design**: Breakpoints customizáveis para diferentes dispositivos

## 📱 **Compatibilidade e Suporte**

### **Navegadores Suportados**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **Dispositivos**
- **Desktop**: Windows, macOS, Linux
- **Tablet**: iPad, Android tablets
- **Mobile**: iOS 14+, Android 8+

## 🚀 **Deploy e Produção**

### **Build de Produção**
```bash
# Build otimizado
npm run build

# Análise do bundle
npm run build:analyze

# Preview da build
npm run preview
```

### **Deploy em Vercel**
```bash
# Instalação do Vercel CLI
npm i -g vercel

# Deploy automático
vercel --prod
```

### **Deploy em Netlify**
```bash
# Build e deploy
npm run build
netlify deploy --prod --dir=dist
```

## 🤝 **Contribuição e Desenvolvimento**

### **Padrões de Código**
- **ESLint**: Configuração rigorosa para qualidade
- **Prettier**: Formatação automática de código
- **TypeScript**: Tipagem estática obrigatória
- **Conventional Commits**: Padrão de mensagens de commit

### **Estrutura de Commits**
```bash
feat: adiciona sistema de pagamento a prazo
fix: corrige cálculo de troco em vendas
docs: atualiza documentação da API
style: ajusta espaçamento dos componentes
refactor: reorganiza estrutura de pastas
test: adiciona testes para validação de formulários
```

## 📄 **Licença e Suporte**

### **Licença**
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

### **Suporte**
- **Issues**: [GitHub Issues](https://github.com/zaleoz1/Kontrolla-SaaS-multitenant/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/zaleoz1/Kontrolla-SaaS-multitenant/wiki)
- **Discussões**: [GitHub Discussions](https://github.com/zaleoz1/Kontrolla-SaaS-multitenant/discussions)

## 🎉 **Agradecimentos**

- **React Team**: Pela incrível biblioteca
- **Vite Team**: Pela ferramenta de build ultra-rápida
- **Tailwind CSS**: Pelo framework CSS utilitário
- **Radix UI**: Pelos componentes acessíveis
- **Comunidade Open Source**: Por todas as contribuições

---

**Desenvolvido com ❤️ para revolucionar a gestão de lojas**

*KontrollaPro - Transformando a forma como você gerencia seu negócio*