const sequelize = require("../config/db");
const fs = require('fs');
const path = require('path');
const { createTablesInOrder } = require('./criarTabelas');

// Dados Teste
const sqlPath = path.join(__dirname, './dados_teste.sql');
const dadosSQL = fs.readFileSync(sqlPath, 'utf-8');

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

// Função para criar estrutura de diretórios necessária
const createDirectoryStructure = () => {
  console.log("Criando estrutura de diretórios para cursos...");
  const baseDir = 'uploads/cursos';

  // Garantir que o diretório base existe
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`Diretório criado: ${baseDir}`);
  }

  // Criar diretório temporário para uploads intermediários
  const tempDir = 'uploads/temp';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Diretório temporário criado: ${tempDir}`);
  }

  console.log("Estrutura de diretórios base criada!");
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

    // Criar estrutura de diretórios necessária
    createDirectoryStructure();

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