import { User, Crown, Shield, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Componente exibido quando não há operador selecionado
 */
export function OperadorRequired() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>Selecione um Operador</CardTitle>
          <CardDescription>
            Para acessar o sistema, você precisa selecionar um operador no cabeçalho.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use o seletor de operador no cabeçalho para escolher:
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Crown className="h-4 w-4 text-red-500" />
                <span>Administrador</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Gerente</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <ShoppingBag className="h-4 w-4 text-green-500" />
                <span>Vendedor</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
