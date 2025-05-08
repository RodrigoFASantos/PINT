const sequelize = require("../config/db");

/**
 * Script para apagar todas as tabelas da base de dados
 * Este script deve ser usado com cautela, pois removerá TODOS os dados
 */

(async () => {
  try {
    // Teste de ligação
    await sequelize.testConnection();
    console.log("Ligação à base de dados estabelecida com sucesso!");

    // Verificar se o sequelize está disponível
    if (!sequelize || !sequelize.define) {
      console.error("ERRO: O objeto sequelize importado não é válido ou não possui o método define!");
      console.log("Objeto sequelize:", sequelize);
      process.exit(1);
    }

    console.log("\n⚠️  ATENÇÃO! ⚠️");
    console.log("⚠️  Este script irá apagar TODAS as tabelas e dados da base de dados!");
    console.log("⚠️  Esta operação NÃO pode ser desfeita!");
    console.log("⚠️  Prima CTRL+C para cancelar se não tem a certeza.");
    console.log("\n⏳ A aguardar 5 segundos antes de prosseguir...");

    // Aguardar 5 segundos para dar oportunidade ao utilizador de cancelar
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log("\n🔄 A iniciar processo de limpeza...");

    // Obter o nome do schema atual (geralmente 'public' em PostgreSQL)
    const [schemaResult] = await sequelize.query(`SELECT current_schema() as schema`);
    const schema = schemaResult[0].schema;
    console.log(`🔍 Schema atual: ${schema}`);

    // Obter uma lista de todas as tabelas na base de dados
    const [tablesResult] = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = '${schema}' AND 
       tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'`
    );
    
    if (tablesResult.length === 0) {
      console.log("ℹ️ Não foram encontradas tabelas para apagar.");
      process.exit(0);
    }

    console.log(`🔍 Encontradas ${tablesResult.length} tabelas para apagar.`);
    
    // Primeiro, desabilitar todas as verificações de chave estrangeira
    console.log("🔓 A desabilitar verificações de chave estrangeira...");
    await sequelize.query("SET CONSTRAINTS ALL DEFERRED;");
    
    // Preparar o comando para apagar todas as tabelas
    const tableNames = tablesResult.map(table => `"${table.tablename}"`).join(", ");
    
    console.log("🗑️ A apagar todas as tabelas...");
    await sequelize.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE;`);
    
    // Também eliminar todas as sequências, que são usadas para campos autoincrement/serial
    const [sequencesResult] = await sequelize.query(
      `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = '${schema}'`
    );
    
    if (sequencesResult.length > 0) {
      console.log(`🔍 Encontradas ${sequencesResult.length} sequências para apagar.`);
      const sequenceNames = sequencesResult.map(seq => `"${seq.sequence_name}"`).join(", ");
      
      console.log("🗑️ A apagar todas as sequências...");
      await sequelize.query(`DROP SEQUENCE IF EXISTS ${sequenceNames} CASCADE;`);
    }
    
    // Eliminar também funções personalizadas que possam ter sido criadas
    const [functionsResult] = await sequelize.query(
      `SELECT routine_name FROM information_schema.routines 
       WHERE routine_schema = '${schema}' AND routine_type = 'FUNCTION'`
    );
    
    if (functionsResult.length > 0) {
      console.log(`🔍 Encontradas ${functionsResult.length} funções para apagar.`);
      
      // Apagar cada função individualmente
      for (const func of functionsResult) {
        console.log(`🗑️ A apagar função: ${func.routine_name}`);
        await sequelize.query(`DROP FUNCTION IF EXISTS "${func.routine_name}" CASCADE;`);
      }
    }
    
    console.log("\n✅ Todas as tabelas, sequências e funções foram removidas com sucesso!");
    console.log("🔄 Para recriar a base de dados, execute o script sync.js");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro ao apagar tabelas:", error.message);
    console.error("Detalhes do erro:", error);
    process.exit(1);
  }
})();