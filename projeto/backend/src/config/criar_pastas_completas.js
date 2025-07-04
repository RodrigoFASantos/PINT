const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Configuração do diretório base para uploads
 * Utiliza a variável de ambiente ou define 'uploads' como padrão
 */
const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS || 'uploads');

/**
 * Remove recursivamente um diretório e todo o seu conteúdo
 * @param {string} diretorio - Caminho completo do diretório a remover
 */
function apagarDiretorio(diretorio) {
  if (fs.existsSync(diretorio)) {
    const ficheiros = fs.readdirSync(diretorio);
    
    // Processar cada item dentro do diretório
    for (const ficheiro of ficheiros) {
      const caminhoCompleto = path.join(diretorio, ficheiro);
      
      if (fs.statSync(caminhoCompleto).isDirectory()) {
        // Se for diretório, chamar recursivamente
        apagarDiretorio(caminhoCompleto);
      } else {
        // Se for ficheiro, eliminar diretamente
        fs.unlinkSync(caminhoCompleto);
      }
    }
    
    fs.rmdirSync(diretorio);
    console.log(`🗑️ Diretório apagado: ${diretorio}`);
  }
}

/**
 * Cria a estrutura completa de diretórios para a aplicação
 * 
 * Estrutura criada:
 * - uploads/cursos/ (para ficheiros de cursos)
 * - uploads/utilizadores/ (para dados de utilizadores)
 * - uploads/chat/ (para anexos de chat)
 * - uploads/temp/ (para ficheiros temporários)
 * - AVATAR.png e CAPA.png (ficheiros padrão)
 */
function criarPastasCompletas() {
  console.log("\n===== A APAGAR E RECRIAR ESTRUTURA DE DIRETÓRIOS =====");
  console.log(`Diretório base: ${BASE_UPLOAD_DIR}`);

  // Definir todos os diretórios necessários
  const directories = [
    path.join(BASE_UPLOAD_DIR, 'cursos'),
    path.join(BASE_UPLOAD_DIR, 'utilizadores'),
    path.join(BASE_UPLOAD_DIR, 'chat'),
    path.join(BASE_UPLOAD_DIR, 'temp')
  ];

  // Criar diretório base se não existir
  if (!fs.existsSync(BASE_UPLOAD_DIR)) {
    fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
    console.log(`✅ Diretório base criado: ${BASE_UPLOAD_DIR}`);
  }

  // Processar cada diretório: apagar se existir e recriar
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

  // Criar ficheiros padrão para avatar e capa
  const avatarPath = path.join(BASE_UPLOAD_DIR, 'AVATAR.png');
  const capaPath = path.join(BASE_UPLOAD_DIR, 'CAPA.png');

  try {
    fs.writeFileSync(avatarPath, 'Este é um espaço reservado para AVATAR.png. Substitua por uma imagem real.');
    console.log('✅ Ficheiro espaço reservado AVATAR.png criado');
  } catch (error) {
    console.error(`❌ Erro ao criar AVATAR.png: ${error.message}`);
  }

  try {
    fs.writeFileSync(capaPath, 'Este é um espaço reservado para CAPA.png. Substitua por uma imagem real.');
    console.log('✅ Ficheiro espaço reservado CAPA.png criado');
  } catch (error) {
    console.error(`❌ Erro ao criar CAPA.png: ${error.message}`);
  }

  console.log("\n🎉 Estrutura de diretórios recriada com sucesso!");
  return true;
}

// Permitir execução direta ou importação como módulo
if (require.main === module) {
  criarPastasCompletas();
} else {
  module.exports = { criarPastasCompletas };
}