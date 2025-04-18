const sequelize = require("../config/db");
const fs = require('fs');
const path = require('path');

// Models
const User = require("../database/models/User");
const Cargo = require("../database/models/Cargo");
const Categoria = require("../database/models/Categoria");
const Area = require("../database/models/Area");
const Curso = require("../database/models/Curso");
const Conteudo = require("../database/models/Conteudo");
const Inscricao_Curso = require("../database/models/Inscricao_Curso");
const Topico_Categoria = require("../database/models/Topico_Categoria");
const Comentario_Topico = require("../database/models/Comentario_Topico");
const Trabalho_Entregue = require("../database/models/Trabalho_Entregue");
const Avaliacao = require("../database/models/Avaliacao");
const OcorrenciaCurso = require("../database/models/OcorrenciaCurso");
const PushSubscription = require("../database/models/PushSubscription");
const Quiz = require("../database/models/Quiz");
const QuizOpcao = require("../database/models/QuizOpcao");
const QuizPergunta = require("../database/models/QuizPergunta");
const QuizResposta = require("../database/models/QuizResposta");
const QuizRespostaDetalhe = require("../database/models/QuizRespostaDetalhe");
const TipoConteudo = require("../database/models/TipoConteudo");
const Inscricao_Curso_Cancelada = require("../database/models/InscricaoCursoCancelada");

// Dados Teste
const sqlPath = path.join(__dirname, '../seeders/dados_teste.sql');
const dadosSQL = fs.readFileSync(sqlPath, 'utf-8');

(async () => {
  try {
    // Teste de conexão
    await sequelize.testConnection();

    // Verificar se o sequelize está disponível
    if (!sequelize || !sequelize.define) {
      console.error("ERRO: O objeto sequelize importado não é válido ou não possui o método define!");
      console.log("Objeto sequelize:", sequelize);
      process.exit(1);
    }

    // Sincroniza e recria todas as tabelas (force: true)
    console.log("Apagando todas as tabelas e dados existentes...");
    await sequelize.sync({ force: true });
    console.log("Base de dados sincronizada e limpa!");

    // Executa os dados de teste
    const statements = [];
    const sqlScript = dadosSQL.replace(/\r\n/g, '\n'); // Normalize line endings
    const rawStatements = sqlScript.split(';');

    for (let rawStmt of rawStatements) {
      // Remove comments and trim whitespace
      const lines = rawStmt.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      const trimmedStmt = lines.trim();
      if (trimmedStmt) {
        statements.push(trimmedStmt);
      }
    }

    console.log(`Preparados ${statements.length} comandos SQL para execução.`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log(`Executando comando SQL ${i+1}/${statements.length}`);
        await sequelize.query(stmt);
        console.log(`Comando SQL ${i+1} executado com sucesso.`);
      } catch (error) {
        console.error(`Erro ao executar comando SQL ${i+1}/${statements.length}:`);
        console.error(stmt);
        console.error(error.message);
        // Não interrompe a execução para que os outros comandos possam ser tentados
      }
    }
    console.log("Dados de teste inseridos!");

    process.exit();
  } catch (error) {
    console.error("Erro ao sincronizar ou carregar os dados de teste:", error.message);
    console.error("Detalhes do erro:", error);
    process.exit(1);
  }
})();