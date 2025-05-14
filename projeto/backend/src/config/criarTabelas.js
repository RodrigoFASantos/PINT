const sequelize = require("../config/db");

const createTablesInOrder = async () => {
  const createTablesSQL = [
    // =============================================
    // 1. CARGOS
    // =============================================
    `CREATE TABLE IF NOT EXISTS cargos (
      id_cargo SERIAL PRIMARY KEY,
      descricao VARCHAR(255) NOT NULL
    );`,

    // =============================================
    // 2. USER_PENDENTE
    // =============================================
    `CREATE TABLE IF NOT EXISTS "User_Pendente" (
      id SERIAL PRIMARY KEY,
      id_cargo INTEGER NOT NULL,
      nome VARCHAR(255) NOT NULL,
      idade INTEGER NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      telefone VARCHAR(20) NOT NULL,
      password VARCHAR(255) NOT NULL,
      token VARCHAR(500) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // =============================================
    // 3. UTILIZADORES
    // =============================================
    `CREATE TABLE IF NOT EXISTS utilizadores (
      id_utilizador SERIAL PRIMARY KEY,
      id_cargo INTEGER NOT NULL REFERENCES cargos(id_cargo),
      nome VARCHAR(255) NOT NULL,
      idade INTEGER,
      email VARCHAR(255) UNIQUE NOT NULL,
      telefone VARCHAR(9),
      password VARCHAR(255) NOT NULL,
      primeiro_login INTEGER NOT NULL DEFAULT 1,
      foto_perfil VARCHAR(255) DEFAULT 'AVATAR.png',
      foto_capa VARCHAR(255) DEFAULT 'CAPA.png',
      morada VARCHAR(255),
      cidade VARCHAR(100),
      distrito VARCHAR(100),
      freguesia VARCHAR(100),
      codigo_postal VARCHAR(20),
      descricao TEXT
    );`,

    // =============================================
    // 4. CATEGORIAS
    // =============================================
    `CREATE TABLE IF NOT EXISTS categorias (
      id_categoria SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL UNIQUE
    );`,

    // =============================================
    // 5. AREAS
    // =============================================
    `CREATE TABLE IF NOT EXISTS areas (
      id_area SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria)
    );`,

    // =============================================
    // 6. FORMADOR_ASSOCIACOES_PENDENTES
    // =============================================
    `CREATE TABLE IF NOT EXISTS formador_associacoes_pendentes (
      id SERIAL PRIMARY KEY,
      id_pendente INTEGER NOT NULL REFERENCES "User_Pendente"(id) ON DELETE CASCADE,
      categorias JSONB DEFAULT '[]',
      areas JSONB DEFAULT '[]',
      cursos JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_pendente UNIQUE (id_pendente)
    );`,

    // =============================================
    // 7. FORMADOR_CATEGORIA
    // =============================================
    `CREATE TABLE IF NOT EXISTS formador_categoria (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_categoria UNIQUE (id_formador, id_categoria)
    );`,

    // =============================================
    // 8. FORMADOR_AREA
    // =============================================
    `CREATE TABLE IF NOT EXISTS formador_area (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_area INTEGER NOT NULL REFERENCES areas(id_area) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_area UNIQUE (id_formador, id_area)
    );`,

    // =============================================
    // 9. TOPICO_CATEGORIA
    // =============================================
    `CREATE TABLE IF NOT EXISTS topico_categoria (
      id_topico SERIAL PRIMARY KEY,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria),
      id_area INTEGER NOT NULL REFERENCES areas(id_area),
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      criado_por INTEGER NOT NULL REFERENCES utilizadores(id_utilizador),
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ativo BOOLEAN NOT NULL DEFAULT TRUE
    );`,

    // =============================================
    // 10. CURSO
    // =============================================
    `CREATE TABLE IF NOT EXISTS curso (
      id_curso SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      descricao TEXT,
      tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('sincrono', 'assincrono')),
      vagas INTEGER,
      data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
      data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
      estado VARCHAR(30) NOT NULL DEFAULT 'planeado' CHECK (estado IN ('planeado', 'em_curso', 'terminado')),
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      id_formador INTEGER REFERENCES utilizadores(id_utilizador),
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria),
      id_area INTEGER NOT NULL REFERENCES areas(id_area),
      id_topico_categoria INTEGER NOT NULL REFERENCES topico_categoria(id_topico),
      imagem_path VARCHAR(500),
      dir_path VARCHAR(500)
    );`,

    // =============================================
    // 11. ASSOCIAR_CURSOS
    // =============================================
    `CREATE TABLE IF NOT EXISTS associar_cursos (
      id_associacao SERIAL PRIMARY KEY,
      id_curso_origem INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      id_curso_destino INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      descricao TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // =============================================
    // 12. INSCRICOES_CURSOS
    // =============================================
    `CREATE TABLE IF NOT EXISTS inscricoes_cursos (
      id_inscricao SERIAL PRIMARY KEY,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador),
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso),
      data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      estado VARCHAR(30) NOT NULL DEFAULT 'inscrito' CHECK (estado IN ('inscrito', 'cancelado')),
      motivacao TEXT,
      expectativas TEXT,
      nota_final DECIMAL(5,2),
      certificado_gerado BOOLEAN NOT NULL DEFAULT FALSE,
      horas_presenca INTEGER,
      motivo_cancelamento TEXT,
      data_cancelamento TIMESTAMP WITH TIME ZONE
    );`,

    // =============================================
    // 13. AVALIACOES
    // =============================================
    `CREATE TABLE IF NOT EXISTS avaliacoes (
      id_avaliacao SERIAL PRIMARY KEY,
      id_inscricao INTEGER NOT NULL REFERENCES inscricoes_cursos(id_inscricao),
      nota DECIMAL(5,2) NOT NULL,
      certificado BOOLEAN DEFAULT FALSE,
      horas_totais INTEGER NOT NULL,
      horas_presenca INTEGER NOT NULL,
      data_avaliacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      url_certificado VARCHAR(500)
    );`,

    // =============================================
    // 14. OCORRENCIAS_CURSOS
    // =============================================
    `CREATE TABLE IF NOT EXISTS ocorrencias_cursos (
      id_ocorrencia SERIAL PRIMARY KEY,
      id_curso_original INTEGER NOT NULL REFERENCES curso(id_curso),
      id_curso_nova_ocorrencia INTEGER NOT NULL REFERENCES curso(id_curso),
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      numero_edicao INTEGER NOT NULL
    );`,

    // =============================================
    // 15. NOTIFICACOES
    // =============================================
    `CREATE TABLE IF NOT EXISTS notificacoes (
      id_notificacao SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      mensagem TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('curso_adicionado', 'formador_alterado', 'formador_criado', 'admin_criado', 'data_curso_alterada')),
      id_referencia INTEGER,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      enviado_email BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    // =============================================
    // 16. NOTIFICACOES_UTILIZADORES
    // =============================================
    `CREATE TABLE IF NOT EXISTS notificacoes_utilizadores (
      id SERIAL PRIMARY KEY,
      id_notificacao INTEGER NOT NULL REFERENCES notificacoes(id_notificacao) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      lida BOOLEAN NOT NULL DEFAULT FALSE,
      data_leitura TIMESTAMP WITH TIME ZONE,
      CONSTRAINT unique_notificacao_utilizador UNIQUE (id_notificacao, id_utilizador)
    );`,

    // =============================================
    // 17. QUIZZES
    // =============================================
    `CREATE TABLE IF NOT EXISTS quizzes (
      id_quiz SERIAL PRIMARY KEY,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso),
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      tempo_limite INTEGER,
      ativo BOOLEAN DEFAULT TRUE
    );`,

    // =============================================
    // 18. QUIZ_PERGUNTAS
    // =============================================
    `CREATE TABLE IF NOT EXISTS quiz_perguntas (
      id_pergunta SERIAL PRIMARY KEY,
      id_quiz INTEGER NOT NULL REFERENCES quizzes(id_quiz) ON DELETE CASCADE,
      pergunta TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('multipla_escolha', 'verdadeiro_falso', 'resposta_curta')),
      pontos INTEGER NOT NULL DEFAULT 1,
      ordem INTEGER NOT NULL DEFAULT 0
    );`,

    // =============================================
    // 19. QUIZ_OPCOES
    // =============================================
    `CREATE TABLE IF NOT EXISTS quiz_opcoes (
      id_opcao SERIAL PRIMARY KEY,
      id_pergunta INTEGER NOT NULL REFERENCES quiz_perguntas(id_pergunta) ON DELETE CASCADE,
      texto TEXT NOT NULL,
      correta BOOLEAN NOT NULL DEFAULT FALSE,
      ordem INTEGER NOT NULL DEFAULT 0
    );`,

    // =============================================
    // 20. QUIZ_RESPOSTAS
    // =============================================
    `CREATE TABLE IF NOT EXISTS quiz_respostas (
      id_resposta SERIAL PRIMARY KEY,
      id_inscricao INTEGER NOT NULL REFERENCES inscricoes_cursos(id_inscricao),
      id_quiz INTEGER NOT NULL REFERENCES quizzes(id_quiz),
      data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      data_conclusao TIMESTAMP WITH TIME ZONE,
      nota DECIMAL(5,2),
      completo BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    // =============================================
    // 21. QUIZ_RESPOSTAS_DETALHES
    // =============================================
    `CREATE TABLE IF NOT EXISTS quiz_respostas_detalhes (
      id_resposta_detalhe SERIAL PRIMARY KEY,
      id_resposta INTEGER NOT NULL REFERENCES quiz_respostas(id_resposta) ON DELETE CASCADE,
      id_pergunta INTEGER NOT NULL REFERENCES quiz_perguntas(id_pergunta),
      resposta_texto TEXT,
      id_opcao INTEGER REFERENCES quiz_opcoes(id_opcao),
      correta BOOLEAN,
      pontos_obtidos DECIMAL(5,2)
    );`,

    // =============================================
    // 22. PUSH_SUBSCRIPTIONS
    // =============================================
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id_subscription SERIAL PRIMARY KEY,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador),
      endpoint VARCHAR(500) NOT NULL,
      p256dh VARCHAR(500) NOT NULL,
      auth VARCHAR(500) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // =============================================
    // 23. TIPOS_CONTEUDO
    // =============================================
    `CREATE TABLE IF NOT EXISTS tipos_conteudo (
      id_tipo SERIAL PRIMARY KEY,
      nome VARCHAR(50) NOT NULL UNIQUE,
      icone VARCHAR(50),
      descricao VARCHAR(255),
      ativo BOOLEAN DEFAULT TRUE
    );`,

    // =============================================
    // 24. CURSO_TOPICO
    // =============================================
    `CREATE TABLE IF NOT EXISTS curso_topico (
      id_topico SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      arquivo_path VARCHAR(500),
      dir_path VARCHAR(500)
    );`,

    // =============================================
    // 25. CURSO_TOPICO_PASTA
    // =============================================
    `CREATE TABLE IF NOT EXISTS curso_topico_pasta (
      id_pasta SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      arquivo_path VARCHAR(500),
      id_topico INTEGER NOT NULL REFERENCES curso_topico(id_topico) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE
    );`,

    // =============================================
    // 26. CURSO_TOPICO_PASTA_CONTEUDO
    // =============================================
    `CREATE TABLE IF NOT EXISTS curso_topico_pasta_conteudo (
      id_conteudo SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('file', 'link', 'video')),
      url VARCHAR(500),
      arquivo_path VARCHAR(500),
      id_pasta INTEGER NOT NULL REFERENCES curso_topico_pasta(id_pasta) ON DELETE CASCADE,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso),
      data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE
    );`,

    // =============================================
    // 27. TRABALHOS_ENTREGUES
    // =============================================
    `CREATE TABLE IF NOT EXISTS trabalhos_entregues (
      id_trabalho SERIAL PRIMARY KEY,
      id_inscricao INTEGER NOT NULL REFERENCES inscricoes_cursos(id_inscricao),
      ficheiro_path VARCHAR(500) NOT NULL,
      data_entrega TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      avaliacao TEXT
    );`,

    // =============================================
    // 28. CHAT_MENSAGENS
    // =============================================
    `CREATE TABLE IF NOT EXISTS chat_mensagens (
      id SERIAL PRIMARY KEY,
      id_topico INTEGER NOT NULL REFERENCES topico_categoria(id_topico),
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador),
      texto TEXT,
      anexo_url VARCHAR(255),
      anexo_nome VARCHAR(100),
      tipo_anexo VARCHAR(20) CHECK (tipo_anexo IN ('imagem', 'video', 'file')),
      data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      likes INTEGER NOT NULL DEFAULT 0,
      dislikes INTEGER NOT NULL DEFAULT 0,
      foi_denunciada BOOLEAN NOT NULL DEFAULT FALSE,
      oculta BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    // =============================================
    // 29. CHAT_INTERACOES
    // =============================================
    `CREATE TABLE IF NOT EXISTS chat_interacoes (
      id_interacao SERIAL PRIMARY KEY,
      id_mensagem INTEGER NOT NULL REFERENCES chat_mensagens(id),
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador),
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('like', 'dislike')),
      data_interacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_user_message UNIQUE (id_mensagem, id_utilizador)
    );`,

    // =============================================
    // 30. CHAT_DENUNCIAS
    // =============================================
    `CREATE TABLE IF NOT EXISTS chat_denuncias (
      id_denuncia SERIAL PRIMARY KEY,
      id_mensagem INTEGER NOT NULL REFERENCES chat_mensagens(id),
      id_denunciante INTEGER NOT NULL REFERENCES utilizadores(id_utilizador),
      motivo VARCHAR(100) NOT NULL,
      descricao TEXT,
      data_denuncia TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      resolvida BOOLEAN NOT NULL DEFAULT FALSE,
      acao_tomada VARCHAR(50)
    );`
  ];

  // Executar a criação das tabelas em sequência
  for (const sql of createTablesSQL) {
    try {
      await sequelize.query(sql);
      console.log(`Executado com sucesso: ${sql.substring(0, 60)}...`);
    } catch (error) {
      console.error(`Erro ao criar tabela: ${error.message}`);
      console.error(sql);
      throw error; // Interrompendo a execução se houver um erro
    }
  }

  console.log("Todas as tabelas foram criadas com sucesso!");
};

module.exports = {
  createTablesInOrder
};