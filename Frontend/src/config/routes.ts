// Configuração centralizada das rotas da aplicação
export const routes = {
  landing: "/",
  dashboard: "/dashboard",
  produtos: "/produtos",
  novoProduto: "/novo-produto",
  vendas: "/vendas",
  novaVenda: "/nova-venda",
  catalogo: "/catalogo",
  clientes: "/clientes",
  novoCliente: "/novo-cliente",
  relatorios: "/relatorios",
  financeiro: "/financeiro",
  novaTransacao: "/nova-transacao",
  nfe: "/nfe",
  configuracoes: "/configuracoes",
  novoFornecedor: "/novo-fornecedor",
  novoFuncionario: "/novo-funcionario",
  login: "/login",
  signup: "/signup",
  esqueciSenha: "/esqueci-senha",
  demo: "/demo",
  download: "/download",
} as const;

// Tipos para as rotas
export type RouteKey = keyof typeof routes;
export type RoutePath = typeof routes[RouteKey];

// Navegação principal do sidebar
export const navigationItems = [
  { name: "Dashboard", href: routes.dashboard, icon: "LayoutDashboard" },
  { name: "Produtos", href: routes.produtos, icon: "Package" },
  { name: "Vendas", href: routes.vendas, icon: "ShoppingCart" },
  { name: "Catálogo", href: routes.catalogo, icon: "Store" },
  { name: "Clientes", href: routes.clientes, icon: "Users" },
  { name: "Relatórios", href: routes.relatorios, icon: "BarChart3" },
  { name: "Financeiro", href: routes.financeiro, icon: "TrendingUp" },
  { name: "NF-e", href: routes.nfe, icon: "Receipt" },
  { name: "Configurações", href: routes.configuracoes, icon: "Settings" },
] as const;

// Botões de ação rápida
export const quickActionItems = [
  { name: "Novo Produto", href: routes.novoProduto, icon: "Package" },
  { name: "Novo Cliente", href: routes.novoCliente, icon: "Users" },
  { name: "Nova Transação", href: routes.novaTransacao, icon: "TrendingUp" },
] as const;

// Botões do header
export const headerActionItems = [
  { name: "Produto", href: routes.novoProduto, icon: "Package" },
  { name: "Cliente", href: routes.novoCliente, icon: "Users" },
  { name: "Transação", href: routes.novaTransacao, icon: "TrendingUp" },
  { name: "Venda", href: routes.novaVenda, icon: "Plus" },
] as const;
