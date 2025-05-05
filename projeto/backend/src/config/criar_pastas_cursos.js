const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sequelize = require('../config/db');

const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS || 'uploads');

async function criarPastasEImagens() {
  try {
    console.log('Conectando ao banco de dados...');
    const conexaoOk = await sequelize.testConnection();
    if (!conexaoOk) {
      throw new Error('Não foi possível conectar ao banco de dados.');
    }

    // 1. Buscar todos os cursos
    console.log('Buscando cursos na base de dados...');
    const [cursos] = await sequelize.query(
      'SELECT id_curso, nome, imagem_path, dir_path FROM curso WHERE ativo = true'
    );

    console.log(`Encontrados ${cursos.length} cursos para processar.`);

    for (const curso of cursos) {
      console.log(`\n==== Processando curso: ${curso.nome} (ID: ${curso.id_curso}) ====`);
      
      // Criar diretório base do curso
      const cursoDirPath = path.join(process.cwd(), curso.dir_path || `uploads/cursos/${curso.nome.toLowerCase().replace(/\s+/g, '-')}`);
      const cursoImgPath = path.join(process.cwd(), curso.imagem_path || `${cursoDirPath}/capa.png`);
      
      // Garantir que o diretório do curso existe
      if (!fs.existsSync(cursoDirPath)) {
        try {
          fs.mkdirSync(cursoDirPath, { recursive: true });
          console.log(`✅ Diretório do curso criado: ${cursoDirPath}`);
          
          // Atualizar caminho no banco de dados se necessário
          if (!curso.dir_path) {
            await sequelize.query(
              'UPDATE curso SET dir_path = ? WHERE id_curso = ?',
              { replacements: [cursoDirPath.replace(process.cwd() + '/', ''), curso.id_curso] }
            );
            console.log(`✅ Caminho do diretório atualizado no banco de dados.`);
          }
        } catch (error) {
          console.error(`❌ Erro ao criar diretório do curso: ${error.message}`);
          continue;
        }
      }
      
      // Criar imagem de capa do curso se não existir
      if (!fs.existsSync(cursoImgPath)) {
        try {
          const placeholderPath = path.join(BASE_UPLOAD_DIR, 'placeholder.png');

          if (fs.existsSync(placeholderPath)) {
            fs.copyFileSync(placeholderPath, cursoImgPath);
            console.log(`✅ Imagem placeholder copiada para: ${cursoImgPath}`);
          } else {
            fs.writeFileSync(
              cursoImgPath,
              `Este é um placeholder para: ${curso.nome}\nSubstitua este arquivo por uma imagem real.`
            );
            console.log(`✅ Arquivo placeholder de texto criado para capa do curso.`);
          }
          
          // Atualizar caminho no banco de dados se necessário
          if (!curso.imagem_path) {
            await sequelize.query(
              'UPDATE curso SET imagem_path = ? WHERE id_curso = ?',
              { replacements: [cursoImgPath.replace(process.cwd() + '/', ''), curso.id_curso] }
            );
            console.log(`✅ Caminho da imagem de capa atualizado no banco de dados.`);
          }
        } catch (error) {
          console.error(`❌ Erro ao criar imagem de capa: ${error.message}`);
        }
      }
      
      // 2. Buscar tópicos do curso
      const [topicos] = await sequelize.query(
        'SELECT id_topico, nome, arquivo_path FROM curso_topico WHERE id_curso = ? AND ativo = true',
        { replacements: [curso.id_curso] }
      );
      
      console.log(`Encontrados ${topicos.length} tópicos para o curso.`);
      
      for (const topico of topicos) {
        console.log(`\n-- Processando tópico: ${topico.nome} (ID: ${topico.id_topico})`);
        
        // Criar diretório do tópico
        const topicoDirPath = path.join(cursoDirPath, topico.nome.toLowerCase().replace(/\s+/g, '-'));
        
        if (!fs.existsSync(topicoDirPath)) {
          try {
            fs.mkdirSync(topicoDirPath, { recursive: true });
            console.log(`✅ Diretório do tópico criado: ${topicoDirPath}`);
            
            // Atualizar caminho no banco de dados
            await sequelize.query(
              'UPDATE curso_topico SET arquivo_path = ? WHERE id_topico = ?',
              { replacements: [topicoDirPath.replace(process.cwd() + '/', ''), topico.id_topico] }
            );
          } catch (error) {
            console.error(`❌ Erro ao criar diretório do tópico: ${error.message}`);
            continue;
          }
        }
        
        // 3. Buscar pastas do tópico
        const [pastas] = await sequelize.query(
          'SELECT id_pasta, nome, arquivo_path FROM curso_topico_pasta WHERE id_topico = ? AND ativo = true',
          { replacements: [topico.id_topico] }
        );
        
        console.log(`Encontradas ${pastas.length} pastas para o tópico.`);
        
        for (const pasta of pastas) {
          console.log(`-- Processando pasta: ${pasta.nome} (ID: ${pasta.id_pasta})`);
          
          // Criar diretório da pasta
          const pastaDirPath = path.join(topicoDirPath, pasta.nome.toLowerCase().replace(/\s+/g, '-'));
          
          if (!fs.existsSync(pastaDirPath)) {
            try {
              fs.mkdirSync(pastaDirPath, { recursive: true });
              console.log(`✅ Diretório da pasta criado: ${pastaDirPath}`);
              
              // Atualizar caminho no banco de dados
              await sequelize.query(
                'UPDATE curso_topico_pasta SET arquivo_path = ? WHERE id_pasta = ?',
                { replacements: [pastaDirPath.replace(process.cwd() + '/', ''), pasta.id_pasta] }
              );
            } catch (error) {
              console.error(`❌ Erro ao criar diretório da pasta: ${error.message}`);
              continue;
            }
          }
          
          // 4. Buscar conteúdos da pasta
          const [conteudos] = await sequelize.query(
            'SELECT id_conteudo, titulo, tipo, url, arquivo_path FROM curso_topico_pasta_conteudo WHERE id_pasta = ? AND ativo = true',
            { replacements: [pasta.id_pasta] }
          );
          
          console.log(`Encontrados ${conteudos.length} conteúdos para a pasta.`);
          
          for (const conteudo of conteudos) {
            if (conteudo.tipo === 'file') {
              console.log(`---- Processando conteúdo de arquivo: ${conteudo.titulo} (ID: ${conteudo.id_conteudo})`);
              
              // Criar arquivo placeholder para o conteúdo
              const conteudoFilePath = path.join(pastaDirPath, `${conteudo.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
              
              if (!fs.existsSync(conteudoFilePath)) {
                try {
                  fs.writeFileSync(
                    conteudoFilePath,
                    `Este é um placeholder para o conteúdo: ${conteudo.titulo}\nSubstitua este arquivo pelo conteúdo real.`
                  );
                  console.log(`✅ Arquivo placeholder criado para o conteúdo: ${conteudoFilePath}`);
                  
                  // Atualizar caminho no banco de dados
                  await sequelize.query(
                    'UPDATE curso_topico_pasta_conteudo SET arquivo_path = ? WHERE id_conteudo = ?',
                    { replacements: [conteudoFilePath.replace(process.cwd() + '/', ''), conteudo.id_conteudo] }
                  );
                } catch (error) {
                  console.error(`❌ Erro ao criar arquivo do conteúdo: ${error.message}`);
                }
              }
            }
          }
        }
      }
    }

    console.log('\n🎉 Processo concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro durante o processamento:', error);
    return false;
  } finally {
    try {
      await sequelize.close();
      console.log('Conexão com o banco de dados fechada.');
    } catch (error) {
      console.error('Erro ao fechar conexão com o banco:', error);
    }
  }
}

// Executar o script quando chamado diretamente
if (require.main === module) {
  criarPastasEImagens();
} else {
  module.exports = { criarPastasEImagens };
}