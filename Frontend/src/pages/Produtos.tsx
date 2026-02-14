
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
  X,
  Building2,
  UserPlus,
  Receipt,
  Download,
  CheckSquare,
  Square,
  Copy,
  Eye
} from "lucide-react";

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  preco_compra?: number;
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
  categoria_id?: number;
  categoria_nome?: string;
  fornecedor_id?: number;
  marca?: string;
  modelo?: string;
  imagens?: string[];
  destaque: boolean;
  data_criacao: string;
  data_atualizacao: string;
  // Campos de impostos
  ncm?: string;
  cfop?: string;
  cst?: string;
  icms_aliquota?: number;
  icms_origem?: string;
  icms_situacao_tributaria?: string;
  ipi_aliquota?: number;
  ipi_codigo_enquadramento?: string;
  pis_aliquota?: number;
  pis_cst?: string;
  cofins_aliquota?: number;
  cofins_cst?: string;
}

// Interface para fornecedor no export
interface FornecedorExport {
  id: number;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  contato?: string;
  observacoes?: string;
  status: string;
  data_criacao?: string;
  data_atualizacao?: string;
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
  nfeId: string; // ID da NF-e de origem
  nfeNumero: string; // Número da NF-e para exibição
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
  const [filtroImpostos, setFiltroImpostos] = useState(""); // Filtro de impostos: '', 'com_impostos', 'sem_impostos'
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<{id: number, nome: string} | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Estados para importação XML
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [produtosXML, setProdutosXML] = useState<ProdutoXML[]>([]);
  const [emitentesXML, setEmitentesXML] = useState<{[key: string]: EmitenteXML}>({});
  const [dadosNFesXML, setDadosNFesXML] = useState<{[key: string]: DadosNFeXML}>({});
  const [importando, setImportando] = useState(false);
  const [xmlFileNames, setXmlFileNames] = useState<string[]>([]);
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [produtoExpandido, setProdutoExpandido] = useState<string | null>(null);
  const [nfeExpandida, setNfeExpandida] = useState<string | null>(null);
  const [criarFornecedores, setCriarFornecedores] = useState(true); // Criar fornecedores automaticamente
  const [fornecedoresCriados, setFornecedoresCriados] = useState<{[documento: string]: number}>({}); // Mapa CNPJ -> ID do fornecedor
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para exportação XML
  const [modoSelecao, setModoSelecao] = useState(false);
  const [produtosSelecionados, setProdutosSelecionados] = useState<Set<number>>(new Set());
  const [exportando, setExportando] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [xmlPreview, setXmlPreview] = useState("");
  const [exportInfo, setExportInfo] = useState<{totalProdutos: number, totalFornecedores: number}>({totalProdutos: 0, totalFornecedores: 0});
  const [produtosExport, setProdutosExport] = useState<Produto[]>([]);
  const [fornecedoresExport, setFornecedoresExport] = useState<FornecedorExport[]>([]);
  const [produtoExportExpandido, setProdutoExportExpandido] = useState<number | null>(null);
  const [fornecedorExpandido, setFornecedorExpandido] = useState<number | null>(null);
  const [visualizacaoXML, setVisualizacaoXML] = useState<'formatado' | 'xml'>('formatado');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const produtosApi = useCrudApi<ProdutosResponse>(API_ENDPOINTS.PRODUCTS.LIST);
  const deleteApi = useCrudApi(API_ENDPOINTS.PRODUCTS.LIST);
  const categoriasApi = useCrudApi<{categorias: Categoria[]}>(API_ENDPOINTS.CATALOG.CATEGORIES);
  const importApi = useCrudApi(API_ENDPOINTS.PRODUCTS.IMPORT); // Rota de importação com upsert
  const fornecedoresApi = useCrudApi(API_ENDPOINTS.FORNECEDORES.LIST); // API de fornecedores

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
        limit: 10000, // Listar todos os produtos sem paginação
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

  // ============ FUNÇÕES PARA EXPORTAÇÃO XML ============
  
  // Função para alternar seleção de produto
  const toggleSelecaoProduto = (id: number) => {
    const novaSelecao = new Set(produtosSelecionados);
    if (novaSelecao.has(id)) {
      novaSelecao.delete(id);
    } else {
      novaSelecao.add(id);
    }
    setProdutosSelecionados(novaSelecao);
  };

  // Função para selecionar/desselecionar todos os produtos
  const toggleSelecionarTodos = () => {
    if (produtosSelecionados.size === produtos.length) {
      setProdutosSelecionados(new Set());
    } else {
      setProdutosSelecionados(new Set(produtos.map(p => p.id)));
    }
  };

  // Função para cancelar modo de seleção
  const cancelarModoSelecao = () => {
    setModoSelecao(false);
    setProdutosSelecionados(new Set());
  };

