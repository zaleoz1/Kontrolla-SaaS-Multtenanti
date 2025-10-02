const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo caminhos para Electron...');

const indexPath = path.join(__dirname, '../Frontend/dist/index.html');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Corrigir caminhos absolutos para relativos
  content = content.replace(/src="\//g, 'src="./');
  content = content.replace(/href="\//g, 'href="./');
  
  // Corrigir URLs em CSS inline
  content = content.replace(/url\(\//g, 'url(./');
  
  fs.writeFileSync(indexPath, content);
  console.log('✅ Caminhos corrigidos com sucesso!');
} else {
  console.log('❌ Arquivo index.html não encontrado');
}
