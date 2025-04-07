// Verifica se a pasta public existe, se não existir cria-a
const fs = require('fs');
const path = require('path');

// Caminho para a pasta public
const publicPath = path.join(__dirname, '../../public');

// Verifica se a pasta public existe, se não existir cria-a
if (!fs.existsSync(publicPath)) {
  console.log('A criar pasta public...');
  fs.mkdirSync(publicPath, { recursive: true });
}

// Verifica se a pasta fonts existe dentro de public, se não existir cria-a
const fontsPath = path.join(publicPath, 'fonts');
if (!fs.existsSync(fontsPath)) {
  console.log('A criar pasta fonts...');
  fs.mkdirSync(fontsPath, { recursive: true });
}

// O resto do código original de certificateGenerator.js
const { createCanvas, loadImage, registerFont } = require('canvas');

// Corrige o registo da fonte para verificar primeiro se ela existe
try {
  // Caminho para a fonte
  const fontPath = path.join(fontsPath, 'certificate-font.ttf');
  
  // Se a fonte não existir, avisa sem falhar
  if (!fs.existsSync(fontPath)) {
    console.warn(`Aviso: Fonte não encontrada em ${fontPath}. A usar fonte padrão.`);
  } else {
    registerFont(fontPath, { family: 'Certificate' });
    console.log('Fonte registada com sucesso.');
  }
} catch (error) {
  console.error('Erro ao registar a fonte:', error);
  // Continue mesmo com erro na fonte
}

// Função para gerar certificado
async function generateCertificate(userName, courseName, date, hours) {
  try {
    // Cria um canvas com as dimensões do certificado
    const width = 1000;
    const height = 700;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    // Define um fundo branco
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    // Adiciona uma borda
    context.strokeStyle = '#000000';
    context.lineWidth = 10;
    context.strokeRect(10, 10, width - 20, height - 20);

    // Adiciona um título
    context.font = 'bold 36px Arial'; // Usa Arial como fallback se Certificate falhar
    context.textAlign = 'center';
    context.fillStyle = '#000000';
    context.fillText('Certificado de Conclusão', width / 2, 100);

    // Adiciona o texto do certificado
    context.font = '24px Arial';
    context.fillText(`Certifica-se que ${userName}`, width / 2, 200);
    context.fillText(`concluiu com sucesso o curso:`, width / 2, 250);
    
    // Nome do curso
    context.font = 'bold 28px Arial';
    context.fillText(courseName, width / 2, 310);
    
    // Detalhes adicionais
    context.font = '24px Arial';
    context.fillText(`com uma carga horária de ${hours} horas`, width / 2, 370);
    context.fillText(`concluído em ${date}`, width / 2, 430);

    // Retorna o buffer do canvas como uma imagem PNG
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    throw error;
  }
}

module.exports = { generateCertificate };