# Upload de Imagens de Produtos - Cloudinary

Este documento explica como funciona o upload de imagens de produtos para o Cloudinary no sistema KontrollaPro.

## 🚀 Funcionalidades Implementadas

### Backend
- ✅ Upload automático de imagens para Cloudinary
- ✅ Redimensionamento automático de imagens
- ✅ Exclusão automática de imagens antigas
- ✅ Organização por pastas no Cloudinary
- ✅ Tratamento de erros robusto

### Frontend
- ✅ Interface de drag & drop para upload
- ✅ Preview de imagens em tempo real
- ✅ Redimensionamento automático (800x800px)
- ✅ Validação de tipos de arquivo
- ✅ Limite de 5 imagens por produto
- ✅ Validação de tamanho (máximo 5MB)

## 📁 Estrutura no Cloudinary

```
dko7s3u3j/
└── kontrolla/
    └── produtos/
        ├── tenant_1_produto_1_img_1
        ├── tenant_1_produto_1_img_2
        ├── tenant_1_produto_2_img_1
        └── ...
```

## 🔧 Como Funciona

### 1. Criação de Produto
1. Usuário preenche dados do produto
2. Adiciona imagens via drag & drop ou seleção
3. Imagens são redimensionadas automaticamente (800x800px)
4. Produto é criado no banco de dados
5. Imagens são enviadas para Cloudinary
6. URLs do Cloudinary são salvas no banco

### 2. Atualização de Produto
1. Usuário edita dados do produto
2. Adiciona novas imagens se necessário
3. Novas imagens são enviadas para Cloudinary
4. URLs antigas são substituídas pelas novas

### 3. Exclusão de Produto
1. Produto é deletado do banco
2. Imagens são automaticamente removidas do Cloudinary

## 🛠️ Rotas da API

### Criar Produto
```
POST /produtos
Content-Type: application/json

{
  "nome": "Produto Exemplo",
  "preco": 29.90,
  "imagens": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  ]
}
```

### Atualizar Produto
```
PUT /produtos/:id
Content-Type: application/json

{
  "nome": "Produto Atualizado",
  "imagens": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  ]
}
```

### Deletar Produto
```
DELETE /produtos/:id
```

## 📋 Especificações Técnicas

### Validações
- **Tipos permitidos**: JPG, PNG, GIF, WebP
- **Tamanho máximo**: 5MB por imagem
- **Quantidade máxima**: 5 imagens por produto
- **Redimensionamento**: 800x800px (mantém proporção)

### Otimizações
- **Qualidade**: 80% (configurável)
- **Formato de saída**: JPEG (otimizado)
- **CDN**: Entrega global via Cloudinary
- **Cache**: Headers de cache otimizados

## 🔍 Monitoramento

### Logs do Backend
```
📸 Fazendo upload de imagens para Cloudinary...
✅ Imagens enviadas para Cloudinary: 3
🗑️ Deletando imagens do Cloudinary...
✅ Imagens deletadas do Cloudinary: 2
```

### Dashboard Cloudinary
1. Acesse [cloudinary.com](https://cloudinary.com)
2. Vá para "Media Library"
3. Navegue para `kontrolla/produtos/`
4. Visualize todas as imagens de produtos

## 🚨 Tratamento de Erros

### Erros Comuns
- **Arquivo muito grande**: Máximo 5MB
- **Tipo inválido**: Apenas imagens são aceitas
- **Limite excedido**: Máximo 5 imagens
- **Erro de upload**: Falha na conexão com Cloudinary

### Fallbacks
- Se o upload falhar, o produto ainda é criado
- Imagens antigas são mantidas em caso de erro
- Logs detalhados para debugging

## 🎯 Próximos Passos

1. **Teste a funcionalidade**:
   - Crie um novo produto
   - Adicione imagens
   - Verifique no Cloudinary

2. **Monitore o uso**:
   - Acompanhe o consumo de banda
   - Verifique o armazenamento usado

3. **Otimizações futuras**:
   - Lazy loading de imagens
   - WebP automático
   - Compressão avançada

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do servidor
2. Confirme as credenciais do Cloudinary
3. Teste a conexão com Cloudinary
4. Verifique os limites da conta
