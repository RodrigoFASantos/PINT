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
const createTablesSQL = `
-- Criar tabela para tópicos do curso
CREATE TABLE IF NOT EXISTS topicos_curso (
  id_topico SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  id_curso INTEGER NOT NULL REFERENCES cursos(id_curso) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Criar tabela para pastas
CREATE TABLE IF NOT EXISTS pastas_curso (
  id_pasta SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  id_topico INTEGER NOT NULL REFERENCES topicos_curso(id_topico) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Criar tabela para conteúdos
CREATE TABLE IF NOT EXISTS conteudos_curso (
  id_conteudo SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(10) NOT NULL,
  url VARCHAR(500),
  arquivo_path VARCHAR(500),
  id_pasta INTEGER NOT NULL REFERENCES pastas_curso(id_pasta) ON DELETE CASCADE,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ordem INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Criar índices para otimizar consultas
CREATE INDEX idx_topicos_curso_curso ON topicos_curso(id_curso);
CREATE INDEX idx_pastas_curso_topico ON pastas_curso(id_topico);
CREATE INDEX idx_conteudos_curso_pasta ON conteudos_curso(id_pasta);
`;

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

    // Sincroniza e recria todas as tabelas existentes (force: true)
    console.log("Apagando todas as tabelas e dados existentes...");
    await sequelize.sync({ force: true });
    console.log("Base de dados sincronizada e limpa!");

    // Criando as novas tabelas para conteúdos de cursos usando SQL direto
    console.log("Criando tabelas para conteúdos de cursos...");
    await sequelize.query(createTablesSQL);
    console.log("Tabelas de conteúdos criadas com sucesso!");

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