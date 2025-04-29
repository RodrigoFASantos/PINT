// criar_pastas_completas.js
const fs = require('fs');
const path = require('path');

/**
 * Script para apagar e recriar todas as pastas necessárias para o sistema
 * Este script pode ser executado após o sync.js ou ser chamado diretamente pelo sync.js
 */

function apagarDiretorio(diretorio) {
  if (fs.existsSync(diretorio)) {
    // Primeiro remover todos os arquivos dentro do diretório
    const arquivos = fs.readdirSync(diretorio);
    for (const arquivo of arquivos) {
      const caminhoCompleto = path.join(diretorio, arquivo);
      
      // Se for um diretório, apagar recursivamente
      if (fs.statSync(caminhoCompleto).isDirectory()) {
        apagarDiretorio(caminhoCompleto);
      } else {
        // Se for um arquivo, apagar diretamente
        fs.unlinkSync(caminhoCompleto);
      }
    }
    
    // Depois apagar o diretório vazio
    fs.rmdirSync(diretorio);
    console.log(`🗑️ Diretório apagado: ${diretorio}`);
  }
}

function criarPastasCompletas() {
  console.log("\n===== APAGANDO E RECRIANDO ESTRUTURA DE DIRETÓRIOS =====");
  
  // Determinar o caminho raiz do projeto (um nível acima deste script)
  const rootPath = path.join(__dirname, '..');
  
  // Lista de todos os diretórios que precisam ser recriados
  const directories = [
    'uploads/cursos',
    'uploads/users',
    'uploads/chat',
    'uploads/temp'
  ];

  // Garantir que o diretório uploads exista
  const uploadsPath = path.join(rootPath, 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`✅ Diretório base criado: uploads`);
  }
  
  // Apagar e recriar cada diretório específico
  directories.forEach(dir => {
    const fullPath = path.join(rootPath, dir);
    
    try {
      // Apagar o diretório se existir
      if (fs.existsSync(fullPath)) {
        apagarDiretorio(fullPath);
      }
      
      // Recriar o diretório
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Diretório recriado: ${dir}`);
    } catch (error) {
      console.error(`❌ Erro ao processar diretório ${dir}: ${error.message}`);
    }
  });

  // Criar os arquivos AVATAR.png e CAPA.png padrão
  const avatarPath = path.join(rootPath, 'uploads', 'AVATAR.png');
  const capaPath = path.join(rootPath, 'uploads', 'CAPA.png');
  
  try {
    // Criar um arquivo placeholder para o avatar
    fs.writeFileSync(
      avatarPath,
      'Este é um placeholder para AVATAR.png. Substitua por uma imagem real.'
    );
    console.log('✅ Arquivo placeholder AVATAR.png criado');
  } catch (error) {
    console.error(`❌ Erro ao criar AVATAR.png: ${error.message}`);
  }
  
  try {
    // Criar um arquivo placeholder para a capa
    fs.writeFileSync(
      capaPath,
      'Este é um placeholder para CAPA.png. Substitua por uma imagem real.'
    );
    console.log('✅ Arquivo placeholder CAPA.png criado');
  } catch (error) {
    console.error(`❌ Erro ao criar CAPA.png: ${error.message}`);
  }

  console.log("\n🎉 Estrutura de diretórios recriada com sucesso!");
}

// Verificar se o script está sendo executado diretamente ou importado
if (require.main === module) {
  // Executar a função principal se o script foi chamado diretamente
  criarPastasCompletas();
} else {
  // Exportar a função para poder ser chamada por outros scripts
  module.exports = { criarPastasCompletas };
}