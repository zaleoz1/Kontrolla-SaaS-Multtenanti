import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "sonner";
import { 
  Save, 
  X, 
  Upload, 
  Package,
  DollarSign,
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Loader2
} from "lucide-react";

interface Produto {
  nome: string;
  descricao: string;
  categoria: string;
  categoria_id?: number;
  preco: number | null;
  preco_promocional?: number | null;
  codigo_barras: string;
  sku: string;
  estoque: number | null;
  estoque_minimo: number | null;
  peso: number | null;
  largura: number | null;
  altura: number | null;
  comprimento: number | null;
  fornecedor: string;
  marca: string;
  modelo: string;
  garantia: string;
  status: "ativo" | "inativo" | "rascunho";
  destaque: boolean;
  imagens: string[];
}

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
}

export default function NovoProduto() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("basico");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [mostrarInputNovaCategoria, setMostrarInputNovaCategoria] = useState(false);
  const { makeRequest, loading, error } = useApi();
  
  const [produto, setProduto] = useState<Produto>({
    nome: "",
    descricao: "",
    categoria: "",
    categoria_id: undefined,
    preco: null,
    preco_promocional: null,
    codigo_barras: "",
    sku: "",
    estoque: null,
    estoque_minimo: null,
    peso: null,
    largura: null,
    altura: null,
    comprimento: null,
    fornecedor: "",
    marca: "",
    modelo: "",
    garantia: "",
    status: "rascunho",
    destaque: false,
    imagens: []
  });



  // Carregar categorias ao montar o componente
  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      const response = await makeRequest(API_ENDPOINTS.CATALOG.CATEGORIES);
      setCategorias(response.categorias || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    }
  };

  const criarNovaCategoria = async () => {
    if (!novaCategoria.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const response = await makeRequest(API_ENDPOINTS.CATALOG.CATEGORIES, {
        method: 'POST',
        body: {
          nome: novaCategoria.trim(),
          descricao: `Categoria: ${novaCategoria.trim()}`
        }
      });

      // Adicionar a nova categoria à lista
      const novaCategoriaObj = {
        id: response.categoria.id,
        nome: response.categoria.nome,
        descricao: response.categoria.descricao
      };
      
      setCategorias(prev => [...prev, novaCategoriaObj]);
      
      // Selecionar a nova categoria automaticamente
      atualizarProduto("categoria_id", novaCategoriaObj.id);
      atualizarProduto("categoria", novaCategoriaObj.nome);
      
      // Limpar e esconder o input
      setNovaCategoria("");
      setMostrarInputNovaCategoria(false);
      
      toast.success('Categoria criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria. Tente novamente.');
    }
  };

  const atualizarProduto = (campo: keyof Produto, valor: any) => {
    setProduto(prev => ({ ...prev, [campo]: valor }));
  };

  const adicionarImagem = (url: string) => {
    setProduto(prev => ({
      ...prev,
      imagens: [...prev.imagens, url]
    }));
  };

  const removerImagem = (index: number) => {
    setProduto(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index)
    }));
  };

  const salvarProduto = async () => {
    try {
      // Validar se o preço é válido
      if (!produto.preco || produto.preco <= 0) {
        toast.error('Preço deve ser maior que zero');
        return;
      }

      // Validar se o nome é válido
      if (!produto.nome || produto.nome.trim().length < 2) {
        toast.error('Nome deve ter pelo menos 2 caracteres');
        return;
      }

      // Preparar dados para envio
      const dadosProduto = {
        nome: produto.nome.trim(),
        descricao: produto.descricao?.trim() || null,
        categoria_id: produto.categoria_id || null,
        codigo_barras: produto.codigo_barras?.trim() || null,
        sku: produto.sku?.trim() || null,
        preco: parseFloat(String(produto.preco)),
        preco_promocional: produto.preco_promocional ? parseFloat(String(produto.preco_promocional)) : null,
        estoque: parseInt(String(produto.estoque)) || 0,
        estoque_minimo: parseInt(String(produto.estoque_minimo)) || 0,
        peso: produto.peso ? parseFloat(String(produto.peso)) : null,
        largura: produto.largura ? parseFloat(String(produto.largura)) : null,
        altura: produto.altura ? parseFloat(String(produto.altura)) : null,
        comprimento: produto.comprimento ? parseFloat(String(produto.comprimento)) : null,
        fornecedor: produto.fornecedor?.trim() || null,
        marca: produto.marca?.trim() || null,
        modelo: produto.modelo?.trim() || null,
        garantia: produto.garantia?.trim() || null,
        status: produto.status || 'ativo',
        destaque: produto.destaque || false,
        imagens: produto.imagens || []
      };

      console.log('📦 Enviando dados do produto:', dadosProduto);

      const response = await makeRequest(API_ENDPOINTS.PRODUCTS.CREATE, {
        method: 'POST',
        body: dadosProduto
      });

      toast.success('Produto criado com sucesso!');
      navigate("/dashboard/produtos");
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto. Tente novamente.');
    }
  };

  const formularioValido = produto.nome && produto.preco && produto.preco > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Novo Produto</h1>
          <p className="text-muted-foreground">
            Adicione um novo produto ao seu catálogo
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/produtos")}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            className="bg-gradient-primary" 
            onClick={salvarProduto}
            disabled={!formularioValido || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Salvando...' : 'Salvar Produto'}
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda - Formulário */}
        <div className="lg:col-span-2">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Básico</span>
              </TabsTrigger>
              <TabsTrigger value="preco" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Preço</span>
              </TabsTrigger>
              <TabsTrigger value="estoque" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Estoque</span>
              </TabsTrigger>
              <TabsTrigger value="avancado" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Avançado</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba Básico */}
            <TabsContent value="basico" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome do Produto *</label>
                    <Input
                      placeholder="Ex: Meu Produto Premium"
                      value={produto.nome}
                      onChange={(e) => atualizarProduto("nome", e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <textarea
                      placeholder="Descreva as características do produto..."
                      value={produto.descricao}
                      onChange={(e) => atualizarProduto("descricao", e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md bg-background min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Categoria</label>
                      <div className="space-y-2">
                        <select
                          value={produto.categoria_id || ""}
                          onChange={(e) => {
                            const categoriaId = e.target.value ? parseInt(e.target.value) : undefined;
                            const categoriaNome = e.target.selectedOptions[0]?.text || "";
                            atualizarProduto("categoria_id", categoriaId);
                            atualizarProduto("categoria", categoriaNome);
                          }}
                          className="w-full p-2 border rounded-md bg-background"
                        >
                          <option value="">Selecione uma categoria</option>
                          {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </option>
                          ))}
                        </select>
                        
                        {!mostrarInputNovaCategoria ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMostrarInputNovaCategoria(true)}
                            className="w-full"
                          >
                            + Nova Categoria
                          </Button>
                        ) : (
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Nome da nova categoria"
                              value={novaCategoria}
                              onChange={(e) => setNovaCategoria(e.target.value)}
                              className="flex-1"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  criarNovaCategoria();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={criarNovaCategoria}
                              disabled={!novaCategoria.trim() || loading}
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMostrarInputNovaCategoria(false);
                                setNovaCategoria("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Marca</label>
                      <Input
                        placeholder="Ex: Samsung, Apple, Xiaomi..."
                        value={produto.marca}
                        onChange={(e) => atualizarProduto("marca", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Modelo</label>
                      <Input
                        placeholder="Ex: Meu Modelo"
                        value={produto.modelo}
                        onChange={(e) => atualizarProduto("modelo", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Fornecedor</label>
                      <Input
                        placeholder="Nome do fornecedor"
                        value={produto.fornecedor}
                        onChange={(e) => atualizarProduto("fornecedor", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Código de Barras</label>
                      <Input
                        placeholder="7891234567890"
                        value={produto.codigo_barras}
                        onChange={(e) => atualizarProduto("codigo_barras", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">SKU</label>
                      <Input
                        placeholder="Código interno do produto"
                        value={produto.sku}
                        onChange={(e) => atualizarProduto("sku", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Preço */}
            <TabsContent value="preco" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Configurações de Preço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Preço de Venda *</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={produto.preco || ""}
                        onChange={(e) => atualizarProduto("preco", e.target.value ? parseFloat(e.target.value) : null)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Preço Promocional</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={produto.preco_promocional || ""}
                        onChange={(e) => atualizarProduto("preco_promocional", e.target.value ? parseFloat(e.target.value) : null)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {produto.preco_promocional && produto.preco_promocional > 0 && produto.preco && produto.preco > 0 && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Economia:</span>
                        <span className="font-medium text-success">
                          {((produto.preco - produto.preco_promocional) / produto.preco * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Valor economizado:</span>
                        <span className="font-medium text-success">
                          R$ {(produto.preco - produto.preco_promocional).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Estoque */}
            <TabsContent value="estoque" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Controle de Estoque</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Quantidade em Estoque</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={produto.estoque || ""}
                        onChange={(e) => atualizarProduto("estoque", e.target.value ? parseInt(e.target.value) : null)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Estoque Mínimo</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={produto.estoque_minimo || ""}
                        onChange={(e) => atualizarProduto("estoque_minimo", e.target.value ? parseInt(e.target.value) : null)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {produto.estoque !== null && produto.estoque_minimo !== null && produto.estoque <= produto.estoque_minimo && produto.estoque_minimo > 0 && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-sm text-warning-foreground">
                        Estoque baixo! Quantidade atual ({produto.estoque}) está no limite mínimo ({produto.estoque_minimo})
                      </span>
                    </div>
                  )}

                  {produto.estoque !== null && produto.estoque === 0 && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive-foreground">
                        Produto sem estoque!
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Avançado */}
            <TabsContent value="avancado" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Peso (kg)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={produto.peso || ""}
                        onChange={(e) => atualizarProduto("peso", e.target.value ? parseFloat(e.target.value) : null)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Garantia</label>
                      <Input
                        placeholder="Ex: 12 meses"
                        value={produto.garantia}
                        onChange={(e) => atualizarProduto("garantia", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Dimensões (cm)</label>
                    <div className="grid gap-2 mt-1 md:grid-cols-3">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Largura"
                        value={produto.largura || ""}
                        onChange={(e) => atualizarProduto("largura", e.target.value ? parseFloat(e.target.value) : null)}
                      />
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Altura"
                        value={produto.altura || ""}
                        onChange={(e) => atualizarProduto("altura", e.target.value ? parseFloat(e.target.value) : null)}
                      />
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Comprimento"
                        value={produto.comprimento || ""}
                        onChange={(e) => atualizarProduto("comprimento", e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={produto.status}
                        onChange={(e) => atualizarProduto("status", e.target.value as Produto["status"])}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                      >
                        <option value="rascunho">Rascunho</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2 mt-6">
                      <input
                        type="checkbox"
                        id="destaque"
                        checked={produto.destaque}
                        onChange={(e) => atualizarProduto("destaque", e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="destaque" className="text-sm font-medium">
                        Produto em Destaque
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Coluna Direita - Preview e Imagens */}
        <div className="space-y-4">
          {/* Preview do Produto */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Preview do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {produto.nome ? (
                <div className="space-y-3">
                  <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center">
                    {produto.imagens.length > 0 ? (
                      <img 
                        src={produto.imagens[0]} 
                        alt={produto.nome}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold">{produto.nome}</h3>
                    {produto.categoria && (
                      <Badge variant="outline" className="mt-1">
                        {produto.categoria}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    {produto.preco_promocional && produto.preco_promocional > 0 ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-primary">
                          R$ {produto.preco_promocional.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {produto.preco?.toFixed(2) || "0,00"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        R$ {produto.preco?.toFixed(2) || "0,00"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Estoque: {produto.estoque || 0} un.</span>
                    <span>SKU: {produto.sku || "N/A"}</span>
                  </div>

                  {produto.destaque && (
                    <Badge className="bg-warning/80 text-warning-foreground">
                      Destaque
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p>Preencha as informações básicas para ver o preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload de Imagens */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Imagens do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 grid-cols-2">
                {produto.imagens.map((imagem, index) => (
                  <div key={index} className="relative aspect-square">
                    <img 
                      src={imagem} 
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removerImagem(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <Button variant="outline" size="sm">
                  Selecionar Imagens
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validação do Formulário */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Status do Formulário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                {produto.nome ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Nome do produto</span>
              </div>

              <div className="flex items-center space-x-2">
                {produto.categoria_id ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Categoria (opcional)</span>
              </div>

              <div className="flex items-center space-x-2">
                {produto.preco && produto.preco > 0 ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Preço de venda</span>
              </div>

              <div className="flex items-center space-x-2">
                {produto.estoque !== null && produto.estoque >= 0 ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Quantidade em estoque</span>
              </div>

              {formularioValido && (
                <div className="pt-2 border-t">
                  <div className="flex items-center space-x-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Formulário válido</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
 