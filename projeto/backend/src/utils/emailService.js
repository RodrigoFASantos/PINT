const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

// CORREÇÃO: createTransport() em vez de createTransporter()
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
  },
});

// Verificar configuração do transportador na inicialização
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ [EMAIL] Erro na configuração do email:', error);
  } else {
    console.log('✅ [EMAIL] Servidor de email configurado e pronto para enviar mensagens');
    console.log('📧 [EMAIL] Host:', process.env.EMAIL_HOST);
    console.log('📧 [EMAIL] Porta:', process.env.EMAIL_PORT);
    console.log('📧 [EMAIL] Utilizador:', process.env.EMAIL_USER);
  }
});

/**
 * Envia email de confirmação de registo para o user
 * @param {Object} user - Objeto com informações do user
 * @returns {Promise} - Promessa que resolve quando o email é enviado
 */
const sendRegistrationEmail = async (user) => {
  try {
    console.log('📧 [EMAIL] === ENVIANDO EMAIL DE CONFIRMAÇÃO ===');
    console.log('📧 [EMAIL] Destinatário:', user.email);
    console.log('📧 [EMAIL] Nome:', user.nome);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    // Usar o token fornecido pelo user pendente
    const confirmationUrl = `${frontendUrl}/confirm-account?token=${user.token}`;

    console.log('📧 [EMAIL] URL de confirmação:', confirmationUrl);

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
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-family: monospace; background-color: #f8fafc; color: #2563eb;">${user.senha_temporaria || 'Senha definida pelo user'}</td>
        </tr>
      </table>
    `;

    // Template do email de confirmação
    const mailOptions = {
      from: `"Plataforma de Cursos" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Confirme seu registo na Plataforma de Cursos',
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
            <a href="${confirmationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirmar registo</a>
          </div>
          
          <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 0.9em; color: #777;">
            <p>Se você não solicitou este cadastro, por favor ignore este email.</p>
            <p>Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all;">${confirmationUrl}</p>
            <p>Este link expira em 24 horas.</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #999;">
            <p>© ${new Date().getFullYear()} Plataforma de Cursos. Todos os direitos reservados.</p>
            <p>Este email foi enviado para: ${user.email}</p>
          </div>
        </div>
      `
    };

    console.log('📧 [EMAIL] A enviar email de confirmação...');
    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL] Email de confirmação enviado com sucesso:', info.messageId);
    console.log('📧 [EMAIL] Response:', info.response);
    return info;
  } catch (error) {
    console.error('❌ [EMAIL] Erro ao enviar email de registo:', error);
    console.error('❌ [EMAIL] Stack:', error.stack);
    throw error;
  }
};

/**
 * Envia email de recuperação de senha para o user
 * @param {Object} user - Objeto com informações do user
 * @param {String} token - Token para redefinição de senha
 * @returns {Promise} - Promessa que resolve quando o email é enviado
 */
const sendPasswordResetEmail = async (user, token) => {
  try {
    console.log('🔑 [EMAIL] === ENVIANDO EMAIL DE RECUPERAÇÃO ===');
    console.log('🔑 [EMAIL] Destinatário:', user.email);
    console.log('🔑 [EMAIL] Nome:', user.nome);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    console.log('🔑 [EMAIL] URL de recuperação:', resetUrl);

    // Template do email de recuperação de senha
    const mailOptions = {
      from: `"Plataforma de Cursos" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Recuperação de Senha - Plataforma de Cursos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #ef4444;">Recuperação de Senha</h2>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p>Olá, <strong>${user.nome}</strong>!</p>
            <p>Recebemos uma solicitação para redefinir sua senha na Plataforma de Cursos.</p>
            <p>Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
          </div>
          
          <div style="margin: 30px 0; background-color: #fef2f2; padding: 15px; border-radius: 5px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; color: #dc2626;"><strong>⚠️ Importante:</strong></p>
            <ul style="margin: 10px 0; color: #dc2626;">
              <li>Este link é válido por apenas <strong>1 hora</strong></li>
              <li>Após clicar no link, você será redirecionado para criar uma nova senha</li>
              <li>Por segurança, o link só pode ser usado uma vez</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Redefinir Senha</a>
          </div>
          
          <div style="margin: 30px 0; background-color: #f8fafc; padding: 15px; border-radius: 5px; border-left: 4px solid #64748b;">
            <p style="margin: 0; color: #475569;"><strong>Não solicitou esta recuperação?</strong></p>
            <p style="margin: 10px 0 0 0; color: #475569;">Se você não pediu para recuperar sua senha, pode ignorar este email com segurança. Sua conta permanece protegida.</p>
          </div>
          
          <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 0.9em; color: #777;">
            <p><strong>Problemas com o botão?</strong> Copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f8fafc; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.8em;">${resetUrl}</p>
            <p style="color: #dc2626;"><strong>Lembrete:</strong> Este link expira em 1 hora por motivos de segurança.</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #999;">
            <p>© ${new Date().getFullYear()} Plataforma de Cursos. Todos os direitos reservados.</p>
            <p>Este email foi enviado para: ${user.email}</p>
            <p>Horário da solicitação: ${new Date().toLocaleString('pt-PT')}</p>
          </div>
        </div>
      `
    };

    console.log('🔑 [EMAIL] A enviar email de recuperação...');
    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL] Email de recuperação enviado com sucesso:', info.messageId);
    console.log('🔑 [EMAIL] Response:', info.response);
    return info;
  } catch (error) {
    console.error('❌ [EMAIL] Erro ao enviar email de recuperação de senha:', error);
    console.error('❌ [EMAIL] Stack:', error.stack);
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
    console.log('📢 [EMAIL] === ENVIANDO DIVULGAÇÃO DE CURSOS ===');
    console.log('📢 [EMAIL] Destinatários:', formandos.length);
    console.log('📢 [EMAIL] Cursos:', cursos.length);

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
      console.log(`📢 [EMAIL] Email de divulgação enviado para ${formando.email}:`, info.messageId);
      return info;
    });

    // Esperar que todos os emails sejam enviados
    await Promise.all(promises);
    console.log(`✅ [EMAIL] Divulgação enviada para ${formandos.length} formandos.`);
  } catch (error) {
    console.error('❌ [EMAIL] Erro ao enviar emails de divulgação:', error);
    throw error;
  }
};

/**
 * Envia email de confirmação de inscrição num curso
 * @param {Object} user - Objeto com informações do utilizador
 * @param {Object} curso - Objeto com informações do curso
 * @returns {Promise} - Promessa que resolve quando o email é enviado
 */
const sendCourseInscricaoEmail = async (user, curso) => {
  try {
    console.log('📚 [EMAIL] === ENVIANDO CONFIRMAÇÃO DE INSCRIÇÃO ===');
    console.log('📚 [EMAIL] Utilizador:', user.email);
    console.log('📚 [EMAIL] Curso:', curso.nome);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const cursoUrl = `${frontendUrl}/cursos/${curso.id_curso}`;

    // Formatar datas
    const dataInicio = new Date(curso.data_inicio).toLocaleDateString('pt-PT');
    const dataFim = new Date(curso.data_fim).toLocaleDateString('pt-PT');

    // Template do email de confirmação de inscrição
    const mailOptions = {
      from: `"Plataforma de Cursos" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Confirmação de Inscrição: ${curso.nome}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #3b82f6;">Inscrição Realizada com Sucesso!</h2>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p>Olá, ${user.nome}!</p>
            <p>A sua inscrição no curso <strong>${curso.nome}</strong> foi realizada com sucesso.</p>
          </div>
          
          <div style="margin: 20px 0; background-color: #f8fafc; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #334155;">Detalhes do Curso</h3>
            <p><strong>Nome:</strong> ${curso.nome}</p>
            <p><strong>Tipo:</strong> ${curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}</p>
            <p><strong>Data de Início:</strong> ${dataInicio}</p>
            <p><strong>Data de Fim:</strong> ${dataFim}</p>
            ${curso.formador ? `<p><strong>Formador:</strong> ${curso.formador.nome}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${cursoUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver Detalhes do Curso</a>
          </div>
          
          <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 0.9em; color: #777;">
            <p>Se tiver alguma dúvida, entre em contato connosco respondendo a este email.</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #999;">
            <p>© ${new Date().getFullYear()} Plataforma de Cursos. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };

    console.log('📚 [EMAIL] A enviar email de confirmação de inscrição...');
    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL] Email de confirmação de inscrição enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ [EMAIL] Erro ao enviar email de confirmação de inscrição:', error);
    throw error;
  }
};

module.exports = {
  sendRegistrationEmail,
  sendPasswordResetEmail,
  sendMailingList,
  sendCourseInscricaoEmail
};