const fs = require('fs');
const path = require('path');
require('dotenv').config();

function criar_pasta_uploads() {
  const uploadDir = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS);

  const subPastas = ['chat', 'users', 'cursos'];
  const ficheiros = [
    { nome: 'AVATAR.png', conteudo: 'Este é um placeholder para AVATAR.png. Substitua por uma imagem real.' },
    { nome: 'CAPA.png', conteudo: 'Este é um placeholder para CAPA.png. Substitua por uma imagem real.' }
  ];

  // Criar pasta uploads se não existir
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`✅ Pasta criada: ${uploadDir}`);
  } else {
    console.log(`ℹ️ Pasta já existe: ${uploadDir}`);
  }

  // Criar subpastas
  subPastas.forEach(sub => {
    const subPath = path.join(uploadDir, sub);
    if (!fs.existsSync(subPath)) {
      fs.mkdirSync(subPath, { recursive: true });
      console.log(`✅ Subpasta criada: ${subPath}`);
    } else {
      console.log(`ℹ️ Subpasta já existe: ${subPath}`);
    }
  });

  // Criar ficheiros se não existirem
  ficheiros.forEach(fich => {
    const filePath = path.join(uploadDir, fich.nome);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, fich.conteudo);
      console.log(`✅ Ficheiro criado: ${filePath}`);
    } else {
      console.log(`ℹ️ Ficheiro já existe: ${filePath}`);
    }
  });
}

module.exports = { criar_pasta_uploads };
