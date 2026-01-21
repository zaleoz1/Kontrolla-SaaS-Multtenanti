
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useCrudApi } from "@/hooks/useApi";
import { API_ENDPOINTS } from "@/config/api";
import { usePermissions } from "@/hooks/usePermissions";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { 
  Plus, 
  Search, 
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Upload,
  FileText,
  X
} from "lucide-react";

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number;
  tipo_preco: 'unidade' | 'kg' | 'litros';
  estoque: number;
  estoque_minimo: number;
  // Novos campos para estoque decimal
  estoque_kg?: number;
  estoque_litros?: number;
  estoque_minimo_kg?: number;
  estoque_minimo_litros?: number;
  // Campos calculados
  estoque_atual?: number;
  estoque_minimo_atual?: number;
  codigo_barras?: string;
  sku?: string;
  status: 'ativo' | 'inativo' | 'rascunho';
  categoria_nome?: string;
  marca?: string;
  modelo?: string;
  imagens?: string[];
  destaque: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
  total_produtos: number;
}

interface ProdutosResponse {
  produtos: Produto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface para dados do emitente/fornecedor do XML
interface EmitenteXML {
  cnpj: string;
  cpf: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  telefone: string;
}

// Interface para dados da NF-e
interface DadosNFeXML {
  numero: string;
  serie: string;
  dataEmissao: string;
  chaveAcesso: string;
  naturezaOperacao: string;
  valorTotal: number;
}

// Interface para produtos extraídos do XML
interface ProdutoXML {
  id: string; // ID temporário para controle
  selecionado: boolean;
  codigo: string;
  codigoBarras: string;
  nome: string;
  descricao?: string;
  ncm: string;
  cfop: string;
  cest?: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  valorDesconto?: number;
  // Impostos
  icmsOrigem?: string;
  icmsCST?: string;
  icmsAliquota?: number;
  icmsBase?: number;
  icmsValor?: number;
  ipiAliquota?: number;
  ipiCodigo?: string;
  ipiBase?: number;
  ipiValor?: number;
  pisCST?: string;
  pisAliquota?: number;
  pisBase?: number;
  pisValor?: number;
  cofinsCST?: string;
  cofinsAliquota?: number;
  cofinsBase?: number;
  cofinsValor?: number;
}

export default function Produtos() {
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstoque, setFiltroEstoque] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<{id: number, nome: string} | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Estados para importação XML
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [produtosXML, setProdutosXML] = useState<ProdutoXML[]>([]);
  const [emitenteXML, setEmitenteXML] = useState<EmitenteXML | null>(null);
  const [dadosNFeXML, setDadosNFeXML] = useState<DadosNFeXML | null>(null);
  const [importando, setImportando] = useState(false);
  const [xmlFileName, setXmlFileName] = useState("");
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [produtoExpandido, setProdutoExpandido] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const produtosApi = useCrudApi<ProdutosResponse>(API_ENDPOINTS.PRODUCTS.LIST);
  const deleteApi = useCrudApi(API_ENDPOINTS.PRODUCTS.LIST);
  const categoriasApi = useCrudApi<{categorias: Categoria[]}>(API_ENDPOINTS.CATALOG.CATEGORIES);
  const importApi = useCrudApi(API_ENDPOINTS.PRODUCTS.IMPORT); // Rota de importação com upsert

  // Carregar categorias e produtos
  useEffect(() => {
    carregarCategorias();
    carregarProdutos();
  }, [termoBusca, filtroStatus, filtroCategoria]);
  // filtroEstoque não precisa recarregar a API pois é filtrado no frontend

