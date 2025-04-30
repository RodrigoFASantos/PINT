const sequelize = require("../config/db");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importar funções dos outros scripts
const { createTablesInOrder } = require('./criarTabelas');
const { criarPastasCompletas } = require('./criar_pastas_completas');

// Função principal que orquestra o processo de sincronização completo
async function syncronizarTudo() {
  try {
    console.log("\n==================================================");
    console.log("🚀 INICIANDO PROCESSO DE SINCRONIZAÇÃO COMPLETA 🚀");
    console.log("==================================================\n");

    // Teste de conexão
    console.log("Conectando ao banco de dados...");
    await sequelize.testConnection();
    console.log("✅ Conexão com o banco de dados estabelecida com sucesso!");

    // Verificar se o sequelize está disponível
    if (!sequelize || !sequelize.define) {
      console.error("❌ ERRO: O objeto sequelize importado não é válido ou não possui o método define!");
      console.log("Objeto sequelize:", sequelize);
      process.exit(1);
    }

    // ETAPA 1: Apagar todas as tabelas existentes
    console.log("\n==================================================");
    console.log("🗑️ ETAPA 1: APAGANDO TODAS AS TABELAS EXISTENTES");
    console.log("==================================================");
    await apagarTodasTabelas();

    // ETAPA 2: Criar tabelas na ordem correta
    console.log("\n==================================================");
    console.log("📋 ETAPA 2: CRIANDO TABELAS NA ORDEM CORRETA");
    console.log("==================================================");

    // Desabilitar verificações de chave estrangeira temporariamente para criação e inserção de dados
    await sequelize.query("SET session_replication_role = 'replica';");

    // Criar as tabelas na ordem correta usando o módulo separado
    console.log("Criando tabelas na ordem correta...");
    await createTablesInOrder();
    console.log("✅ Tabelas criadas com sucesso!");

    // ETAPA 3: Inserir dados de teste
    console.log("\n==================================================");
    console.log("📊 ETAPA 3: INSERINDO DADOS DE TESTE");
    console.log("==================================================");

    // Carregar os dados de teste
    const dadosSQL = carregarDadosTeste();
    console.log("Preparando dados de teste...");
    const testDataStatements = prepareSQLStatements(dadosSQL);
    console.log(`Preparados ${testDataStatements.length} comandos SQL para execução.`);

    await executeSQLStatements(testDataStatements);
    console.log("✅ Dados de teste inseridos com sucesso!");

    // Reativar verificações de chave estrangeira
    await sequelize.query("SET session_replication_role = 'origin';");

    // ETAPA 4: Criar estrutura de pastas base
    console.log("\n==================================================");
    console.log("📁 ETAPA 4: CRIANDO ESTRUTURA DE PASTAS BASE");
    console.log("==================================================");
    await criarPastasCompletas();
    console.log("✅ Estrutura de pastas base criada com sucesso!");

    // ETAPA 5: Criar pastas para cursos
    console.log("\n==================================================");
    console.log("📚 ETAPA 5: CRIANDO PASTAS PARA CURSOS");
    console.log("==================================================");
    await criarPastasParaCursos();
    console.log("✅ Pastas para cursos criadas com sucesso!");

    // ETAPA 6: Criar pastas para usuários
    console.log("\n==================================================");
    console.log("👥 ETAPA 6: CRIANDO PASTAS PARA USUÁRIOS");
    console.log("==================================================");
    await criarPastasParaUsuarios();
    console.log("✅ Pastas para usuários criadas com sucesso!");

    console.log("\n==================================================");
    console.log("🎉 SINCRONIZAÇÃO COMPLETA FINALIZADA COM SUCESSO! 🎉");
    console.log("==================================================\n");

    process.exit(0);
  } catch (error) {
    // Em caso de erro, certifique-se de reativar as verificações de chave estrangeira
    try {
      await sequelize.query("SET session_replication_role = 'origin';");
    } catch (e) {
      console.error("Erro ao reativar verificações de chave estrangeira:", e.message);
    }

    console.error("\n❌ ERRO DURANTE A SINCRONIZAÇÃO:");
    console.error(error.message);
    console.error("Detalhes do erro:", error);
    process.exit(1);
  }
}

