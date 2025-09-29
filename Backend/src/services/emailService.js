import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do transporter de email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Função para gerar código de verificação
export const gerarCodigoVerificacao = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Função para enviar email de verificação
export const enviarEmailVerificacao = async (email, codigo, nome, tipo = 'cadastro') => {
  try {
    const transporter = createTransporter();
    
    let assunto, template;
    
    switch (tipo) {
      case 'cadastro':
        assunto = 'Verifique seu email - KontrollaPro';
        template = getTemplateCadastro(nome, codigo);
        break;
      case 'login':
        assunto = 'Código de verificação - KontrollaPro';
        template = getTemplateLogin(nome, codigo);
        break;
      case 'recuperacao_senha':
        assunto = 'Recuperação de senha - KontrollaPro';
        template = getTemplateRecuperacaoSenha(nome, codigo);
        break;
      default:
        assunto = 'Código de verificação - KontrollaPro';
        template = getTemplatePadrao(nome, codigo);
    }

    const info = await transporter.sendMail({
      from: `"KontrollaPro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: assunto,
      html: template,
    });

    console.log('✅ Email enviado com sucesso:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
};

// Template para cadastro
const getTemplateCadastro = (nome, codigo) => {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verificação de Email - KontrollaPro</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1a202c; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        .email-wrapper {
          padding: 40px 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .email-container { 
          max-width: 600px; 
          width: 100%;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 60px 40px; 
          text-align: center; 
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .header-content {
          position: relative;
          z-index: 2;
        }
        
        
        .header h1 { 
          margin: 0 0 16px 0; 
          font-size: 32px; 
          font-weight: 800;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header p { 
          margin: 0; 
          font-size: 18px; 
          opacity: 0.95;
          font-weight: 400;
          letter-spacing: 0.3px;
        }
        
        .content { 
          padding: 50px 40px; 
          background: #ffffff;
        }
        
        .greeting {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 24px 0;
          letter-spacing: -0.5px;
        }
        
        .message {
          font-size: 17px;
          color: #4a5568;
          margin: 0 0 40px 0;
          line-height: 1.8;
          font-weight: 400;
        }
        
        .code-container {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin: 40px 0;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }
        
        .code-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
          animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .code-label {
          color: #a0aec0;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          display: block;
        }
        
        .code { 
          color: #667eea; 
          font-size: 42px; 
          font-weight: 900; 
          letter-spacing: 12px; 
          margin: 0;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          position: relative;
          z-index: 1;
          text-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
        }
        
        
        
        .signature {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
        }
        
        .signature p {
          margin: 0 0 8px 0;
          color: #4a5568;
          font-size: 17px;
        }
        
        .signature p:first-child {
          font-weight: 700;
          color: #1a202c;
          font-size: 18px;
        }
        
        .footer { 
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          text-align: center; 
          padding: 40px; 
          color: #718096; 
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
          margin: 0 0 12px 0;
          font-weight: 400;
        }
        
        .footer p:last-child {
          margin: 0;
          font-weight: 600;
          color: #4a5568;
        }
        
        .divider {
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
          margin: 20px auto;
        }
        
        @media (max-width: 600px) {
          .email-wrapper { padding: 20px 10px; }
          .email-container { border-radius: 16px; }
          .header, .content, .footer { padding: 30px 20px; }
          .code { font-size: 32px; letter-spacing: 8px; }
          .greeting { font-size: 24px; }
          .header h1 { font-size: 28px; }
          .message { font-size: 16px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
        <div class="header">
            <div class="header-content">
              <h1>Bem-vindo ao KontrollaPro!</h1>
              <p>Seu sistema de gestão empresarial completo</p>
            </div>
        </div>
          
        <div class="content">
            <h2 class="greeting">Olá, ${nome}!</h2>
            
            <p class="message">
              Obrigado por escolher o KontrollaPro! Estamos muito felizes em tê-lo(a) conosco. 
              Para ativar sua conta e começar a transformar a gestão do seu negócio, 
              confirme seu endereço de email usando o código de verificação abaixo:
            </p>
            
            <div class="code-container">
              <span class="code-label">Código de Verificação</span>
          <div class="code">${codigo}</div>
            </div>
            
            <p style="text-align: center; color: black; font-size: 14px; font-weight: 600; margin: 20px 0 0 0;">
              Este código expira em 1 minuto
            </p>
            
            <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: left;">
              <h4 style="color: #495057; font-size: 16px; font-weight: 700; margin: 0 0 12px 0; display: flex; align-items: center;">
                Dicas de Segurança
              </h4>
              <ul style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 14px; line-height: 1.6;">
                <li>Nunca compartilhe este código com terceiros</li>
                <li>O KontrollaPro nunca solicitará seu código por telefone ou email</li>
                <li>Se você não solicitou este código, ignore este email</li>
                <li>Mantenha sua conta segura com senhas fortes</li>
              </ul>
            </div>
            
            
            
            <div class="divider"></div>
            
            <div class="signature">
              <p>Equipe KontrollaPro</p>
              <p>Transformando a gestão empresarial, um cliente por vez.</p>
            </div>
        </div>
          
        <div class="footer">
          <p>Este é um email automático, não responda a esta mensagem.</p>
          <p>© 2024 KontrollaPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template para login
const getTemplateLogin = (nome, codigo) => {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código de Verificação - KontrollaPro</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1a202c; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          min-height: 100vh;
        }
        
        .email-wrapper {
          padding: 40px 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .email-container { 
          max-width: 600px; 
          width: 100%;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .header { 
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white; 
          padding: 60px 40px; 
          text-align: center; 
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .header-content {
          position: relative;
          z-index: 2;
        }
        
        
        .header h1 { 
          margin: 0 0 16px 0; 
          font-size: 32px; 
          font-weight: 800;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header p { 
          margin: 0; 
          font-size: 18px; 
          opacity: 0.95;
          font-weight: 400;
          letter-spacing: 0.3px;
        }
        
        .content { 
          padding: 50px 40px; 
          background: #ffffff;
        }
        
        .greeting {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 24px 0;
          letter-spacing: -0.5px;
        }
        
        .message {
          font-size: 17px;
          color: #4a5568;
          margin: 0 0 40px 0;
          line-height: 1.8;
          font-weight: 400;
        }
        
        .code-container {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin: 40px 0;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(79, 70, 229, 0.2);
        }
        
        .code-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.1), transparent);
          animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .code-label {
          color: #a0aec0;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          display: block;
        }
        
        .code { 
          color: #4f46e5; 
          font-size: 42px; 
          font-weight: 900; 
          letter-spacing: 12px; 
          margin: 0;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          position: relative;
          z-index: 1;
          text-shadow: 0 0 20px rgba(79, 70, 229, 0.3);
        }
        
        
        
        .signature {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
        }
        
        .signature p {
          margin: 0 0 8px 0;
          color: #4a5568;
          font-size: 17px;
        }
        
        .signature p:first-child {
          font-weight: 700;
          color: #1a202c;
          font-size: 18px;
        }
        
        .footer { 
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          text-align: center; 
          padding: 40px; 
          color: #718096; 
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
          margin: 0 0 12px 0;
          font-weight: 400;
        }
        
        .footer p:last-child {
          margin: 0;
          font-weight: 600;
          color: #4a5568;
        }
        
        .divider {
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border-radius: 2px;
          margin: 20px auto;
        }
        
        @media (max-width: 600px) {
          .email-wrapper { padding: 20px 10px; }
          .email-container { border-radius: 16px; }
          .header, .content, .footer { padding: 30px 20px; }
          .code { font-size: 32px; letter-spacing: 8px; }
          .greeting { font-size: 24px; }
          .header h1 { font-size: 28px; }
          .message { font-size: 16px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
        <div class="header">
            <div class="header-content">
              <h1>Código de Verificação</h1>
          <p>KontrollaPro - Sistema de Gestão</p>
        </div>
          </div>
          
        <div class="content">
            <h2 class="greeting">Olá, ${nome}!</h2>
            
            <p class="message">
              Você solicitou um código de verificação para fazer login. 
              Use o código abaixo para acessar sua conta com segurança:
            </p>
            
            <div class="code-container">
              <span class="code-label">Código de Verificação</span>
          <div class="code">${codigo}</div>
            </div>
            
            <p style="text-align: center; color: #e53e3e; font-size: 14px; font-weight: 600; margin: 20px 0 0 0;">
              ⏰ Este código expira em 1 minuto
            </p>
            
            
            
            <div class="divider"></div>
            
            <div class="signature">
              <p>Equipe KontrollaPro</p>
              <p>Protegendo seu acesso com tecnologia avançada.</p>
            </div>
        </div>
          
        <div class="footer">
          <p>Este é um email automático, não responda a esta mensagem.</p>
          <p>© 2024 KontrollaPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template para recuperação de senha
const getTemplateRecuperacaoSenha = (nome, codigo) => {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperação de Senha - KontrollaPro</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1a202c; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          min-height: 100vh;
        }
        
        .email-wrapper {
          padding: 40px 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .email-container { 
          max-width: 600px; 
          width: 100%;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .header { 
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white; 
          padding: 60px 40px; 
          text-align: center; 
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .header-content {
          position: relative;
          z-index: 2;
        }
        
        
        .header h1 { 
          margin: 0 0 16px 0; 
          font-size: 32px; 
          font-weight: 800;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header p { 
          margin: 0; 
          font-size: 18px; 
          opacity: 0.95;
          font-weight: 400;
          letter-spacing: 0.3px;
        }
        
        .content { 
          padding: 50px 40px; 
          background: #ffffff;
        }
        
        .greeting {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 24px 0;
          letter-spacing: -0.5px;
        }
        
        .message {
          font-size: 17px;
          color: #4a5568;
          margin: 0 0 40px 0;
          line-height: 1.8;
          font-weight: 400;
        }
        
        .code-container {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin: 40px 0;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }
        
        .code-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.1), transparent);
          animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .code-label {
          color: #a0aec0;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          display: block;
        }
        
        .code { 
          color: #dc2626; 
          font-size: 42px; 
          font-weight: 900; 
          letter-spacing: 12px; 
          margin: 0;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          position: relative;
          z-index: 1;
          text-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
        }
        
        
        
        .signature {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
        }
        
        .signature p {
          margin: 0 0 8px 0;
          color: #4a5568;
          font-size: 17px;
        }
        
        .signature p:first-child {
          font-weight: 700;
          color: #1a202c;
          font-size: 18px;
        }
        
        .footer { 
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          text-align: center; 
          padding: 40px; 
          color: #718096; 
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
          margin: 0 0 12px 0;
          font-weight: 400;
        }
        
        .footer p:last-child {
          margin: 0;
          font-weight: 600;
          color: #4a5568;
        }
        
        .divider {
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          border-radius: 2px;
          margin: 20px auto;
        }
        
        @media (max-width: 600px) {
          .email-wrapper { padding: 20px 10px; }
          .email-container { border-radius: 16px; }
          .header, .content, .footer { padding: 30px 20px; }
          .code { font-size: 32px; letter-spacing: 8px; }
          .greeting { font-size: 24px; }
          .header h1 { font-size: 28px; }
          .message { font-size: 16px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
        <div class="header">
            <div class="header-content">
              <h1>Recuperação de Senha</h1>
          <p>KontrollaPro - Sistema de Gestão</p>
        </div>
          </div>
          
        <div class="content">
            <h2 class="greeting">Olá, ${nome}!</h2>
            
            <p class="message">
              Você solicitou a recuperação de senha. 
              Use o código abaixo para redefinir sua senha com segurança:
            </p>
            
            <div class="code-container">
              <span class="code-label">Código de Recuperação</span>
          <div class="code">${codigo}</div>
            </div>
            
            <p style="text-align: center; color: #e53e3e; font-size: 14px; font-weight: 600; margin: 20px 0 0 0;">
              ⏰ Este código expira em 1 minuto
            </p>
            
            
            
            <div class="divider"></div>
            
            <div class="signature">
              <p>Equipe KontrollaPro</p>
              <p>Protegendo sua conta com máxima segurança.</p>
            </div>
        </div>
          
        <div class="footer">
          <p>Este é um email automático, não responda a esta mensagem.</p>
          <p>© 2024 KontrollaPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template padrão
const getTemplatePadrao = (nome, codigo) => {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código de Verificação - KontrollaPro</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1a202c; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          min-height: 100vh;
        }
        
        .email-wrapper {
          padding: 40px 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .email-container { 
          max-width: 600px; 
          width: 100%;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .header { 
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white; 
          padding: 60px 40px; 
          text-align: center; 
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .header-content {
          position: relative;
          z-index: 2;
        }
        
        
        .header h1 { 
          margin: 0 0 16px 0; 
          font-size: 32px; 
          font-weight: 800;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header p { 
          margin: 0; 
          font-size: 18px; 
          opacity: 0.95;
          font-weight: 400;
          letter-spacing: 0.3px;
        }
        
        .content { 
          padding: 50px 40px; 
          background: #ffffff;
        }
        
        .greeting {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 24px 0;
          letter-spacing: -0.5px;
        }
        
        .message {
          font-size: 17px;
          color: #4a5568;
          margin: 0 0 40px 0;
          line-height: 1.8;
          font-weight: 400;
        }
        
        .code-container {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin: 40px 0;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }
        
        .code-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
          animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .code-label {
          color: #a0aec0;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          display: block;
        }
        
        .code { 
          color: #6366f1; 
          font-size: 42px; 
          font-weight: 900; 
          letter-spacing: 12px; 
          margin: 0;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          position: relative;
          z-index: 1;
          text-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
        }
        
        
        
        .signature {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
        }
        
        .signature p {
          margin: 0 0 8px 0;
          color: #4a5568;
          font-size: 17px;
        }
        
        .signature p:first-child {
          font-weight: 700;
          color: #1a202c;
          font-size: 18px;
        }
        
        .footer { 
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          text-align: center; 
          padding: 40px; 
          color: #718096; 
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
          margin: 0 0 12px 0;
          font-weight: 400;
        }
        
        .footer p:last-child {
          margin: 0;
          font-weight: 600;
          color: #4a5568;
        }
        
        .divider {
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 2px;
          margin: 20px auto;
        }
        
        @media (max-width: 600px) {
          .email-wrapper { padding: 20px 10px; }
          .email-container { border-radius: 16px; }
          .header, .content, .footer { padding: 30px 20px; }
          .code { font-size: 32px; letter-spacing: 8px; }
          .greeting { font-size: 24px; }
          .header h1 { font-size: 28px; }
          .message { font-size: 16px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
        <div class="header">
            <div class="header-content">
              <h1>Código de Verificação</h1>
          <p>KontrollaPro - Sistema de Gestão</p>
        </div>
          </div>
          
        <div class="content">
            <h2 class="greeting">Olá, ${nome}!</h2>
            
            <p class="message">
              Use o código abaixo para verificar seu email e confirmar sua identidade:
            </p>
            
            <div class="code-container">
              <span class="code-label">Código de Verificação</span>
          <div class="code">${codigo}</div>
            </div>
            
            <p style="text-align: center; color: #e53e3e; font-size: 14px; font-weight: 600; margin: 20px 0 0 0;">
              ⏰ Este código expira em 1 minuto
            </p>
            
            
            
            <div class="divider"></div>
            
            <div class="signature">
              <p>Equipe KontrollaPro</p>
              <p>Garantindo a segurança da sua conta.</p>
            </div>
        </div>
          
        <div class="footer">
          <p>Este é um email automático, não responda a esta mensagem.</p>
          <p>© 2024 KontrollaPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Função para testar configuração de email
export const testarConfiguracaoEmail = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Configuração de email válida');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro na configuração de email:', error);
    return { success: false, error: error.message };
  }
};
