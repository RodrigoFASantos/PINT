const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Módulo para envio de emails de solicitação de criação de tópicos
 * Permite aos utilizadores solicitar novos tópicos aos administradores
 */

// Configuração do transportador de email usando variáveis de ambiente
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envia email ao administrador solicitando criação de novo tópico
 * @param {string} categoriaNome - Nome da categoria onde será criado o tópico
 * @param {string} titulo - Título do tópico solicitado
 * @param {string} descricao - Descrição detalhada do tópico
 * @param {Object} solicitante - Dados do utilizador que fez a solicitação
 * @param {string} solicitante.nome - Nome do solicitante
 * @param {string} solicitante.email - Email do solicitante
 * @returns {Promise<boolean>} True se o email foi enviado com sucesso
 */
const sendTopicRequestEmail = async (categoriaNome, titulo, descricao, solicitante) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error('Email do administrador não configurado');
    }

    // Configuração do conteúdo do email
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

    // Envio do email
    await transporter.sendMail(mailOptions);
    console.log(`Pedido de tópico "${titulo}" enviado para administrador`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar pedido de tópico:', error.message);
    throw error;
  }
};

module.exports = { sendTopicRequestEmail };