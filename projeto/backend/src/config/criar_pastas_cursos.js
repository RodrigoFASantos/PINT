// criar_pastas_cursos.js
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db');

async function criarPastasEImagens() {
  try {
    console.log('Conectando ao banco de dados...');
    // Testar a conexão com o banco de dados
    const conexaoOk = await sequelize.testConnection();
    if (!conexaoOk) {
      throw new Error('Não foi possível conectar ao banco de dados.');
    }
    
    console.log('Buscando cursos na base de dados...');
    
    // Buscar todos os cursos que têm um caminho de imagem definido
    const [cursos] = await sequelize.query(
      'SELECT id_curso, nome, imagem_path, dir_path FROM curso WHERE imagem_path IS NOT NULL'
    );
    
    console.log(`Encontrados ${cursos.length} cursos para processar.`);
    
    // Determinar o caminho raiz do projeto
    const rootPath = path.join(__dirname, '..');
    
    for (const curso of cursos) {
      // Caminho completo para a imagem
      const imagemPath = path.join(rootPath, curso.imagem_path);
      // Diretório que contém a imagem
      const dirPath = path.dirname(imagemPath);
      
      console.log(`\nProcessando curso: ${curso.nome} (ID: ${curso.id_curso})`);
      console.log(`Caminho da imagem: ${imagemPath}`);
      console.log(`Diretório: ${dirPath}`);
      
      // Criar o diretório se não existir
      if (!fs.existsSync(dirPath)) {
        try {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`✅ Diretório criado com sucesso.`);
        } catch (error) {
          console.error(`❌ Erro ao criar diretório: ${error.message}`);
          continue;
        }
      } else {
        console.log(`ℹ️ Diretório já existe.`);
      }
      
      // Criar um arquivo de imagem placeholder se não existir
      if (!fs.existsSync(imagemPath)) {
        try {
          // Verificar se existe uma imagem de exemplo para copiar
          const placeholderPath = path.join(rootPath, 'uploads', 'placeholder.png');
          
          if (fs.existsSync(placeholderPath)) {
            // Copiar a imagem de exemplo
            fs.copyFileSync(placeholderPath, imagemPath);
            console.log(`✅ Imagem placeholder copiada.`);
          } else {
            // Criar um arquivo de texto como placeholder
            fs.writeFileSync(
              imagemPath, 
              `Este é um placeholder para: ${curso.nome}\nSubstitua este arquivo por uma imagem real.`
            );
            console.log(`✅ Arquivo placeholder de texto criado.`);
          }
        } catch (error) {
          console.error(`❌ Erro ao criar imagem: ${error.message}`);
        }
      } else {
        console.log(`ℹ️ Imagem já existe.`);
      }
    }
    
    console.log('\n🎉 Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o processamento:', error);
  } finally {
    // Fechar a conexão com o banco de dados
    await sequelize.close();
  }
}

// Executar a função principal
criarPastasEImagens();