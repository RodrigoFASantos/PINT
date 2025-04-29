const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sequelize = require('../config/db');

const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS);

async function criarPastasEImagens() {
  try {
    console.log('Conectando ao banco de dados...');
    const conexaoOk = await sequelize.testConnection();
    if (!conexaoOk) {
      throw new Error('Não foi possível conectar ao banco de dados.');
    }

    console.log('Buscando cursos na base de dados...');
    const [cursos] = await sequelize.query(
      'SELECT id_curso, nome, imagem_path, dir_path FROM curso WHERE imagem_path IS NOT NULL'
    );

    console.log(`Encontrados ${cursos.length} cursos para processar.`);

    for (const curso of cursos) {
      const imagemPath = path.join(process.cwd(), curso.imagem_path);
      const dirPath = path.dirname(imagemPath);

      console.log(`\nProcessando curso: ${curso.nome} (ID: ${curso.id_curso})`);
      console.log(`Caminho da imagem: ${imagemPath}`);
      console.log(`Diretório: ${dirPath}`);

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

      if (!fs.existsSync(imagemPath)) {
        try {
          const placeholderPath = path.join(BASE_UPLOAD_DIR, 'placeholder.png');

          if (fs.existsSync(placeholderPath)) {
            fs.copyFileSync(placeholderPath, imagemPath);
            console.log(`✅ Imagem placeholder copiada.`);
          } else {
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
    await sequelize.close();
  }
}

criarPastasEImagens();