  // Função para buscar dados do fornecedor
  const buscarFornecedor = async (fornecedorId: number): Promise<FornecedorExport | null> => {
    try {
      const response = await fornecedoresApi.get(fornecedorId);
      // O backend retorna { success: true, data: fornecedor }
      if (response && response.data) {
        return response.data as FornecedorExport;
      }
      // Se o response for o fornecedor diretamente
      if (response && response.id) {
        return response as unknown as FornecedorExport;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      return null;
    }
  };

  // Função para escapar caracteres especiais XML
  const escapeXML = (text: string | undefined | null): string => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Função para gerar XML dos produtos
  const gerarXMLProdutos = async (): Promise<string> => {
    // Buscar dados completos dos produtos selecionados com fornecedores
    const produtosParaExportar = produtos.filter(p => produtosSelecionados.has(p.id));
    
    // Buscar fornecedores únicos
    const fornecedorIds = [...new Set(produtosParaExportar.map(p => p.fornecedor_id).filter(Boolean))] as number[];
    const fornecedoresMap: {[id: number]: FornecedorExport} = {};
    
    for (const fornecedorId of fornecedorIds) {
      const fornecedor = await buscarFornecedor(fornecedorId);
      if (fornecedor) {
        fornecedoresMap[fornecedorId] = fornecedor;
      }
    }

    // Atualizar info de exportação
    setExportInfo({
      totalProdutos: produtosParaExportar.length,
      totalFornecedores: Object.keys(fornecedoresMap).length
    });

    // Gerar XML no formato compatível com NF-e para reimportação
    const dataExportacao = new Date().toISOString();
    const dataFormatada = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Agrupar produtos por fornecedor para criar estrutura similar à NF-e
    const produtosPorFornecedor: {[key: string]: Produto[]} = {};
    
    for (const produto of produtosParaExportar) {
      const fornecedorKey = produto.fornecedor_id ? String(produto.fornecedor_id) : 'sem_fornecedor';
      if (!produtosPorFornecedor[fornecedorKey]) {
        produtosPorFornecedor[fornecedorKey] = [];
      }
      produtosPorFornecedor[fornecedorKey].push(produto);
    }
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe versao="4.00" Id="NFe_EXPORT_${Date.now()}">
      <ide>
        <cUF>00</cUF>
        <cNF>00000000</cNF>
        <natOp>EXPORTACAO DE PRODUTOS</natOp>
        <mod>55</mod>
        <serie>001</serie>
        <nNF>${Date.now()}</nNF>
        <dhEmi>${dataFormatada}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>0000000</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>0</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>KONTROLLA_EXPORT_1.0</verProc>
      </ide>
`;
    
    // Adicionar emitente (primeiro fornecedor ou dados genéricos)
    const primeiroFornecedor = Object.values(fornecedoresMap)[0];
    if (primeiroFornecedor) {
      xml += `      <emit>
        <CNPJ>${escapeXML((primeiroFornecedor.cnpj || '').replace(/\D/g, ''))}</CNPJ>
        <xNome>${escapeXML(primeiroFornecedor.razao_social || primeiroFornecedor.nome)}</xNome>
        <xFant>${escapeXML(primeiroFornecedor.nome)}</xFant>
        <enderEmit>
          <xLgr>${escapeXML(primeiroFornecedor.endereco || '')}</xLgr>
          <nro>S/N</nro>
          <xBairro>CENTRO</xBairro>
          <cMun>0000000</cMun>
          <xMun>${escapeXML(primeiroFornecedor.cidade || '')}</xMun>
          <UF>${escapeXML(primeiroFornecedor.estado || '')}</UF>
          <CEP>${escapeXML((primeiroFornecedor.cep || '').replace(/\D/g, ''))}</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
          <fone>${escapeXML((primeiroFornecedor.telefone || '').replace(/\D/g, ''))}</fone>
        </enderEmit>
        <IE></IE>
        <CRT>3</CRT>
      </emit>
`;
    } else {
      xml += `      <emit>
        <CNPJ>00000000000000</CNPJ>
        <xNome>EXPORTACAO KONTROLLA</xNome>
        <xFant>KONTROLLA</xFant>
        <enderEmit>
          <xLgr>ENDERECO</xLgr>
          <nro>S/N</nro>
          <xBairro>CENTRO</xBairro>
          <cMun>0000000</cMun>
          <xMun>CIDADE</xMun>
          <UF>UF</UF>
          <CEP>00000000</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
        </enderEmit>
        <IE></IE>
        <CRT>3</CRT>
      </emit>
`;
    }
    
    // Adicionar produtos no formato NF-e
    let itemNum = 1;
    for (const produto of produtosParaExportar) {
      const estoqueAtual = obterEstoqueAtual(produto);
      const unidade = produto.tipo_preco === 'kg' ? 'KG' : produto.tipo_preco === 'litros' ? 'LT' : 'UN';
      const precoNum = Number(produto.preco) || 0;
      const valorTotal = precoNum * (estoqueAtual || 1);
      
      // Extrair valores de impostos REAIS (null/undefined se não cadastrado)
      const icmsOrigem = produto.icms_origem?.trim() || null;
      const icmsCST = produto.icms_situacao_tributaria?.trim() || produto.cst?.trim() || null;
      const icmsAliquota = produto.icms_aliquota != null ? Number(produto.icms_aliquota) : null;
      const ipiCodEnq = produto.ipi_codigo_enquadramento?.trim() || null;
      const ipiAliquota = produto.ipi_aliquota != null ? Number(produto.ipi_aliquota) : null;
      const pisCST = produto.pis_cst?.trim() || null;
      const pisAliquota = produto.pis_aliquota != null ? Number(produto.pis_aliquota) : null;
      const cofinsCST = produto.cofins_cst?.trim() || null;
      const cofinsAliquota = produto.cofins_aliquota != null ? Number(produto.cofins_aliquota) : null;
      const ncmValor = (produto.ncm || '').replace(/\D/g, '').trim() || null;
      const cfopValor = (produto.cfop || '').replace(/\D/g, '').trim() || null;
      
      // Verificar se tem algum imposto cadastrado
      const temICMS = icmsOrigem || icmsCST || (icmsAliquota != null && icmsAliquota > 0);
      const temIPI = ipiCodEnq || (ipiAliquota != null && ipiAliquota > 0);
      const temPIS = pisCST || (pisAliquota != null && pisAliquota > 0);
      const temCOFINS = cofinsCST || (cofinsAliquota != null && cofinsAliquota > 0);
      const temImpostos = temICMS || temIPI || temPIS || temCOFINS || ncmValor || cfopValor;
      
      xml += `      <det nItem="${itemNum}">
        <prod>
          <cProd>${escapeXML(produto.sku || String(produto.id))}</cProd>
          <cEAN>${escapeXML(produto.codigo_barras || '')}</cEAN>
          <xProd>${escapeXML(produto.nome)}</xProd>
          <NCM>${ncmValor || ''}</NCM>
          <CEST></CEST>
          <CFOP>${cfopValor || ''}</CFOP>
          <uCom>${unidade}</uCom>
          <qCom>${estoqueAtual.toFixed(4)}</qCom>
          <vUnCom>${precoNum.toFixed(4)}</vUnCom>
          <vProd>${valorTotal.toFixed(2)}</vProd>
          <cEANTrib>${escapeXML(produto.codigo_barras || '')}</cEANTrib>
          <uTrib>${unidade}</uTrib>
          <qTrib>${estoqueAtual.toFixed(4)}</qTrib>
          <vUnTrib>${precoNum.toFixed(4)}</vUnTrib>
          <indTot>1</indTot>
        </prod>`;
      
      // Adicionar impostos apenas se houver algum cadastrado
      if (temImpostos) {
        xml += `
        <imposto>`;
        
        // ICMS - apenas se tiver dados cadastrados
        if (temICMS) {
          const icmsAliqNum = icmsAliquota || 0;
          const icmsValor = (valorTotal * icmsAliqNum) / 100;
          xml += `
          <ICMS>
            <ICMS00>
              <orig>${icmsOrigem || ''}</orig>
              <CST>${icmsCST || ''}</CST>
              <modBC>3</modBC>
              <vBC>${valorTotal.toFixed(2)}</vBC>
              <pICMS>${icmsAliqNum.toFixed(2)}</pICMS>
              <vICMS>${icmsValor.toFixed(2)}</vICMS>
            </ICMS00>
          </ICMS>`;
        }
        
        // IPI - apenas se tiver dados cadastrados
        if (temIPI) {
          const ipiAliqNum = ipiAliquota || 0;
          xml += `
          <IPI>
            <cEnq>${ipiCodEnq || ''}</cEnq>
            <IPITrib>
              <CST>50</CST>
              <vBC>${valorTotal.toFixed(2)}</vBC>
              <pIPI>${ipiAliqNum.toFixed(2)}</pIPI>
              <vIPI>${((valorTotal * ipiAliqNum) / 100).toFixed(2)}</vIPI>
            </IPITrib>
          </IPI>`;
        }
        
        // PIS - apenas se tiver dados cadastrados
        if (temPIS) {
          const pisAliqNum = pisAliquota || 0;
          xml += `
          <PIS>
            <PISAliq>
              <CST>${pisCST || ''}</CST>
              <vBC>${valorTotal.toFixed(2)}</vBC>
              <pPIS>${pisAliqNum.toFixed(2)}</pPIS>
              <vPIS>${((valorTotal * pisAliqNum) / 100).toFixed(2)}</vPIS>
            </PISAliq>
          </PIS>`;
        }
        
        // COFINS - apenas se tiver dados cadastrados
        if (temCOFINS) {
          const cofinsAliqNum = cofinsAliquota || 0;
          xml += `
          <COFINS>
            <COFINSAliq>
              <CST>${cofinsCST || ''}</CST>
              <vBC>${valorTotal.toFixed(2)}</vBC>
              <pCOFINS>${cofinsAliqNum.toFixed(2)}</pCOFINS>
              <vCOFINS>${((valorTotal * cofinsAliqNum) / 100).toFixed(2)}</vCOFINS>
            </COFINSAliq>
          </COFINS>`;
        }
        
        xml += `
        </imposto>`;
      }
      
      xml += `
      </det>
`;
      itemNum++;
    }
    
    // Calcular totais
    const totalProdutos = produtosParaExportar.reduce((acc, p) => acc + (Number(p.preco) || 0) * (obterEstoqueAtual(p) || 1), 0);
    
    xml += `      <total>
        <ICMSTot>
          <vBC>${totalProdutos.toFixed(2)}</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${totalProdutos.toFixed(2)}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${totalProdutos.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <infAdic>
        <infCpl>EXPORTACAO DE PRODUTOS KONTROLLA - ${dataFormatada} - Total de ${produtosParaExportar.length} produto(s)</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>KONTROLLA_EXPORT_1.0</verAplic>
      <chNFe>00000000000000000000000000000000000000000000</chNFe>
      <dhRecbto>${dataFormatada}</dhRecbto>
      <nProt>000000000000000</nProt>
      <digVal></digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

    return xml;
  };

  // Função para pré-visualizar XML antes de exportar
  const preVisualizarXML = async () => {
    if (produtosSelecionados.size === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um produto para exportar.",
        variant: "destructive",
      });
      return;
    }

    setExportando(true);

    try {
      // Buscar dados completos dos produtos selecionados com fornecedores
      const produtosParaExportar = produtos.filter(p => produtosSelecionados.has(p.id));
      
      // Buscar fornecedores únicos
      const fornecedorIds = [...new Set(produtosParaExportar.map(p => p.fornecedor_id).filter(Boolean))] as number[];
      const fornecedoresMap: {[id: number]: FornecedorExport} = {};
      
      for (const fornecedorId of fornecedorIds) {
        const fornecedor = await buscarFornecedor(fornecedorId);
        if (fornecedor) {
          fornecedoresMap[fornecedorId] = fornecedor;
        }
      }

      // Salvar dados para visualização formatada
      setProdutosExport(produtosParaExportar);
      setFornecedoresExport(Object.values(fornecedoresMap));
      
      const xml = await gerarXMLProdutos();
      setXmlPreview(xml);
      setVisualizacaoXML('formatado');
      setShowExportPreview(true);
    } catch (error) {
      console.error('Erro ao gerar pré-visualização:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a pré-visualização. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportando(false);
    }
  };

  // Função para baixar o XML
  const baixarXML = () => {
    if (!xmlPreview) return;

    const blob = new Blob([xmlPreview], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produtos_export_${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Sucesso",
      description: `${exportInfo.totalProdutos} produto(s) exportado(s) com sucesso!`,
    });

    // Fechar modal e limpar seleção
    setShowExportPreview(false);
    setXmlPreview("");
    cancelarModoSelecao();
  };

  // Função para copiar XML para clipboard
  const copiarXML = async () => {
    if (!xmlPreview) return;

    try {
      await navigator.clipboard.writeText(xmlPreview);
      toast({
        title: "Copiado!",
        description: "XML copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o XML.",
        variant: "destructive",
      });
    }
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

  // Interface para resultado do parse de XML
  interface ParseXMLResult {
    produtos: ProdutoXML[];
    emitente: EmitenteXML | null;
    dadosNFe: DadosNFeXML | null;
    nfeId: string;
  }

  // Função para processar o XML e extrair produtos
  const parseXMLProdutos = (xmlString: string, fileIndex: number): ParseXMLResult => {
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
    
    // Criar ID único para esta NF-e
    const nfeId = `nfe-${fileIndex}-${dadosNFe?.numero || Date.now()}`;
    const nfeNumero = dadosNFe?.numero || `${fileIndex + 1}`;

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
        id: `xml-${fileIndex}-${i}-${Date.now()}`,
        selecionado: true,
        nfeId,
        nfeNumero,
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

    return { produtos, emitente, dadosNFe, nfeId };
  };

  // Função para lidar com a seleção de múltiplos arquivos XML
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Verificar extensões
    const arquivosInvalidos: string[] = [];
    const arquivosValidos: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith(".xml")) {
        arquivosInvalidos.push(file.name);
      } else {
        arquivosValidos.push(file);
      }
    }