/**
 * Função para apagar todas as tabelas do banco de dados
 * (Adaptado do arquivo apagar_tabelas.js)
 */
async function apagarTodasTabelas() {
  try {
    console.log("🔄 Iniciando processo de limpeza do banco de dados...");

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

    console.log("✅ Todas as tabelas, sequências e funções foram removidas com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao apagar tabelas:", error.message);
    throw error;
  }
}

/**
 * Função para criar pastas para cursos
 * (Adaptado do arquivo criar_pastas_cursos.js)
 */
async function criarPastasParaCursos() {
  const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS || 'uploads');
  
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

    console.log('Processo de criação de pastas para cursos concluído!');
  } catch (error) {
    console.error('❌ Erro durante o processamento de pastas para cursos:', error);
    throw error;
  }
}

/**
 * Função para criar pastas para usuários
 * (Adaptado do arquivo criar_pastas_users.js)
 */
async function criarPastasParaUsuarios() {
  const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS || 'uploads');
  
  try {
    console.log('Conectando ao banco de dados...');
    const conexaoOk = await sequelize.testConnection();
    if (!conexaoOk) {
      throw new Error('Não foi possível conectar ao banco de dados.');
    }

    console.log('Buscando usuários na base de dados...');
    const [usuarios] = await sequelize.query(
      'SELECT id_utilizador, nome, email, foto_perfil, foto_capa FROM utilizadores'
    );

    console.log(`Encontrados ${usuarios.length} usuários para processar.`);

    // Garantir que a pasta base de uploads/users exista
    const usersBaseDir = path.join(BASE_UPLOAD_DIR, 'users');
    if (!fs.existsSync(usersBaseDir)) {
      fs.mkdirSync(usersBaseDir, { recursive: true });
      console.log(`✅ Diretório base de usuários criado: ${usersBaseDir}`);
    }

    // Verificar se existem as imagens padrão
    const avatarPadrao = path.join(usersBaseDir, 'AVATAR.png');
    const capaPadrao = path.join(usersBaseDir, 'CAPA.png');

    if (!fs.existsSync(avatarPadrao)) {
      console.log('⚠️ Imagem padrão de avatar não encontrada. Criando placeholder...');
      try {
        // Você pode substituir isto por uma cópia de uma imagem real
        fs.writeFileSync(
          avatarPadrao,
          'Este é um placeholder para avatar. Substitua por uma imagem real.'
        );
        console.log(`✅ Arquivo placeholder de avatar criado em ${avatarPadrao}`);
      } catch (error) {
        console.error(`❌ Erro ao criar avatar padrão: ${error.message}`);
      }
    }

    if (!fs.existsSync(capaPadrao)) {
      console.log('⚠️ Imagem padrão de capa não encontrada. Criando placeholder...');
      try {
        // Você pode substituir isto por uma cópia de uma imagem real
        fs.writeFileSync(
          capaPadrao,
          'Este é um placeholder para capa. Substitua por uma imagem real.'
        );
        console.log(`✅ Arquivo placeholder de capa criado em ${capaPadrao}`);
      } catch (error) {
        console.error(`❌ Erro ao criar capa padrão: ${error.message}`);
      }
    }

    // Processar cada usuário
    for (const usuario of usuarios) {
      console.log(`\nProcessando usuário: ${usuario.nome} (ID: ${usuario.id_utilizador})`);

      // Verificar se o usuário tem email
      if (!usuario.email) {
        console.log(`⚠️ Usuário ${usuario.nome} (ID: ${usuario.id_utilizador}) não tem email. Pulando.`);
        continue;
      }

      // Criar slug do usuário baseado no email
      const userSlug = usuario.email.replace(/@/g, '_at_').replace(/\./g, '_');
      const userDir = path.join(usersBaseDir, userSlug);

      console.log(`Diretório de usuário: ${userDir}`);

      // Criar pasta do usuário
      if (!fs.existsSync(userDir)) {
        try {
          fs.mkdirSync(userDir, { recursive: true });
          console.log(`✅ Diretório de usuário criado com sucesso.`);
        } catch (error) {
          console.error(`❌ Erro ao criar diretório de usuário: ${error.message}`);
          continue;
        }
      } else {
        console.log(`ℹ️ Diretório de usuário já existe.`);
      }

      // Definir caminhos para as imagens
      const avatarFilename = `${usuario.email}_AVATAR.png`;
      const capaFilename = `${usuario.email}_CAPA.png`;
      
      const avatarPath = path.join(userDir, avatarFilename);
      const capaPath = path.join(userDir, capaFilename);

      // Verificar e criar imagem de perfil
      if (!fs.existsSync(avatarPath)) {
        try {
          fs.copyFileSync(avatarPadrao, avatarPath);
          console.log(`✅ Imagem de perfil (avatar) criada: ${avatarPath}`);
        } catch (error) {
          console.error(`❌ Erro ao criar imagem de perfil: ${error.message}`);
        }
      } else {
        console.log(`ℹ️ Imagem de perfil já existe.`);
      }

      // Verificar e criar imagem de capa
      if (!fs.existsSync(capaPath)) {
        try {
          fs.copyFileSync(capaPadrao, capaPath);
          console.log(`✅ Imagem de capa criada: ${capaPath}`);
        } catch (error) {
          console.error(`❌ Erro ao criar imagem de capa: ${error.message}`);
        }
      } else {
        console.log(`ℹ️ Imagem de capa já existe.`);
      }

      // Atualizar referências no banco de dados se necessário
      const dbPathAvatar = `uploads/users/${userSlug}/${avatarFilename}`;
      const dbPathCapa = `uploads/users/${userSlug}/${capaFilename}`;

      // Verificar se precisa atualizar as referências no banco
      if (usuario.foto_perfil !== dbPathAvatar || usuario.foto_capa !== dbPathCapa) {
        try {
          await sequelize.query(
            'UPDATE utilizadores SET foto_perfil = ?, foto_capa = ? WHERE id_utilizador = ?',
            {
              replacements: [dbPathAvatar, dbPathCapa, usuario.id_utilizador]
            }
          );
          console.log(`✅ Referências de imagens atualizadas no banco de dados.`);
        } catch (error) {
          console.error(`❌ Erro ao atualizar banco de dados: ${error.message}`);
        }
      } else {
        console.log(`ℹ️ Referências de imagens já estão corretas no banco de dados.`);
      }
    }

    console.log('Processo de criação de pastas para usuários concluído!');
  } catch (error) {
    console.error('❌ Erro durante o processamento de pastas para usuários:', error);
    throw error;
  }
}

