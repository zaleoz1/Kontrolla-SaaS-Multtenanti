import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Filter,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Eye,
  FileText,
  PieChart,
  LineChart
} from "lucide-react";

export default function Relatorios() {
  const relatorios = [
    {
      titulo: "Vendas por Período",
      descricao: "Análise detalhada das vendas por dia, semana ou mês",
      icone: BarChart3,
      tipo: "vendas",
      ultimaGeracao: "2024-01-18",
      cor: "bg-primary/10 text-primary"
    },
    {
      titulo: "Produtos Mais Vendidos",
      descricao: "Ranking dos produtos com melhor performance",
      icone: Package,
      tipo: "produtos",
      ultimaGeracao: "2024-01-18",
      cor: "bg-success/10 text-success"
    },
    {
      titulo: "Análise de Clientes",
      descricao: "Perfil e comportamento dos seus clientes",
      icone: Users,
      tipo: "clientes",
      ultimaGeracao: "2024-01-17",
      cor: "bg-info/10 text-info"
    },
    {
      titulo: "Relatório Financeiro",
      descricao: "Receitas, despesas e fluxo de caixa",
      icone: DollarSign,
      tipo: "financeiro",
      ultimaGeracao: "2024-01-18",
      cor: "bg-warning/10 text-warning"
    },
    {
      titulo: "Controle de Estoque",
      descricao: "Movimentação e níveis de estoque",
      icone: PieChart,
      tipo: "estoque",
      ultimaGeracao: "2024-01-18",
      cor: "bg-accent/10 text-accent"
    },
    {
      titulo: "Performance de Vendas",
      descricao: "Métricas e KPIs de vendas",
      icone: LineChart,
      tipo: "performance",
      ultimaGeracao: "2024-01-18",
      cor: "bg-secondary/10 text-secondary"
    }
  ];

  const metricasRapidas = [
    {
      titulo: "Vendas Hoje",
      valor: "R$ 2.847,50",
      mudanca: "+12.5%",
      tipoMudanca: "positiva" as const,
      icone: DollarSign
    },
    {
      titulo: "Pedidos",
      valor: "23",
      mudanca: "+8",
      tipoMudanca: "positiva" as const,
      icone: ShoppingCart
    },
    {
      titulo: "Produtos Vendidos",
      valor: "89",
      mudanca: "+15%",
      tipoMudanca: "positiva" as const,
      icone: Package
    },
    {
      titulo: "Novos Clientes",
      valor: "7",
      mudanca: "+2",
      tipoMudanca: "positiva" as const,
      icone: Users
    }
  ];

  const relatoriosRecentes = [
    {
      nome: "Relatório de Vendas - Janeiro 2024",
      tipo: "PDF",
      tamanho: "2.4 MB",
      geradoEm: "2024-01-18 14:30",
      downloads: 3
    },
    {
      nome: "Análise de Produtos - Dezembro 2023", 
      tipo: "Excel",
      tamanho: "1.8 MB",
      geradoEm: "2024-01-15 10:15",
      downloads: 8
    },
    {
      nome: "Relatório Financeiro - 4º Trimestre",
      tipo: "PDF", 
      tamanho: "3.1 MB",
      geradoEm: "2024-01-10 16:45",
      downloads: 12
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e insights sobre seu negócio
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Período
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricasRapidas.map((metrica, index) => (
          <Card key={index} className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metrica.titulo}</p>
                  <p className="text-2xl font-bold">{metrica.valor}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {metrica.tipoMudanca === "positiva" ? (
                      <TrendingUp className="h-3 w-3 text-success" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className={`text-xs ${metrica.tipoMudanca === "positiva" ? "text-success" : "text-destructive"}`}>
                      {metrica.mudanca}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <metrica.icone className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Relatórios Disponíveis */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Relatórios Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {relatorios.map((relatorio, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${relatorio.cor}`}>
                        <relatorio.icone className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{relatorio.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{relatorio.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Última atualização: {new Date(relatorio.ultimaGeracao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button size="sm" className="bg-gradient-primary">
                        <Download className="h-4 w-4 mr-2" />
                        Gerar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relatórios Recentes */}
        <div>
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Relatórios Recentes</span>
                <Badge variant="secondary">{relatoriosRecentes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatoriosRecentes.map((relatorio, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm line-clamp-2">{relatorio.nome}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{relatorio.tipo}</span>
                          <span>•</span>
                          <span>{relatorio.tamanho}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {relatorio.geradoEm}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Download className="h-3 w-3" />
                      <span>{relatorio.downloads} downloads</span>
                    </div>
                    {index < relatoriosRecentes.length - 1 && (
                      <div className="border-t border-border/50" />
                    )}
                  </div>
                ))}
              </div>
              
              <Button variant="outline" size="sm" className="w-full mt-4">
                Ver Todos os Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Placeholder de Gráficos - Implementação Futura */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Vendas por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Gráfico de vendas</p>
                <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Produtos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Gráfico de categorias</p>
                <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}