    if (arquivosInvalidos.length > 0) {
      setXmlError(`Arquivos inválidos (não são XML): ${arquivosInvalidos.join(", ")}`);
      if (arquivosValidos.length === 0) return;
    } else {
      setXmlError(null);
    }

    // Processar todos os arquivos válidos
    const nomesArquivos: string[] = [];
    const todosProdutos: ProdutoXML[] = [];
    const todosEmitentes: {[key: string]: EmitenteXML} = {};
    const todosDadosNFes: {[key: string]: DadosNFeXML} = {};
    const errosProcessamento: string[] = [];

    const processarArquivo = (file: File, index: number): Promise<void> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const xmlString = e.target?.result as string;
            const resultado = parseXMLProdutos(xmlString, index);
            
            nomesArquivos.push(file.name);
            todosProdutos.push(...resultado.produtos);
            
            if (resultado.emitente) {
              todosEmitentes[resultado.nfeId] = resultado.emitente;
            }
            if (resultado.dadosNFe) {
              todosDadosNFes[resultado.nfeId] = resultado.dadosNFe;
            }
          } catch (error) {
            console.error(`Erro ao processar ${file.name}:`, error);
            errosProcessamento.push(`${file.name}: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
          }
          resolve();
        };
        reader.onerror = () => {
          errosProcessamento.push(`${file.name}: Erro ao ler o arquivo`);
          resolve();
        };
        reader.readAsText(file);
      });
    };

    // Processar todos os arquivos em paralelo
    await Promise.all(arquivosValidos.map((file, index) => processarArquivo(file, index)));

    // Atualizar estados
    if (todosProdutos.length > 0) {
      setXmlFileNames(nomesArquivos);
      setProdutosXML(todosProdutos);
      setEmitentesXML(todosEmitentes);
      setDadosNFesXML(todosDadosNFes);
      setShowImportDialog(true);
    }

    if (errosProcessamento.length > 0) {
      setXmlError(`Erros ao processar: ${errosProcessamento.join("; ")}`);
    }

    // Limpar input para permitir selecionar os mesmos arquivos novamente
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

  // Função para buscar fornecedor existente pelo CNPJ
  const buscarFornecedorPorCnpj = async (cnpj: string): Promise<number | null> => {
    try {
      // Buscar fornecedor pelo CNPJ exato
      const response = await fornecedoresApi.list({ q: cnpj, limit: 100 });
      
      // A resposta pode vir em diferentes formatos
      const fornecedores = response?.data || response?.fornecedores || response || [];
      
      if (Array.isArray(fornecedores) && fornecedores.length > 0) {
        // Buscar o fornecedor com CNPJ exato (removendo formatação para comparar)
        const cnpjLimpo = cnpj.replace(/\D/g, '');
        const fornecedorExato = fornecedores.find((f: any) => {
          const fornecedorCnpj = (f.cnpj || '').replace(/\D/g, '');
          return fornecedorCnpj === cnpjLimpo;
        });
        
        if (fornecedorExato) {
          return fornecedorExato.id;
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      return null;
    }
  };

  // Função para criar fornecedor a partir dos dados do emitente do XML
  // Retorna o ID do fornecedor criado ou existente
  const criarFornecedorDoXML = async (emitente: EmitenteXML, dadosNFe: DadosNFeXML | null): Promise<number | null> => {
    // Verificar se tem CNPJ ou CPF
    const documentoOriginal = emitente.cnpj || emitente.cpf;
    if (!documentoOriginal) return null;

    // Limpar documento (remover formatação)
    const documento = documentoOriginal.replace(/\D/g, '');

    // Verificar se já foi criado nesta sessão de importação
    if (fornecedoresCriados[documento]) {
      return fornecedoresCriados[documento]; // Retornar ID já conhecido
    }

    try {
      // PRIMEIRO: Verificar se o fornecedor já existe pelo CNPJ
      if (emitente.cnpj) {
        const cnpjLimpo = emitente.cnpj.replace(/\D/g, '');
        const fornecedorExistenteId = await buscarFornecedorPorCnpj(cnpjLimpo);
        if (fornecedorExistenteId) {
          // Fornecedor já existe, salvar no mapa e retornar o ID
          setFornecedoresCriados(prev => ({ ...prev, [documento]: fornecedorExistenteId }));
          return fornecedorExistenteId;
        }
      }

      // Verificar se tem nome válido (mínimo 2 caracteres)
      const nomeOriginal = emitente.nomeFantasia || emitente.razaoSocial || '';
      if (nomeOriginal.trim().length < 2) {
        console.warn('Fornecedor sem nome válido, pulando criação');
        return null;
      }

      // Limpar e validar telefone (deve ter entre 10 e 20 dígitos)
      let telefone: string | null = null;
      if (emitente.telefone) {
        const telLimpo = emitente.telefone.replace(/\D/g, '');
        if (telLimpo.length >= 10 && telLimpo.length <= 20) {
          telefone = telLimpo;
        }
      }

      // Limpar CEP (deve ter exatamente 8 dígitos)
      let cep: string | null = null;
      if (emitente.endereco.cep) {
        const cepLimpo = emitente.endereco.cep.replace(/\D/g, '');
        if (cepLimpo.length === 8) {
          cep = cepLimpo;
        }
      }

      // Limpar CNPJ (deve ter exatamente 14 dígitos)
      let cnpj: string | null = null;
      if (emitente.cnpj) {
        const cnpjLimpo = emitente.cnpj.replace(/\D/g, '');
        if (cnpjLimpo.length === 14) {
          cnpj = cnpjLimpo;
        }
      }

      // Validar estado (deve ter exatamente 2 caracteres)
      let estado: string | null = null;
      if (emitente.endereco.uf && emitente.endereco.uf.length === 2) {
        estado = emitente.endereco.uf.toUpperCase();
      }

      // Preparar dados do fornecedor
      const dadosFornecedor: Record<string, any> = {
        nome: nomeOriginal.trim().substring(0, 255),
        status: 'ativo'
      };

      // Adicionar campos opcionais apenas se válidos
      if (emitente.razaoSocial && emitente.razaoSocial.trim()) {
        dadosFornecedor.razao_social = emitente.razaoSocial.trim().substring(0, 255);
      }
      if (cnpj) {
        dadosFornecedor.cnpj = cnpj;
      }
      if (telefone) {
        dadosFornecedor.telefone = telefone;
      }
      if (cep) {
        dadosFornecedor.cep = cep;
      }
      if (estado) {
        dadosFornecedor.estado = estado;
      }
      if (emitente.endereco.cidade && emitente.endereco.cidade.trim()) {
        dadosFornecedor.cidade = emitente.endereco.cidade.trim().substring(0, 100);
      }
      if (emitente.endereco.logradouro) {
        const endereco = `${emitente.endereco.logradouro}${emitente.endereco.numero ? `, ${emitente.endereco.numero}` : ''}${emitente.endereco.bairro ? ` - ${emitente.endereco.bairro}` : ''}`;
        dadosFornecedor.endereco = endereco.substring(0, 500);
      }
      
      dadosFornecedor.observacoes = dadosNFe 
        ? `Fornecedor cadastrado automaticamente via importação de NF-e ${dadosNFe.numero} em ${formatarDataXML(dadosNFe.dataEmissao)}`
        : 'Fornecedor cadastrado automaticamente via importação de XML';

      // Tentar criar o fornecedor (só chega aqui se não existe)
      const response = await fornecedoresApi.create(dadosFornecedor);
      
      // Extrair ID do fornecedor criado
      const fornecedorId = response?.data?.id || response?.id;
      
      if (fornecedorId) {
        // Salvar no mapa de fornecedores criados
        setFornecedoresCriados(prev => ({ ...prev, [documento]: fornecedorId }));
        return fornecedorId;
      }
      
      return null;
    } catch (error: any) {
      // Se ainda assim ocorrer erro 409, tentar buscar novamente
      if (error.message?.includes('CNPJ já cadastrado') || error.message?.includes('duplicate') || error.message?.includes('409') || error.message?.includes('Conflict')) {
        // Buscar o fornecedor existente pelo CNPJ
        if (emitente.cnpj) {
          const cnpjLimpo = emitente.cnpj.replace(/\D/g, '');
          const fornecedorExistenteId = await buscarFornecedorPorCnpj(cnpjLimpo);
          if (fornecedorExistenteId) {
            setFornecedoresCriados(prev => ({ ...prev, [documento]: fornecedorExistenteId }));
            return fornecedorExistenteId;
          }
        }
        return null;
      }
      console.error('Erro ao criar fornecedor:', error);
      return null;
    }
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
    let fornecedoresCriadosCount = 0;
    let produtosVinculados = 0; // Produtos vinculados a fornecedores
    const errosDetalhes: string[] = [];

    // Mapa de nfeId -> fornecedor_id para vincular aos produtos
    const nfeFornecedorMap: {[nfeId: string]: number | null} = {};

    // Criar fornecedores automaticamente se a opção estiver habilitada
    if (criarFornecedores) {
      const nfeIdsUnicos = [...new Set(selecionados.map(p => p.nfeId))];
      
      for (const nfeId of nfeIdsUnicos) {
        const emitente = emitentesXML[nfeId];
        const dadosNFe = dadosNFesXML[nfeId];
        
        if (emitente) {
          const documento = (emitente.cnpj || emitente.cpf)?.replace(/\D/g, '');
          
          // Verificar se já temos o ID do fornecedor
          if (documento && fornecedoresCriados[documento]) {
            nfeFornecedorMap[nfeId] = fornecedoresCriados[documento];
          } else if (documento) {
            // Criar o fornecedor e obter o ID
            const fornecedorId = await criarFornecedorDoXML(emitente, dadosNFe);
            nfeFornecedorMap[nfeId] = fornecedorId;
            if (fornecedorId) {
              fornecedoresCriadosCount++;
            }
          }
        }
      }
    }

    for (const produtoXML of selecionados) {
      try {
        const tipoPreco = converterUnidade(produtoXML.unidade);
        const emitenteDoXML = emitentesXML[produtoXML.nfeId];
        const dadosNFeDoXML = dadosNFesXML[produtoXML.nfeId];
        const fornecedorIdDoProduto = nfeFornecedorMap[produtoXML.nfeId];
        
        // Preparar dados do produto mapeando EXATAMENTE para as colunas da tabela
        // IMPORTANTE: Não enviar campos opcionais como null, apenas omitir
        const dadosProduto: Record<string, any> = {
          // Dados básicos do produto
          nome: produtoXML.nome.substring(0, 255),
          descricao: emitenteDoXML 
            ? `[NF-e ${dadosNFeDoXML?.numero || ''} - ${formatarDataXML(dadosNFeDoXML?.dataEmissao || '')}] ${emitenteDoXML.razaoSocial}`
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

        // Vincular fornecedor ao produto se disponível
        if (fornecedorIdDoProduto) {
          dadosProduto.fornecedor_id = fornecedorIdDoProduto;
        }

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
        
        // Contar se foi vinculado a fornecedor
        if (fornecedorIdDoProduto) {
          produtosVinculados++;
        }
      } catch (error) {
        erros++;
        errosDetalhes.push(`${produtoXML.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        console.error(`Erro ao importar produto ${produtoXML.nome}:`, error);
      }
    }

    setImportando(false);

    const totalSucessos = criados + atualizados;
    
    if (totalSucessos > 0 || fornecedoresCriadosCount > 0) {
      // Montar mensagem detalhada
      const partes: string[] = [];
      if (fornecedoresCriadosCount > 0) partes.push(`${fornecedoresCriadosCount} fornecedor(es) criado(s)`);
      if (criados > 0) partes.push(`${criados} produto(s) novo(s)`);
      if (atualizados > 0) partes.push(`${atualizados} produto(s) atualizado(s)`);
      if (produtosVinculados > 0) partes.push(`${produtosVinculados} vinculado(s) a fornecedor`);
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
      setEmitentesXML({});
      setDadosNFesXML({});
      setXmlFileNames([]);
      setNfeExpandida(null);
      setFornecedoresCriados({}); // Resetar mapa de fornecedores criados
    }
  };

  // Função para fechar o modal de importação
  const fecharImportDialog = () => {
    setShowImportDialog(false);
    setProdutosXML([]);
    setEmitentesXML({});
    setDadosNFesXML({});
    setXmlFileNames([]);
    setXmlError(null);
    setProdutoExpandido(null);
    setNfeExpandida(null);
    setFornecedoresCriados({}); // Resetar mapa de fornecedores criados
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

  // Verificar se o produto tem impostos cadastrados
  const temImpostosCadastrados = (produto: Produto): boolean => {
    return !!(
      produto.ncm ||
      produto.cfop ||
      produto.cst ||
      produto.icms_aliquota ||
      produto.icms_origem ||
      produto.icms_situacao_tributaria ||
      produto.ipi_aliquota ||
      produto.ipi_codigo_enquadramento ||
      produto.pis_aliquota ||
      produto.pis_cst ||
      produto.cofins_aliquota ||
      produto.cofins_cst
    );
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

  // Filtrar produtos baseado no filtro de impostos
  const filtrarProdutosPorImpostos = (produtos: Produto[]) => {
    if (!filtroImpostos) return produtos;

    switch (filtroImpostos) {
      case 'com_impostos':
        return produtos.filter(p => temImpostosCadastrados(p));
      case 'sem_impostos':
        return produtos.filter(p => !temImpostosCadastrados(p));
      default:
        return produtos;
    }
  };

  // Aplicar todos os filtros
  const produtosFiltradosEstoque = filtrarProdutosPorEstoque(todosProdutos);
  const produtos = filtrarProdutosPorImpostos(produtosFiltradosEstoque);

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
              {modoSelecao ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={cancelarModoSelecao}
                    className="border-muted-foreground/50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={toggleSelecionarTodos}
                    className="border-primary/50 hover:bg-primary/10"
                  >
                    {produtosSelecionados.size === produtos.length ? (
                      <><Square className="h-4 w-4 mr-2" />Desselecionar Todos</>
                    ) : (
                      <><CheckSquare className="h-4 w-4 mr-2" />Selecionar Todos</>
                    )}
                  </Button>
                  <Button 
                    className="bg-gradient-primary text-white"
                    onClick={preVisualizarXML}
                    disabled={produtosSelecionados.size === 0 || exportando}
                  >
                    {exportando ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exportando...</>
                    ) : (
                      <><Download className="h-4 w-4 mr-2" />Exportar {produtosSelecionados.size} XML</>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setModoSelecao(true)}
                    className="border-green-500/50 hover:bg-green-500/10 text-green-600 dark:text-green-400"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar XML
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={abrirSeletorArquivo}
                    className="border-primary/50 hover:bg-primary/10"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar XML(s)
                  </Button>
                  <Button className="bg-gradient-primary text-white" onClick={() => navigate("/dashboard/novo-produto")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Botões - Mobile */}
        <div className="md:hidden w-full space-y-2">
          {hasPermission('produtos_criar') && (
            <>
              {modoSelecao ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1 text-xs sm:text-sm"
                      onClick={cancelarModoSelecao}
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span>Cancelar</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 text-xs sm:text-sm border-primary/50 hover:bg-primary/10"
                      onClick={toggleSelecionarTodos}
                    >
                      {produtosSelecionados.size === produtos.length ? (
                        <><Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /><span>Desselecionar</span></>
                      ) : (
                        <><CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /><span>Selecionar Todos</span></>
                      )}
                    </Button>
                  </div>
                  <Button 
                    className="w-full bg-gradient-primary text-white text-xs sm:text-sm"
                    onClick={preVisualizarXML}
                    disabled={produtosSelecionados.size === 0 || exportando}
                  >
                    {exportando ? (
                      <><Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" /><span>Exportando...</span></>
                    ) : (
                      <><Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /><span>Exportar {produtosSelecionados.size} XML</span></>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline"
                    className="w-full text-xs sm:text-sm border-green-500/50 hover:bg-green-500/10 text-green-600 dark:text-green-400"
                    onClick={() => setModoSelecao(true)}
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span>Exportar XML</span>
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1 text-xs sm:text-sm border-primary/50 hover:bg-primary/10" 
                      onClick={abrirSeletorArquivo}
                    >
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span>Importar XML(s)</span>
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-primary text-white text-xs sm:text-sm" 
                      onClick={() => navigate("/dashboard/novo-produto")}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span>Novo Produto</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input hidden para seleção de múltiplos arquivos XML */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        multiple
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
              <select
                value={filtroImpostos}
                onChange={(e) => setFiltroImpostos(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos os impostos</option>
                <option value="com_impostos">Com impostos</option>
                <option value="sem_impostos">Sem impostos</option>
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
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
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
              <select
                value={filtroImpostos}
                onChange={(e) => setFiltroImpostos(e.target.value)}
                className="px-2 py-2 border border-input bg-background rounded-md text-xs sm:text-sm"
              >
                <option value="">Impostos</option>
                <option value="com_impostos">Com</option>
                <option value="sem_impostos">Sem</option>
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
            <Card 
              key={produto.id} 
              className={`bg-gradient-card shadow-card hover:shadow-lg transition-shadow duration-300 flex flex-col h-full ${modoSelecao ? 'cursor-pointer' : ''} ${modoSelecao && produtosSelecionados.has(produto.id) ? 'ring-2 ring-primary border-primary' : ''}`}
              onClick={modoSelecao ? () => toggleSelecaoProduto(produto.id) : undefined}
            >
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {modoSelecao && (
                      <div 
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          produtosSelecionados.has(produto.id) 
                            ? 'bg-primary border-primary' 
                            : 'border-muted-foreground/50'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelecaoProduto(produto.id);
                        }}
                      >
                        {produtosSelecionados.has(produto.id) && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                    )}
                    <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                      <Package className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                    </div>
                  </div>
                  {obterBadgeStatus(produto)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4 flex-1">
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
              </CardContent>

              {/* Footer fixo com botões de ação */}
              {(hasPermission('produtos_editar') || hasPermission('produtos_excluir')) && (
                <div className="p-4 pt-0 mt-auto">
                  <div className="flex space-x-2 items-center border-t pt-3">
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
                    {/* Ícone de imposto - exibido se o produto tem impostos cadastrados */}
                    {temImpostosCadastrados(produto) && (
                      <div 
                        className="p-1.5 rounded-md bg-green-500/10 border border-green-500/30"
                        title="Produto com impostos cadastrados"
                      >
                        <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
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

      {/* Modal de Pré-visualização do XML */}
      <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Pré-visualização da Exportação
            </DialogTitle>
            <DialogDescription>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-primary" />
                  <strong>{exportInfo.totalProdutos}</strong> produto(s)
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-primary" />
                  <strong>{exportInfo.totalFornecedores}</strong> fornecedor(es)
                </span>
                
                {/* Toggle de visualização */}
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant={visualizacaoXML === 'formatado' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoXML('formatado')}
                    className={visualizacaoXML === 'formatado' ? 'bg-primary text-white' : ''}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Formatado
                  </Button>
                  <Button
                    variant={visualizacaoXML === 'xml' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacaoXML('xml')}
                    className={visualizacaoXML === 'xml' ? 'bg-primary text-white' : ''}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    XML
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          {visualizacaoXML === 'formatado' ? (
            <>
              {/* Fornecedores - Cards com rolagem horizontal */}
              {fornecedoresExport.length > 0 && (
                <div className="pb-3 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Fornecedores</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {fornecedoresExport.map((fornecedor) => (
                      <Card 
                        key={fornecedor.id} 
                        className="flex-shrink-0 w-[280px] bg-gradient-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setFornecedorExpandido(fornecedorExpandido === fornecedor.id ? null : fornecedor.id)}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Cabeçalho */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-sm truncate">{fornecedor.nome}</span>
                            </div>
                            <Badge variant={fornecedor.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {fornecedor.status}
                            </Badge>
                          </div>
                          
                          {/* Informações */}
                          <div className="space-y-1 text-xs">
                            {fornecedor.cnpj && (
                              <div className="text-muted-foreground font-mono text-[10px]">
                                CNPJ: {formatarCNPJ(fornecedor.cnpj)}
                              </div>
                            )}
                            {fornecedor.razao_social && (
                              <div className="text-muted-foreground truncate" title={fornecedor.razao_social}>
                                {fornecedor.razao_social}
                              </div>
                            )}
                          </div>
                          
                          {/* Detalhes expandidos */}
                          {fornecedorExpandido === fornecedor.id && (
                            <div className="pt-2 border-t space-y-1 text-xs">
                              {fornecedor.email && (
                                <div>
                                  <span className="text-muted-foreground">Email:</span>
                                  <span className="ml-1">{fornecedor.email}</span>
                                </div>
                              )}
                              {fornecedor.telefone && (
                                <div>
                                  <span className="text-muted-foreground">Telefone:</span>
                                  <span className="ml-1">{fornecedor.telefone}</span>
                                </div>
                              )}
                              {fornecedor.cidade && (
                                <div>
                                  <span className="text-muted-foreground">Local:</span>
                                  <span className="ml-1">{fornecedor.cidade}{fornecedor.estado ? `/${fornecedor.estado}` : ''}</span>
                                </div>
                              )}
                              {fornecedor.endereco && (
                                <div>
                                  <span className="text-muted-foreground">Endereço:</span>
                                  <span className="ml-1">{fornecedor.endereco}</span>
                                </div>
                              )}
                              {fornecedor.contato && (
                                <div>
                                  <span className="text-muted-foreground">Contato:</span>
                                  <span className="ml-1">{fornecedor.contato}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de produtos */}
              <div className="py-2 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Produtos ({produtosExport.length})</p>
              </div>
              
              <ScrollArea className="flex-1 min-h-[200px] max-h-[45vh] overflow-auto">
                <div className="space-y-2 pr-4">
                  {produtosExport.map((produto) => {
                    const fornecedorDoProduto = produto.fornecedor_id 
                      ? fornecedoresExport.find(f => f.id === produto.fornecedor_id) 
                      : null;
                    
                    return (
                      <div 
                        key={produto.id}
                        className="border rounded-lg transition-colors bg-primary/5 border-primary/30"
                      >
                        {/* Linha principal do produto */}
                        <div 
                          className="flex items-center gap-3 p-3 cursor-pointer"
                          onClick={() => setProdutoExportExpandido(produtoExportExpandido === produto.id ? null : produto.id)}
                        >
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm line-clamp-1">{produto.nome}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {produto.categoria_nome && (
                                    <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                                      {produto.categoria_nome}
                                    </Badge>
                                  )}
                                  {produto.codigo_barras && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      EAN: {produto.codigo_barras}
                                    </Badge>
                                  )}
                                  {produto.sku && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      SKU: {produto.sku}
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
                                <p className="font-semibold text-primary">{formatarPreco(produto.preco)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Estoque: {obterEstoqueAtual(produto)} {produto.tipo_preco === 'kg' ? 'kg' : produto.tipo_preco === 'litros' ? 'L' : 'un'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className={`transition-transform ${produtoExportExpandido === produto.id ? 'rotate-180' : ''}`}>
                            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Detalhes expandidos */}
                        {produtoExportExpandido === produto.id && (
                          <div className="px-3 pb-3 pt-0 border-t bg-muted/20">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs">
                              {/* Informações Gerais */}
                              <div className="space-y-1">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px]">Informações</p>
                                <div>
                                  <span className="text-muted-foreground">Status:</span>
                                  <span className="ml-1 font-medium">{produto.status}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Tipo:</span>
                                  <span className="ml-1">{produto.tipo_preco === 'unidade' ? 'Por Unidade' : produto.tipo_preco === 'kg' ? 'Por KG' : 'Por Litro'}</span>
                                </div>
                                {produto.marca && (
                                  <div>
                                    <span className="text-muted-foreground">Marca:</span>
                                    <span className="ml-1">{produto.marca}</span>
                                  </div>
                                )}
                                {produto.modelo && (
                                  <div>
                                    <span className="text-muted-foreground">Modelo:</span>
                                    <span className="ml-1">{produto.modelo}</span>
                                  </div>
                                )}
                                {produto.preco_compra && (
                                  <div>
                                    <span className="text-muted-foreground">Preço Compra:</span>
                                    <span className="ml-1">{formatarPreco(produto.preco_compra)}</span>
                                  </div>
                                )}
                                {produto.preco_promocional && (
                                  <div>
                                    <span className="text-muted-foreground">Preço Promo:</span>
                                    <span className="ml-1 text-green-600">{formatarPreco(produto.preco_promocional)}</span>
                                  </div>
                                )}
                              </div>

                              {/* ICMS */}
                              <div className="space-y-1">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px]">ICMS</p>
                                <div>
                                  <span className="text-muted-foreground">Origem:</span>
                                  <span className="ml-1 font-medium">{produto.icms_origem || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">CST:</span>
                                  <span className="ml-1 font-mono">{produto.icms_situacao_tributaria || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Alíquota:</span>
                                  <span className="ml-1">{produto.icms_aliquota ? `${produto.icms_aliquota}%` : '-'}</span>
                                </div>
                              </div>

                              {/* IPI */}
                              <div className="space-y-1">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px]">IPI</p>
                                {produto.ipi_codigo_enquadramento && (
                                  <div>
                                    <span className="text-muted-foreground">Código:</span>
                                    <span className="ml-1 font-mono">{produto.ipi_codigo_enquadramento}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted-foreground">Alíquota:</span>
                                  <span className="ml-1">{produto.ipi_aliquota ? `${produto.ipi_aliquota}%` : '-'}</span>
                                </div>
                              </div>

                              {/* PIS/COFINS */}
                              <div className="space-y-1">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px]">PIS/COFINS</p>
                                <div>
                                  <span className="text-muted-foreground">PIS CST:</span>
                                  <span className="ml-1 font-mono">{produto.pis_cst || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">PIS Alíq:</span>
                                  <span className="ml-1">{produto.pis_aliquota ? `${produto.pis_aliquota}%` : '-'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">COFINS CST:</span>
                                  <span className="ml-1 font-mono">{produto.cofins_cst || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">COFINS Alíq:</span>
                                  <span className="ml-1">{produto.cofins_aliquota ? `${produto.cofins_aliquota}%` : '-'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Fornecedor do produto */}
                            {fornecedorDoProduto && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px] mb-2">Fornecedor</p>
                                <div className="flex items-center gap-2 text-xs">
                                  <Building2 className="h-3 w-3 text-primary" />
                                  <span className="font-medium">{fornecedorDoProduto.nome}</span>
                                  {fornecedorDoProduto.cnpj && (
                                    <span className="text-muted-foreground font-mono">
                                      CNPJ: {formatarCNPJ(fornecedorDoProduto.cnpj)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          ) : (
            /* Visualização XML bruto */
            <div className="flex-1 overflow-hidden border rounded-lg bg-muted/30">
              <ScrollArea className="h-[50vh]">
                <pre className="p-4 text-xs sm:text-sm font-mono whitespace-pre-wrap break-all">
                  <code className="text-foreground">
                    {xmlPreview.split('\n').map((line, index) => (
                      <div key={index} className="flex">
                        <span className="text-muted-foreground w-8 sm:w-12 text-right pr-2 sm:pr-4 select-none border-r mr-2 sm:mr-4">
                          {index + 1}
                        </span>
                        <span className={
                          line.includes('<?xml') ? 'text-purple-500 dark:text-purple-400' :
                          line.includes('</') ? 'text-blue-500 dark:text-blue-400' :
                          line.includes('<') && line.includes('>') ? 'text-green-600 dark:text-green-400' :
                          'text-foreground'
                        }>
                          {line || ' '}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              </ScrollArea>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowExportPreview(false)}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              variant="outline"
              onClick={copiarXML}
              className="w-full sm:w-auto border-primary/50 hover:bg-primary/10"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar XML
            </Button>
            <Button 
              onClick={baixarXML}
              className="w-full sm:w-auto bg-gradient-primary text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar XML
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Importação de XML */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Importar Produtos do XML
            </DialogTitle>
            <DialogDescription>
              {xmlFileNames.length > 0 && (
                <span className="text-sm">
                  {xmlFileNames.length === 1 ? (
                    <>Arquivo: <strong>{xmlFileNames[0]}</strong></>
                  ) : (
                    <><strong>{xmlFileNames.length}</strong> arquivos selecionados</>
                  )}
                  {" - "}{produtosXML.length} produto(s) encontrado(s) em {Object.keys(dadosNFesXML).length} NF-e(s)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {produtosXML.length > 0 && (
            <>
              {/* Dados das NF-es e Fornecedores - Cards com rolagem horizontal */}
              <div className="pb-3 border-b">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {Object.entries(dadosNFesXML).map(([nfeId, dadosNFe]) => {
                    const emitente = emitentesXML[nfeId];
                    const produtosDaNfe = produtosXML.filter(p => p.nfeId === nfeId);
                    
                    return (
                      <Card 
                        key={nfeId} 
                        className="flex-shrink-0 w-[280px] bg-gradient-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setNfeExpandida(nfeExpandida === nfeId ? null : nfeId)}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Cabeçalho */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-sm">NF-e {dadosNFe.numero}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Série {dadosNFe.serie}
                            </Badge>
                          </div>
                          
                          {/* Informações */}
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">{produtosDaNfe.length} produto(s)</span>
                              <span className="font-semibold text-primary">{formatarPreco(dadosNFe.valorTotal)}</span>
                            </div>
                            
                            {emitente && (
                              <div className="text-muted-foreground truncate" title={emitente.razaoSocial}>
                                <Building2 className="h-3 w-3 inline mr-1" />
                                {emitente.nomeFantasia || emitente.razaoSocial}
                              </div>
                            )}
                            
                            {emitente?.cnpj && (
                              <div className="text-muted-foreground font-mono text-[10px]">
                                CNPJ: {formatarCNPJ(emitente.cnpj)}
                              </div>
                            )}
                          </div>
                          
                          {/* Detalhes expandidos */}
                          {nfeExpandida === nfeId && (
                            <div className="pt-2 border-t space-y-1 text-xs">
                              <div>
                                <span className="text-muted-foreground">Emissão:</span>
                                <span className="ml-1">{formatarDataXML(dadosNFe.dataEmissao)}</span>
                              </div>
                              {dadosNFe.naturezaOperacao && (
                                <div>
                                  <span className="text-muted-foreground">Natureza:</span>
                                  <span className="ml-1">{dadosNFe.naturezaOperacao}</span>
                                </div>
                              )}
                              {emitente?.endereco.cidade && (
                                <div>
                                  <span className="text-muted-foreground">Local:</span>
                                  <span className="ml-1">{emitente.endereco.cidade}/{emitente.endereco.uf}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Controles de seleção e opções */}
              <div className="space-y-2 py-2 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="selectAll"
                      checked={produtosXML.every(p => p.selecionado)}
                      onCheckedChange={toggleTodosSelecionados}
                    />
                    <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                      Selecionar todos os produtos
                    </Label>
                  </div>
                  <Badge variant="secondary">
                    {produtosXML.filter(p => p.selecionado).length} de {produtosXML.length} selecionado(s)
                  </Badge>
                </div>
                
                {/* Opção de criar fornecedores */}
                {Object.keys(emitentesXML).length > 0 && (
                  <div className="flex items-center gap-2 pl-0.5">
                    <Checkbox
                      id="criarFornecedores"
                      checked={criarFornecedores}
                      onCheckedChange={(checked) => setCriarFornecedores(!!checked)}
                    />
                    <Label htmlFor="criarFornecedores" className="text-sm cursor-pointer flex items-center gap-1.5">
                      <UserPlus className="h-3.5 w-3.5 text-primary" />
                      Cadastrar fornecedores automaticamente
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
                        {Object.keys(emitentesXML).length} fornecedor(es)
                      </Badge>
                    </Label>
                  </div>
                )}
              </div>

              {/* Lista de produtos */}
              <ScrollArea className="flex-1 min-h-[200px] max-h-[50vh] overflow-auto">
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
                                {Object.keys(dadosNFesXML).length > 1 && (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                                    NF-e {produto.nfeNumero}
                                  </Badge>
                                )}
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

            </>
          )}

          <DialogFooter className="flex flex-row items-center justify-between pt-2 border-t gap-2">
            {/* Resumo - lado esquerdo */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Total:</span>
                <span className="text-primary font-semibold">
                  {formatarPreco(
                    produtosXML
                      .filter(p => p.selecionado)
                      .reduce((acc, p) => acc + p.valorTotal, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>Status: Ativo</span>
              </div>
            </div>
            
            {/* Botões - lado direito */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fecharImportDialog}
                disabled={importando}
                className="text-xs h-8"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={importarProdutosSelecionados}
                disabled={importando || produtosXML.filter(p => p.selecionado).length === 0}
                className="bg-gradient-primary text-white text-xs h-8"
              >
                {importando ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1.5" />
                    Importar {produtosXML.filter(p => p.selecionado).length} Produto(s)
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}