import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MudancaItem {
  texto: string;
  tipo: "positiva" | "negativa" | "neutra" | "aviso";
}

interface PropsCartaoMetrica {
  titulo: string;
  valor: string;
  mudanca?: string;
  tipoMudanca?: "positiva" | "negativa" | "neutra" | "aviso";
  mudancas?: MudancaItem[]; // Nova prop para múltiplas mudanças
  icone: LucideIcon;
  descricao?: string;
}

export function CartaoMetrica({ 
  titulo, 
  valor, 
  mudanca, 
  tipoMudanca = "neutra", 
  mudancas,
  icone: Icone,
  descricao 
}: PropsCartaoMetrica) {
  const obterIconeTendencia = (tipo: "positiva" | "negativa" | "neutra" | "aviso") => {
    if (tipo === "positiva") return TrendingUp;
    if (tipo === "negativa") return TrendingDown;
    return null;
  };

  const obterCorTendencia = (tipo: "positiva" | "negativa" | "neutra" | "aviso") => {
    if (tipo === "positiva") return "text-success";
    if (tipo === "negativa") return "text-destructive";
    if (tipo === "aviso") return "text-amber-500";
    return "text-muted-foreground";
  };

  const IconeTendencia = obterIconeTendencia(tipoMudanca);

  return (
    <Card className="bg-card shadow-card border border-border/60 hover:shadow-lg transition-all duration-300 hover:border-primary/40 dark:border-border/70 dark-light:border-border/70 windows-dark:border-border/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-muted-foreground/90 dark-light:text-muted-foreground/90 windows-dark:text-muted-foreground/90 leading-tight">
          {titulo}
        </CardTitle>
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/15 dark:bg-primary/20 dark-light:bg-primary/15 windows-dark:bg-primary/15 shadow-sm flex-shrink-0">
          <Icone className="h-3 w-3 sm:h-4 sm:w-4 text-primary dark:text-primary/90 dark-light:text-primary/90 windows-dark:text-primary/90" />
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="space-y-1 sm:space-y-2">
          <div className="text-lg sm:text-2xl font-bold text-foreground dark:text-foreground/95 dark-light:text-foreground/95 windows-dark:text-foreground/95 leading-tight">{valor}</div>
          
          {/* Renderiza múltiplas mudanças se disponível */}
          {mudancas && mudancas.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {mudancas.map((item, index) => (
                <Badge key={index} variant="secondary" className={`${obterCorTendencia(item.tipo)} bg-transparent border border-current/30 px-1.5 py-0.5 text-[10px] dark:border-current/40`}>
                  {item.texto}
                </Badge>
              ))}
            </div>
          ) : mudanca && (
            <div className="flex items-center space-x-1">
              {IconeTendencia && <IconeTendencia className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${obterCorTendencia(tipoMudanca)}`} />}
              <Badge variant="secondary" className={`${obterCorTendencia(tipoMudanca)} bg-transparent border border-current/30 px-1.5 sm:px-2 py-0.5 text-xs dark:border-current/40 dark-light:border-current/40 windows-dark:border-current/40`}>
                {mudanca}
              </Badge>
            </div>
          )}
          
          {descricao && (
            <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 dark-light:text-muted-foreground/80 windows-dark:text-muted-foreground/80 leading-tight line-clamp-2">{descricao}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}