const sequelize = require("../config/db");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importar módulos específicos para cada etapa
const { createTablesInOrder } = require('./criarTabelas');
const { criarPastasCompletas } = require('./criar_pastas_completas');
const { criarPastasEImagens } = require('./criar_pastas_cursos');
const { criarPastasEImagensUsuarios } = require('./criar_pastas_users');

/**
 * Script principal de sincronização completa da aplicação
 * 
 * Executa todas as etapas necessárias para configurar o sistema:
 * 1. Limpeza completa da base de dados
 * 2. Criação de todas as tabelas
 * 3. Inserção de dados de teste
 * 4. Criação da estrutura de diretórios
 * 5. Configuração de pastas para cursos e utilizadores
 */
async function syncronizarTudo() {
  try {
    console.log("\n==================================================");
    console.log("🚀 INICIANDO PROCESSO DE SINCRONIZAÇÃO COMPLETA 🚀");
    console.log("==================================================\n");

    // Verificar ligação à base de dados
    console.log("Conectando ao banco de dados...");
    await sequelize.testConnection();
    console.log("✅ Conexão com o banco de dados estabelecida com sucesso!");

    // Validar configuração do Sequelize
    if (!sequelize || !sequelize.define) {
      console.error("❌ ERRO: O objeto sequelize importado não é válido!");
      process.exit(1);
    }

    // Executar todas as etapas de sincronização
    await executarEtapa1_LimpezaBaseDados();
    await executarEtapa2_CriarTabelas();
    await executarEtapa3_InserirDadosTeste();
    await executarEtapa4_CriarEstruturaPastas();
    await executarEtapa5_ConfigurarCursos();
    await executarEtapa6_ConfigurarUtilizadores();

    console.log("\n==================================================");
    console.log("🎉 SINCRONIZAÇÃO COMPLETA FINALIZADA COM SUCESSO! 🎉");
    console.log("==================================================\n");

    process.exit(0);
  } catch (error) {
    await restaurarEstadoBaseDados();
    console.error("\n❌ ERRO DURANTE A SINCRONIZAÇÃO:");
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * ETAPA 1: Limpeza completa da base de dados
 */
async function executarEtapa1_LimpezaBaseDados() {
  console.log("\n==================================================");
  console.log("🗑️ ETAPA 1: APAGANDO TODAS AS TABELAS EXISTENTES");
  console.log("==================================================");
  await apagarTodasTabelas();
}

/**
 * ETAPA 2: Criação de todas as tabelas
 */
async function executarEtapa2_CriarTabelas() {
  console.log("\n==================================================");
  console.log("📋 ETAPA 2: CRIANDO TABELAS NA ORDEM CORRETA");
  console.log("==================================================");

  // Desabilitar verificações de chaves estrangeiras temporariamente
  await sequelize.query("SET session_replication_role = 'replica';");

  console.log("Criando tabelas na ordem correta...");
  await createTablesInOrder();
  console.log("✅ Tabelas criadas com sucesso!");
}

/**
 * ETAPA 3: Inserção de dados de teste
 */
async function executarEtapa3_InserirDadosTeste() {
  console.log("\n==================================================");
  console.log("📊 ETAPA 3: INSERINDO DADOS DE TESTE");
  console.log("==================================================");

  const dadosSQL = carregarDadosTeste();
  console.log("Preparando dados de teste...");
  const testDataStatements = prepareSQLStatements(dadosSQL);
  console.log(`Preparados ${testDataStatements.length} comandos SQL para execução.`);

  await executeSQLStatements(testDataStatements);
  console.log("✅ Dados de teste inseridos com sucesso!");

  // Reativar verificações de chaves estrangeiras
  await sequelize.query("SET session_replication_role = 'origin';");
}

/**
 * ETAPA 4: Criação da estrutura base de pastas
 */
async function executarEtapa4_CriarEstruturaPastas() {
  console.log("\n==================================================");
  console.log("📁 ETAPA 4: CRIANDO ESTRUTURA DE PASTAS BASE");
  console.log("==================================================");
  await criarPastasCompletas();
  console.log("✅ Estrutura de pastas base criada com sucesso!");
}

/**
 * ETAPA 5: Configuração de pastas para cursos
 */
async function executarEtapa5_ConfigurarCursos() {
  console.log("\n==================================================");
  console.log("📚 ETAPA 5: CRIANDO PASTAS PARA CURSOS");
  console.log("==================================================");
  try {
    await criarPastasEImagens();
    console.log("✅ Pastas para cursos criadas com sucesso!");
  } catch (error) {
    console.error("❌ ERRO ao criar pastas para cursos:", error.message);
    console.error("Continuando com o próximo passo...");
  }
}

/**
 * ETAPA 6: Configuração de pastas para utilizadores
 */
async function executarEtapa6_ConfigurarUtilizadores() {
  console.log("\n==================================================");
  console.log("👥 ETAPA 6: CRIANDO PASTAS PARA UTILIZADORES");
  console.log("==================================================");
  try {
    await criarPastasEImagensUsuarios();
    console.log("✅ Pastas para utilizadores criadas com sucesso!");
  } catch (error) {
    console.error("❌ ERRO ao criar pastas para utilizadores:", error.message);
    console.error("Continuando finalização...");
  }
}

/**
 * Remove todas as tabelas da base de dados (adaptado do apagar_tabelas.js)
 */
async function apagarTodasTabelas() {
  try {
    console.log("🔄 Iniciando processo de limpeza do banco de dados...");

    // Obter schema atual
    const [schemaResult] = await sequelize.query(`SELECT current_schema() as schema`);
    const schema = schemaResult[0].schema;
    console.log(`🔍 Schema atual: ${schema}`);

    // Procurar todas as tabelas de utilizador
    const [tablesResult] = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = '${schema}' AND 
       tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'`
    );

    if (tablesResult.length === 0) {
      console.log("ℹ️ Não foram encontradas tabelas para apagar.");
      return;
    }

    console.log(`🔍 Encontradas ${tablesResult.length} tabelas para apagar.`);

    // Desabilitar verificações de chaves estrangeiras
    console.log("🔓 Desabilitando verificações de chave estrangeira...");
    await sequelize.query("SET CONSTRAINTS ALL DEFERRED;");

    // Remover todas as tabelas
    const tableNames = tablesResult.map(table => `"${table.tablename}"`).join(", ");
    console.log("🗑️ Apagando todas as tabelas...");
    await sequelize.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE;`);

    // Limpar sequências órfãs
    await limparSequenciasOrfas(schema);
    
    // Remover funções personalizadas
    await removerFuncoesPersonalizadas(schema);

    console.log("✅ Todas as tabelas, sequências e funções foram removidas com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao apagar tabelas:", error.message);
    throw error;
  }
}

/**
 * Remove sequências órfãs que ficaram sem tabelas
 */
async function limparSequenciasOrfas(schema) {
  const [sequencesResult] = await sequelize.query(
    `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = '${schema}'`
  );

  if (sequencesResult.length > 0) {
    console.log(`🔍 Encontradas ${sequencesResult.length} sequências para apagar.`);
    const sequenceNames = sequencesResult.map(seq => `"${seq.sequence_name}"`).join(", ");
    
    console.log("🗑️ Apagando todas as sequências...");
    await sequelize.query(`DROP SEQUENCE IF EXISTS ${sequenceNames} CASCADE;`);
  }
}

/**
 * Remove funções personalizadas que possam existir
 */
async function removerFuncoesPersonalizadas(schema) {
  const [functionsResult] = await sequelize.query(
    `SELECT routine_name FROM information_schema.routines 
     WHERE routine_schema = '${schema}' AND routine_type = 'FUNCTION'`
  );

  if (functionsResult.length > 0) {
    console.log(`🔍 Encontradas ${functionsResult.length} funções para apagar.`);

    for (const func of functionsResult) {
      try {
        console.log(`🗑️ Apagando função: ${func.routine_name}`);
        await sequelize.query(`DROP FUNCTION IF EXISTS "${func.routine_name}" CASCADE;`);
      } catch (error) {
        console.error(`Erro ao apagar função ${func.routine_name}:`, error.message);
      }
    }
  }
}

/**
 * Carrega os dados de teste do ficheiro SQL
 */
function carregarDadosTeste() {
  try {
    const sqlPath = path.join(__dirname, './dados_teste.sql');
    const dadosPrincipais = fs.readFileSync(sqlPath, 'utf-8');
    
    // Tentar carregar dados específicos para formadores se existirem
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
 * Divide o script SQL em comandos individuais executáveis
 */
function prepareSQLStatements(sqlScript) {
  if (!sqlScript || sqlScript.trim() === '') {
    return [];
  }

  const statements = [];
  let currentStatement = '';
  let inPlpgsqlBlock = false;

  const lines = sqlScript.replace(/\r\n/g, '\n').split('\n');

  for (let line of lines) {
    // Ignorar comentários
    if (line.trim().startsWith('--')) {
      continue;
    }

    // Detectar blocos PL/pgSQL
    if (line.trim().startsWith('DO $$')) {
      inPlpgsqlBlock = true;
      currentStatement = line;
      continue;
    }

    if (inPlpgsqlBlock && line.trim() === 'END $$;') {
      currentStatement += '\n' + line;
      statements.push(currentStatement.trim());
      currentStatement = '';
      inPlpgsqlBlock = false;
      continue;
    }

    if (inPlpgsqlBlock) {
      currentStatement += '\n' + line;
      continue;
    }

    // Processar comandos normais
    currentStatement += (currentStatement ? '\n' : '') + line;

    if (line.trim().endsWith(';')) {
      const trimmedStmt = currentStatement.trim();
      if (trimmedStmt) {
        statements.push(trimmedStmt);
      }
      currentStatement = '';
    }
  }

  // Adicionar comando restante se existir
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

/**
 * Executa uma lista de comandos SQL sequencialmente
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
      // Continua para permitir outros comandos
    }
  }
}

/**
 * Tenta restaurar o estado da base de dados em caso de erro
 */
async function restaurarEstadoBaseDados() {
  try {
    await sequelize.query("SET session_replication_role = 'origin';");
  } catch (e) {
    console.error("Erro ao reativar verificações de chave estrangeira:", e.message);
  }
}

// Executar sincronização se for chamado diretamente
if (require.main === module) {
  syncronizarTudo();
} else {
  module.exports = { syncronizarTudo };
}