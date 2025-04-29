const sequelize = require("../config/db");
const fs = require('fs');
const path = require('path');
const { createTablesInOrder } = require('./criarTabelas');
const { criarPastasCompletas } = require('./criar_pastas_completas');
require('dotenv').config();
const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS);

// Dados Teste
const sqlPath = path.join(__dirname, './dados_teste.sql');
const dadosSQL = fs.readFileSync(sqlPath, 'utf-8');

// Função auxiliar para normalizar nomes para uso em caminhos de arquivos
const normalizarNome = (nome) => {
  // Remove acentos e converte para minúsculas
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
    .replace(/[^a-z0-9]+/g, '-')     // Substitui caracteres não alfanuméricos por hífens
    .replace(/^-+|-+$/g, '');        // Remove hífens no início ou fim
};

// Função para verificar diretórios definidos no banco antes de criar
const verificarDiretoriosExistentes = async () => {
  try {
    console.log('Verificando diretórios definidos no banco de dados...');

    // Consultar valores únicos de dir_path em várias tabelas
    const [cursos] = await sequelize.query('SELECT DISTINCT dir_path FROM curso WHERE dir_path IS NOT NULL');
    const [topicos] = await sequelize.query('SELECT DISTINCT dir_path FROM curso_topico WHERE dir_path IS NOT NULL');
    const [pastas] = await sequelize.query('SELECT DISTINCT dir_path FROM curso_topico_pasta WHERE dir_path IS NOT NULL');

    // Extrair os valores de dir_path
    const dirPaths = [
      ...cursos.map(c => c.dir_path),
      ...topicos.map(t => t.dir_path),
      ...pastas.map(p => p.dir_path)
    ];

    // Eliminar duplicatas
    const uniqueDirPaths = [...new Set(dirPaths)];

    console.log(`Encontrados ${uniqueDirPaths.length} diretórios definidos explicitamente no banco.`);
    console.log('Diretórios encontrados:');
    uniqueDirPaths.forEach(dir => console.log(` - ${dir}`));

    return uniqueDirPaths;
  } catch (error) {
    console.error('Erro ao verificar diretórios existentes:', error);
    return [];
  }
};

