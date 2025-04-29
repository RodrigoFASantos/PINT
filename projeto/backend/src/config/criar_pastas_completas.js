const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS);

function apagarDiretorio(diretorio) {
  if (fs.existsSync(diretorio)) {
    const arquivos = fs.readdirSync(diretorio);
    for (const arquivo of arquivos) {
      const caminhoCompleto = path.join(diretorio, arquivo);
      if (fs.statSync(caminhoCompleto).isDirectory()) {
        apagarDiretorio(caminhoCompleto);
      } else {
        fs.unlinkSync(caminhoCompleto);
      }
    }
    fs.rmdirSync(diretorio);
    console.log(`🗑️ Diretório apagado: ${diretorio}`);
  }
}

function criarPastasCompletas() {
  console.log("\n===== APAGANDO E RECRIANDO ESTRUTURA DE DIRETÓRIOS =====");

  const directories = [
    path.join(BASE_UPLOAD_DIR, 'cursos'),
    path.join(BASE_UPLOAD_DIR, 'users'),
    path.join(BASE_UPLOAD_DIR, 'chat'),
    path.join(BASE_UPLOAD_DIR, 'temp')
  ];

  if (!fs.existsSync(BASE_UPLOAD_DIR)) {
    fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
    console.log(`✅ Diretório base criado: uploads`);
  }

  directories.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        apagarDiretorio(dir);
      }
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Diretório recriado: ${dir}`);
    } catch (error) {
      console.error(`❌ Erro ao processar diretório ${dir}: ${error.message}`);
    }
  });

  const avatarPath = path.join(BASE_UPLOAD_DIR, 'AVATAR.png');
  const capaPath = path.join(BASE_UPLOAD_DIR, 'CAPA.png');

  try {
    fs.writeFileSync(avatarPath, 'Este é um placeholder para AVATAR.png. Substitua por uma imagem real.');
    console.log('✅ Arquivo placeholder AVATAR.png criado');
  } catch (error) {
    console.error(`❌ Erro ao criar AVATAR.png: ${error.message}`);
  }

  try {
    fs.writeFileSync(capaPath, 'Este é um placeholder para CAPA.png. Substitua por uma imagem real.');
    console.log('✅ Arquivo placeholder CAPA.png criado');
  } catch (error) {
    console.error(`❌ Erro ao criar CAPA.png: ${error.message}`);
  }

  console.log("\n🎉 Estrutura de diretórios recriada com sucesso!");
}

if (require.main === module) {
  criarPastasCompletas();
} else {
  module.exports = { criarPastasCompletas };
}
