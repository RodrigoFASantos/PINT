const sequelize = require("../config/db");

/**
 * Script para eliminar completamente todas as tabelas da base de dados
 * 
 * Este script executa uma limpeza total da base de dados, removendo:
 * - Todas as tabelas de utilizador
 * - Sequências automáticas (SERIAL/AUTO_INCREMENT)
 * - Funções personalizadas criadas
 * 
 * ⚠️ ATENÇÃO: Esta operação é irreversível e elimina TODOS os dados
 */

(async () => {
  try {
    // Verificar ligação à base de dados
    await sequelize.testConnection();
    console.log("Ligação à base de dados estabelecida com sucesso!");

    // Validar se o sequelize está a funcionar corretamente
    if (!sequelize || !sequelize.define) {
      console.error("ERRO: O objeto sequelize não está válido!");
      process.exit(1);
    }

    // Aviso de segurança para o utilizador
    console.log("\n⚠️  ATENÇÃO! ⚠️");
    console.log("⚠️  Este script irá apagar TODAS as tabelas e dados da base de dados!");
    console.log("⚠️  Esta operação NÃO pode ser desfeita!");
    console.log("⚠️  Prima CTRL+C para cancelar se não tem a certeza.");
    console.log("\n⏳ A aguardar 5 segundos antes de prosseguir...");

    // Período de segurança para cancelamento
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log("\n🔄 A iniciar processo de limpeza...");

    // Obter o schema atual da base de dados
    const [schemaResult] = await sequelize.query(`SELECT current_schema() as schema`);
    const schema = schemaResult[0].schema;
    console.log(`🔍 Schema atual: ${schema}`);

    // Procurar todas as tabelas de utilizador no schema
    const [tablesResult] = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = '${schema}' AND 
       tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'`
    );
    
    if (tablesResult.length === 0) {
      console.log("ℹ️ Não foram encontradas tabelas para apagar.");
      process.exit(0);
    }

    console.log(`🔍 Encontradas ${tablesResult.length} tabelas para apagar.`);
    
    // Desativar temporariamente as verificações de chaves estrangeiras
    console.log("🔓 A desabilitar verificações de chave estrangeira...");
    await sequelize.query("SET CONSTRAINTS ALL DEFERRED;");
    
    // Eliminar todas as tabelas com CASCADE para remover dependências
    const tableNames = tablesResult.map(table => `"${table.tablename}"`).join(", ");
    
    console.log("🗑️ A apagar todas as tabelas...");
    await sequelize.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE;`);
    
    // Limpar sequências órfãs que possam ter ficado
    const [sequencesResult] = await sequelize.query(
      `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = '${schema}'`
    );
    
    if (sequencesResult.length > 0) {
      console.log(`🔍 Encontradas ${sequencesResult.length} sequências para apagar.`);
      const sequenceNames = sequencesResult.map(seq => `"${seq.sequence_name}"`).join(", ");
      
      console.log("🗑️ A apagar todas as sequências...");
      await sequelize.query(`DROP SEQUENCE IF EXISTS ${sequenceNames} CASCADE;`);
    }
    
    // Remover funções personalizadas que possam existir
    const [functionsResult] = await sequelize.query(
      `SELECT routine_name FROM information_schema.routines 
       WHERE routine_schema = '${schema}' AND routine_type = 'FUNCTION'`
    );
    
    if (functionsResult.length > 0) {
      console.log(`🔍 Encontradas ${functionsResult.length} funções para apagar.`);
      
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
    process.exit(1);
  }
})();