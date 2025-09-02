import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Eye, 
  Share2, 
  Copy,
  ExternalLink,
  QrCode,
  Settings,
  Globe,
  ShoppingBag,
  Star,
  Heart
} from "lucide-react";

export default function Catalogo() {
  const [termoBusca, setTermoBusca] = useState("");
  const [isPublico, setIsPublico] = useState(true);

  const produtosCatalogo = [
    {
      id: 1,
      nome: "Smartphone Galaxy S24",
      preco: "R$ 2.499,00",
      precoOriginal: "R$ 2.799,00",
      imagem: "/api/placeholder/200/200",
      categoria: "Eletrônicos",
      avaliacao: 4.8,
      avaliacoes: 124,
      emEstoque: true,
      destaque: true,
      descricao: "Smartphone premium com câmera de alta resolução"
    },
    {
      id: 2,
      nome: "Fone Bluetooth Premium",
      preco: "R$ 299,90",
      precoOriginal: null,
      imagem: "/api/placeholder/200/200", 
      categoria: "Acessórios",
      avaliacao: 4.5,
      avaliacoes: 89,
      emEstoque: true,
      destaque: false,
      descricao: "Fone sem fio com cancelamento de ruído"
    },
    {
      id: 3,
      nome: "Tablet Android 11",
      preco: "R$ 1.299,00",
      precoOriginal: "R$ 1.499,00",
      imagem: "/api/placeholder/200/200",
      categoria: "Eletrônicos", 
      avaliacao: 4.7,
      avaliacoes: 67,
      emEstoque: true,
      destaque: true,
      descricao: "Tablet ideal para trabalho e entretenimento"
    },
    {
      id: 4,
      nome: "Carregador USB-C 65W",
      preco: "R$ 89,90",
      precoOriginal: null,
      imagem: "/api/placeholder/200/200",
      categoria: "Acessórios",
      avaliacao: 4.3,
      avaliacoes: 45,
      emEstoque: false,
      destaque: false,
      descricao: "Carregador rápido compatível com diversos dispositivos"
    }
  ];

  const produtosFiltrados = produtosCatalogo.filter(produto =>
    produto.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const urlCatalogo = "https://minha-loja.com.br/catalogo";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Catálogo Online</h1>
          <p className="text-muted-foreground">
            Gerencie e compartilhe seu catálogo público
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
          <Button className="bg-gradient-primary">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Configurações do Catálogo */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Configurações do Catálogo</span>
            <Badge variant={isPublico ? "default" : "secondary"} className={isPublico ? "bg-success" : ""}>
              {isPublico ? "Público" : "Privado"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Status do Catálogo</p>
              <p className="text-sm text-muted-foreground">
                {isPublico ? "Seu catálogo está visível para clientes" : "Catálogo privado, apenas para você"}
              </p>
            </div>
            <Switch
              checked={isPublico}
              onCheckedChange={setIsPublico}
            />
          </div>

          <div className="space-y-2">
            <p className="font-medium">Link Público</p>
            <div className="flex items-center space-x-2">
              <Input value={urlCatalogo} readOnly className="flex-1" />
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Globe className="h-4 w-4" />
                <span>Produtos: {produtosCatalogo.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>Visualizações hoje: 47</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Personalizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos no catálogo..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid de Produtos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {produtosFiltrados.map((produto) => (
          <Card key={produto.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-2">
              <div className="relative">
                <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center mb-3">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
                
                {produto.destaque && (
                  <Badge className="absolute top-2 left-2 bg-warning/80 text-warning-foreground">
                    Destaque
                  </Badge>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-semibold line-clamp-2">{produto.nome}</h3>
                <p className="text-sm text-muted-foreground">{produto.categoria}</p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {produto.descricao}
              </p>

              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3 w-3 ${i < Math.floor(produto.avaliacao) ? 'text-warning fill-warning' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {produto.avaliacao} ({produto.avaliacoes})
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {produto.precoOriginal && (
                      <p className="text-xs text-muted-foreground line-through">
                        {produto.precoOriginal}
                      </p>
                    )}
                    <p className="text-lg font-bold text-primary">{produto.preco}</p>
                  </div>
                  
                  <Badge variant={produto.emEstoque ? "default" : "secondary"} 
                         className={produto.emEstoque ? "bg-success" : ""}>
                    {produto.emEstoque ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={!produto.emEstoque}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {produtosFiltrados.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {termoBusca ? "Tente ajustar sua busca" : "Adicione produtos ao seu catálogo"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}