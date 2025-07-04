const nodemailer = require('nodemailer');

/**
 * SERVIÇO DE EMAIL PARA ENVIO DE NOTIFICAÇÕES E CONFIRMAÇÕES
 * 
 * Este módulo centraliza todas as funcionalidades de envio de emails
 * incluindo confirmação de registro, recuperação de password e notificações
 * de inscrições em cursos. Suporta diferentes provedores SMTP.
 */

// =============================================================================
// CONFIGURAÇÃO DO TRANSPORTER
// =============================================================================

/**
 * Criar transporter do nodemailer com configuração baseada em variáveis de ambiente
 * Suporta Gmail, Outlook, SMTP personalizado e modo de desenvolvimento
 */
const createTransporter = () => {
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  // Configurações específicas para diferentes provedores
  if (process.env.EMAIL_HOST === 'smtp.gmail.com') {
    emailConfig.service = 'gmail';
  }

  // Modo de desenvolvimento - usar ethereal email para testes
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('⚠️  Modo desenvolvimento: Configure EMAIL_USER e EMAIL_PASS para envio real');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  try {
    return nodemailer.createTransport(emailConfig);
  } catch (error) {
    console.error('❌ Erro ao criar transporter de email:', error.message);
    // Retornar transporter mock para evitar crashes
    return {
      sendMail: async () => {
        console.log('📧 Email mockado (transporter indisponível)');
        return { messageId: 'mock-id' };
      }
    };
  }
};

const transporter = createTransporter();

// =============================================================================
// TEMPLATES DE EMAIL
// =============================================================================

/**
 * Template HTML para email de confirmação de registro
 */
const getRegistrationEmailTemplate = (user) => {
  const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirmar-conta?token=${user.token}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Confirmação de Conta</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Bem-vindo à Plataforma de Formação</h1>
            </div>
            <div class="content">
                <h2>Olá, ${user.nome}!</h2>
                <p>Obrigado por se registar na nossa plataforma como <strong>${user.cargo_descricao || 'utilizador'}</strong>.</p>
                <p>Para ativar a sua conta, clique no botão abaixo:</p>
                <a href="${confirmUrl}" class="button">Confirmar Conta</a>
                <p>Ou copie e cole este link no seu navegador:</p>
                <p><a href="${confirmUrl}">${confirmUrl}</a></p>
                <p><strong>Dados da sua conta:</strong></p>
                <ul>
                    <li>Nome: ${user.nome}</li>
                    <li>Email: ${user.email}</li>
                    <li>Cargo: ${user.cargo_descricao || 'Não especificado'}</li>
                    ${user.senha_temporaria ? `<li>Senha temporária: ${user.senha_temporaria}</li>` : ''}
                </ul>
                <p><small>Este link é válido por 24 horas.</small></p>
            </div>
            <div class="footer">
                <p>Se não solicitou este registro, ignore este email.</p>
                <p>&copy; 2024 Plataforma de Formação. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Template HTML para email de recuperação de password
 */
const getPasswordResetTemplate = (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Recuperação de Password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Recuperação de Password</h1>
            </div>
            <div class="content">
                <h2>Olá, ${user.nome}!</h2>
                <p>Recebemos um pedido para redefinir a password da sua conta.</p>
                <p>Clique no botão abaixo para criar uma nova password:</p>
                <a href="${resetUrl}" class="button">Redefinir Password</a>
                <p>Ou copie e cole este link no seu navegador:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <p><small>Este link é válido por 1 hora por motivos de segurança.</small></p>
                <p><strong>Se não solicitou esta alteração, ignore este email.</strong> A sua password atual permanece inalterada.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Plataforma de Formação. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Template HTML para confirmação de inscrição em curso
 */
const getCourseInscricaoTemplate = (user, curso) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Inscrição Confirmada</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .course-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Inscrição Confirmada!</h1>
            </div>
            <div class="content">
                <h2>Olá, ${user.nome}!</h2>
                <p>A sua inscrição foi realizada com sucesso!</p>
                <div class="course-info">
                    <h3>Detalhes do Curso:</h3>
                    <ul>
                        <li><strong>Nome:</strong> ${curso.nome}</li>
                        <li><strong>Tipo:</strong> ${curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}</li>
                        <li><strong>Data de Início:</strong> ${new Date(curso.data_inicio).toLocaleDateString('pt-PT')}</li>
                        <li><strong>Data de Fim:</strong> ${new Date(curso.data_fim).toLocaleDateString('pt-PT')}</li>
                        ${curso.formador ? `<li><strong>Formador:</strong> ${curso.formador.nome}</li>` : ''}
                        ${curso.vagas ? `<li><strong>Vagas:</strong> ${curso.vagas}</li>` : ''}
                    </ul>
                </div>
                <p>Pode acompanhar o progresso do curso e aceder aos materiais através da plataforma.</p>
                <p>Boa formação!</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Plataforma de Formação. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// =============================================================================
// FUNÇÕES DE ENVIO DE EMAIL
// =============================================================================

/**
 * Enviar email de confirmação de registro
 */
const sendRegistrationEmail = async (user) => {
  try {
    if (!user.email || !user.token) {
      throw new Error('Email e token são obrigatórios');
    }

    const mailOptions = {
      from: `"Plataforma de Formação" <${process.env.EMAIL_USER || 'noreply@plataforma.com'}>`,
      to: user.email,
      subject: 'Confirmação de Conta - Plataforma de Formação',
      html: getRegistrationEmailTemplate(user)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmação enviado para: ${user.email}`);
    return result;

  } catch (error) {
    console.error(`❌ Erro ao enviar email de confirmação para ${user.email}:`, error.message);
    throw error;
  }
};

/**
 * Enviar email de recuperação de password
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    if (!user.email || !resetToken) {
      throw new Error('Email e token de reset são obrigatórios');
    }

    const mailOptions = {
      from: `"Plataforma de Formação" <${process.env.EMAIL_USER || 'noreply@plataforma.com'}>`,
      to: user.email,
      subject: 'Recuperação de Password - Plataforma de Formação',
      html: getPasswordResetTemplate(user, resetToken)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de recuperação enviado para: ${user.email}`);
    return result;

  } catch (error) {
    console.error(`❌ Erro ao enviar email de recuperação para ${user.email}:`, error.message);
    throw error;
  }
};

/**
 * Enviar email de confirmação de inscrição em curso
 */
const sendCourseInscricaoEmail = async (user, curso) => {
  try {
    if (!user.email) {
      throw new Error('Email do utilizador é obrigatório');
    }

    const mailOptions = {
      from: `"Plataforma de Formação" <${process.env.EMAIL_USER || 'noreply@plataforma.com'}>`,
      to: user.email,
      subject: `Inscrição Confirmada - ${curso.nome}`,
      html: getCourseInscricaoTemplate(user, curso)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de inscrição enviado para: ${user.email}`);
    return result;

  } catch (error) {
    console.error(`❌ Erro ao enviar email de inscrição para ${user.email}:`, error.message);
    throw error;
  }
};

/**
 * Testar configuração de email
 */
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Configuração de email válida');
    return true;
  } catch (error) {
    console.error('❌ Configuração de email inválida:', error.message);
    return false;
  }
};

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

module.exports = {
  sendRegistrationEmail,
  sendPasswordResetEmail,
  sendCourseInscricaoEmail,
  testEmailConfig,
  transporter
};