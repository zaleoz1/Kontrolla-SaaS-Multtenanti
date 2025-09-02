import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface PropsCartaoMetrica {
  titulo: string;
  valor: string;
  mudanca?: string;
  tipoMudanca?: "positiva" | "negativa" | "neutra";
  icone: LucideIcon;
  descricao?: string;
}

export function CartaoMetrica({ 
  titulo, 
  valor, 
  mudanca, 
  tipoMudanca = "neutra", 
  icone: Icone,
  descricao 
}: PropsCartaoMetrica) {
  const obterIconeTendencia = () => {
    if (tipoMudanca === "positiva") return TrendingUp;
    if (tipoMudanca === "negativa") return TrendingDown;
    return null;
  };

  const obterCorTendencia = () => {
    if (tipoMudanca === "positiva") return "text-success";
    if (tipoMudanca === "negativa") return "text-destructive";
    return "text-muted-foreground";
  };

  const IconeTendencia = obterIconeTendencia();

  return (
    <Card className="bg-gradient-card shadow-card border-0 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icone className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{valor}</div>
          
          {mudanca && (
            <div className="flex items-center space-x-1">
              {IconeTendencia && <IconeTendencia className={`h-3 w-3 ${obterCorTendencia()}`} />}
              <Badge variant="secondary" className={`${obterCorTendencia()} bg-transparent border-0 px-0`}>
                {mudanca}
              </Badge>
            </div>
          )}
          
          {descricao && (
            <p className="text-xs text-muted-foreground">{descricao}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}