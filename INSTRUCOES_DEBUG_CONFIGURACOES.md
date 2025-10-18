# Instruções para Debug da Página de Configurações no Electron

## O que foi feito

Adicionei logs de debug na página de Configurações (`Frontend/src/pages/Configuracoes.tsx`) para identificar onde está falhando:

1. **Log no início do componente**: Confirma se o componente está sendo renderizado
2. **Log após hooks básicos**: Confirma se `useNavigate` e `useSearchParams` funcionam
3. **Log após useConfiguracoes**: Mostra o estado de loading, error, dadosConta e dadosTenant
4. **Log após todos os hooks**: Confirma se todos os hooks foram inicializados

## Como testar

### Opção 1: Testar no desenvolvimento (Recomendado)

```powershell
# 1. Entre no diretório raiz do projeto
cd "C:\Projetos\Nova pasta\Kontrolla-SaaS-Multtenanti"

# 2. Execute o script de debug do Electron
npm run debug:electron
```

**IMPORTANTE**: O Electron vai abrir automaticamente. Quando abrir:
1. **Faça login** se necessário
2. **Abra o DevTools** pressionando `F12`
3. **Vá para a aba Console**
4. **Tente acessar Configurações** (menu ou sidebar)
5. **Copie todos os logs** que aparecerem

### Opção 2: Construir e testar

```powershell
# 1. Entre no diretório raiz do projeto
cd "C:\Projetos\Nova pasta\Kontrolla-SaaS-Multtenanti"

# 2. Construa o aplicativo Electron
npm run electron:build

# 3. Execute o aplicativo
.\dist-electron\win-unpacked\KontrollaPro.exe
```

## O que verificar

Quando o aplicativo Electron abrir:

1. **Abra o DevTools** pressionando `Ctrl+Shift+I` ou `F12`
2. **Vá para a aba Console**
3. **Navegue para Configurações** através do menu ou sidebar
4. **Observe os logs** no console:

### Logs esperados (se tudo estiver funcionando):

```
[Configuracoes] Componente renderizado
[Configuracoes] Hooks básicos inicializados
[Configuracoes] useConfiguracoes inicializado { loading: true/false, error: null/string, dadosConta: {...}, dadosTenant: {...} }
[Configuracoes] Todos os hooks inicializados { hasPermission: "function", operador: {...} }
```

### Possíveis cenários:

1. **Se nenhum log aparecer**: O componente não está sendo renderizado (problema de rota)
2. **Se parar em "Hooks básicos inicializados"**: Problema com `useConfiguracoes`
3. **Se aparecer erro no useConfiguracoes**: Problema com a API ou dados
4. **Se todos os logs aparecerem**: O componente está renderizando, o problema pode ser visual

## Me envie o seguinte feedback:

1. **Quais logs aparecerem no console** (tire um print ou copie)
2. **Qualquer mensagem de erro** que aparecer (em vermelho)
3. **O que você vê na tela** quando tenta acessar Configurações
4. **Como você está tentando acessar** (menu, sidebar, URL direta)

## Próximos passos

Dependendo dos logs, posso:
- Investigar problema de roteamento no Electron
- Verificar problemas com hooks específicos
- Analisar problemas de API/Backend
- Verificar permissões de usuário

---

**Nota**: Os logs de debug serão removidos após identificarmos o problema.

