const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

// Configurar o transportador de email diretamente com variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
  },
});

/**
 * Envia email de confirmação de registro para o usuário
 * @param {Object} user - Objeto com informações do usuário
 * @returns {Promise} - Promessa que resolve quando o email é enviado
 */
const sendRegistrationEmail = async (user) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    // Usar o token fornecido pelo usuário pendente
    const confirmationUrl = `${frontendUrl}/confirm-account?token=${user.token}`;
    
    console.log(`Enviando email para ${user.email} com link: ${confirmationUrl}`);
    
    // Criar tabela com os dados da conta
    const accountDetailsTable = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e0e0e0;">
        <tr>
          <th colspan="2" style="padding: 12px; background-color: #f5f7fa; border-bottom: 1px solid #e0e0e0; text-align: left; color: #333;">
            Dados da Conta
          </th>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 40%;">Nome</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${user.nome || 'Não informado'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Email</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${user.email || 'Não informado'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Cargo</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${user.cargo_descricao || 'Não informado'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Idade</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${user.idade || 'Não informado'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Telefone</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${user.telefone || 'Não informado'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Morada</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${user.morada || 'Não informado'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Código Postal</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${user.codigo_postal || 'Não informado'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Senha Provisória</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-family: monospace; background-color: #f8fafc; color: #2563eb;">${user.senha_temporaria || 'Senha definida pelo usuário'}</td>
        </tr>
      </table>
    `;
    
    // Template do email de confirmação
    const mailOptions = {
      from: `"Plataforma de Cursos" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Confirme seu registro na Plataforma de Cursos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #3b82f6;">Bem-vindo à Plataforma de Cursos</h2>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p>Olá, ${user.nome}!</p>
            <p>Obrigado por se cadastrar em nossa plataforma de cursos online. Estamos muito felizes em tê-lo conosco!</p>
            <p>Abaixo estão os dados da sua conta:</p>
          </div>
          
          ${accountDetailsTable}
          
          <div style="margin: 30px 0; background-color: #f8fafc; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #334155;"><strong>Importante:</strong> Para sua segurança, recomendamos que altere sua senha após o primeiro acesso.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirmar Registro</a>
          </div>
          
          <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 0.9em; color: #777;">
            <p>Se você não solicitou este cadastro, por favor ignore este email.</p>
            <p>Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all;">${confirmationUrl}</p>
            <p>Este link expira em 24 horas.</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #999;">
            <p>© ${new Date().getFullYear()} Plataforma de Cursos. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };
    
    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de registro:', error);
    throw error;
  }
};

/**
 * Envia email de recuperação de senha para o usuário
 * @param {Object} user - Objeto com informações do usuário
 * @param {String} token - Token para redefinição de senha
 * @returns {Promise} - Promessa que resolve quando o email é enviado
 */
const sendPasswordResetEmail = async (user, token) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    
    console.log(`Enviando email de recuperação para ${user.email}`);
    
    // Template do email de recuperação de senha
    const mailOptions = {
      from: `"Plataforma de Cursos" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Recuperação de Senha - Plataforma de Cursos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #3b82f6;">Recuperação de Senha</h2>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p>Olá, ${user.nome}!</p>
            <p>Recebemos uma solicitação para redefinir sua senha na Plataforma de Cursos.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Redefinir Senha</a>
          </div>
          
          <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 0.9em; color: #777;">
            <p>Se você não solicitou esta redefinição, por favor ignore este email.</p>
            <p>Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p>Este link expira em 1 hora.</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #999;">
            <p>© ${new Date().getFullYear()} Plataforma de Cursos. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };
    
    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email de recuperação enviado: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de recuperação de senha:', error);
    throw error;
  }
};

/**
 * Envia email de divulgação de cursos para uma lista de formandos
 * @param {Array} formandos - Lista de objetos de formandos
 * @param {Array} cursos - Lista de objetos de cursos a serem divulgados
 * @param {Object} area - Objeto da área (opcional, para divulgação por área)
 * @returns {Promise} - Promessa que resolve quando todos os emails forem enviados
 */
const sendMailingList = async (formandos, cursos, area = null) => {
  try {
    // Preparar conteúdo dos cursos para o email
    const cursosHtml = cursos.map(curso => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
        <h3 style="color: #3b82f6; margin-top: 0;">${curso.nome}</h3>
        <p>${curso.descricao || 'Sem descrição disponível.'}</p>
        <p><strong>Área:</strong> ${curso.area ? curso.area.nome : 'Não especificada'}</p>
        <p><strong>Início:</strong> ${curso.data_inicio ? new Date(curso.data_inicio).toLocaleDateString() : 'A definir'}</p>
        <p><strong>Vagas:</strong> ${curso.vagas || 'Ilimitadas'}</p>
        <a href="${process.env.FRONTEND_URL}/cursos/${curso.id_curso}" 
           style="display: inline-block; padding: 8px 15px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Ver Detalhes
        </a>
      </div>
    `).join('');
    
    // Título personalizado com base na divulgação (geral ou por área)
    const tituloDivulgacao = area 
      ? `Novos Cursos na Área de ${area.nome}` 
      : 'Novos Cursos Disponíveis';
    
    // Enviar email para cada formando
    const promises = formandos.map(async (formando) => {
      const mailOptions = {
        from: `"Plataforma de Cursos" <${process.env.EMAIL_USER}>`,
        to: formando.email,
        subject: tituloDivulgacao,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #3b82f6;">${tituloDivulgacao}</h2>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p>Olá, ${formando.nome}!</p>
              <p>Temos novidades para você! Confira os cursos que acabamos de disponibilizar:</p>
            </div>
            
            <div style="margin: 30px 0;">
              ${cursosHtml}
            </div>
            
            <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 0.9em; text-align: center; color: #777;">
              <p>Para ver todos os cursos disponíveis, acesse <a href="${process.env.FRONTEND_URL}/cursos">nossa plataforma</a>.</p>
              <p>Se não deseja receber estas divulgações, por favor atualize suas preferências no seu perfil.</p>
            </div>
            
            <div style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #999;">
              <p>© ${new Date().getFullYear()} Plataforma de Cursos. Todos os direitos reservados.</p>
            </div>
          </div>
        `
      };
      
      // Enviar email para este formando
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email de divulgação enviado para ${formando.email}: ${info.messageId}`);
      return info;
    });
    
    // Aguardar todos os emails serem enviados
    await Promise.all(promises);
    console.log(`Divulgação enviada para ${formandos.length} formandos.`);
  } catch (error) {
    console.error('Erro ao enviar emails de divulgação:', error);
    throw error;
  }
};



module.exports = {
  sendRegistrationEmail,
  sendPasswordResetEmail,
  sendMailingList
};