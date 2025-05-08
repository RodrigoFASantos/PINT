const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar transportador de email usando variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envia um email ao administrador para solicitar a criação de um novo tópico.
 * @param {string} categoriaNome - Nome da categoria do tópico solicitado.
 * @param {string} titulo - Título do tópico solicitado.
 * @param {string} descricao - Descrição do tópico solicitado.
 * @param {Object} solicitante - Objeto com dados do utilizador solicitante (nome e email).
 */
const sendTopicRequestEmail = async (categoriaNome, titulo, descricao, solicitante) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL não configurado no ambiente');
    }

    // Configurar conteúdo do email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmail,
      subject: `Pedido de Criação de Tópico: ${titulo}`,
      html: `
        <h2>Pedido de Novo Tópico</h2>
        <p><strong>Categoria:</strong> ${categoriaNome}</p>
        <p><strong>Título:</strong> ${titulo}</p>
        <p><strong>Descrição:</strong> ${descricao || 'N/A'}</p>
        <p><strong>Solicitado por:</strong> ${solicitante.nome} (${solicitante.email})</p>
      `,
    };

    // Enviar o email
    await transporter.sendMail(mailOptions);
    console.log(`Email de pedido de tópico enviado para ${adminEmail} (Tópico: "${titulo}")`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de pedido de tópico:', error);
    throw error;
  }
};

module.exports = { sendTopicRequestEmail };