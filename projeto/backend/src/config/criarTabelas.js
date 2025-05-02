const sequelize = require("../config/db");

const createTablesInOrder = async () => {
  // Criar tabelas necessárias na ordem correta (respeitando as dependências)
  const createTablesSQL = [
    // Primeiro criar tabelas sem dependências
    `CREATE TABLE IF NOT EXISTS cargos (
      id_cargo SERIAL PRIMARY KEY,
      descricao VARCHAR(50) NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS "User_Pendente" (
      id SERIAL PRIMARY KEY,
      id_cargo INTEGER NOT NULL,
      nome VARCHAR(100) NOT NULL,
      idade INTEGER NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      telefone VARCHAR(20) NOT NULL,
      password VARCHAR(100) NOT NULL,
      token VARCHAR(500) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS formador_associacoes_pendentes (
      id SERIAL PRIMARY KEY,
      id_pendente INTEGER NOT NULL REFERENCES "User_Pendente"(id) ON DELETE CASCADE,
      categorias JSONB DEFAULT '[]',
      areas JSONB DEFAULT '[]',
      cursos JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_pendente UNIQUE (id_pendente)
    );`,

    `CREATE TABLE IF NOT EXISTS utilizadores (
      id_utilizador SERIAL PRIMARY KEY,
      id_cargo INTEGER REFERENCES cargos(id_cargo),
      nome VARCHAR(100) NOT NULL,
      idade INTEGER,
      email VARCHAR(100) UNIQUE NOT NULL,
      telefone VARCHAR(20),
      password VARCHAR(100) NOT NULL,
      primeiro_login BOOLEAN DEFAULT TRUE,
      foto_perfil VARCHAR(500),
      foto_capa VARCHAR(500),
      morada VARCHAR(255),
      cidade VARCHAR(100),
      distrito VARCHAR(100),
      freguesia VARCHAR(100),
      codigo_postal VARCHAR(20),
      descricao TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS categorias (
      id_categoria SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      ativo BOOLEAN DEFAULT TRUE
    );`,

    `CREATE TABLE IF NOT EXISTS areas (
      id_area SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      id_categoria INTEGER REFERENCES categorias(id_categoria),
      ativo BOOLEAN DEFAULT TRUE,
      CONSTRAINT unique_area_nome_categoria UNIQUE (nome, id_categoria)
    );`,

    `CREATE TABLE IF NOT EXISTS formador_categoria (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_categoria UNIQUE (id_formador, id_categoria)
    );`,

    `CREATE TABLE IF NOT EXISTS formador_area (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_area INTEGER NOT NULL REFERENCES areas(id_area) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_area UNIQUE (id_formador, id_area)
    );`,

    `CREATE TABLE IF NOT EXISTS curso (
      id_curso SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      descricao TEXT,
      tipo VARCHAR(30),
      vagas INTEGER,
      data_inicio DATE,
      data_fim DATE,
      estado VARCHAR(20) DEFAULT 'planeado',
      ativo BOOLEAN DEFAULT TRUE,
      id_formador INTEGER REFERENCES utilizadores(id_utilizador),
      id_area INTEGER REFERENCES areas(id_area),
      id_categoria INTEGER REFERENCES categorias(id_categoria),
      imagem_path VARCHAR(500),
      dir_path VARCHAR(500)
    );`,

    `CREATE TABLE IF NOT EXISTS inscricoes_cursos (
      id_inscricao SERIAL PRIMARY KEY,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador),
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso),
      data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      estado VARCHAR(20) DEFAULT 'inscrito',
      motivacao TEXT,
      expectativas TEXT,
      nota_final DECIMAL(4,2),
      certificado_gerado BOOLEAN DEFAULT FALSE,
      horas_presenca INTEGER DEFAULT 0,
      motivo_cancelamento TEXT,
      data_cancelamento TIMESTAMP WITH TIME ZONE,
      CONSTRAINT unique_user_curso UNIQUE (id_utilizador, id_curso)
    );`,

      `CREATE TABLE IF NOT EXISTS trabalhos_entregues (
      id_trabalho SERIAL PRIMARY KEY,
      id_inscricao INTEGER NOT NULL REFERENCES inscricoes_cursos(id_inscricao),
      ficheiro_path VARCHAR(500) NOT NULL,
      data_entrega TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      avaliacao TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS topicos_categorias (
      id_topico SERIAL PRIMARY KEY,
      id_categoria INTEGER REFERENCES categorias(id_categoria),
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      criado_por INTEGER REFERENCES utilizadores(id_utilizador),
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ativo BOOLEAN DEFAULT TRUE,
      CONSTRAINT unique_topico_categoria_titulo UNIQUE (id_categoria, titulo)
    );`,

    `CREATE TABLE IF NOT EXISTS comentarios_topico (
      id_comentario SERIAL PRIMARY KEY,
      id_topico INTEGER NOT NULL REFERENCES topicos_categorias(id_topico) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      texto TEXT,
      anexo_url VARCHAR(255),
      anexo_nome VARCHAR(100),
      tipo_anexo VARCHAR(10) CHECK (tipo_anexo IN ('imagem', 'video', 'file')),
      data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      likes INTEGER NOT NULL DEFAULT 0,
      dislikes INTEGER NOT NULL DEFAULT 0,
      denuncias INTEGER NOT NULL DEFAULT 0
    );`,

    `CREATE TABLE IF NOT EXISTS quizzes (
      id_quiz SERIAL PRIMARY KEY,
      id_curso INTEGER REFERENCES curso(id_curso),
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      tempo_limite INTEGER,
      ativo BOOLEAN DEFAULT TRUE,
      CONSTRAINT unique_quiz_titulo_curso UNIQUE (id_curso, titulo)
    );`,

    `CREATE TABLE IF NOT EXISTS quiz_perguntas (
      id_pergunta SERIAL PRIMARY KEY,
      id_quiz INTEGER REFERENCES quizzes(id_quiz) ON DELETE CASCADE,
      pergunta TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      pontos INTEGER DEFAULT 1,
      ordem INTEGER DEFAULT 1,
      CONSTRAINT unique_quiz_pergunta UNIQUE (id_quiz, pergunta)
    );`,

    `CREATE TABLE IF NOT EXISTS quiz_opcoes (
      id_opcao SERIAL PRIMARY KEY,
      id_pergunta INTEGER REFERENCES quiz_perguntas(id_pergunta) ON DELETE CASCADE,
      texto TEXT NOT NULL,
      correta BOOLEAN DEFAULT FALSE,
      ordem INTEGER DEFAULT 1,
      CONSTRAINT unique_quiz_opcao UNIQUE (id_pergunta, texto)
    );`,

    `CREATE TABLE IF NOT EXISTS quiz_respostas (
      id_resposta SERIAL PRIMARY KEY,
      id_quiz INTEGER REFERENCES quizzes(id_quiz),
      id_inscricao INTEGER REFERENCES inscricoes_cursos(id_inscricao),
      pontuacao_total INTEGER DEFAULT 0,
      data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      data_fim TIMESTAMP WITH TIME ZONE,
      tempo_gasto INTEGER DEFAULT 0
    );`,

    `CREATE TABLE IF NOT EXISTS quiz_respostas_detalhes (
      id_detalhe SERIAL PRIMARY KEY,
      id_resposta INTEGER REFERENCES quiz_respostas(id_resposta) ON DELETE CASCADE,
      id_pergunta INTEGER REFERENCES quiz_perguntas(id_pergunta),
      id_opcao INTEGER REFERENCES quiz_opcoes(id_opcao),
      resposta_texto TEXT,
      correta BOOLEAN DEFAULT FALSE,
      pontos_ganhos INTEGER DEFAULT 0
    );`,

    `CREATE TABLE IF NOT EXISTS tipos_conteudo (
      id_tipo SERIAL PRIMARY KEY,
      nome VARCHAR(50) NOT NULL,
      icone VARCHAR(50),
      descricao TEXT,
      ativo BOOLEAN DEFAULT TRUE,
      CONSTRAINT unique_tipo_conteudo_nome UNIQUE (nome)
    );`,

    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id_subscription SERIAL PRIMARY KEY,
      id_utilizador INTEGER REFERENCES utilizadores(id_utilizador),
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_push_subscription UNIQUE (id_utilizador, endpoint)
    );`,

    `CREATE TABLE IF NOT EXISTS avaliacoes (
      id_avaliacao SERIAL PRIMARY KEY,
      id_inscricao INTEGER UNIQUE REFERENCES inscricoes_cursos(id_inscricao) ON DELETE CASCADE,
      classificacao INTEGER NOT NULL,
      comentario TEXT,
      data_avaliacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS ocorrencias_curso (
      id_ocorrencia SERIAL PRIMARY KEY,
      id_curso INTEGER REFERENCES curso(id_curso) ON DELETE CASCADE,
      data_ocorrencia TIMESTAMP WITH TIME ZONE NOT NULL,
      duracao_minutos INTEGER NOT NULL,
      descricao TEXT,
      local VARCHAR(255),
      link_reuniao VARCHAR(255),
      tipo VARCHAR(50) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Tabelas para conteúdos de cursos
    `CREATE TABLE IF NOT EXISTS curso_topico (
      id_topico SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      arquivo_path VARCHAR(500),
      dir_path VARCHAR(500),
      CONSTRAINT unique_topico_nome_curso UNIQUE (nome, id_curso)
    );`,

    `CREATE TABLE IF NOT EXISTS curso_topico_pasta (
      id_pasta SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      id_topico INTEGER NOT NULL REFERENCES curso_topico(id_topico) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      arquivo_path VARCHAR(500),
      dir_path VARCHAR(500),
      CONSTRAINT unique_pasta_nome_topico UNIQUE (nome, id_topico)
    );`,

    `CREATE TABLE IF NOT EXISTS curso_topico_pasta_conteudo (
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
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      CONSTRAINT unique_conteudo_titulo_pasta UNIQUE (titulo, id_pasta)
    );`
  ];

  // Executa a criação das tabelas em sequência
  for (const sql of createTablesSQL) {
    try {
      await sequelize.query(sql);
    } catch (error) {
      console.error(`Erro ao criar tabela: ${error.message}`);
      console.error(sql);
      // Continua mesmo com erro para tentar criar as outras tabelas
    }
  }

  console.log("Tabelas criadas com sucesso!");
};


module.exports = {
  createTablesInOrder
};