# Sistema de Temas - KontrollaPro

## Visão Geral

O sistema de temas do KontrollaPro permite alternar entre modo claro (padrão), escuro, dark light, dark mode e automático (baseado na preferência do sistema). O tema é persistido no localStorage e aplicado instantaneamente em toda a aplicação.

## Componentes Principais

### 1. Hook useTheme

```typescript
import { useTheme } from "@/hooks/useTheme";

const { theme, setTheme, resolvedTheme } = useTheme();
```

**Propriedades:**
- `theme`: Tema selecionado ('light' | 'dark' | 'dark-light' | 'windows-dark' | 'system')
- `setTheme`: Função para alterar o tema
- `resolvedTheme`: Tema efetivamente aplicado ('light' | 'dark' | 'dark-light' | 'windows-dark')

### 2. ThemeProvider

O ThemeProvider deve envolver a aplicação no AppLayout:

```tsx
<ThemeProvider>
  {/* Conteúdo da aplicação */}
</ThemeProvider>
```

### 3. ThemeToggle Component

Componente de toggle para alternar entre temas:

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

<ThemeToggle />
```

## Como Usar

### 1. Na Página de Configurações

A página de configurações já inclui uma seção completa para gerenciar o tema:

- Acesse Configurações > Tema
- Selecione entre Claro, Escuro, Dark Light, Dark Mode ou Sistema
- As mudanças são aplicadas instantaneamente

### 2. No Header

O header inclui um botão de toggle de tema para acesso rápido.

### 3. Programaticamente

```typescript
import { useTheme } from "@/hooks/useTheme";

function MeuComponente() {
  const { setTheme } = useTheme();
  
  const alternarParaEscuro = () => {
    setTheme('dark');
  };
  
  const alternarParaDarkLight = () => {
    setTheme('dark-light');
  };
  
  const alternarParaDarkMode = () => {
    setTheme('windows-dark');
  };
  
  const alternarParaClaro = () => {
    setTheme('light');
  };
  
  const usarSistema = () => {
    setTheme('system');
  };
}
```

## Variáveis CSS

O sistema usa variáveis CSS que são automaticamente atualizadas:

### Modo Claro (Padrão)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  /* ... outras variáveis */
}
```

### Modo Escuro
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  /* ... outras variáveis */
}
```

### Modo Escuro Light
```css
.dark-light {
  --background: 220 13% 18%;
  --foreground: 210 40% 98%;
  --card: 220 13% 20%;
  /* ... outras variáveis */
}
```

### Modo Dark Mode
```css
.windows-dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --primary: 210 40% 98%;
  --secondary: 240 3.7% 15.9%;
  /* ... outras variáveis */
}
```

**Características do Dark Mode:**
- Baseado no tema escuro nativo do Windows
- Tons de cinza neutros com azuis sutis
- Contraste mais suave e elegante
- Cores primárias em branco para melhor legibilidade
- Ideal para uso prolongado

## Páginas Excluídas

As seguintes páginas NÃO são afetadas pelo sistema de temas (mantêm sempre o tema claro):

- `Signup.tsx`
- `Login.tsx`
- `LandingPage.tsx`
- `ForgotPassword.tsx`
- `OperadorRequired.tsx`

## Tema Padrão

O sistema inicia com o **tema claro** como padrão. Quando um usuário acessa a aplicação pela primeira vez, o tema claro será aplicado automaticamente, proporcionando uma experiência consistente e familiar.

## Persistência

O tema selecionado é salvo automaticamente no localStorage com a chave `kontrolla_theme` e é restaurado na próxima visita. Se nenhum tema foi salvo anteriormente, o sistema utilizará o tema claro como padrão.

## Detecção de Sistema

Quando o tema está definido como "sistema", o hook detecta automaticamente a preferência do usuário através de `window.matchMedia('(prefers-color-scheme: dark)')` e escuta mudanças em tempo real.

## Classes CSS Recomendadas

Use as classes do Tailwind que se adaptam automaticamente ao tema:

```tsx
// ✅ Bom - usa variáveis de tema
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
<div className="border-border">

// ❌ Evite - cores fixas
<div className="bg-white text-black">
<div className="bg-gray-100">
```
