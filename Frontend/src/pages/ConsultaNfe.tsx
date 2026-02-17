import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search, 
  FileText,
  Download,
  Eye,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FileDown,
  Import,
  DollarSign,
  Building,
  Calendar,
  Hash
} from "lucide-react";
import { useMeuDanfe, ConsultaNfeResult, NfeImportada, MeuDanfeConfig, MeuDanfeStats } from "@/hooks/useMeuDanfe";
import { useToast } from "@/hooks/use-toast";

export default function ConsultaNfe() {
  const { toast } = useToast();
  
  const {
    loading,
    error,
    nfesImportadas,
    pagination,
    fetchConfig,
    validarConfig,
    consultarNfe,
    downloadXml,
    downloadDanfe,
    importarNfe,
    fetchNfesImportadas,
    fetchNfeImportada,
    fetchEstatisticas,
    formatarChaveAcesso,
    validarChaveAcesso,
    formatCurrency,
    formatDate
  } = useMeuDanfe();

  // Estados
  const [tabAtual, setTabAtual] = useState("consultar");
  const [chaveAcesso, setChaveAcesso] = useState("");
  const [nfeConsultada, setNfeConsultada] = useState<ConsultaNfeResult | null>(null);
  const [config, setConfig] = useState<MeuDanfeConfig | null>(null);
  const [stats, setStats] = useState<MeuDanfeStats | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  
  // Estados de modais
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [nfeDetalhes, setNfeDetalhes] = useState<NfeImportada | null>(null);
  const [confirmarImportar, setConfirmarImportar] = useState(false);
  const [confirmarConsulta, setConfirmarConsulta] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const [configData, statsData] = await Promise.all([
      fetchConfig(),
      fetchEstatisticas('mes'),
      fetchNfesImportadas()
    ]);
    if (configData) setConfig(configData);
    if (statsData) setStats(statsData);
  };

  // Buscar NF-e importadas quando termo mudar
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNfesImportadas({ q: termoBusca, page: 1, limit: pagination.limit });
    }, 500);
    return () => clearTimeout(timer);
  }, [termoBusca]);

  // Validar e preparar consulta
  const handlePrepararConsulta = () => {
    const validacao = validarChaveAcesso(chaveAcesso);
    if (!validacao.valid) {
      toast({
        title: "Chave inválida",
        description: validacao.error,
        variant: "destructive"
      });
      return;
    }

    if (!config?.api_key_configurada) {
      toast({
        title: "API não configurada",
        description: "A API Key do MeuDanfe não está configurada no servidor. Entre em contato com o administrador.",
        variant: "destructive"
      });
      return;
    }

    // Mostrar confirmação de custo
    setConfirmarConsulta(true);
  };

  // Realizar consulta
  const handleConsultar = async () => {
    setConfirmarConsulta(false);
    
    try {
      const resultado = await consultarNfe(chaveAcesso);
      setNfeConsultada(resultado);
      
      toast({
        title: "NF-e encontrada!",
        description: `Nota fiscal ${resultado.nfe?.numero || ''} consultada com sucesso`
      });
      
      // Atualizar estatísticas
      const newStats = await fetchEstatisticas('mes');
      if (newStats) setStats(newStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao consultar NF-e";
      
      // Verificar se é erro de endpoint não encontrado
      const isEndpointError = errorMessage.includes('Endpoint') || errorMessage.includes('URL');
      
      toast({
        title: isEndpointError ? "API não configurada" : "Erro na consulta",
        description: isEndpointError 
          ? "A integração com MeuDanfe precisa ser configurada no servidor. Entre em contato com o administrador."
          : errorMessage,
        variant: "destructive"
      });
    }
  };

  // Importar NF-e consultada
  const handleImportar = async () => {
    if (!nfeConsultada?.nfe) return;
    setConfirmarImportar(false);

    try {
      await importarNfe({
        chave_acesso: nfeConsultada.chave_acesso,
        numero: nfeConsultada.nfe.numero,
        serie: nfeConsultada.nfe.serie,
        data_emissao: nfeConsultada.nfe.data_emissao,
        valor_total: nfeConsultada.nfe.valor_total,
        emitente_cnpj: nfeConsultada.nfe.emitente?.cnpj,
        emitente_nome: nfeConsultada.nfe.emitente?.nome || nfeConsultada.nfe.emitente?.razao_social,
        emitente_uf: nfeConsultada.nfe.emitente?.uf,
        destinatario_cnpj: nfeConsultada.nfe.destinatario?.cnpj || nfeConsultada.nfe.destinatario?.cpf,
        destinatario_nome: nfeConsultada.nfe.destinatario?.nome || nfeConsultada.nfe.destinatario?.razao_social,
        xml_content: nfeConsultada.nfe.xml
      } as any);

      toast({
        title: "NF-e importada!",
        description: "A nota fiscal foi importada para o sistema"
      });

      setNfeConsultada(null);
      setChaveAcesso("");
      setTabAtual("importadas");
    } catch (err) {
      toast({
        title: "Erro ao importar",
        description: err instanceof Error ? err.message : "Erro ao importar NF-e",
        variant: "destructive"
      });
    }
  };

  // Ver detalhes de NF-e importada
  const handleVerDetalhes = async (nfe: NfeImportada) => {
    const detalhes = await fetchNfeImportada(nfe.id);
    if (detalhes) {
      setNfeDetalhes(detalhes);
      setModalDetalhesAberto(true);
    }
  };

  // Paginação
  const handlePaginacao = (pagina: number) => {
    fetchNfesImportadas({ page: pagina, limit: pagination.limit, q: termoBusca });
  };

  return (
    <div className="space-y-6 overflow-x-hidden prevent-zoom touch-optimized mobile-scroll">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Consulta NF-e</h1>
          <p className="text-muted-foreground">
            Consulte e importe notas fiscais via{" "}
            <a 
              href="https://meudanfe.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              MeuDanfe
            </a>
          </p>
        </div>
        <Button 
          onClick={carregarDados} 
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Aviso sobre API */}
      {config && !config.api_key_configurada && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <h4 className="font-semibold text-warning">API não configurada</h4>
                <p className="text-sm text-muted-foreground">
                  A API Key do MeuDanfe não está configurada no backend. Configure a variável de ambiente{" "}
                  <code className="px-1 py-0.5 bg-muted rounded text-xs">MEUDANFE_API_KEY</code>{" "}
                  para habilitar a consulta de NF-e.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">NF-e Importadas</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Consultas (mês)</p>
                <p className="text-2xl font-bold">{stats?.total_consultas || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Search className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custo Total (mês)</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.custo_total || 0)}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs value={tabAtual} onValueChange={setTabAtual} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consultar">Consultar NF-e</TabsTrigger>
          <TabsTrigger value="importadas">NF-e Importadas</TabsTrigger>
        </TabsList>

        {/* Aba Consultar */}
        <TabsContent value="consultar" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Consultar NF-e por Chave de Acesso
              </CardTitle>
              <CardDescription>
                Informe a chave de acesso de 44 dígitos para consultar a nota fiscal na SEFAZ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chave">Chave de Acesso (44 dígitos)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="chave"
                    placeholder="00000000000000000000000000000000000000000000"
                    value={chaveAcesso}
                    onChange={(e) => setChaveAcesso(e.target.value.replace(/\D/g, '').substring(0, 44))}
                    className="font-mono text-sm"
                    maxLength={44}
                  />
                  <Button
                    onClick={handlePrepararConsulta}
                    disabled={loading || chaveAcesso.length !== 44}
                    className="bg-gradient-primary text-white min-w-[120px]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Consultar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {chaveAcesso.length}/44 dígitos • 
                  <span className="text-warning"> Custo: R$ 0,03 por consulta</span>
                </p>
              </div>

              {/* Resultado da consulta */}
              {nfeConsultada?.nfe && (
                <Card className="mt-6 border-success bg-success/5">
                  <CardHeader>
                    <CardTitle className="flex items-center text-success">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      NF-e Encontrada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-muted-foreground text-xs">Número / Série</Label>
                          <p className="font-medium">{nfeConsultada.nfe.numero || 'N/A'} / {nfeConsultada.nfe.serie || '1'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Data de Emissão</Label>
                          <p className="font-medium">
                            {nfeConsultada.nfe.data_emissao 
                              ? formatDate(nfeConsultada.nfe.data_emissao) 
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Valor Total</Label>
                          <p className="font-medium text-lg text-primary">
                            {formatCurrency(nfeConsultada.nfe.valor_total || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-muted-foreground text-xs">Emitente</Label>
                          <p className="font-medium">
                            {nfeConsultada.nfe.emitente?.nome || nfeConsultada.nfe.emitente?.razao_social || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {nfeConsultada.nfe.emitente?.cnpj || 'CNPJ não informado'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Destinatário</Label>
                          <p className="font-medium">
                            {nfeConsultada.nfe.destinatario?.nome || nfeConsultada.nfe.destinatario?.razao_social || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {nfeConsultada.nfe.destinatario?.cnpj || nfeConsultada.nfe.destinatario?.cpf || 'Documento não informado'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-muted-foreground text-xs">Chave de Acesso</Label>
                      <p className="font-mono text-xs break-all">
                        {formatarChaveAcesso(nfeConsultada.chave_acesso)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        onClick={() => downloadXml(nfeConsultada.chave_acesso)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download XML
                      </Button>
                      <Button
                        onClick={() => downloadDanfe(nfeConsultada.chave_acesso)}
                        variant="outline"
                        size="sm"
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download DANFE
                      </Button>
                      <Button
                        onClick={() => setConfirmarImportar(true)}
                        className="bg-success hover:bg-success/90 text-white"
                        size="sm"
                      >
                        <Import className="h-4 w-4 mr-2" />
                        Importar para o Sistema
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba NF-e Importadas */}
        <TabsContent value="importadas" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por chave de acesso, emitente ou número..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {loading && nfesImportadas.length === 0 ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando NF-e importadas...</p>
              </CardContent>
            </Card>
          ) : nfesImportadas.length === 0 ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma NF-e importada</h3>
                <p className="text-muted-foreground mb-4">
                  Consulte e importe notas fiscais para visualizá-las aqui
                </p>
                <Button 
                  className="bg-gradient-primary text-white"
                  onClick={() => setTabAtual("consultar")}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Consultar NF-e
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {nfesImportadas.map((nfe) => (
                <Card key={nfe.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">NF-e #{nfe.numero || 'S/N'}</h3>
                            <Badge variant="secondary">Importada</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {nfe.emitente_nome || "Emitente não informado"}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {nfe.emitente_cnpj || "-"}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {nfe.data_emissao ? formatDate(nfe.data_emissao) : "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {formatCurrency(nfe.valor_total)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Importada em {formatDate(nfe.data_importacao)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadXml(nfe.chave_acesso)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            XML
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerDetalhes(nfe)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground font-mono">
                        <Hash className="h-3 w-3 inline mr-1" />
                        {formatarChaveAcesso(nfe.chave_acesso)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginacao(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaginacao(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

      </Tabs>

      {/* Modal de Detalhes */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da NF-e #{nfeDetalhes?.numero || 'S/N'}</DialogTitle>
            <DialogDescription>
              Informações da nota fiscal importada
            </DialogDescription>
          </DialogHeader>
          
          {nfeDetalhes && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Número / Série</Label>
                  <p className="font-medium">{nfeDetalhes.numero || 'N/A'} / {nfeDetalhes.serie || '1'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Emissão</Label>
                  <p className="font-medium">
                    {nfeDetalhes.data_emissao ? formatDate(nfeDetalhes.data_emissao) : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Emitente</Label>
                  <p className="font-medium">{nfeDetalhes.emitente_nome || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{nfeDetalhes.emitente_cnpj || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destinatário</Label>
                  <p className="font-medium">{nfeDetalhes.destinatario_nome || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{nfeDetalhes.destinatario_cnpj || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="font-medium text-lg text-primary">
                    {formatCurrency(nfeDetalhes.valor_total)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Importada em</Label>
                  <p className="font-medium">{formatDate(nfeDetalhes.data_importacao)}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Chave de Acesso</Label>
                <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                  {formatarChaveAcesso(nfeDetalhes.chave_acesso)}
                </p>
              </div>

              {nfeDetalhes.itens && nfeDetalhes.itens.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Itens</Label>
                  <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2">Descrição</th>
                          <th className="text-center p-2">Qtd</th>
                          <th className="text-right p-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nfeDetalhes.itens.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.descricao}</td>
                            <td className="text-center p-2">{item.quantidade}</td>
                            <td className="text-right p-2">{formatCurrency(item.valor_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => nfeDetalhes && downloadXml(nfeDetalhes.chave_acesso)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download XML
            </Button>
            <Button variant="outline" onClick={() => setModalDetalhesAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Consulta (custo) */}
      <AlertDialog open={confirmarConsulta} onOpenChange={setConfirmarConsulta}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-warning" />
              Confirmar Consulta
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Esta consulta tem um custo de <strong className="text-warning">R$ 0,03</strong>.</p>
                <p>Deseja continuar com a consulta da NF-e?</p>
                <div className="mt-3 p-2 bg-muted rounded text-xs font-mono">
                  {formatarChaveAcesso(chaveAcesso)}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsultar}>
              Consultar (R$ 0,03)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de Importação */}
      <AlertDialog open={confirmarImportar} onOpenChange={setConfirmarImportar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar NF-e</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja importar esta NF-e para o sistema? 
              Ela ficará disponível na lista de NF-e importadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportar} className="bg-success hover:bg-success/90">
              <Import className="h-4 w-4 mr-2" />
              Importar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

