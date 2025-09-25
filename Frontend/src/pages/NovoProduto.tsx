import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Eye
} from "lucide-react";

interface Produto {
  nome: string;
  descricao: string;
  categoria: string;
  categoria_id?: number;
  preco: number | null;
  preco_promocional?: number | null;
  tipo_preco: "unidade" | "kg" | "litros";
  codigo_barras: string;
  sku: string;
  estoque: number | null;
  estoque_minimo: number | null;
  fornecedor_id?: number;
  marca: string;
  modelo: string;
  status: "ativo" | "inativo" | "rascunho";
  destaque: boolean;
  imagens: string[];
}

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
}

interface Fornecedor {
  id: number;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  status: string;
}

export default function NovoProduto() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [abaAtiva, setAbaAtiva] = useState("basico");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [mostrarInputNovaCategoria, setMostrarInputNovaCategoria] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [carregandoProduto, setCarregandoProduto] = useState(false);
  const { makeRequest, loading, error } = useApi();
  
  // Determinar se é modo de edição
  const isEditMode = Boolean(id);
  
  const [produto, setProduto] = useState<Produto>({
    nome: "",
    descricao: "",
    categoria: "",
    categoria_id: undefined,
    preco: null,
    preco_promocional: null,
    tipo_preco: "unidade",
    codigo_barras: "",
    sku: "",
    estoque: null,
    estoque_minimo: null,
    fornecedor_id: undefined,
    marca: "",
    modelo: "",
    status: "ativo",
    destaque: false,
    imagens: []
  });

  const [errosValidacao, setErrosValidacao] = useState<Record<string, boolean>>({});



  // Carregar categorias, fornecedores e produto (se editando) ao montar o componente
  useEffect(() => {
    carregarCategorias();
    carregarFornecedores();
    if (isEditMode && id) {
      carregarProduto(parseInt(id));
    }
  }, [isEditMode, id]);

  const carregarCategorias = async () => {
    try {
      const response = await makeRequest(API_ENDPOINTS.CATALOG.CATEGORIES);
      setCategorias(response.categorias || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    }
  };

  const carregarFornecedores = async () => {
    try {
      const response = await makeRequest(API_ENDPOINTS.FORNECEDORES.LIST);
      setFornecedores(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    }
  };

  const carregarProduto = async (produtoId: number) => {
    try {
      setCarregandoProduto(true);
      const response = await makeRequest(API_ENDPOINTS.PRODUCTS.GET(produtoId));
      const produtoData = response.produto;
      
      // Converter imagens de string JSON para array se necessário
      let imagens = [];
      if (produtoData.imagens) {
        try {
          imagens = typeof produtoData.imagens === 'string' 
            ? JSON.parse(produtoData.imagens) 
            : produtoData.imagens;
        } catch (e) {
          console.warn('Erro ao parsear imagens:', e);
          imagens = [];
        }
      }

      // Mapear dados do produto para o estado
      setProduto({
        nome: produtoData.nome || "",
        descricao: produtoData.descricao || "",
        categoria: produtoData.categoria_nome || "",
        categoria_id: produtoData.categoria_id || undefined,
        preco: produtoData.preco || null,
        preco_promocional: produtoData.preco_promocional || null,
        tipo_preco: produtoData.tipo_preco || "unidade",
        codigo_barras: produtoData.codigo_barras || "",
        sku: produtoData.sku || "",
        estoque: produtoData.estoque || null,
        estoque_minimo: produtoData.estoque_minimo || null,
        fornecedor_id: produtoData.fornecedor_id || undefined,
        marca: produtoData.marca || "",
        modelo: produtoData.modelo || "",
        status: produtoData.status || "ativo",
        destaque: produtoData.destaque || false,
        imagens: imagens
      });
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error('Erro ao carregar produto para edição');
      navigate("/dashboard/produtos");
    } finally {
      setCarregandoProduto(false);
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

  const gerarCodigoBarras = () => {
    // Gerar código de barras EAN-13 (13 dígitos)
    // Primeiros 3 dígitos: código do país (789 = Brasil)
    const pais = '789';
    
    // Próximos 4 dígitos: código da empresa (simulado)
    const empresa = Math.floor(Math.random() * 9000 + 1000).toString();
    
    // Próximos 5 dígitos: código do produto
    const produto = Math.floor(Math.random() * 90000 + 10000).toString();
    
    // Código sem dígito verificador
    const codigoSemVerificador = pais + empresa + produto;
    
    // Calcular dígito verificador EAN-13
    let soma = 0;
    for (let i = 0; i < 12; i++) {
      const digito = parseInt(codigoSemVerificador[i]);
      soma += (i % 2 === 0) ? digito : digito * 3;
    }
    const digitoVerificador = ((10 - (soma % 10)) % 10).toString();
    
    const codigoCompleto = codigoSemVerificador + digitoVerificador;
    atualizarProduto("codigo_barras", codigoCompleto);
    toast.success('Código de barras gerado com sucesso!');
  };

  const gerarSKU = () => {
    // Gerar SKU baseado no nome do produto e categoria
    const nome = produto.nome.trim().toUpperCase();
    const categoria = produto.categoria || 'GEN';
    
    // Pegar primeiras 3 letras do nome
    const prefixoNome = nome.substring(0, 3).replace(/[^A-Z]/g, 'X');
    
    // Pegar primeiras 3 letras da categoria
    const prefixoCategoria = categoria.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    
    // Gerar número sequencial de 4 dígitos
    const numero = Math.floor(Math.random() * 9000 + 1000);
    
    // Gerar letra final
    const letraFinal = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    
    const sku = `${prefixoCategoria}-${prefixoNome}-${numero}${letraFinal}`;
    atualizarProduto("sku", sku);
    toast.success('SKU gerado com sucesso!');
  };

  const validarCamposObrigatorios = () => {
    const erros: Record<string, boolean> = {};
    
    // Nome do Produto
    if (!produto.nome || produto.nome.trim().length < 2) {
      erros.nome = true;
    }
    
    // Categoria
    if (!produto.categoria_id) {
      erros.categoria = true;
    }
    
    // Fornecedor - permitir null (nenhum fornecedor)
    // Não validar pois null é um valor válido
    
    // Código de Barras
    if (!produto.codigo_barras || produto.codigo_barras.trim().length === 0) {
      erros.codigo_barras = true;
    }
    
    // SKU
    if (!produto.sku || produto.sku.trim().length === 0) {
      erros.sku = true;
    }
    
    // Tipo de Preço (sempre tem valor padrão, mas vamos validar)
    if (!produto.tipo_preco) {
      erros.tipo_preco = true;
    }
    
    // Preço de Venda
    if (!produto.preco || produto.preco <= 0) {
      erros.preco = true;
    }
    
    // Quantidade em Estoque
    if (produto.estoque === null || produto.estoque < 0) {
      erros.estoque = true;
    }
    
    // Estoque Mínimo
    if (produto.estoque_minimo === null || produto.estoque_minimo < 0) {
      erros.estoque_minimo = true;
    }
    
    setErrosValidacao(erros);
    return Object.keys(erros).length === 0;
  };

  const redimensionarImagem = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Configurar canvas
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Converter para base64
        const dataURL = canvas.toDataURL('image/jpeg', quality);
        resolve(dataURL);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 5;
    const remainingSlots = maxImages - produto.imagens.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (filesToProcess.length < files.length) {
      toast.warning(`Máximo de ${maxImages} imagens permitidas. Apenas as primeiras ${filesToProcess.length} serão processadas.`);
    }

    try {
      const promises = filesToProcess.map(file => {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          throw new Error(`Arquivo ${file.name} não é uma imagem válida`);
        }
        
        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Arquivo ${file.name} é muito grande. Máximo 5MB`);
        }
        
        return redimensionarImagem(file);
      });

      const resizedImages = await Promise.all(promises);
      
      setProduto(prev => ({
        ...prev,
        imagens: [...prev.imagens, ...resizedImages]
      }));

      toast.success(`${resizedImages.length} imagem(ns) adicionada(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar imagens');
    }

    // Limpar input
    event.target.value = '';
  };

  const adicionarImagem = (url: string) => {
    if (produto.imagens.length >= 5) {
      toast.warning('Máximo de 5 imagens permitidas');
      return;
    }
    
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Processar arquivos diretamente
    const maxImages = 5;
    const remainingSlots = maxImages - produto.imagens.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (filesToProcess.length < files.length) {
      toast.warning(`Máximo de ${maxImages} imagens permitidas. Apenas as primeiras ${filesToProcess.length} serão processadas.`);
    }

    try {
      const promises = filesToProcess.map(file => {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          throw new Error(`Arquivo ${file.name} não é uma imagem válida`);
        }
        
        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Arquivo ${file.name} é muito grande. Máximo 5MB`);
        }
        
        return redimensionarImagem(file);
      });

      Promise.all(promises).then(resizedImages => {
        setProduto(prev => ({
          ...prev,
          imagens: [...prev.imagens, ...resizedImages]
        }));

        toast.success(`${resizedImages.length} imagem(ns) adicionada(s) com sucesso!`);
      }).catch(error => {
        console.error('Erro ao processar imagens:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao processar imagens');
      });
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar imagens');
    }
  };

  const salvarProduto = async () => {
    try {
      // Validar campos obrigatórios
      if (!validarCamposObrigatorios()) {
        toast.error('Preencha todos os campos obrigatórios');
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
        tipo_preco: produto.tipo_preco || 'unidade',
        estoque: parseInt(String(produto.estoque)) || 0,
        estoque_minimo: parseInt(String(produto.estoque_minimo)) || 0,
        fornecedor_id: produto.fornecedor_id || null,
        marca: produto.marca?.trim() || null,
        modelo: produto.modelo?.trim() || null,
        status: produto.status || 'ativo',
        destaque: produto.destaque || false,
        imagens: produto.imagens || []
      };

      console.log('📦 Enviando dados do produto:', dadosProduto);

      let response;
      if (isEditMode && id) {
        // Modo de edição - fazer PUT
        response = await makeRequest(API_ENDPOINTS.PRODUCTS.UPDATE(parseInt(id)), {
          method: 'PUT',
          body: dadosProduto
        });
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Modo de criação - fazer POST
        response = await makeRequest(API_ENDPOINTS.PRODUCTS.CREATE, {
          method: 'POST',
          body: dadosProduto
        });
        toast.success('Produto criado com sucesso!');
      }

      navigate("/dashboard/produtos");
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error(`Erro ao ${isEditMode ? 'atualizar' : 'criar'} produto. Tente novamente.`);
    }
  };

  const formularioValido = useMemo(() => {
    // Nome do Produto
    if (!produto.nome || produto.nome.trim().length < 2) return false;
    
    // Categoria
    if (!produto.categoria_id) return false;
    
    // Fornecedor - permitir null (nenhum fornecedor)
    // Não precisa validar pois null é um valor válido
    
    // Código de Barras
    if (!produto.codigo_barras || produto.codigo_barras.trim().length === 0) return false;
    
    // SKU
    if (!produto.sku || produto.sku.trim().length === 0) return false;
    
    // Tipo de Preço
    if (!produto.tipo_preco) return false;
    
    // Preço de Venda
    if (!produto.preco || produto.preco <= 0) return false;
    
    // Quantidade em Estoque
    if (produto.estoque === null || produto.estoque < 0) return false;
    
    // Estoque Mínimo
    if (produto.estoque_minimo === null || produto.estoque_minimo < 0) return false;
    
    return true;
  }, [produto.nome, produto.categoria_id, produto.fornecedor_id, produto.codigo_barras, produto.sku, produto.tipo_preco, produto.preco, produto.estoque, produto.estoque_minimo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode 
              ? 'Edite as informações do produto' 
              : 'Adicione um novo produto ao seu catálogo'
            }
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
            disabled={!formularioValido || loading || carregandoProduto}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading 
              ? (isEditMode ? 'Atualizando...' : 'Salvando...') 
              : (isEditMode ? 'Atualizar Produto' : 'Salvar Produto')
            }
          </Button>
        </div>
      </div>

      {/* Loading State para Edição */}
      {carregandoProduto && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando produto para edição...</p>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      {!carregandoProduto && (
        <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda - Formulário */}
        <div className="lg:col-span-2">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
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
                      onChange={(e) => {
                        atualizarProduto("nome", e.target.value);
                        // Limpar erro quando o usuário começar a digitar
                        if (errosValidacao.nome) {
                          setErrosValidacao(prev => ({ ...prev, nome: false }));
                        }
                      }}
                      className={`mt-1 ${errosValidacao.nome ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errosValidacao.nome && (
                      <p className="text-xs text-red-500 mt-1">Nome do produto é obrigatório</p>
                    )}
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
                      <label className="text-sm font-medium">Categoria *</label>
                      <div className="space-y-2">
                        <select
                          value={produto.categoria_id || ""}
                          onChange={(e) => {
                            const categoriaId = e.target.value ? parseInt(e.target.value) : undefined;
                            const categoriaNome = e.target.selectedOptions[0]?.text || "";
                            atualizarProduto("categoria_id", categoriaId);
                            atualizarProduto("categoria", categoriaNome);
                            // Limpar erro quando o usuário selecionar uma categoria
                            if (errosValidacao.categoria) {
                              setErrosValidacao(prev => ({ ...prev, categoria: false }));
                            }
                          }}
                          className={`w-full p-2 border rounded-md bg-background ${errosValidacao.categoria ? 'border-red-500 focus:border-red-500' : ''}`}
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
                        {errosValidacao.categoria && (
                          <p className="text-xs text-red-500">Categoria é obrigatória</p>
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
                      <select
                        value={produto.fornecedor_id === null ? "0" : (produto.fornecedor_id || "")}
                        onChange={(e) => {
                          const fornecedorId = e.target.value ? parseInt(e.target.value) : undefined;
                          // Se for "0" (Sem fornecedor), enviar null para o backend
                          atualizarProduto("fornecedor_id", fornecedorId === 0 ? null : fornecedorId);
                        }}
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                      >
                        <option value="">Selecione um fornecedor</option>
                        <option value="0">Nenhum fornecedor</option>
                        {fornecedores.map((fornecedor) => (
                          <option key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome} {fornecedor.razao_social && `(${fornecedor.razao_social})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Código de Barras *</label>
                      <div className="flex space-x-2 mt-1">
                      <Input
                        placeholder="7891234567890"
                        value={produto.codigo_barras}
                          onChange={(e) => {
                            atualizarProduto("codigo_barras", e.target.value);
                            // Limpar erro quando o usuário começar a digitar
                            if (errosValidacao.codigo_barras) {
                              setErrosValidacao(prev => ({ ...prev, codigo_barras: false }));
                            }
                          }}
                          className={`flex-1 ${errosValidacao.codigo_barras ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={gerarCodigoBarras}
                          disabled={!produto.nome.trim()}
                          title="Gerar código de barras EAN-13"
                        >
                          Gerar
                        </Button>
                      </div>
                      {errosValidacao.codigo_barras ? (
                        <p className="text-xs text-red-500 mt-1">Código de barras é obrigatório</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {!produto.nome.trim() ? "Digite o nome do produto para gerar código" : "Código EAN-13 válido para o Brasil"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium">SKU *</label>
                      <div className="flex space-x-2 mt-1">
                      <Input
                        placeholder="Código interno do produto"
                        value={produto.sku}
                          onChange={(e) => {
                            atualizarProduto("sku", e.target.value);
                            // Limpar erro quando o usuário começar a digitar
                            if (errosValidacao.sku) {
                              setErrosValidacao(prev => ({ ...prev, sku: false }));
                            }
                          }}
                          className={`flex-1 ${errosValidacao.sku ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={gerarSKU}
                          disabled={!produto.nome.trim()}
                          title="Gerar SKU baseado no nome e categoria"
                        >
                          Gerar
                        </Button>
                      </div>
                      {errosValidacao.sku ? (
                        <p className="text-xs text-red-500 mt-1">SKU é obrigatório</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {!produto.nome.trim() ? "Digite o nome do produto para gerar SKU" : "Formato: CAT-NOM-1234A"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Status */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Status do Produto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Rascunho: produto não visível no catálogo | Ativo: produto visível | Inativo: produto oculto
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
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

            {/* Aba Preço */}
            <TabsContent value="preco" className="space-y-4">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Configurações de Preço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tipo de Preço */}
                  <div>
                    <label className="text-sm font-medium">Tipo de Preço *</label>
                    <select
                      value={produto.tipo_preco}
                      onChange={(e) => {
                        atualizarProduto("tipo_preco", e.target.value as "unidade" | "kg" | "litros");
                        // Limpar erro quando o usuário selecionar um tipo
                        if (errosValidacao.tipo_preco) {
                          setErrosValidacao(prev => ({ ...prev, tipo_preco: false }));
                        }
                      }}
                      className={`w-full mt-1 p-2 border rounded-md bg-background ${errosValidacao.tipo_preco ? 'border-red-500 focus:border-red-500' : ''}`}
                    >
                      <option value="unidade">Por Unidade</option>
                      <option value="kg">Por Quilograma (KG)</option>
                      <option value="litros">Por Litros</option>
                    </select>
                    {errosValidacao.tipo_preco ? (
                      <p className="text-xs text-red-500 mt-1">Tipo de preço é obrigatório</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        {produto.tipo_preco === "unidade" && "Preço por unidade do produto"}
                        {produto.tipo_preco === "kg" && "Preço por quilograma (útil para produtos vendidos por peso)"}
                        {produto.tipo_preco === "litros" && "Preço por litro (útil para líquidos vendidos por volume)"}
                      </p>
                    )}
                  </div>

                  {/* Preços baseados no tipo selecionado */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">
                        Preço de Venda * 
                        {produto.tipo_preco === "unidade" && " (por unidade)"}
                        {produto.tipo_preco === "kg" && " (por KG)"}
                        {produto.tipo_preco === "litros" && " (por litro)"}
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={produto.preco || ""}
                        onChange={(e) => {
                          atualizarProduto("preco", e.target.value ? parseFloat(e.target.value) : null);
                          // Limpar erro quando o usuário começar a digitar
                          if (errosValidacao.preco) {
                            setErrosValidacao(prev => ({ ...prev, preco: false }));
                          }
                        }}
                        className={`mt-1 ${errosValidacao.preco ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {errosValidacao.preco && (
                        <p className="text-xs text-red-500 mt-1">Preço de venda é obrigatório</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Preço Promocional
                        {produto.tipo_preco === "unidade" && " (por unidade)"}
                        {produto.tipo_preco === "kg" && " (por KG)"}
                        {produto.tipo_preco === "litros" && " (por litro)"}
                      </label>
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


                  {/* Cálculo de economia */}
                  {produto.preco_promocional && produto.preco_promocional > 0 && produto.preco && produto.preco > 0 && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Economia:</span>
                        <span className="font-medium text-success">
                          {(((Number(produto.preco) - Number(produto.preco_promocional)) / Number(produto.preco) * 100)).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Valor economizado:</span>
                        <span className="font-medium text-success">
                          R$ {(Number(produto.preco) - Number(produto.preco_promocional)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Informações adicionais baseadas no tipo */}
                  {produto.tipo_preco === "kg" && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-start space-x-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">Preço por KG</p>
                          <p className="text-blue-700">
                            Este produto será vendido por peso. O preço será calculado automaticamente 
                            baseado no peso do produto e no preço por KG definido.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {produto.tipo_preco === "litros" && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-start space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="text-sm">
                          <p className="font-medium text-green-900">Preço por Litros</p>
                          <p className="text-green-700">
                            Este produto será vendido por volume. O preço será calculado automaticamente 
                            baseado no volume do produto e no preço por litro definido.
                          </p>
                        </div>
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
                  {/* Informação sobre o tipo de estoque */}
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium">
                        {produto.tipo_preco === "unidade" && "Estoque por Unidades"}
                        {produto.tipo_preco === "kg" && "Estoque por Peso (KG)"}
                        {produto.tipo_preco === "litros" && "Estoque por Volume (Litros)"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {produto.tipo_preco === "unidade" && "Controle a quantidade de unidades disponíveis"}
                      {produto.tipo_preco === "kg" && "Controle o peso total disponível em quilogramas"}
                      {produto.tipo_preco === "litros" && "Controle o volume total disponível em litros"}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">
                        {produto.tipo_preco === "unidade" && "Quantidade em Estoque"}
                        {produto.tipo_preco === "kg" && "Peso Total Disponível (KG)"}
                        {produto.tipo_preco === "litros" && "Volume Total Disponível (L)"}
                      </label>
                      <Input
                        type="number"
                        step={produto.tipo_preco === "unidade" ? "1" : "0.01"}
                        min="0"
                        placeholder={produto.tipo_preco === "unidade" ? "0" : "0,00"}
                        value={produto.estoque || ""}
                        onChange={(e) => {
                          atualizarProduto("estoque", e.target.value ? parseFloat(e.target.value) : null);
                          // Limpar erro quando o usuário começar a digitar
                          if (errosValidacao.estoque) {
                            setErrosValidacao(prev => ({ ...prev, estoque: false }));
                          }
                        }}
                        className={`mt-1 ${errosValidacao.estoque ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {errosValidacao.estoque ? (
                        <p className="text-xs text-red-500 mt-1">Quantidade em estoque é obrigatória</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {produto.tipo_preco === "unidade" && "Número de unidades disponíveis"}
                          {produto.tipo_preco === "kg" && "Peso total em quilogramas (ex: 15.5 para 15,5kg)"}
                          {produto.tipo_preco === "litros" && "Volume total em litros (ex: 2.5 para 2,5L)"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        {produto.tipo_preco === "unidade" && "Estoque Mínimo"}
                        {produto.tipo_preco === "kg" && "Peso Mínimo (KG)"}
                        {produto.tipo_preco === "litros" && "Volume Mínimo (L)"}
                      </label>
                      <Input
                        type="number"
                        step={produto.tipo_preco === "unidade" ? "1" : "0.01"}
                        min="0"
                        placeholder={produto.tipo_preco === "unidade" ? "0" : "0,00"}
                        value={produto.estoque_minimo || ""}
                        onChange={(e) => {
                          atualizarProduto("estoque_minimo", e.target.value ? parseFloat(e.target.value) : null);
                          // Limpar erro quando o usuário começar a digitar
                          if (errosValidacao.estoque_minimo) {
                            setErrosValidacao(prev => ({ ...prev, estoque_minimo: false }));
                          }
                        }}
                        className={`mt-1 ${errosValidacao.estoque_minimo ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {errosValidacao.estoque_minimo ? (
                        <p className="text-xs text-red-500 mt-1">Estoque mínimo é obrigatório</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {produto.tipo_preco === "unidade" && "Quantidade mínima antes do alerta"}
                          {produto.tipo_preco === "kg" && "Peso mínimo antes do alerta (ex: 5.0 para 5kg)"}
                          {produto.tipo_preco === "litros" && "Volume mínimo antes do alerta (ex: 1.0 para 1L)"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Alertas de estoque adaptados ao tipo */}
                  {produto.estoque !== null && produto.estoque_minimo !== null && produto.estoque <= produto.estoque_minimo && produto.estoque_minimo > 0 && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-sm text-warning-foreground">
                        {produto.tipo_preco === "unidade" && `Estoque baixo! Quantidade atual (${produto.estoque}) está no limite mínimo (${produto.estoque_minimo})`}
                        {produto.tipo_preco === "kg" && `Estoque baixo! Peso atual (${produto.estoque}kg) está no limite mínimo (${produto.estoque_minimo}kg)`}
                        {produto.tipo_preco === "litros" && `Estoque baixo! Volume atual (${produto.estoque}L) está no limite mínimo (${produto.estoque_minimo}L)`}
                      </span>
                    </div>
                  )}

                  {produto.estoque !== null && produto.estoque === 0 && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive-foreground">
                        {produto.tipo_preco === "unidade" && "Produto sem estoque!"}
                        {produto.tipo_preco === "kg" && "Produto sem peso disponível!"}
                        {produto.tipo_preco === "litros" && "Produto sem volume disponível!"}
                      </span>
                    </div>
                  )}

                  {/* Informações adicionais baseadas no tipo */}
                  {produto.tipo_preco === "kg" && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-start space-x-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">Controle por Peso</p>
                          <p className="text-blue-700">
                            O estoque será controlado pelo peso total em quilogramas. 
                            Exemplo: se você tem 10 sacos de 5kg cada, o estoque total será 50kg.
                          </p>
                    </div>
                    </div>
                  </div>
                  )}

                  {produto.tipo_preco === "litros" && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-start space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="text-sm">
                          <p className="font-medium text-green-900">Controle por Volume</p>
                          <p className="text-green-700">
                            O estoque será controlado pelo volume total em litros. 
                            Exemplo: se você tem 5 garrafas de 2L cada, o estoque total será 10L.
                          </p>
                    </div>
                  </div>
                    </div>
                  )}
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
                          R$ {Number(produto.preco_promocional).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {produto.preco ? Number(produto.preco).toFixed(2) : "0,00"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        R$ {produto.preco ? Number(produto.preco).toFixed(2) : "0,00"}
                      </span>
                    )}
                    
                    {/* Mostrar tipo de preço */}
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {produto.tipo_preco === "unidade" && "Por unidade"}
                        {produto.tipo_preco === "kg" && "Por KG"}
                        {produto.tipo_preco === "litros" && "Por litro"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Estoque: {produto.estoque || 0} 
                      {produto.tipo_preco === "unidade" && " un."}
                      {produto.tipo_preco === "kg" && "kg"}
                      {produto.tipo_preco === "litros" && "L"}
                    </span>
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
              <CardTitle className="flex items-center justify-between">
                Imagens do Produto
                <span className="text-sm text-muted-foreground">
                  {produto.imagens.length}/5 imagens
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Grid de Imagens */}
              {produto.imagens.length > 0 && (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                  {produto.imagens.map((imagem, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img 
                        src={imagem} 
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-border cursor-pointer"
                        onClick={() => setImagemPreview(imagem)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagemPreview(imagem);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removerImagem(index);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {/* Slot para nova imagem */}
                  {produto.imagens.length < 5 && (
                    <div className="aspect-square">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="w-full h-full border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground text-center">
                            Adicionar Imagem
                          </p>
                        </div>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Área de Upload Principal */}
              {produto.imagens.length === 0 && (
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="text-lg font-medium mb-2">
                    {isDragOver ? 'Solte as imagens aqui' : 'Adicionar Imagens do Produto'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isDragOver 
                      ? 'As imagens serão redimensionadas automaticamente'
                      : 'Arraste e solte ou clique para selecionar até 5 imagens. Elas serão redimensionadas automaticamente para 800x800px.'
                    }
                  </p>
                  <div className="space-y-2">
                    <Button asChild>
                      <label htmlFor="main-image-upload" className="cursor-pointer">
                        Selecionar Imagens
                      </label>
                    </Button>
                    <input
                      id="main-image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos: JPG, PNG, GIF • Máximo: 5MB por imagem
                    </p>
                  </div>
                </div>
              )}

              {/* Informações sobre as imagens */}
              {produto.imagens.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>
                      {produto.imagens.length} imagem(ns) carregada(s) • Redimensionadas automaticamente
                    </span>
                  </div>
                </div>
              )}
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
      )}

      {/* Modal de Preview da Imagem */}
      {imagemPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-background rounded-lg overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setImagemPreview(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img 
              src={imagemPreview} 
              alt="Preview da imagem"
              className="w-full h-full object-contain max-h-[90vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
 