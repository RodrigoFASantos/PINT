const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

/**
 * Gerador de certificados de conclusão de cursos
 * Cria certificados em formato PNG utilizando Canvas
 */

// Define o caminho para a pasta public
const publicPath = path.join(__dirname, '../../public');

/**
 * Inicializa as pastas necessárias para o sistema de certificados
 * Cria a estrutura de diretorias se não existir
 */
const inicializarPastas = () => {
  // Verifica e cria pasta public
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }

  // Verifica e cria pasta fonts dentro de public
  const fontsPath = path.join(publicPath, 'fonts');
  if (!fs.existsSync(fontsPath)) {
    fs.mkdirSync(fontsPath, { recursive: true });
  }

  return fontsPath;
};

/**
 * Regista a fonte personalizada para os certificados
 * Se a fonte não existir, usa Arial como fallback
 */
const registarFonte = () => {
  try {
    const fontsPath = inicializarPastas();
    const fontPath = path.join(fontsPath, 'certificate-font.ttf');
    
    if (fs.existsSync(fontPath)) {
      registerFont(fontPath, { family: 'Certificate' });
      console.log('Fonte Certificate registada com sucesso');
    } else {
      console.warn('Fonte personalizada não encontrada, a usar Arial');
    }
  } catch (error) {
    console.error('Erro ao registar fonte:', error.message);
  }
};

/**
 * Gera um certificado de conclusão de curso
 * @param {string} userName - Nome do utilizador
 * @param {string} courseName - Nome do curso
 * @param {string} date - Data de conclusão
 * @param {number} hours - Número de horas do curso
 * @returns {Buffer} Buffer da imagem PNG do certificado
 */
async function generateCertificate(userName, courseName, date, hours) {
  try {
    // Dimensões do certificado
    const width = 1000;
    const height = 700;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    // Define fundo branco
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    // Adiciona moldura preta
    context.strokeStyle = '#000000';
    context.lineWidth = 10;
    context.strokeRect(10, 10, width - 20, height - 20);

    // Título do certificado
    context.font = 'bold 36px Arial';
    context.textAlign = 'center';
    context.fillStyle = '#000000';
    context.fillText('Certificado de Conclusão', width / 2, 100);

    // Texto principal do certificado
    context.font = '24px Arial';
    context.fillText(`Certifica-se que ${userName}`, width / 2, 200);
    context.fillText(`concluiu com sucesso o curso:`, width / 2, 250);
    
    // Nome do curso em destaque
    context.font = 'bold 28px Arial';
    context.fillText(courseName, width / 2, 310);
    
    // Detalhes adicionais do curso
    context.font = '24px Arial';
    context.fillText(`com uma carga horária de ${hours} horas`, width / 2, 370);
    context.fillText(`concluído em ${date}`, width / 2, 430);

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    throw error;
  }
}

// Inicializa o sistema ao carregar o módulo
registarFonte();

module.exports = { generateCertificate };