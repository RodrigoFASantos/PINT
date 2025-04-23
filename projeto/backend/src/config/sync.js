const sequelize = require("../config/db");
const fs = require('fs');
const path = require('path');

// Models
const User = require("../database/models/User");
const Cargo = require("../database/models/Cargo");
const Categoria = require("../database/models/Categoria");
const Area = require("../database/models/Area");
const Curso = require("../database/models/Curso");
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
const TopicoCurso = require("../database/models/TopicoCurso");
const PastaCurso = require("../database/models/PastaCurso");
const ConteudoCurso = require("../database/models/ConteudoCurso");

// Dados Teste
const sqlPath = path.join(__dirname, '../seeders/dados_teste.sql');
const dadosSQL = fs.readFileSync(sqlPath, 'utf-8');

// Criar tabelas diretamente com SQL em vez de usar sync do Sequelize
// Modificado para usar IF NOT EXISTS em todos os lugares e DROP INDEX IF EXISTS
const createTablesSQL = `
-- Remover índices se existirem para evitar conflitos
DROP INDEX IF EXISTS idx_topicos_curso_curso;
DROP INDEX IF EXISTS idx_pastas_curso_topico;
DROP INDEX IF EXISTS idx_conteudos_curso_pasta;

-- Criar tabela para tópicos do curso
CREATE TABLE IF NOT EXISTS curso_topico (
  id_topico SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  arquivo_path VARCHAR(500)
);

-- Criar tabela para pastas
CREATE TABLE IF NOT EXISTS curso_topico_pasta (
  id_pasta SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  id_topico INTEGER NOT NULL REFERENCES curso_topico(id_topico) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  arquivo_path VARCHAR(500)
);

-- Criar tabela para conteúdos
CREATE TABLE IF NOT EXISTS curso_topico_pasta_conteudo (
  id_conteudo SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(10) NOT NULL,
  url VARCHAR(500),
  arquivo_path VARCHAR(500),
  id_pasta INTEGER NOT NULL REFERENCES curso_topico_pasta(id_pasta) ON DELETE CASCADE,
  id_curso INTEGER NOT NULL REFERENCES curso(id_curso),
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ordem INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_topicos_curso_curso ON curso_topico(id_curso);
CREATE INDEX IF NOT EXISTS idx_pastas_curso_topico ON curso_topico_pasta(id_topico);
CREATE INDEX IF NOT EXISTS idx_conteudos_curso_pasta ON curso_topico_pasta_conteudo(id_pasta);
`;

// Execute SQL statements in sequence
const executeSQLStatements = async (statements) => {
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
      // Continua a execução para permitir que outros comandos sejam tentados
    }
  }
};

// Divide o script SQL em comandos individuais
const prepareSQLStatements = (sqlScript) => {
  const statements = [];
  const rawStatements = sqlScript.replace(/\r\n/g, '\n').split(';');

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

  return statements;
};

// Divide o SQL de criação de tabelas em comandos separados
const prepareCreateTableStatements = () => {
  return createTablesSQL.split(';').filter(stmt => stmt.trim().length > 0).map(stmt => stmt.trim() + ';');
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

    // Sincroniza e recria todas as tabelas existentes (force: true)
    console.log("Apagando todas as tabelas e dados existentes...");
    await sequelize.sync({ force: true });
    console.log("Base de dados sincronizada e limpa!");

    // Separar as instruções SQL de criação de tabelas
    console.log("Criando tabelas para conteúdos de cursos...");
    const createTableStatements = prepareCreateTableStatements();
    await executeSQLStatements(createTableStatements);
    console.log("Tabelas de conteúdos criadas com sucesso!");

    // Preparar e executar os dados de teste
    console.log("Preparando dados de teste...");
    const testDataStatements = prepareSQLStatements(dadosSQL);
    console.log(`Preparados ${testDataStatements.length} comandos SQL para execução.`);
    
    await executeSQLStatements(testDataStatements);
    console.log("Dados de teste inseridos!");

    process.exit(0);
  } catch (error) {
    console.error("Erro ao sincronizar ou carregar os dados de teste:", error.message);
    console.error("Detalhes do erro:", error);
    process.exit(1);
  }
})();