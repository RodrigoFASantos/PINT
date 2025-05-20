const sequelize = require("../config/db");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importar funções dos outros scripts
const { createTablesInOrder } = require('./criarTabelas');
const { criarPastasCompletas } = require('./criar_pastas_completas');
const { criarPastasEImagens } = require('./criar_pastas_cursos');
const { criarPastasEImagensUsuarios } = require('./criar_pastas_users');

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
    try {
      await criarPastasEImagens(); // Usando a função completa importada
      console.log("✅ Pastas para cursos criadas com sucesso!");
    } catch (error) {
      console.error("❌ ERRO ao criar pastas para cursos:", error.message);
      console.error("Continuando com o próximo passo...");
    }

    // ETAPA 6: Criar pastas para usuários
    console.log("\n==================================================");
    console.log("👥 ETAPA 6: CRIANDO PASTAS PARA USUÁRIOS");
    console.log("==================================================");
    try {
      await criarPastasEImagensUsuarios(); // Usando a função completa importada
      console.log("✅ Pastas para usuários criadas com sucesso!");
    } catch (error) {
      console.error("❌ ERRO ao criar pastas para usuários:", error.message);
      console.error("Continuando finalização...");
    }

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
 * Função para carregar os dados de teste do arquivo SQL
 */
function carregarDadosTeste() {
  try {
    // Primeiro carregar o arquivo dados_teste.sql principal
    const sqlPath = path.join(__dirname, './dados_teste.sql');
    const dadosPrincipais = fs.readFileSync(sqlPath, 'utf-8');
    
    // Tentar também carregar dados específicos para formadores
    try {
      const formadoresPath = path.join(__dirname, './dados_teste_formadores_categorias_areas.sql');
      if (fs.existsSync(formadoresPath)) {
        console.log('✅ Encontrado arquivo de dados para associações de formadores');
        const dadosFormadores = fs.readFileSync(formadoresPath, 'utf-8');
        return dadosPrincipais + '\n\n' + dadosFormadores;
      }
    } catch (formadoresError) {
      console.log('⚠️ Arquivo de dados para formadores não encontrado, usando apenas dados principais');
    }
    
    return dadosPrincipais;
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