  const carregarCategorias = async () => {
    try {
      const response = await categoriasApi.list();
      setCategorias(response.categorias || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      // Não mostrar toast de erro para categorias pois não é crítico
    }
  };

  const carregarProdutos = async () => {
    try {
      const params: Record<string, any> = {
        limit: 1000, // Limite máximo permitido pelo backend
      };

      if (termoBusca) params.q = termoBusca;
      if (filtroStatus) params.status = filtroStatus;
      if (filtroCategoria) params.categoria_id = filtroCategoria;
      // Removido filtroEstoque da API - será filtrado no frontend

      await produtosApi.list(params);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleExcluirProduto = (id: number, nome: string) => {
    setProdutoParaExcluir({ id, nome });
    setShowDeleteDialog(true);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;

    try {
      await deleteApi.remove(produtoParaExcluir.id);
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso!",
      });
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setProdutoParaExcluir(null);
    }
  };

  const cancelarExclusao = () => {
    setShowDeleteDialog(false);
    setProdutoParaExcluir(null);
  };

  // ============ FUNÇÕES PARA IMPORTAÇÃO XML ============

  // Função para extrair texto de um elemento XML
  const getXMLText = (element: Element | null, tagName: string): string => {
    if (!element) return "";
    const tag = element.getElementsByTagName(tagName)[0];
    return tag?.textContent?.trim() || "";
  };

  // Função para extrair número de um elemento XML
  const getXMLNumber = (element: Element | null, tagName: string): number => {
    const text = getXMLText(element, tagName);
    return parseFloat(text) || 0;
  };

  // Função para formatar CNPJ
  const formatarCNPJ = (cnpj: string): string => {
    if (!cnpj) return "";
    const numeros = cnpj.replace(/\D/g, "");
    if (numeros.length !== 14) return cnpj;
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  // Função para formatar CPF
  const formatarCPF = (cpf: string): string => {
    if (!cpf) return "";
    const numeros = cpf.replace(/\D/g, "");
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Função para formatar CEP
  const formatarCEP = (cep: string): string => {
    if (!cep) return "";
    const numeros = cep.replace(/\D/g, "");
    if (numeros.length !== 8) return cep;
    return numeros.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  // Função para formatar data
  const formatarDataXML = (dataStr: string): string => {
    if (!dataStr) return "";
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataStr;
    }
  };

  // Função para extrair dados do emitente/fornecedor
  const parseEmitenteXML = (xmlDoc: Document): EmitenteXML | null => {
    const emit = xmlDoc.getElementsByTagName("emit")[0];
    if (!emit) return null;

    const enderEmit = emit.getElementsByTagName("enderEmit")[0];

    return {
      cnpj: getXMLText(emit, "CNPJ"),
      cpf: getXMLText(emit, "CPF"),
      razaoSocial: getXMLText(emit, "xNome"),
      nomeFantasia: getXMLText(emit, "xFant"),
      inscricaoEstadual: getXMLText(emit, "IE"),
      endereco: {
        logradouro: getXMLText(enderEmit, "xLgr"),
        numero: getXMLText(enderEmit, "nro"),
        bairro: getXMLText(enderEmit, "xBairro"),
        cidade: getXMLText(enderEmit, "xMun"),
        uf: getXMLText(enderEmit, "UF"),
        cep: getXMLText(enderEmit, "CEP"),
      },
      telefone: getXMLText(enderEmit, "fone"),
    };
  };

  // Função para extrair dados da NF-e
  const parseDadosNFeXML = (xmlDoc: Document): DadosNFeXML | null => {
    const ide = xmlDoc.getElementsByTagName("ide")[0];
    const total = xmlDoc.getElementsByTagName("total")[0];
    const infNFe = xmlDoc.getElementsByTagName("infNFe")[0];

    if (!ide) return null;

    const icmsTot = total?.getElementsByTagName("ICMSTot")[0];

    return {
      numero: getXMLText(ide, "nNF"),
      serie: getXMLText(ide, "serie"),
      dataEmissao: getXMLText(ide, "dhEmi") || getXMLText(ide, "dEmi"),
      chaveAcesso: infNFe?.getAttribute("Id")?.replace("NFe", "") || "",
      naturezaOperacao: getXMLText(ide, "natOp"),
      valorTotal: getXMLNumber(icmsTot, "vNF"),
    };
  };

  // Função para processar o XML e extrair produtos
  const parseXMLProdutos = (xmlString: string): ProdutoXML[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Verificar erros de parse
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      throw new Error("Arquivo XML inválido. Verifique se o arquivo está correto.");
    }

    // Extrair dados do emitente e da NF-e
    const emitente = parseEmitenteXML(xmlDoc);
    const dadosNFe = parseDadosNFeXML(xmlDoc);
    
    setEmitenteXML(emitente);
    setDadosNFeXML(dadosNFe);

    const produtos: ProdutoXML[] = [];
    
    // Buscar elementos <det> (detalhes dos produtos) - padrão NF-e
    const detElements = xmlDoc.getElementsByTagName("det");
    
    if (detElements.length === 0) {
      throw new Error("Nenhum produto encontrado no XML. Verifique se é um XML de NF-e válido.");
    }

    for (let i = 0; i < detElements.length; i++) {
      const det = detElements[i];
      const prod = det.getElementsByTagName("prod")[0];
      const imposto = det.getElementsByTagName("imposto")[0];
      
      if (!prod) continue;

      // Extrair dados do produto
      const codigo = getXMLText(prod, "cProd");
      const codigoBarras = getXMLText(prod, "cEAN") || getXMLText(prod, "cEANTrib");
      const nome = getXMLText(prod, "xProd");
      const ncm = getXMLText(prod, "NCM");
      const cfop = getXMLText(prod, "CFOP");
      const cest = getXMLText(prod, "CEST");
      const unidade = getXMLText(prod, "uCom") || getXMLText(prod, "uTrib");
      const quantidade = getXMLNumber(prod, "qCom") || getXMLNumber(prod, "qTrib");
      const valorUnitario = getXMLNumber(prod, "vUnCom") || getXMLNumber(prod, "vUnTrib");
      const valorTotal = getXMLNumber(prod, "vProd");
      const valorDesconto = getXMLNumber(prod, "vDesc");

      // Extrair impostos com mais detalhes
      let icmsOrigem = "";
      let icmsCST = "";
      let icmsAliquota = 0;
      let icmsBase = 0;
      let icmsValor = 0;
      let ipiAliquota = 0;
      let ipiCodigo = "";
      let ipiBase = 0;
      let ipiValor = 0;
      let pisCST = "";
      let pisAliquota = 0;
      let pisBase = 0;
      let pisValor = 0;
      let cofinsCST = "";
      let cofinsAliquota = 0;
      let cofinsBase = 0;
      let cofinsValor = 0;

      if (imposto) {
        // ICMS
        const icms = imposto.getElementsByTagName("ICMS")[0];
        if (icms) {
          const icmsChild = icms.children[0];
          if (icmsChild) {
            icmsOrigem = getXMLText(icmsChild, "orig");
            icmsCST = getXMLText(icmsChild, "CST") || getXMLText(icmsChild, "CSOSN");
            icmsAliquota = getXMLNumber(icmsChild, "pICMS");
            icmsBase = getXMLNumber(icmsChild, "vBC");
            icmsValor = getXMLNumber(icmsChild, "vICMS");
          }
        }

        // IPI
        const ipi = imposto.getElementsByTagName("IPI")[0];
        if (ipi) {
          const ipiTrib = ipi.getElementsByTagName("IPITrib")[0];
          if (ipiTrib) {
            ipiAliquota = getXMLNumber(ipiTrib, "pIPI");
            ipiBase = getXMLNumber(ipiTrib, "vBC");
            ipiValor = getXMLNumber(ipiTrib, "vIPI");
          }
          ipiCodigo = getXMLText(ipi, "cEnq");
        }

        // PIS
        const pis = imposto.getElementsByTagName("PIS")[0];
        if (pis) {
          const pisChild = pis.children[0];
          if (pisChild) {
            pisCST = getXMLText(pisChild, "CST");
            pisAliquota = getXMLNumber(pisChild, "pPIS");
            pisBase = getXMLNumber(pisChild, "vBC");
            pisValor = getXMLNumber(pisChild, "vPIS");
          }
        }

        // COFINS
        const cofins = imposto.getElementsByTagName("COFINS")[0];
        if (cofins) {
          const cofinsChild = cofins.children[0];
          if (cofinsChild) {
            cofinsCST = getXMLText(cofinsChild, "CST");
            cofinsAliquota = getXMLNumber(cofinsChild, "pCOFINS");
            cofinsBase = getXMLNumber(cofinsChild, "vBC");
            cofinsValor = getXMLNumber(cofinsChild, "vCOFINS");
          }
        }
      }

      produtos.push({
        id: `xml-${i}-${Date.now()}`,
        selecionado: true,
        codigo,
        codigoBarras: codigoBarras === "SEM GTIN" ? "" : codigoBarras,
        nome,
        ncm,
        cfop,
        cest,
        unidade,
        quantidade,
        valorUnitario,
        valorTotal,
        valorDesconto,
        icmsOrigem,
        icmsCST,
        icmsAliquota,
        icmsBase,
        icmsValor,
        ipiAliquota,
        ipiCodigo,
        ipiBase,
        ipiValor,
        pisCST,
        pisAliquota,
        pisBase,
        pisValor,
        cofinsCST,
        cofinsAliquota,
        cofinsBase,
        cofinsValor,
      });
    }

    return produtos;
  };

  // Função para lidar com a seleção do arquivo XML
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar extensão
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setXmlError("Por favor, selecione um arquivo XML válido.");
      return;
    }

    setXmlFileName(file.name);
    setXmlError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlString = e.target?.result as string;
        const produtos = parseXMLProdutos(xmlString);
        setProdutosXML(produtos);
        setShowImportDialog(true);
      } catch (error) {
        console.error("Erro ao processar XML:", error);
        setXmlError(error instanceof Error ? error.message : "Erro ao processar o arquivo XML.");
        setProdutosXML([]);
      }
    };
    reader.onerror = () => {
      setXmlError("Erro ao ler o arquivo. Tente novamente.");
    };
    reader.readAsText(file);

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = "";
  };

  // Função para alternar seleção de um produto
  const toggleProdutoSelecionado = (id: string) => {
    setProdutosXML(prev => 
      prev.map(p => p.id === id ? { ...p, selecionado: !p.selecionado } : p)
    );
  };

  // Função para selecionar/deselecionar todos
  const toggleTodosSelecionados = () => {
    const todosSelecionados = produtosXML.every(p => p.selecionado);
    setProdutosXML(prev => prev.map(p => ({ ...p, selecionado: !todosSelecionados })));
  };

  // Converter unidade do XML para tipo_preco do sistema
  // Baseado nas unidades mais comuns em NF-e brasileiras
  const converterUnidade = (unidade: string): 'unidade' | 'kg' | 'litros' => {
    const un = unidade.toLowerCase().trim();
    
    // Unidades de peso (kg)
    const unidadesPeso = ['kg', 'kilo', 'kilograma', 'quilograma', 'quilogramas', 'g', 'gr', 'grama', 'gramas'];
    if (unidadesPeso.includes(un)) {
      return 'kg';
    }
    
    // Unidades de volume (litros)
    const unidadesVolume = ['l', 'lt', 'litro', 'litros', 'ml', 'mililitro', 'mililitros'];
    if (unidadesVolume.includes(un)) {
      return 'litros';
    }
    
    // Todas as outras são tratadas como unidade
    // Exemplos: UN, UNID, UNIDADE, PC, PÇ, PEÇA, CX, CAIXA, PCT, PACOTE, etc.
    return 'unidade';
  };

  // Função para importar os produtos selecionados
  // Usa rota de importação com UPSERT: se produto já existe (por código de barras ou SKU), atualiza e soma estoque
  const importarProdutosSelecionados = async () => {
    const selecionados = produtosXML.filter(p => p.selecionado);
    
    if (selecionados.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um produto para importar.",
        variant: "destructive",
      });
      return;
    }

    setImportando(true);
    let criados = 0;
    let atualizados = 0;
    let erros = 0;
    const errosDetalhes: string[] = [];

    for (const produtoXML of selecionados) {
      try {
        const tipoPreco = converterUnidade(produtoXML.unidade);
        
        // Preparar dados do produto mapeando EXATAMENTE para as colunas da tabela
        // IMPORTANTE: Não enviar campos opcionais como null, apenas omitir
        const dadosProduto: Record<string, any> = {
          // Dados básicos do produto
          nome: produtoXML.nome.substring(0, 255),
          descricao: emitenteXML 
            ? `[NF-e ${dadosNFeXML?.numero || ''} - ${formatarDataXML(dadosNFeXML?.dataEmissao || '')}] ${emitenteXML.razaoSocial}`
            : `Importado de NF-e - Código: ${produtoXML.codigo}`,
          
          // Preços
          preco: Number(produtoXML.valorUnitario.toFixed(2)),
          
          // Tipo de preço
          tipo_preco: tipoPreco,
          
          // Estoque - será SOMADO se produto já existir
          estoque: tipoPreco === 'unidade' ? Math.round(produtoXML.quantidade) : 0,
          estoque_minimo: 0,
          estoque_kg: tipoPreco === 'kg' ? Number(produtoXML.quantidade.toFixed(3)) : 0,
          estoque_litros: tipoPreco === 'litros' ? Number(produtoXML.quantidade.toFixed(3)) : 0,
          estoque_minimo_kg: 0,
          estoque_minimo_litros: 0,
          
          // Status
          status: 'ativo',
          destaque: false,
        };

        // Adicionar campos opcionais APENAS se tiverem valor
        
        // Código de barras - usado para identificar produto existente
        if (produtoXML.codigoBarras && produtoXML.codigoBarras.trim()) {
          dadosProduto.codigo_barras = produtoXML.codigoBarras.trim().substring(0, 50);
        }
        
        // SKU - usado para identificar produto existente se não tiver código de barras
        if (produtoXML.codigo && produtoXML.codigo.trim()) {
          dadosProduto.sku = produtoXML.codigo.trim().substring(0, 100);
        }
        
        // ====== CAMPOS FISCAIS ======
        if (produtoXML.ncm && produtoXML.ncm.trim()) {
          dadosProduto.ncm = produtoXML.ncm.replace(/\D/g, '').substring(0, 10);
        }
        if (produtoXML.cfop && produtoXML.cfop.trim()) {
          dadosProduto.cfop = produtoXML.cfop.replace(/\D/g, '').substring(0, 4);
        }
        if (produtoXML.icmsCST && produtoXML.icmsCST.trim()) {
          dadosProduto.cst = produtoXML.icmsCST.substring(0, 3);
          dadosProduto.icms_situacao_tributaria = produtoXML.icmsCST.substring(0, 3);
        }
        if (produtoXML.icmsOrigem && produtoXML.icmsOrigem.trim()) {
          dadosProduto.icms_origem = produtoXML.icmsOrigem.substring(0, 1);
        }
        if (produtoXML.icmsAliquota && produtoXML.icmsAliquota > 0) {
          dadosProduto.icms_aliquota = Number(produtoXML.icmsAliquota.toFixed(2));
        }
        if (produtoXML.ipiAliquota && produtoXML.ipiAliquota > 0) {
          dadosProduto.ipi_aliquota = Number(produtoXML.ipiAliquota.toFixed(2));
        }
        if (produtoXML.ipiCodigo && produtoXML.ipiCodigo.trim()) {
          dadosProduto.ipi_codigo_enquadramento = produtoXML.ipiCodigo.substring(0, 3);
        }
        if (produtoXML.pisCST && produtoXML.pisCST.trim()) {
          dadosProduto.pis_cst = produtoXML.pisCST.substring(0, 2);
        }
        if (produtoXML.pisAliquota && produtoXML.pisAliquota > 0) {
          dadosProduto.pis_aliquota = Number(produtoXML.pisAliquota.toFixed(2));
        }
        if (produtoXML.cofinsCST && produtoXML.cofinsCST.trim()) {
          dadosProduto.cofins_cst = produtoXML.cofinsCST.substring(0, 2);
        }
        if (produtoXML.cofinsAliquota && produtoXML.cofinsAliquota > 0) {
          dadosProduto.cofins_aliquota = Number(produtoXML.cofinsAliquota.toFixed(2));
        }

        // Usar rota de importação (upsert)
        const response = await importApi.create(dadosProduto);
        
        // Verificar se foi criado ou atualizado
        if (response.acao === 'atualizado') {
          atualizados++;
        } else {
          criados++;
        }
      } catch (error) {
        erros++;
        errosDetalhes.push(`${produtoXML.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        console.error(`Erro ao importar produto ${produtoXML.nome}:`, error);
      }
    }

    setImportando(false);

    const totalSucessos = criados + atualizados;
    
    if (totalSucessos > 0) {
      // Montar mensagem detalhada
      const partes: string[] = [];
      if (criados > 0) partes.push(`${criados} novo(s)`);
      if (atualizados > 0) partes.push(`${atualizados} atualizado(s) (estoque somado)`);
      if (erros > 0) partes.push(`${erros} erro(s)`);
      
      toast({
        title: "Importação concluída",
        description: partes.join(', '),
      });
      carregarProdutos();
    }

    if (erros > 0 && totalSucessos === 0) {
      toast({
        title: "Erro na importação",
        description: `Nenhum produto foi importado. ${errosDetalhes[0]}`,
        variant: "destructive",
      });
    }

    // Fechar modal se todos foram importados com sucesso
    if (erros === 0) {
      setShowImportDialog(false);
      setProdutosXML([]);
      setEmitenteXML(null);
      setDadosNFeXML(null);
      setXmlFileName("");
    }
  };

  // Função para fechar o modal de importação
  const fecharImportDialog = () => {
    setShowImportDialog(false);
    setProdutosXML([]);
    setEmitenteXML(null);
    setDadosNFeXML(null);
    setXmlFileName("");
    setXmlError(null);
    setProdutoExpandido(null);
  };

  // Função para expandir/recolher detalhes do produto
  const toggleProdutoExpandido = (id: string) => {
    setProdutoExpandido(prev => prev === id ? null : id);
  };

  // Abrir seletor de arquivo
  const abrirSeletorArquivo = () => {
    fileInputRef.current?.click();
  };

  // ============ FIM FUNÇÕES PARA IMPORTAÇÃO XML ============

  const obterBadgeStatus = (produto: Produto) => {
    if (produto.status !== 'ativo') {
      return <Badge variant="secondary">Inativo</Badge>;
    }

    const estoqueAtual = obterEstoqueAtual(produto);
    const estoqueMinimoAtual = obterEstoqueMinimoAtual(produto);

    // Verificar se os valores são válidos
    if (estoqueAtual === null || estoqueAtual === undefined || isNaN(estoqueAtual)) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }

    if (estoqueAtual === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }

    // Só considerar estoque baixo se o estoque mínimo for válido e maior que 0
    if (estoqueMinimoAtual && estoqueMinimoAtual > 0 && estoqueAtual <= estoqueMinimoAtual) {
      return <Badge className="bg-warning/80 text-warning-foreground border-warning/30">Estoque Baixo</Badge>;
    }

    return <Badge className="bg-success hover:bg-success/90 text-white">Em Estoque</Badge>;
  };

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  const obterUnidadeEstoque = (tipo_preco: string) => {
    switch (tipo_preco) {
      case 'kg':
        return 'kg';
      case 'litros':
        return 'L';
      case 'unidade':
      default:
        return 'un.';
    }
  };

  const obterTipoEstoqueTexto = (tipo_preco: string) => {
    switch (tipo_preco) {
      case 'kg':
        return 'Peso';
      case 'litros':
        return 'Volume';
      case 'unidade':
      default:
        return 'Quantidade';
    }
  };

  const formatarEstoque = (produto: Produto) => {
    const estoqueAtual = obterEstoqueAtual(produto);
    const unidade = obterUnidadeEstoque(produto.tipo_preco);
    
    if (produto.tipo_preco === 'unidade') {
      return `${Math.round(estoqueAtual)} ${unidade}`;
    } else {
      // Para kg e litros, manter casas decimais mas limitar a 3 casas
      return `${Number(estoqueAtual).toFixed(3).replace(/\.?0+$/, '')} ${unidade}`;
    }
  };

  const obterEstoqueAtual = (produto: Produto) => {
    // Priorizar estoque_atual calculado pelo backend
    if (produto.estoque_atual !== undefined && produto.estoque_atual !== null) {
      return parseFloat(String(produto.estoque_atual)) || 0;
    }
    
    // Fallback para campos específicos baseado no tipo
    switch (produto.tipo_preco) {
      case 'kg':
        return parseFloat(String(produto.estoque_kg)) || 0;
      case 'litros':
        return parseFloat(String(produto.estoque_litros)) || 0;
      case 'unidade':
      default:
        return parseFloat(String(produto.estoque)) || 0;
    }
  };

  const obterEstoqueMinimoAtual = (produto: Produto) => {
    // Priorizar estoque_minimo_atual calculado pelo backend
    if (produto.estoque_minimo_atual !== undefined && produto.estoque_minimo_atual !== null) {
      return parseFloat(String(produto.estoque_minimo_atual)) || 0;
    }
    
    // Fallback para campos específicos baseado no tipo
    switch (produto.tipo_preco) {
      case 'kg':
        return parseFloat(String(produto.estoque_minimo_kg)) || 0;
      case 'litros':
        return parseFloat(String(produto.estoque_minimo_litros)) || 0;
      case 'unidade':
      default:
        return parseFloat(String(produto.estoque_minimo)) || 0;
    }
  };

  const todosProdutos = produtosApi.data?.produtos || [];

  // Filtrar produtos baseado no filtro de estoque
  const filtrarProdutosPorEstoque = (produtos: Produto[]) => {
    if (!filtroEstoque) return produtos;

    switch (filtroEstoque) {
      case 'disponivel':
        return produtos.filter(p => {
          const estoqueAtual = obterEstoqueAtual(p);
          const estoqueMinimoAtual = obterEstoqueMinimoAtual(p);
          return estoqueAtual > 0 && (!estoqueMinimoAtual || estoqueMinimoAtual <= 0 || estoqueAtual > estoqueMinimoAtual);
        });
      case 'estoque_baixo':
        return produtos.filter(p => {
          const estoqueAtual = obterEstoqueAtual(p);
          const estoqueMinimoAtual = obterEstoqueMinimoAtual(p);
          return estoqueAtual > 0 && estoqueMinimoAtual > 0 && estoqueAtual <= estoqueMinimoAtual;
        });
      case 'sem_estoque':
        return produtos.filter(p => obterEstoqueAtual(p) === 0);
      default:
        return produtos;
    }
  };

  const produtos = filtrarProdutosPorEstoque(todosProdutos);

  // Calcular métricas dos produtos (usando todos os produtos, não apenas os filtrados)
  const calcularMetricas = () => {
    const total = todosProdutos.length;
    const semEstoque = todosProdutos.filter(p => obterEstoqueAtual(p) === 0).length;
    const estoqueBaixo = todosProdutos.filter(p => {
      const estoqueAtual = obterEstoqueAtual(p);
      const estoqueMinimoAtual = obterEstoqueMinimoAtual(p);
      return estoqueAtual > 0 && estoqueMinimoAtual > 0 && estoqueAtual <= estoqueMinimoAtual;
    }).length;
    const disponiveis = todosProdutos.filter(p => {
      const estoqueAtual = obterEstoqueAtual(p);
      const estoqueMinimoAtual = obterEstoqueMinimoAtual(p);
      return estoqueAtual > 0 && (!estoqueMinimoAtual || estoqueMinimoAtual <= 0 || estoqueAtual > estoqueMinimoAtual);
    }).length;
    
    return { total, semEstoque, estoqueBaixo, disponiveis };
  };

  const metricas = calcularMetricas();

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden prevent-zoom touch-optimized mobile-scroll">
      {/* Header */}
      <div className="w-full">
        {/* Título e Descrição - Sempre no topo */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Produtos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie seu catálogo de produtos
          </p>
        </div>

        {/* Botões - Desktop */}
        <div className="hidden md:flex items-center justify-end gap-2">
          {hasPermission('produtos_criar') && (
            <>
              <Button 
                variant="outline" 
                onClick={abrirSeletorArquivo}
                className="border-primary/50 hover:bg-primary/10"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar XML
              </Button>
              <Button className="bg-gradient-primary text-white" onClick={() => navigate("/dashboard/novo-produto")}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </>
          )}
        </div>

        {/* Botões - Mobile */}
        <div className="md:hidden w-full space-y-2">
          {hasPermission('produtos_criar') && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1 text-xs sm:text-sm border-primary/50 hover:bg-primary/10" 
                onClick={abrirSeletorArquivo}
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Importar XML</span>
              </Button>
              <Button 
                className="flex-1 bg-gradient-primary text-white text-xs sm:text-sm" 
                onClick={() => navigate("/dashboard/novo-produto")}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Novo Produto</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Input hidden para seleção de arquivo XML */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Alerta de erro no XML */}
      {xmlError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{xmlError}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setXmlError(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Card de Métricas */}
      {!produtosApi.loading && !produtosApi.error && !categoriasApi.loading && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-2 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Total de Produtos</p>
                  <p className="text-sm sm:text-2xl font-bold text-primary break-words">{metricas.total}</p>
                </div>
                <div className="p-1 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0 self-start sm:self-auto">
                  <Package className="h-3 w-3 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-2 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Disponíveis</p>
                  <p className="text-sm sm:text-2xl font-bold text-success break-words">{metricas.disponiveis}</p>
                </div>
                <div className="p-1 sm:p-2 rounded-lg bg-success/10 flex-shrink-0 self-start sm:self-auto">
                  <CheckCircle className="h-3 w-3 sm:h-6 sm:w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-2 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Estoque Baixo</p>
                  <p className="text-sm sm:text-2xl font-bold text-warning break-words">{metricas.estoqueBaixo}</p>
                </div>
                <div className="p-1 sm:p-2 rounded-lg bg-warning/10 flex-shrink-0 self-start sm:self-auto">
                  <AlertTriangle className="h-3 w-3 sm:h-6 sm:w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-2 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Sem Estoque</p>
                  <p className="text-sm sm:text-2xl font-bold text-destructive break-words">{metricas.semEstoque}</p>
                </div>
                <div className="p-1 sm:p-2 rounded-lg bg-destructive/10 flex-shrink-0 self-start sm:self-auto">
                  <AlertTriangle className="h-3 w-3 sm:h-6 sm:w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-3 sm:p-6">
          {/* Filtros - Desktop */}
          <div className="hidden md:flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, descrição ou código..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="rascunho">Rascunho</option>
              </select>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                disabled={categoriasApi.loading}
              >
                <option value="">Todas as categorias</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome} ({categoria.total_produtos})
                  </option>
                ))}
              </select>
              <select
                value={filtroEstoque}
                onChange={(e) => setFiltroEstoque(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos os estoques</option>
                <option value="disponivel">Disponíveis</option>
                <option value="estoque_baixo">Estoque Baixo</option>
                <option value="sem_estoque">Sem Estoque</option>
              </select>
              <Button 
                variant="outline" 
                onClick={carregarProdutos}
                disabled={produtosApi.loading}
              >
                {produtosApi.loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filtros - Mobile */}
          <div className="md:hidden space-y-3 w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-8 sm:pl-10 text-xs sm:text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-2 py-2 border border-input bg-background rounded-md text-xs sm:text-sm"
              >
                <option value="">Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="rascunho">Rascunho</option>
              </select>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-2 py-2 border border-input bg-background rounded-md text-xs sm:text-sm"
                disabled={categoriasApi.loading}
              >
                <option value="">Categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
              <select
                value={filtroEstoque}
                onChange={(e) => setFiltroEstoque(e.target.value)}
                className="px-2 py-2 border border-input bg-background rounded-md text-xs sm:text-sm"
              >
                <option value="">Estoque</option>
                <option value="disponivel">Disponíveis</option>
                <option value="estoque_baixo">Baixo</option>
                <option value="sem_estoque">Sem Estoque</option>
              </select>
            </div>

            <Button 
              variant="outline" 
              onClick={carregarProdutos}
              disabled={produtosApi.loading}
              className="w-full text-xs sm:text-sm"
            >
              {produtosApi.loading ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Atualizar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {(produtosApi.loading || categoriasApi.loading) && (
        <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="bg-gradient-card shadow-card">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-6 sm:h-10 sm:w-10 rounded-lg" />
                  <Skeleton className="h-4 w-16 sm:h-6 sm:w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <Skeleton className="h-4 w-3/4 mb-2 sm:h-6" />
                  <Skeleton className="h-3 w-1/2 sm:h-4" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-10 sm:h-4 sm:w-12" />
                    <Skeleton className="h-3 w-12 sm:h-4 sm:w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-10 sm:h-4 sm:w-12" />
                    <Skeleton className="h-3 w-12 sm:h-4 sm:w-16" />
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Skeleton className="h-6 flex-1 sm:h-8" />
                  <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {produtosApi.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {produtosApi.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de Produtos */}
      {!produtosApi.loading && !produtosApi.error && !categoriasApi.loading && (
        <>
          <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {produtos.map((produto) => (
            <Card key={produto.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                    <Package className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  {obterBadgeStatus(produto)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{produto.nome}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{produto.categoria_nome || 'Sem categoria'}</p>
                  {produto.marca && (
                    <p className="text-xs text-muted-foreground">{produto.marca}</p>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {produto.tipo_preco === 'unidade' && 'Por unidade'}
                      {produto.tipo_preco === 'kg' && 'Por KG'}
                      {produto.tipo_preco === 'litros' && 'Por litro'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Preço:</span>
                    <div className="text-right">
                      <span className="font-semibold text-foreground text-sm sm:text-base">
                        {formatarPreco(produto.preco_promocional || produto.preco)}
                      </span>
                      {produto.preco_promocional && produto.preco_promocional < produto.preco && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatarPreco(produto.preco)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {obterTipoEstoqueTexto(produto.tipo_preco)}:
                    </span>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="font-medium text-xs sm:text-sm">
                        {formatarEstoque(produto)}
                      </span>
                      {(() => {
                        const estoqueAtual = obterEstoqueAtual(produto);
                        const estoqueMinimoAtual = obterEstoqueMinimoAtual(produto);
                        
                        if (estoqueAtual > 0 && estoqueMinimoAtual > 0 && estoqueAtual <= estoqueMinimoAtual) {
                          return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />;
                        } else if (estoqueAtual > 0) {
                          return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />;
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {produto.codigo_barras && (
                    <div className="text-xs text-muted-foreground truncate">
                      Código: {produto.codigo_barras}
                    </div>
                  )}
                  {produto.sku && (
                    <div className="text-xs text-muted-foreground truncate">
                      SKU: {produto.sku}
                    </div>
                  )}
                </div>

                {/* Ocultar botões de ação para vendedores */}
                {(hasPermission('produtos_editar') || hasPermission('produtos_excluir')) && (
                  <div className="flex space-x-2 pt-2">
                    {hasPermission('produtos_editar') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => navigate(`/dashboard/novo-produto/${produto.id}`)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">Ed.</span>
                      </Button>
                    )}
                    {hasPermission('produtos_excluir') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => handleExcluirProduto(produto.id, produto.nome)}
                        disabled={deleteApi.loading}
                      >
                        {deleteApi.loading ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>

        </>
      )}

      {/* Empty State */}
      {!produtosApi.loading && !produtosApi.error && !categoriasApi.loading && produtos.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6 sm:p-12 text-center">
            <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {termoBusca || filtroStatus || filtroCategoria || filtroEstoque
                ? "Tente ajustar sua busca ou filtros" 
                : "Adicione seu primeiro produto"
              }
            </p>
            {hasPermission('produtos_criar') && (
              <Button 
                className="bg-gradient-primary text-white text-xs sm:text-sm"
                onClick={() => navigate("/dashboard/novo-produto")}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto <strong>"{produtoParaExcluir?.nome}"</strong>?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelarExclusao} disabled={deleteApi.loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={deleteApi.loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteApi.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Importação de XML */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Importar Produtos do XML
            </DialogTitle>
            <DialogDescription>
              {xmlFileName && (
                <span className="text-sm">
                  Arquivo: <strong>{xmlFileName}</strong> - {produtosXML.length} produto(s) encontrado(s)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {produtosXML.length > 0 && (
            <>
              {/* Dados da NF-e e Fornecedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                {/* Dados da NF-e */}
                {dadosNFeXML && (
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Dados da NF-e
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 space-y-1">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-muted-foreground">Número:</span>
                          <span className="ml-1 font-medium">{dadosNFeXML.numero || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Série:</span>
                          <span className="ml-1 font-medium">{dadosNFeXML.serie || '-'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Emissão:</span>
                          <span className="ml-1 font-medium">{formatarDataXML(dadosNFeXML.dataEmissao)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Natureza:</span>
                          <span className="ml-1 font-medium">{dadosNFeXML.naturezaOperacao || '-'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Valor Total:</span>
                          <span className="ml-1 font-semibold text-primary">{formatarPreco(dadosNFeXML.valorTotal)}</span>
                        </div>
                        {dadosNFeXML.chaveAcesso && (
                          <div className="col-span-2 mt-1">
                            <span className="text-muted-foreground">Chave:</span>
                            <span className="ml-1 font-mono text-[10px] break-all">{dadosNFeXML.chaveAcesso}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Dados do Fornecedor/Emitente */}
                {emitenteXML && (
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Fornecedor / Emitente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 space-y-1">
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="font-semibold text-sm">{emitenteXML.razaoSocial}</span>
                          {emitenteXML.nomeFantasia && emitenteXML.nomeFantasia !== emitenteXML.razaoSocial && (
                            <span className="text-muted-foreground ml-1">({emitenteXML.nomeFantasia})</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div>
                            <span className="text-muted-foreground">
                              {emitenteXML.cnpj ? 'CNPJ:' : 'CPF:'}
                            </span>
                            <span className="ml-1 font-mono">
                              {emitenteXML.cnpj ? formatarCNPJ(emitenteXML.cnpj) : formatarCPF(emitenteXML.cpf)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">IE:</span>
                            <span className="ml-1 font-mono">{emitenteXML.inscricaoEstadual || '-'}</span>
                          </div>
                        </div>
                        {emitenteXML.endereco.logradouro && (
                          <div className="pt-1">
                            <span className="text-muted-foreground">Endereço:</span>
                            <div className="text-xs">
                              {emitenteXML.endereco.logradouro}, {emitenteXML.endereco.numero}
                              {emitenteXML.endereco.bairro && ` - ${emitenteXML.endereco.bairro}`}
                            </div>
                            <div className="text-xs">
                              {emitenteXML.endereco.cidade}/{emitenteXML.endereco.uf}
                              {emitenteXML.endereco.cep && ` - CEP: ${formatarCEP(emitenteXML.endereco.cep)}`}
                            </div>
                          </div>
                        )}
                        {emitenteXML.telefone && (
                          <div>
                            <span className="text-muted-foreground">Telefone:</span>
                            <span className="ml-1">{emitenteXML.telefone}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Controles de seleção */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAll"
                    checked={produtosXML.every(p => p.selecionado)}
                    onCheckedChange={toggleTodosSelecionados}
                  />
                  <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                    Selecionar todos
                  </Label>
                </div>
                <Badge variant="secondary">
                  {produtosXML.filter(p => p.selecionado).length} de {produtosXML.length} selecionado(s)
                </Badge>
              </div>

              {/* Lista de produtos */}
              <ScrollArea className="flex-1 min-h-[250px] max-h-[40vh]">
                <div className="space-y-2 pr-4">
                  {produtosXML.map((produto) => (
                    <div 
                      key={produto.id}
                      className={`border rounded-lg transition-colors ${
                        produto.selecionado ? "bg-primary/5 border-primary/30" : "opacity-60 border-border"
                      }`}
                    >
                      {/* Linha principal do produto */}
                      <div 
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => toggleProdutoExpandido(produto.id)}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={produto.selecionado}
                            onCheckedChange={() => toggleProdutoSelecionado(produto.id)}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm line-clamp-1">{produto.nome}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {produto.codigo && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    Cód: {produto.codigo}
                                  </Badge>
                                )}
                                {produto.codigoBarras && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    EAN: {produto.codigoBarras}
                                  </Badge>
                                )}
                                {produto.ncm && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                                    NCM: {produto.ncm}
                                  </Badge>
                                )}
                                {produto.cfop && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                                    CFOP: {produto.cfop}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm">
                                <span className="text-muted-foreground">
                                  {produto.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {produto.unidade}
                                </span>
                                <span className="mx-1">×</span>
                                <span>{formatarPreco(produto.valorUnitario)}</span>
                              </p>
                              <p className="font-semibold text-primary">{formatarPreco(produto.valorTotal)}</p>
                            </div>
                          </div>
                        </div>

                        <div className={`transition-transform ${produtoExpandido === produto.id ? 'rotate-180' : ''}`}>
                          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Detalhes expandidos */}
                      {produtoExpandido === produto.id && (
                        <div className="px-3 pb-3 pt-0 border-t bg-muted/20">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs">
                            {/* Informações Gerais */}
                            <div className="space-y-1">
                              <p className="font-semibold text-muted-foreground uppercase text-[10px]">Informações</p>
                              <div>
                                <span className="text-muted-foreground">Unidade:</span>
                                <span className="ml-1 font-medium">{produto.unidade}</span>
                              </div>
                              {produto.cest && (
                                <div>
                                  <span className="text-muted-foreground">CEST:</span>
                                  <span className="ml-1 font-mono">{produto.cest}</span>
                                </div>
                              )}
                              {produto.valorDesconto && produto.valorDesconto > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Desconto:</span>
                                  <span className="ml-1 text-destructive">{formatarPreco(produto.valorDesconto)}</span>
                                </div>
                              )}
                            </div>

                            {/* ICMS */}
                            <div className="space-y-1">
                              <p className="font-semibold text-muted-foreground uppercase text-[10px]">ICMS</p>
                              <div>
                                <span className="text-muted-foreground">Origem:</span>
                                <span className="ml-1 font-medium">{produto.icmsOrigem || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">CST:</span>
                                <span className="ml-1 font-mono">{produto.icmsCST || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Alíquota:</span>
                                <span className="ml-1">{produto.icmsAliquota ? `${produto.icmsAliquota}%` : '-'}</span>
                              </div>
                              {produto.icmsBase !== undefined && produto.icmsBase > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Base:</span>
                                  <span className="ml-1">{formatarPreco(produto.icmsBase)}</span>
                                </div>
                              )}
                              {produto.icmsValor !== undefined && produto.icmsValor > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Valor:</span>
                                  <span className="ml-1">{formatarPreco(produto.icmsValor)}</span>
                                </div>
                              )}
                            </div>

                            {/* IPI */}
                            <div className="space-y-1">
                              <p className="font-semibold text-muted-foreground uppercase text-[10px]">IPI</p>
                              {produto.ipiCodigo && (
                                <div>
                                  <span className="text-muted-foreground">Código:</span>
                                  <span className="ml-1 font-mono">{produto.ipiCodigo}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">Alíquota:</span>
                                <span className="ml-1">{produto.ipiAliquota ? `${produto.ipiAliquota}%` : '-'}</span>
                              </div>
                              {produto.ipiBase !== undefined && produto.ipiBase > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Base:</span>
                                  <span className="ml-1">{formatarPreco(produto.ipiBase)}</span>
                                </div>
                              )}
                              {produto.ipiValor !== undefined && produto.ipiValor > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Valor:</span>
                                  <span className="ml-1">{formatarPreco(produto.ipiValor)}</span>
                                </div>
                              )}
                            </div>

                            {/* PIS/COFINS */}
                            <div className="space-y-1">
                              <p className="font-semibold text-muted-foreground uppercase text-[10px]">PIS/COFINS</p>
                              <div>
                                <span className="text-muted-foreground">PIS CST:</span>
                                <span className="ml-1 font-mono">{produto.pisCST || '-'}</span>
                                {produto.pisAliquota ? <span className="ml-1">({produto.pisAliquota}%)</span> : null}
                              </div>
                              {produto.pisValor !== undefined && produto.pisValor > 0 && (
                                <div>
                                  <span className="text-muted-foreground">PIS Valor:</span>
                                  <span className="ml-1">{formatarPreco(produto.pisValor)}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">COFINS CST:</span>
                                <span className="ml-1 font-mono">{produto.cofinsCST || '-'}</span>
                                {produto.cofinsAliquota ? <span className="ml-1">({produto.cofinsAliquota}%)</span> : null}
                              </div>
                              {produto.cofinsValor !== undefined && produto.cofinsValor > 0 && (
                                <div>
                                  <span className="text-muted-foreground">COFINS Valor:</span>
                                  <span className="ml-1">{formatarPreco(produto.cofinsValor)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Resumo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t gap-2">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Total selecionado:</strong>{" "}
                    <span className="text-primary font-semibold">
                      {formatarPreco(
                        produtosXML
                          .filter(p => p.selecionado)
                          .reduce((acc, p) => acc + p.valorTotal, 0)
                      )}
                    </span>
                  </p>
                  <p className="text-xs">
                    Clique em um produto para ver os detalhes fiscais
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Os produtos serão criados com status "Ativo"</span>
                </div>
              </div>
            </>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={fecharImportDialog}
              disabled={importando}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={importarProdutosSelecionados}
              disabled={importando || produtosXML.filter(p => p.selecionado).length === 0}
              className="w-full sm:w-auto bg-gradient-primary text-white"
            >
              {importando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Importar {produtosXML.filter(p => p.selecionado).length} Produto(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}