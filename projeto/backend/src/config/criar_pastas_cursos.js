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

    // 1. Buscar todos os cursos ativos
    console.log('Buscando cursos na base de dados...');
    const [cursos] = await sequelize.query(
      'SELECT id_curso, nome, imagem_path, dir_path FROM curso'
    );

    console.log(`Encontrados ${cursos.length} cursos para processar.`);

    for (const curso of cursos) {
      console.log(`\n==== Processando curso: ${curso.nome} (ID: ${curso.id_curso}) ====`);
      
      // Normalizar o nome do curso para uso em caminhos de arquivos
      const cursoSlug = curso.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Definir diretório base do curso
      let cursoDirPath = curso.dir_path;
      if (!cursoDirPath) {
        cursoDirPath = `uploads/cursos/${cursoSlug}`;
      }
      
      // Caminho completo do diretório
      const fullCursoDirPath = path.join(process.cwd(), cursoDirPath);
      
      // Definir caminho da imagem de capa
      let cursoImgPath = curso.imagem_path;
      if (!cursoImgPath) {
        cursoImgPath = `${cursoDirPath}/capa.png`;
      }
      const fullCursoImgPath = path.join(process.cwd(), cursoImgPath);
      
      // Garantir que o diretório do curso existe
      if (!fs.existsSync(fullCursoDirPath)) {
        try {
          fs.mkdirSync(fullCursoDirPath, { recursive: true });
          console.log(`✅ Diretório do curso criado: ${fullCursoDirPath}`);
          
          // Atualizar caminho no banco de dados
          await sequelize.query(
            'UPDATE curso SET dir_path = ? WHERE id_curso = ?',
            { replacements: [cursoDirPath, curso.id_curso] }
          );
          console.log(`✅ Caminho do diretório atualizado no banco de dados.`);
        } catch (error) {
          console.error(`❌ Erro ao criar diretório do curso: ${error.message}`);
          continue;
        }
      } else {
        console.log(`ℹ️ Diretório do curso já existe: ${fullCursoDirPath}`);
      }
      
      // Criar imagem de capa do curso se não existir
      if (!fs.existsSync(fullCursoImgPath)) {
        try {
          // Criar um arquivo de texto simples como placeholder
          fs.writeFileSync(
            fullCursoImgPath,
            `Este é um placeholder para a capa do curso: ${curso.nome}\nSubstitua este arquivo por uma imagem real.`
          );
          console.log(`✅ Arquivo placeholder de texto criado para capa do curso: ${fullCursoImgPath}`);
          
          // Atualizar caminho no banco de dados
          await sequelize.query(
            'UPDATE curso SET imagem_path = ? WHERE id_curso = ?',
            { replacements: [cursoImgPath, curso.id_curso] }
          );
          console.log(`✅ Caminho da imagem de capa atualizado no banco de dados.`);
        } catch (error) {
          console.error(`❌ Erro ao criar imagem de capa: ${error.message}`);
        }
      } else {
        console.log(`ℹ️ Imagem de capa do curso já existe: ${fullCursoImgPath}`);
      }
      
      // 2. Verificar se já existem tópicos para este curso
      const [topicosExistentes] = await sequelize.query(
        'SELECT COUNT(*) as count FROM curso_topico WHERE id_curso = ?',
        { replacements: [curso.id_curso] }
      );
      
      // Se não existirem tópicos, vamos criar alguns padrões baseados no arquivo dados_teste.sql
      if (topicosExistentes[0].count === 0) {
        console.log(`⚠️ Nenhum tópico encontrado para o curso. Criando tópicos padrão...`);
        
        // Tópicos padrão baseados no tipo de curso
        let topicosDefault = [];
        
        // Verificar se é um curso de programação/tecnologia
        if (curso.nome.toLowerCase().includes('python') || 
            curso.nome.toLowerCase().includes('javascript') || 
            curso.nome.toLowerCase().includes('vue') || 
            curso.nome.toLowerCase().includes('react') || 
            curso.nome.toLowerCase().includes('web')) {
          
          topicosDefault = [
            { nome: 'Introdução', ordem: 1 },
            { nome: 'Fundamentos', ordem: 2 },
            { nome: 'Exercícios Práticos', ordem: 3 },
            { nome: 'Projeto Final', ordem: 4 }
          ];
        } else if (curso.nome.toLowerCase().includes('comunicação') || 
                  curso.nome.toLowerCase().includes('soft skills') || 
                  curso.nome.toLowerCase().includes('gestão')) {
          
          topicosDefault = [
            { nome: 'Conceitos Básicos', ordem: 1 },
            { nome: 'Técnicas Avançadas', ordem: 2 },
            { nome: 'Estudos de Caso', ordem: 3 },
            { nome: 'Avaliação', ordem: 4 }
          ];
        } else {
          // Tópicos genéricos para qualquer outro tipo de curso
          topicosDefault = [
            { nome: 'Introdução ao Tema', ordem: 1 },
            { nome: 'Desenvolvimento', ordem: 2 },
            { nome: 'Aplicações Práticas', ordem: 3 },
            { nome: 'Avaliação Final', ordem: 4 }
          ];
        }
        
        // Inserir os tópicos padrão no banco
        for (const topico of topicosDefault) {
          const topicoSlug = topico.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const topicoDirPath = `${cursoDirPath}/${topicoSlug}`;
          const fullTopicoDirPath = path.join(process.cwd(), topicoDirPath);
          
          // Criar diretório do tópico
          if (!fs.existsSync(fullTopicoDirPath)) {
            fs.mkdirSync(fullTopicoDirPath, { recursive: true });
            console.log(`✅ Diretório de tópico criado: ${fullTopicoDirPath}`);
          }
          
          // Inserir o tópico no banco
          const [result] = await sequelize.query(
            'INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path) VALUES (?, ?, ?, ?, ?) RETURNING id_topico',
            { 
              replacements: [
                topico.nome, 
                curso.id_curso, 
                topico.ordem, 
                true, 
                topicoDirPath
              ] 
            }
          );
          
          const idTopico = result[0].id_topico;
          console.log(`✅ Tópico inserido no banco: ${topico.nome} (ID: ${idTopico})`);
          
          // Criar pastas padrão para o tópico
          const pastasDefault = [
            { nome: 'Material de Apoio', ordem: 1 },
            { nome: 'Exercícios', ordem: 2 }
          ];
          
          for (const pasta of pastasDefault) {
            const pastaSlug = pasta.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const pastaDirPath = `${topicoDirPath}/${pastaSlug}`;
            const fullPastaDirPath = path.join(process.cwd(), pastaDirPath);
            
            // Criar diretório da pasta
            if (!fs.existsSync(fullPastaDirPath)) {
              fs.mkdirSync(fullPastaDirPath, { recursive: true });
              console.log(`✅ Diretório de pasta criado: ${fullPastaDirPath}`);
            }
            
            // Inserir a pasta no banco
            const [pastaResult] = await sequelize.query(
              'INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path) VALUES (?, ?, ?, ?, ?) RETURNING id_pasta',
              { 
                replacements: [
                  pasta.nome, 
                  idTopico, 
                  pasta.ordem, 
                  true, 
                  pastaDirPath
                ] 
              }
            );
            
            const idPasta = pastaResult[0].id_pasta;
            console.log(`✅ Pasta inserida no banco: ${pasta.nome} (ID: ${idPasta})`);
            
            // Criar conteúdo padrão para a pasta
            if (pasta.nome === 'Material de Apoio') {
              // Criar um documento de referência
              const conteudoPath = `${pastaDirPath}/material-de-referencia.pdf`;
              const fullConteudoPath = path.join(process.cwd(), conteudoPath);
              
              if (!fs.existsSync(fullConteudoPath)) {
                fs.writeFileSync(
                  fullConteudoPath,
                  `Este é um placeholder para o material de referência do tópico ${topico.nome}.\nSubstitua este arquivo pelo conteúdo real.`
                );
                console.log(`✅ Arquivo placeholder criado: ${fullConteudoPath}`);
              }
              
              // Inserir o conteúdo no banco
              await sequelize.query(
                'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                { 
                  replacements: [
                    'Material de Referência', 
                    `Material de referência para o tópico ${topico.nome}`,
                    'file',
                    conteudoPath,
                    idPasta,
                    curso.id_curso,
                    1,
                    true
                  ] 
                }
              );
              console.log(`✅ Conteúdo inserido no banco: Material de Referência`);
              
              // Adicionar um link para documentação externa
              await sequelize.query(
                'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                { 
                  replacements: [
                    'Recursos Online', 
                    'Links para recursos online relevantes',
                    'link',
                    'https://www.exemplo.com/recursos',
                    idPasta,
                    curso.id_curso,
                    2,
                    true
                  ] 
                }
              );
              console.log(`✅ Conteúdo (link) inserido no banco: Recursos Online`);
            }
            
            if (pasta.nome === 'Exercícios') {
              // Criar um arquivo de exercícios
              const conteudoPath = `${pastaDirPath}/lista-exercicios.pdf`;
              const fullConteudoPath = path.join(process.cwd(), conteudoPath);
              
              if (!fs.existsSync(fullConteudoPath)) {
                fs.writeFileSync(
                  fullConteudoPath,
                  `Este é um placeholder para a lista de exercícios do tópico ${topico.nome}.\nSubstitua este arquivo pelo conteúdo real.`
                );
                console.log(`✅ Arquivo placeholder criado: ${fullConteudoPath}`);
              }
              
              // Inserir o conteúdo no banco
              await sequelize.query(
                'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                { 
                  replacements: [
                    'Lista de Exercícios', 
                    `Exercícios práticos para o tópico ${topico.nome}`,
                    'file',
                    conteudoPath,
                    idPasta,
                    curso.id_curso,
                    1,
                    true
                  ] 
                }
              );
              console.log(`✅ Conteúdo inserido no banco: Lista de Exercícios`);
            }
          }
        }
      } else {
        // Se já existem tópicos, processar os tópicos existentes
        const [topicos] = await sequelize.query(
          'SELECT id_topico, nome, arquivo_path FROM curso_topico WHERE id_curso = ?',
          { replacements: [curso.id_curso] }
        );
        
        console.log(`Encontrados ${topicos.length} tópicos existentes para o curso.`);
        
        for (const topico of topicos) {
          console.log(`\n-- Processando tópico existente: ${topico.nome} (ID: ${topico.id_topico})`);
          
          // Normalizar o nome do tópico para uso em caminhos
          const topicoSlug = topico.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          
          // Definir caminho do tópico
          let topicoDirPath = topico.arquivo_path;
          if (!topicoDirPath) {
            topicoDirPath = `${cursoDirPath}/${topicoSlug}`;
          }
          const fullTopicoDirPath = path.join(process.cwd(), topicoDirPath);
          
          // Criar diretório do tópico se não existir
          if (!fs.existsSync(fullTopicoDirPath)) {
            try {
              fs.mkdirSync(fullTopicoDirPath, { recursive: true });
              console.log(`✅ Diretório do tópico criado: ${fullTopicoDirPath}`);
              
              // Atualizar caminho no banco de dados
              await sequelize.query(
                'UPDATE curso_topico SET arquivo_path = ? WHERE id_topico = ?',
                { replacements: [topicoDirPath, topico.id_topico] }
              );
            } catch (error) {
              console.error(`❌ Erro ao criar diretório do tópico: ${error.message}`);
              continue;
            }
          } else {
            console.log(`ℹ️ Diretório do tópico já existe: ${fullTopicoDirPath}`);
          }
          
          // Verificar se já existem pastas para este tópico
          const [pastasExistentes] = await sequelize.query(
            'SELECT COUNT(*) as count FROM curso_topico_pasta WHERE id_topico = ?',
            { replacements: [topico.id_topico] }
          );
          
          // Se não existirem pastas, criar algumas pastas padrão
          if (pastasExistentes[0].count === 0) {
            console.log(`⚠️ Nenhuma pasta encontrada para o tópico. Criando pastas padrão...`);
            
            const pastasDefault = [
              { nome: 'Material de Apoio', ordem: 1 },
              { nome: 'Exercícios', ordem: 2 }
            ];
            
            for (const pasta of pastasDefault) {
              const pastaSlug = pasta.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              const pastaDirPath = `${topicoDirPath}/${pastaSlug}`;
              const fullPastaDirPath = path.join(process.cwd(), pastaDirPath);
              
              // Criar diretório da pasta
              if (!fs.existsSync(fullPastaDirPath)) {
                fs.mkdirSync(fullPastaDirPath, { recursive: true });
                console.log(`✅ Diretório de pasta criado: ${fullPastaDirPath}`);
              }
              
              // Inserir a pasta no banco
              const [pastaResult] = await sequelize.query(
                'INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path) VALUES (?, ?, ?, ?, ?) RETURNING id_pasta',
                { 
                  replacements: [
                    pasta.nome, 
                    topico.id_topico, 
                    pasta.ordem, 
                    true, 
                    pastaDirPath
                  ] 
                }
              );
              
              const idPasta = pastaResult[0].id_pasta;
              console.log(`✅ Pasta inserida no banco: ${pasta.nome} (ID: ${idPasta})`);
              
              // Criar conteúdo padrão para a pasta
              if (pasta.nome === 'Material de Apoio') {
                // Criar um documento de referência
                const conteudoPath = `${pastaDirPath}/material-de-referencia.pdf`;
                const fullConteudoPath = path.join(process.cwd(), conteudoPath);
                
                if (!fs.existsSync(fullConteudoPath)) {
                  fs.writeFileSync(
                    fullConteudoPath,
                    `Este é um placeholder para o material de referência do tópico ${topico.nome}.\nSubstitua este arquivo pelo conteúdo real.`
                  );
                  console.log(`✅ Arquivo placeholder criado: ${fullConteudoPath}`);
                }
                
                // Inserir o conteúdo no banco
                await sequelize.query(
                  'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                  { 
                    replacements: [
                      'Material de Referência', 
                      `Material de referência para o tópico ${topico.nome}`,
                      'file',
                      conteudoPath,
                      idPasta,
                      curso.id_curso,
                      1,
                      true
                    ] 
                  }
                );
                console.log(`✅ Conteúdo inserido no banco: Material de Referência`);
              }
              
              if (pasta.nome === 'Exercícios') {
                // Criar um arquivo de exercícios
                const conteudoPath = `${pastaDirPath}/lista-exercicios.pdf`;
                const fullConteudoPath = path.join(process.cwd(), conteudoPath);
                
                if (!fs.existsSync(fullConteudoPath)) {
                  fs.writeFileSync(
                    fullConteudoPath,
                    `Este é um placeholder para a lista de exercícios do tópico ${topico.nome}.\nSubstitua este arquivo pelo conteúdo real.`
                  );
                  console.log(`✅ Arquivo placeholder criado: ${fullConteudoPath}`);
                }
                
                // Inserir o conteúdo no banco
                await sequelize.query(
                  'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                  { 
                    replacements: [
                      'Lista de Exercícios', 
                      `Exercícios práticos para o tópico ${topico.nome}`,
                      'file',
                      conteudoPath,
                      idPasta,
                      curso.id_curso,
                      1,
                      true
                    ] 
                  }
                );
                console.log(`✅ Conteúdo inserido no banco: Lista de Exercícios`);
              }
            }
          } else {
            // Processar pastas existentes
            const [pastas] = await sequelize.query(
              'SELECT id_pasta, nome, arquivo_path FROM curso_topico_pasta WHERE id_topico = ?',
              { replacements: [topico.id_topico] }
            );
            
            console.log(`Encontradas ${pastas.length} pastas existentes para o tópico.`);
            
            for (const pasta of pastas) {
              console.log(`-- Processando pasta existente: ${pasta.nome} (ID: ${pasta.id_pasta})`);
              
              // Normalizar o nome da pasta para uso em caminhos
              const pastaSlug = pasta.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              
              // Definir caminho da pasta
              let pastaDirPath = pasta.arquivo_path;
              if (!pastaDirPath) {
                pastaDirPath = `${topicoDirPath}/${pastaSlug}`;
              }
              const fullPastaDirPath = path.join(process.cwd(), pastaDirPath);
              
              // Criar diretório da pasta se não existir
              if (!fs.existsSync(fullPastaDirPath)) {
                try {
                  fs.mkdirSync(fullPastaDirPath, { recursive: true });
                  console.log(`✅ Diretório da pasta criado: ${fullPastaDirPath}`);
                  
                  // Atualizar caminho no banco de dados
                  await sequelize.query(
                    'UPDATE curso_topico_pasta SET arquivo_path = ? WHERE id_pasta = ?',
                    { replacements: [pastaDirPath, pasta.id_pasta] }
                  );
                } catch (error) {
                  console.error(`❌ Erro ao criar diretório da pasta: ${error.message}`);
                  continue;
                }
              } else {
                console.log(`ℹ️ Diretório da pasta já existe: ${fullPastaDirPath}`);
              }
              
              // Verificar se já existem conteúdos para esta pasta
              const [conteudosExistentes] = await sequelize.query(
                'SELECT COUNT(*) as count FROM curso_topico_pasta_conteudo WHERE id_pasta = ?',
                { replacements: [pasta.id_pasta] }
              );
              
              // Se não existirem conteúdos, criar alguns conteúdos padrão
              if (conteudosExistentes[0].count === 0) {
                console.log(`⚠️ Nenhum conteúdo encontrado para a pasta. Criando conteúdo padrão...`);
                
                // Criar um documento placeholder
                const conteudoPath = `${pastaDirPath}/documento-${pastaSlug}.pdf`;
                const fullConteudoPath = path.join(process.cwd(), conteudoPath);
                
                if (!fs.existsSync(fullConteudoPath)) {
                  fs.writeFileSync(
                    fullConteudoPath,
                    `Este é um placeholder para um documento na pasta ${pasta.nome}.\nSubstitua este arquivo pelo conteúdo real.`
                  );
                  console.log(`✅ Arquivo placeholder criado: ${fullConteudoPath}`);
                }
                
                // Inserir o conteúdo no banco
                await sequelize.query(
                  'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                  { 
                    replacements: [
                      `Documento ${pasta.nome}`, 
                      `Documento para a pasta ${pasta.nome}`,
                      'file',
                      conteudoPath,
                      pasta.id_pasta,
                      curso.id_curso,
                      1,
                      true
                    ] 
                  }
                );
                console.log(`✅ Conteúdo inserido no banco: Documento ${pasta.nome}`);
              } else {
                // Processar conteúdos existentes
                const [conteudos] = await sequelize.query(
                  'SELECT id_conteudo, titulo, tipo, url, arquivo_path FROM curso_topico_pasta_conteudo WHERE id_pasta = ?',
                  { replacements: [pasta.id_pasta] }
                );
                
                console.log(`Encontrados ${conteudos.length} conteúdos existentes para a pasta.`);
                
                for (const conteudo of conteudos) {
                  console.log(`---- Processando conteúdo existente: ${conteudo.titulo} (ID: ${conteudo.id_conteudo})`);
                  
                  if (conteudo.tipo === 'file') {
                    // Normalizar o nome do conteúdo para uso em caminhos
                    const conteudoSlug = conteudo.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    
                    // Definir caminho do arquivo
                    let conteudoFilePath = conteudo.arquivo_path;
                    if (!conteudoFilePath) {
                      conteudoFilePath = `${pastaDirPath}/${conteudoSlug}.pdf`;
                    }
                    const fullConteudoFilePath = path.join(process.cwd(), conteudoFilePath);
                    
                    // Criar arquivo placeholder se não existir
                    if (!fs.existsSync(fullConteudoFilePath)) {
                      try {
                        fs.writeFileSync(
                          fullConteudoFilePath,
                          `Este é um placeholder para o conteúdo: ${conteudo.titulo}\nSubstitua este arquivo pelo conteúdo real.`
                        );
                        console.log(`✅ Arquivo placeholder criado para o conteúdo: ${fullConteudoFilePath}`);
                        
                        // Atualizar caminho no banco de dados
                        await sequelize.query(
                          'UPDATE curso_topico_pasta_conteudo SET arquivo_path = ? WHERE id_conteudo = ?',
                          { replacements: [conteudoFilePath, conteudo.id_conteudo] }
                        );
                      } catch (error) {
                        console.error(`❌ Erro ao criar arquivo do conteúdo: ${error.message}`);
                      }
                    } else {
                      console.log(`ℹ️ Arquivo do conteúdo já existe: ${fullConteudoFilePath}`);
                    }
                  } else if (conteudo.tipo === 'link' && !conteudo.url) {
                    // Atualizar URL padrão para links sem URL
                    await sequelize.query(
                      'UPDATE curso_topico_pasta_conteudo SET url = ? WHERE id_conteudo = ?',
                      { replacements: ['https://www.exemplo.com/recurso', conteudo.id_conteudo] }
                    );
                    console.log(`✅ URL padrão definida para o conteúdo tipo link.`);
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log('\n🎉 Processo de criação de estrutura de cursos concluído com sucesso!');
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