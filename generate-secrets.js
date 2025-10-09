#!/usr/bin/env node

/**
 * Script para gerar secrets seguros para produção
 * Uso: node generate-secrets.js
 */

import crypto from 'crypto';

console.log('🔐 Gerando secrets seguros para produção...\n');

// Gerar JWT Secret (32 bytes = 64 caracteres hex)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Gerar Session Secret (32 bytes = 64 caracteres hex)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);

// Gerar API Key (16 bytes = 32 caracteres hex)
const apiKey = crypto.randomBytes(16).toString('hex');
console.log('API_KEY=' + apiKey);

// Gerar Encryption Key (32 bytes = 64 caracteres hex)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);

console.log('\n✅ Secrets gerados com sucesso!');
console.log('\n📋 Instruções:');
console.log('1. Copie os valores acima');
console.log('2. Cole no Railway Dashboard → Settings → Variables');
console.log('3. NUNCA commite estes valores no Git!');
console.log('4. Mantenha-os seguros e não os compartilhe');

console.log('\n⚠️  IMPORTANTE:');
console.log('- JWT_SECRET e SESSION_SECRET devem ter pelo menos 32 caracteres');
console.log('- Use apenas em produção');
console.log('- Mantenha backups seguros destes valores');