// Função para criar toda a estrutura de diretórios dos cursos, tópicos, pastas e conteúdos
const criarEstruturaCompleta = async () => {
  try {
    console.log('Iniciando criação da estrutura completa de cursos...');

    // Verificar os diretórios existentes no banco antes de criar
    const diretoriosBanco = await verificarDiretoriosExistentes();

    // Determinar o caminho raiz do projeto
    const rootPath = process.cwd();

    // 1. Buscar todos os cursos
    console.log('1. Buscando cursos na base de dados...');
    const [cursos] = await sequelize.query(
      'SELECT id_curso, nome, imagem_path, dir_path FROM curso'
    );
    console.log(`Encontrados ${cursos.length} cursos para processar.`);

    for (const curso of cursos) {
      console.log(`\n========== Processando curso: ${curso.nome} (ID: ${curso.id_curso}) ==========`);

      // Diretório do curso (ex: uploads/cursos/curso-de-vuejs)
      const cursoDirPath = curso.dir_path ? path.join(rootPath, curso.dir_path) : null;

      if (!cursoDirPath) {
        console.log(`⚠️ Curso ${curso.nome} não tem diretório definido. Pulando.`);
        continue;
      }

      // Criar o diretório do curso se não existir
      if (!fs.existsSync(cursoDirPath)) {
        try {
          fs.mkdirSync(cursoDirPath, { recursive: true });
          console.log(`✅ Diretório do curso criado: ${cursoDirPath}`);
        } catch (error) {
          console.error(`❌ Erro ao criar diretório do curso: ${error.message}`);
          continue;
        }
      } else {
        console.log(`ℹ️ Diretório do curso já existe: ${cursoDirPath}`);
      }

      // Capa do curso
      if (curso.imagem_path) {
        const imagemPath = path.join(rootPath, curso.imagem_path);
        const dirPath = path.dirname(imagemPath);

        // Criar o diretório da imagem se não existir
        if (!fs.existsSync(dirPath)) {
          try {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Diretório da imagem criado: ${dirPath}`);
          } catch (error) {
            console.error(`❌ Erro ao criar diretório da imagem: ${error.message}`);
          }
        }

        // Criar um arquivo de imagem placeholder se não existir
        if (!fs.existsSync(imagemPath)) {
          try {
            fs.writeFileSync(
              imagemPath,
              `Este é um placeholder para: ${curso.nome}\nSubstitua este arquivo por uma imagem real.`
            );
            console.log(`✅ Arquivo placeholder criado: ${imagemPath}`);
          } catch (error) {
            console.error(`❌ Erro ao criar imagem: ${error.message}`);
          }
        }
      }

      // 2. Buscar todos os tópicos do curso
      console.log(`\n2. Buscando tópicos do curso ${curso.nome}...`);
      const [topicos] = await sequelize.query(
        'SELECT id_topico, nome, arquivo_path, dir_path FROM curso_topico WHERE id_curso = ?',
        { replacements: [curso.id_curso] }
      );
      console.log(`Encontrados ${topicos.length} tópicos para o curso.`);

      for (const topico of topicos) {
        console.log(`\n--- Processando tópico: ${topico.nome} (ID: ${topico.id_topico}) ---`);

        // Determinar o diretório do tópico - PRIORIZAR o dir_path do banco de dados
        let topicoDirPath = null;

        // Se o tópico tem um caminho explícito no banco, usar ele
        if (topico.dir_path) {
          topicoDirPath = path.join(rootPath, topico.dir_path);
          console.log(`ℹ️ Usando diretório explícito do banco: ${topico.dir_path}`);
        }
        // Se não, verificar se há algum caminho deduzível do arquivo
        else if (topico.arquivo_path) {
          const arquivoDir = path.dirname(topico.arquivo_path);
          if (arquivoDir && arquivoDir !== '.') {
            topicoDirPath = path.join(rootPath, arquivoDir);
            console.log(`ℹ️ Usando diretório inferido do arquivo: ${arquivoDir}`);
          }
        }

        // Se ainda não temos um diretório, criar um com base no nome normalizado
        if (!topicoDirPath) {
          const topicoSlug = normalizarNome(topico.nome);
          topicoDirPath = path.join(cursoDirPath, topicoSlug);
          console.log(`ℹ️ Criando diretório baseado no nome normalizado: ${topicoSlug}`);
        }

        // Criar o diretório do tópico se não existir
        if (!fs.existsSync(topicoDirPath)) {
          try {
            fs.mkdirSync(topicoDirPath, { recursive: true });
            console.log(`✅ Diretório do tópico criado: ${topicoDirPath}`);
          } catch (error) {
            console.error(`❌ Erro ao criar diretório do tópico: ${error.message}`);
            continue;
          }
        } else {
          console.log(`ℹ️ Diretório do tópico já existe: ${topicoDirPath}`);
        }

        // Criar arquivo do tópico, se especificado
        if (topico.arquivo_path) {
          const arquivoPath = path.join(rootPath, topico.arquivo_path);
          const arquivoDirPath = path.dirname(arquivoPath);

          // Garantir que o diretório do arquivo exista
          if (!fs.existsSync(arquivoDirPath)) {
            try {
              fs.mkdirSync(arquivoDirPath, { recursive: true });
              console.log(`✅ Diretório para arquivo do tópico criado: ${arquivoDirPath}`);
            } catch (error) {
              console.error(`❌ Erro ao criar diretório para arquivo do tópico: ${error.message}`);
            }
          }

          // Criar arquivo placeholder se não existir
          if (!fs.existsSync(arquivoPath)) {
            try {
              fs.writeFileSync(
                arquivoPath,
                `Este é um arquivo placeholder para o tópico: ${topico.nome}`
              );
              console.log(`✅ Arquivo do tópico criado: ${arquivoPath}`);
            } catch (error) {
              console.error(`❌ Erro ao criar arquivo do tópico: ${error.message}`);
            }
          }
        }

        // 3. Buscar todas as pastas do tópico
        console.log(`\n3. Buscando pastas do tópico ${topico.nome}...`);
        const [pastas] = await sequelize.query(
          'SELECT id_pasta, nome, arquivo_path, dir_path FROM curso_topico_pasta WHERE id_topico = ?',
          { replacements: [topico.id_topico] }
        );
        console.log(`Encontradas ${pastas.length} pastas para o tópico.`);

        for (const pasta of pastas) {
          console.log(`\n-- Processando pasta: ${pasta.nome} (ID: ${pasta.id_pasta}) --`);

          // Determinar o diretório da pasta - PRIORIZAR o dir_path do banco de dados
          let pastaDirPath = null;

          // Se a pasta tem um caminho explícito no banco, usar ele
          if (pasta.dir_path) {
            pastaDirPath = path.join(rootPath, pasta.dir_path);
            console.log(`ℹ️ Usando diretório explícito do banco: ${pasta.dir_path}`);
          }
          // Se não, verificar se há algum caminho deduzível do arquivo
          else if (pasta.arquivo_path) {
            const arquivoDir = path.dirname(pasta.arquivo_path);
            if (arquivoDir && arquivoDir !== '.') {
              pastaDirPath = path.join(rootPath, arquivoDir);
              console.log(`ℹ️ Usando diretório inferido do arquivo: ${arquivoDir}`);
            }
          }

          // Se ainda não temos um diretório, criar um com base no nome normalizado
          if (!pastaDirPath) {
            const pastaSlug = normalizarNome(pasta.nome);
            pastaDirPath = path.join(topicoDirPath, pastaSlug);
            console.log(`ℹ️ Criando diretório baseado no nome normalizado: ${pastaSlug}`);
          }

          // Criar o diretório da pasta se não existir
          if (!fs.existsSync(pastaDirPath)) {
            try {
              fs.mkdirSync(pastaDirPath, { recursive: true });
              console.log(`✅ Diretório da pasta criado: ${pastaDirPath}`);
            } catch (error) {
              console.error(`❌ Erro ao criar diretório da pasta: ${error.message}`);
              continue;
            }
          } else {
            console.log(`ℹ️ Diretório da pasta já existe: ${pastaDirPath}`);
          }

          // Criar arquivo da pasta, se especificado
          if (pasta.arquivo_path) {
            const arquivoPath = path.join(rootPath, pasta.arquivo_path);
            const arquivoDirPath = path.dirname(arquivoPath);

            // Garantir que o diretório do arquivo exista
            if (!fs.existsSync(arquivoDirPath)) {
              try {
                fs.mkdirSync(arquivoDirPath, { recursive: true });
                console.log(`✅ Diretório para arquivo da pasta criado: ${arquivoDirPath}`);
              } catch (error) {
                console.error(`❌ Erro ao criar diretório para arquivo da pasta: ${error.message}`);
              }
            }

            // Criar arquivo placeholder se não existir
            if (!fs.existsSync(arquivoPath)) {
              try {
                fs.writeFileSync(
                  arquivoPath,
                  `Este é um arquivo placeholder para a pasta: ${pasta.nome}`
                );
                console.log(`✅ Arquivo da pasta criado: ${arquivoPath}`);
              } catch (error) {
                console.error(`❌ Erro ao criar arquivo da pasta: ${error.message}`);
              }
            }
          }

          // 4. Buscar todos os conteúdos da pasta
          console.log(`\n4. Buscando conteúdos da pasta ${pasta.nome}...`);
          const [conteudos] = await sequelize.query(
            'SELECT id_conteudo, titulo, tipo, url, arquivo_path FROM curso_topico_pasta_conteudo WHERE id_pasta = ?',
            { replacements: [pasta.id_pasta] }
          );
          console.log(`Encontrados ${conteudos.length} conteúdos para a pasta.`);


          // Modificação na parte de processamento de conteúdos 
          // Substitua o bloco que processa os conteúdos por este:

          for (const conteudo of conteudos) {
            console.log(`- Processando conteúdo: ${conteudo.titulo} (ID: ${conteudo.id_conteudo})`);

            // Diretório onde os arquivos de conteúdo serão salvos
            const conteudoDirPath = pastaDirPath;

            // Nome do arquivo a ser criado (normalizado a partir do título)
            const fileName = normalizarNome(conteudo.titulo);

            // Dois cenários: conteúdo com arquivo_path ou apenas com URL
            if (conteudo.arquivo_path) {
              // CASO 1: Conteúdo com arquivo_path definido
              const arquivoPath = path.join(rootPath, conteudo.arquivo_path);
              const arquivoDirPath = path.dirname(arquivoPath);

              // Garantir que o diretório do arquivo exista
              if (!fs.existsSync(arquivoDirPath)) {
                try {
                  fs.mkdirSync(arquivoDirPath, { recursive: true });
                  console.log(`✅ Diretório para arquivo do conteúdo criado: ${arquivoDirPath}`);
                } catch (error) {
                  console.error(`❌ Erro ao criar diretório para arquivo do conteúdo: ${error.message}`);
                  continue;
                }
              }

              // Criar arquivo placeholder se não existir
              if (!fs.existsSync(arquivoPath)) {
                try {
                  // Criar diferentes tipos de placeholder conforme o tipo de conteúdo
                  let conteudoPlaceholder = `Este é um arquivo placeholder para o conteúdo: ${conteudo.titulo}`;

                  if (conteudo.arquivo_path.endsWith('.pdf')) {
                    // Se for um PDF, criar um arquivo de texto dizendo que é um placeholder
                    conteudoPlaceholder = `Este é um placeholder para o PDF: ${conteudo.titulo}\nSubstitua este arquivo por um PDF real.`;
                  } else if (conteudo.arquivo_path.endsWith('.mp4') || conteudo.arquivo_path.includes('video')) {
                    // Se for um vídeo, criar um arquivo de texto dizendo que é um placeholder
                    conteudoPlaceholder = `Este é um placeholder para o vídeo: ${conteudo.titulo}\nSubstitua este arquivo por um vídeo real.`;
                  }

                  fs.writeFileSync(arquivoPath, conteudoPlaceholder);
                  console.log(`✅ Arquivo do conteúdo criado: ${arquivoPath}`);
                } catch (error) {
                  console.error(`❌ Erro ao criar arquivo do conteúdo: ${error.message}`);
                }
              } else {
                console.log(`ℹ️ Arquivo do conteúdo já existe: ${arquivoPath}`);
              }
            } else {
              // CASO 2: Conteúdo SEM arquivo_path - precisamos criar um placeholder baseado no tipo
              try {
                let extensao = '.txt';
                let conteudoPlaceholder = `Este é um placeholder para o conteúdo: ${conteudo.titulo}`;

                // Definir a extensão adequada baseada no tipo de conteúdo
                if (conteudo.tipo === 'video' || (conteudo.url && conteudo.url.includes('youtube'))) {
                  extensao = '.video.txt';
                  conteudoPlaceholder = `Este é um placeholder para o vídeo: ${conteudo.titulo}\n`;
                  if (conteudo.url) conteudoPlaceholder += `URL: ${conteudo.url}\n`;
                  conteudoPlaceholder += `Substitua este arquivo por um vídeo real ou mantenha a URL.`;
                } else if (conteudo.tipo === 'pdf') {
                  extensao = '.pdf.txt';
                  conteudoPlaceholder = `Este é um placeholder para o PDF: ${conteudo.titulo}\nSubstitua este arquivo por um PDF real.`;
                } else if (conteudo.tipo === 'link') {
                  extensao = '.link.txt';
                  conteudoPlaceholder = `Este é um placeholder para o link: ${conteudo.titulo}\n`;
                  if (conteudo.url) conteudoPlaceholder += `URL: ${conteudo.url}\n`;
                  conteudoPlaceholder += `Substitua este arquivo por um link real ou mantenha a URL.`;
                } else if (conteudo.tipo === 'file') {
                  extensao = '.file.txt';
                  conteudoPlaceholder = `Este é um placeholder para o arquivo: ${conteudo.titulo}\nSubstitua este arquivo por um arquivo real.`;
                }

                // Criar o arquivo placeholder na pasta do conteúdo
                const placeholderPath = path.join(conteudoDirPath, `${fileName}${extensao}`);

                if (!fs.existsSync(placeholderPath)) {
                  fs.writeFileSync(placeholderPath, conteudoPlaceholder);
                  console.log(`✅ Arquivo placeholder criado para conteúdo sem arquivo_path: ${placeholderPath}`);
                } else {
                  console.log(`ℹ️ Arquivo placeholder já existe: ${placeholderPath}`);
                }
              } catch (error) {
                console.error(`❌ Erro ao criar arquivo placeholder para conteúdo sem arquivo_path: ${error.message}`);
              }
            }
          }






        }
      }
    }

    console.log('\n✅ Processo de criação da estrutura completa de cursos concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante o processamento da estrutura de cursos:', error);
    throw error;
  }
};

// Execute SQL statements in sequence
const executeSQLStatements = async (statements) => {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      console.log(`Executando comando SQL ${i + 1}/${statements.length}`);
      await sequelize.query(stmt);
      console.log(`Comando SQL ${i + 1} executado com sucesso.`);
    } catch (error) {
      console.error(`Erro ao executar comando SQL ${i + 1}/${statements.length}:`);
      console.error(stmt);
      console.error(error.message);
      // Continua a execução para permitir que outros comandos sejam tentados
    }
  }
};

// Divide o script SQL em comandos individuais, preservando blocos PL/pgSQL
const prepareSQLStatements = (sqlScript) => {
  const statements = [];
  let currentStatement = '';
  let inPlpgsqlBlock = false;

  // Dividir o script em linhas
  const lines = sqlScript.replace(/\r\n/g, '\n').split('\n');

  for (let line of lines) {
    // Ignorar linhas de comentário
    if (line.trim().startsWith('--')) {
      continue;
    }

    // Detectar início de bloco PL/pgSQL
    if (line.trim().startsWith('DO $$')) {
      inPlpgsqlBlock = true;
      currentStatement = line;
      continue;
    }

    // Detectar fim de bloco PL/pgSQL
    if (inPlpgsqlBlock && line.trim() === 'END $$;') {
      currentStatement += '\n' + line;
      statements.push(currentStatement.trim());
      currentStatement = '';
      inPlpgsqlBlock = false;
      continue;
    }

    // Se estamos dentro de um bloco PL/pgSQL, adicionar a linha ao bloco
    if (inPlpgsqlBlock) {
      currentStatement += '\n' + line;
      continue;
    }

    // Para comandos normais, adicionar a linha e verificar se termina com ponto e vírgula
    currentStatement += (currentStatement ? '\n' : '') + line;

    if (line.trim().endsWith(';')) {
      const trimmedStmt = currentStatement.trim();
      if (trimmedStmt) {
        statements.push(trimmedStmt);
      }
      currentStatement = '';
    }
  }

  // Adicionar qualquer comando restante
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
};

// Função para apagar todas as tabelas do banco de dados
const dropAllTables = async () => {
  console.log("\n🔄 Iniciando processo de limpeza...");

  try {
    // Obter o nome do schema atual (geralmente 'public' em PostgreSQL)
    const [schemaResult] = await sequelize.query(`SELECT current_schema() as schema`);
    const schema = schemaResult[0].schema;
    console.log(`🔍 Schema atual: ${schema}`);

    // Pegar uma lista de todas as tabelas no banco de dados
    const [tablesResult] = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = '${schema}' AND 
       tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'`
    );

    if (tablesResult.length === 0) {
      console.log("ℹ️ Não foram encontradas tabelas para apagar.");
      return;
    }

    console.log(`🔍 Encontradas ${tablesResult.length} tabelas para apagar.`);

    // Primeiro, desabilitar todas as verificações de chave estrangeira
    console.log("🔓 Desabilitando verificações de chave estrangeira...");
    await sequelize.query("SET CONSTRAINTS ALL DEFERRED;");

    // Preparar o comando para apagar todas as tabelas
    const tableNames = tablesResult.map(table => `"${table.tablename}"`).join(", ");

    console.log("🗑️ Apagando todas as tabelas...");
    await sequelize.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE;`);

    // Também eliminar todas as sequências, que são usadas para campos autoincrement/serial
    const [sequencesResult] = await sequelize.query(
      `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = '${schema}'`
    );

    if (sequencesResult.length > 0) {
      console.log(`🔍 Encontradas ${sequencesResult.length} sequências para apagar.`);
      const sequenceNames = sequencesResult.map(seq => `"${seq.sequence_name}"`).join(", ");

      console.log("🗑️ Apagando todas as sequências...");
      await sequelize.query(`DROP SEQUENCE IF EXISTS ${sequenceNames} CASCADE;`);
    }

    // Eliminar também funções personalizadas que podem ter sido criadas
    const [functionsResult] = await sequelize.query(
      `SELECT routine_name FROM information_schema.routines 
       WHERE routine_schema = '${schema}' AND routine_type = 'FUNCTION'`
    );

    if (functionsResult.length > 0) {
      console.log(`🔍 Encontradas ${functionsResult.length} funções para apagar.`);

      // Apagar cada função individualmente
      for (const func of functionsResult) {
        try {
          console.log(`🗑️ Apagando função: ${func.routine_name}`);
          await sequelize.query(`DROP FUNCTION IF EXISTS "${func.routine_name}" CASCADE;`);
        } catch (error) {
          console.error(`Erro ao apagar função ${func.routine_name}:`, error.message);
          // Continua para a próxima função
        }
      }
    }

    console.log("\n✅ Todas as tabelas, sequências e funções foram removidas com sucesso!");
  } catch (error) {
    console.error("\n❌ Erro ao apagar tabelas:", error.message);
    throw error;
  }
};

(async () => {
  try {
    // Teste de conexão
    await sequelize.testConnection();
    console.log("Conexão com o banco de dados estabelecida com sucesso!");

    // Verificar se o sequelize está disponível
    if (!sequelize || !sequelize.define) {
      console.error("ERRO: O objeto sequelize importado não é válido ou não possui o método define!");
      console.log("Objeto sequelize:", sequelize);
      process.exit(1);
    }

    // Etapa 0: Recriar estrutura de diretórios base
    console.log("\n===== ETAPA 0: RECRIANDO ESTRUTURA DE DIRETÓRIOS BASE =====");
    await criarPastasCompletas();

    // Etapa 1: Apagar todas as tabelas existentes
    console.log("\n===== ETAPA 1: APAGANDO TODAS AS TABELAS =====");
    await dropAllTables();

    // Etapa 2: Criar tabelas na ordem correta
    console.log("\n===== ETAPA 2: CRIANDO TABELAS NA ORDEM CORRETA =====");

    // Desabilitar verificações de chave estrangeira temporariamente
    await sequelize.query("SET session_replication_role = 'replica';");

    // Criar as tabelas na ordem correta usando o módulo separado
    console.log("Criando tabelas na ordem correta...");
    await createTablesInOrder();

    // Etapa 3: Inserir dados de teste
    console.log("\n===== ETAPA 3: INSERINDO DADOS DE TESTE =====");

    // Carregar os dados de teste
    console.log("Preparando dados de teste...");
    const testDataStatements = prepareSQLStatements(dadosSQL);
    console.log(`Preparados ${testDataStatements.length} comandos SQL para execução.`);

    await executeSQLStatements(testDataStatements);
    console.log("Dados de teste inseridos!");

    // Reativar verificações
    await sequelize.query("SET session_replication_role = 'origin';");

    // Verificar diretórios antes de criar
    console.log("\n===== VERIFICANDO DIRETÓRIOS DEFINIDOS NO BANCO =====");
    await verificarDiretoriosExistentes();

    // Etapa 4: Criar estrutura completa para todos os cursos
    console.log("\n===== ETAPA 4: CRIANDO ESTRUTURA COMPLETA PARA TODOS OS CURSOS =====");
    await criarEstruturaCompleta();

    console.log("\n✅ Processo concluído com sucesso!");
    process.exit(0);
  } catch (error) {
    // Em caso de erro, certifique-se de reativar as verificações de chave estrangeira
    try {
      await sequelize.query("SET session_replication_role = 'origin';");
    } catch (e) {
      console.error("Erro ao reativar verificações de chave estrangeira:", e.message);
    }

    console.error("Erro ao sincronizar ou carregar os dados de teste:", error.message);
    console.error("Detalhes do erro:", error);
    process.exit(1);
  }
})();