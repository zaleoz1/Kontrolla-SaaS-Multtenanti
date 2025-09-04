#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configurando o projeto KontrollaPro...\n');

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Criando arquivo .env...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Arquivo .env criado com sucesso!');
  console.log('⚠️  Lembre-se de configurar as variáveis de ambiente no arquivo .env');
} else {
  console.log('✅ Arquivo .env já existe');
}

// Verificar se o MySQL está rodando
console.log('\n🔍 Verificando conexão com MySQL...');
try {
  execSync('mysql --version', { stdio: 'pipe' });
  console.log('✅ MySQL encontrado');
} catch (error) {
  console.log('❌ MySQL não encontrado. Instale o MySQL para continuar.');
  process.exit(1);
}

// Executar migração do banco
console.log('\n📊 Executando migração do banco de dados...');
try {
  execSync('node src/database/migrate.js', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Migração executada com sucesso!');
} catch (error) {
  console.log('❌ Erro na migração:', error.message);
  process.exit(1);
}

// Executar seed do banco
console.log('\n🌱 Executando seed do banco de dados...');
try {
  execSync('node src/database/seed.js', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Seed executado com sucesso!');
} catch (error) {
  console.log('❌ Erro no seed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Configuração concluída com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('1. Configure as variáveis de ambiente no arquivo .env');
console.log('2. Execute: npm start');
console.log('3. Acesse: http://localhost:3000/health');
console.log('\n🔑 Credenciais de teste:');
console.log('Email: admin@lojaexemplo.com.br');
console.log('Senha: admin123');