/**
 * Função para carregar os dados de teste do arquivo SQL
 */
function carregarDadosTeste() {
  const sqlPath = path.join(__dirname, './dados_teste.sql');
  try {
    return fs.readFileSync(sqlPath, 'utf-8');
  } catch (error) {
    console.error(`❌ Erro ao carregar dados de teste: ${error.message}`);
    console.log('Continuando sem dados de teste...');
    return '';
  }
}

/**
 * Divide o script SQL em comandos individuais, preservando blocos PL/pgSQL
 */
function prepareSQLStatements(sqlScript) {
  if (!sqlScript || sqlScript.trim() === '') {
    return [];
  }

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
}

/**
 * Execute SQL statements in sequence
 */
async function executeSQLStatements(statements) {
  if (!statements || statements.length === 0) {
    console.log('⚠️ Nenhum comando SQL para executar.');
    return;
  }

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      console.log(`Executando comando SQL ${i + 1}/${statements.length}`);
      await sequelize.query(stmt);
      console.log(`✅ Comando SQL ${i + 1} executado com sucesso.`);
    } catch (error) {
      console.error(`❌ Erro ao executar comando SQL ${i + 1}/${statements.length}:`);
      console.error(error.message);
      // Continua a execução para permitir que outros comandos sejam tentados
    }
  }
}

// Executar a função principal
if (require.main === module) {
  syncronizarTudo();
} else {
  module.exports = { syncronizarTudo };
}