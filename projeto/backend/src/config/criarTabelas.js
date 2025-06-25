const sequelize = require("../config/db");

const createTablesInOrder = async () => {
  const createTablesSQL = [
    // Tabela de cargos
    `CREATE TABLE IF NOT EXISTS cargos (
      id_cargo SERIAL PRIMARY KEY,
      descricao VARCHAR(255) NOT NULL
    );`,

    // Tabela de utilizadores pendentes
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

    // Tabela de utilizadores principais
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

    // Tabela de categorias
    `CREATE TABLE IF NOT EXISTS categorias (
      id_categoria SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL UNIQUE
    );`,

    // Tabela de áreas
    `CREATE TABLE IF NOT EXISTS areas (
      id_area SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria)
    );`,

    // Tabela de associações pendentes de formadores
    `CREATE TABLE IF NOT EXISTS formador_associacoes_pendentes (
      id SERIAL PRIMARY KEY,
      id_pendente INTEGER NOT NULL REFERENCES "User_Pendente"(id) ON DELETE CASCADE,
      categorias JSONB DEFAULT '[]',
      areas JSONB DEFAULT '[]',
      cursos JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_pendente UNIQUE (id_pendente)
    );`,

    // Tabela de formadores e categorias
    `CREATE TABLE IF NOT EXISTS formador_categoria (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_categoria UNIQUE (id_formador, id_categoria)
    );`,

    // Tabela de formadores e áreas
    `CREATE TABLE IF NOT EXISTS formador_area (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_area INTEGER NOT NULL REFERENCES areas(id_area) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_area UNIQUE (id_formador, id_area)
    );`,

    // Tabela de tópicos de área corrigida com cascade
    `CREATE TABLE IF NOT EXISTS topico_area (
      id_topico SERIAL PRIMARY KEY,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria),
      id_area INTEGER NOT NULL REFERENCES areas(id_area),
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      criado_por INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ativo BOOLEAN NOT NULL DEFAULT TRUE
    );`,

    // Tabela de cursos corrigida com set null para formador
    `CREATE TABLE IF NOT EXISTS curso (
      id_curso SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      descricao TEXT,
      tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('sincrono', 'assincrono')),
      vagas INTEGER,
      duracao INTEGER NOT NULL,
      data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
      data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
      estado VARCHAR(30) NOT NULL DEFAULT 'planeado' CHECK (estado IN ('planeado', 'em_curso', 'terminado')),
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      id_formador INTEGER REFERENCES utilizadores(id_utilizador) ON DELETE SET NULL,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria),
      id_area INTEGER NOT NULL REFERENCES areas(id_area),
      id_topico_area INTEGER NOT NULL REFERENCES topico_area(id_topico),
      imagem_path VARCHAR(500),
      dir_path VARCHAR(500)
    );`,

    // Tabela de associação entre cursos nova funcionalidade
    `CREATE TABLE IF NOT EXISTS associar_cursos (
      id_associacao SERIAL PRIMARY KEY,
      id_curso_origem INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      id_curso_destino INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      descricao TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraint única para evitar associações duplicadas
      CONSTRAINT unique_course_association UNIQUE(id_curso_origem, id_curso_destino),
      
      -- Validação para impedir que um curso seja associado a si mesmo
      CONSTRAINT check_different_courses CHECK (id_curso_origem != id_curso_destino)
    );`,

    // Tabela de inscrições em cursos já tinha cascade mantido
    `CREATE TABLE IF NOT EXISTS inscricoes_cursos (
      id_inscricao SERIAL PRIMARY KEY,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
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

    // Tabela de presença em cursos
    `CREATE TABLE IF NOT EXISTS curso_presenca (
      id_curso_presenca SERIAL PRIMARY KEY,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      data_inicio DATE NOT NULL,
      data_fim DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fim TIME NOT NULL,
      codigo VARCHAR(20) NOT NULL
    );`,

    // Tabela de presença de formandos corrigida com cascade
    `CREATE TABLE IF NOT EXISTS formando_presenca (
      id_formando_presenca SERIAL PRIMARY KEY,
      id_curso_presenca INTEGER NOT NULL REFERENCES curso_presenca(id_curso_presenca) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      presenca BOOLEAN NOT NULL DEFAULT TRUE,
      duracao DECIMAL(5,2) NULL
    );`,

    // Tabela de avaliações corrigida com cascade
    `CREATE TABLE IF NOT EXISTS avaliacoes (
      id_avaliacao SERIAL PRIMARY KEY,
      id_inscricao INTEGER NOT NULL REFERENCES inscricoes_cursos(id_inscricao) ON DELETE CASCADE,
      nota DECIMAL(5,2) NOT NULL,
      certificado BOOLEAN DEFAULT FALSE,
      horas_totais INTEGER NOT NULL,
      horas_presenca INTEGER NOT NULL,
      data_avaliacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      url_certificado VARCHAR(500),
      data_limite TIMESTAMP WITH TIME ZONE
    );`,

    // Tabela de ocorrências de cursos
    `CREATE TABLE IF NOT EXISTS ocorrencias_cursos (
      id_ocorrencia SERIAL PRIMARY KEY,
      id_curso_original INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      id_curso_nova_ocorrencia INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      numero_edicao INTEGER NOT NULL
    );`,

    // Tabela de notificações
    `CREATE TABLE IF NOT EXISTS notificacoes (
      id_notificacao SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      mensagem TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('curso_adicionado', 'formador_alterado', 'formador_criado', 'admin_criado', 'data_curso_alterada')),
      id_referencia INTEGER,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      enviado_email BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    // Tabela de notificações para utilizadores já tinha cascade mantido
    `CREATE TABLE IF NOT EXISTS notificacoes_utilizadores (
      id SERIAL PRIMARY KEY,
      id_notificacao INTEGER NOT NULL REFERENCES notificacoes(id_notificacao) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      lida BOOLEAN NOT NULL DEFAULT FALSE,
      data_leitura TIMESTAMP WITH TIME ZONE,
      CONSTRAINT unique_notificacao_utilizador UNIQUE (id_notificacao, id_utilizador)
    );`,

    // Tabela de quizzes
    `CREATE TABLE IF NOT EXISTS quizzes (
      id_quiz SERIAL PRIMARY KEY,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      tempo_limite INTEGER,
      tempo_limite_inicio TIMESTAMP WITH TIME ZONE,
      ativo BOOLEAN DEFAULT TRUE
    );`,

    // Tabela de perguntas de quiz
    `CREATE TABLE IF NOT EXISTS quiz_perguntas (
      id_pergunta SERIAL PRIMARY KEY,
      id_quiz INTEGER NOT NULL REFERENCES quizzes(id_quiz) ON DELETE CASCADE,
      pergunta TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('multipla_escolha', 'verdadeiro_falso', 'resposta_curta')),
      pontos INTEGER NOT NULL DEFAULT 1,
      ordem INTEGER NOT NULL DEFAULT 0
    );`,

    // Tabela de opções de quiz
    `CREATE TABLE IF NOT EXISTS quiz_opcoes (
      id_opcao SERIAL PRIMARY KEY,
      id_pergunta INTEGER NOT NULL REFERENCES quiz_perguntas(id_pergunta) ON DELETE CASCADE,
      texto TEXT NOT NULL,
      correta BOOLEAN NOT NULL DEFAULT FALSE,
      ordem INTEGER NOT NULL DEFAULT 0
    );`,

    // Tabela de respostas de quiz corrigida com cascade
    `CREATE TABLE IF NOT EXISTS quiz_respostas (
      id_resposta SERIAL PRIMARY KEY,
      id_inscricao INTEGER NOT NULL REFERENCES inscricoes_cursos(id_inscricao) ON DELETE CASCADE,
      id_quiz INTEGER NOT NULL REFERENCES quizzes(id_quiz) ON DELETE CASCADE,
      data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      data_conclusao TIMESTAMP WITH TIME ZONE,
      nota DECIMAL(5,2),
      completo BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    // Tabela de detalhes de respostas de quiz
    `CREATE TABLE IF NOT EXISTS quiz_respostas_detalhes (
      id_resposta_detalhe SERIAL PRIMARY KEY,
      id_resposta INTEGER NOT NULL REFERENCES quiz_respostas(id_resposta) ON DELETE CASCADE,
      id_pergunta INTEGER NOT NULL REFERENCES quiz_perguntas(id_pergunta) ON DELETE CASCADE,
      resposta_texto TEXT,
      id_opcao INTEGER REFERENCES quiz_opcoes(id_opcao) ON DELETE CASCADE,
      correta BOOLEAN,
      pontos_obtidos DECIMAL(5,2)
    );`,

    // Tabela de push subscriptions corrigida com cascade
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id_subscription SERIAL PRIMARY KEY,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      endpoint VARCHAR(500) NOT NULL,
      p256dh VARCHAR(500) NOT NULL,
      auth VARCHAR(500) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Tabela de tipos de conteúdo
    `CREATE TABLE IF NOT EXISTS tipos_conteudo (
      id_tipo SERIAL PRIMARY KEY,
      nome VARCHAR(50) NOT NULL UNIQUE,
      icone VARCHAR(50),
      descricao VARCHAR(255),
      ativo BOOLEAN DEFAULT TRUE
    );`,

    // Tabela de tópicos de curso
    `CREATE TABLE IF NOT EXISTS curso_topico (
      id_topico SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      arquivo_path VARCHAR(500),
      dir_path VARCHAR(500)
    );`,

    // Tabela de pastas de tópicos de curso
    `CREATE TABLE IF NOT EXISTS curso_topico_pasta (
      id_pasta SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      arquivo_path VARCHAR(500),
      id_topico INTEGER NOT NULL REFERENCES curso_topico(id_topico) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      data_limite TIMESTAMP WITH TIME ZONE
    );`,

    // Tabela de conteúdo de pastas de curso
    `CREATE TABLE IF NOT EXISTS curso_topico_pasta_conteudo (
      id_conteudo SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('file', 'link', 'video')),
      url VARCHAR(500),
      arquivo_path VARCHAR(500),
      id_pasta INTEGER NOT NULL REFERENCES curso_topico_pasta(id_pasta) ON DELETE CASCADE,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE
    );`,

    // Tabela de trabalhos entregues corrigida com cascade
    `CREATE TABLE IF NOT EXISTS trabalhos_entregues (
      id_trabalho SERIAL PRIMARY KEY,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      id_pasta INTEGER NOT NULL REFERENCES curso_topico_pasta(id_pasta) ON DELETE CASCADE,
      ficheiro_path VARCHAR(500) NOT NULL,
      nome_ficheiro VARCHAR(255),
      data_entrega TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      avaliacao INTEGER CHECK (avaliacao BETWEEN 0 AND 20),
      observacoes TEXT
    );`,

    // Tabela de mensagens de chat corrigida com cascade
    `CREATE TABLE IF NOT EXISTS chat_mensagens (
      id SERIAL PRIMARY KEY,
      id_topico INTEGER NOT NULL REFERENCES topico_area(id_topico) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
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

    // Tabela de interações de chat corrigida com cascade
    `CREATE TABLE IF NOT EXISTS chat_interacoes (
      id_interacao SERIAL PRIMARY KEY,
      id_mensagem INTEGER NOT NULL REFERENCES chat_mensagens(id) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('like', 'dislike')),
      data_interacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_user_message UNIQUE (id_mensagem, id_utilizador)
    );`,

    // Tabela de denúncias de chat corrigida com cascade
    `CREATE TABLE IF NOT EXISTS chat_denuncias (
      id_denuncia SERIAL PRIMARY KEY,
      id_mensagem INTEGER NOT NULL REFERENCES chat_mensagens(id) ON DELETE CASCADE,
      id_denunciante INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      motivo VARCHAR(100) NOT NULL,
      descricao TEXT,
      data_denuncia TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      resolvida BOOLEAN NOT NULL DEFAULT FALSE,
      acao_tomada VARCHAR(255)
    );`,

    // Tabela de temas do fórum corrigida com cascade
    `CREATE TABLE IF NOT EXISTS forum_tema (
      id_tema SERIAL PRIMARY KEY,
      id_topico INTEGER NOT NULL REFERENCES topico_area(id_topico) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      titulo VARCHAR(255),
      texto TEXT,
      anexo_url VARCHAR(255),
      anexo_nome VARCHAR(100),
      tipo_anexo VARCHAR(20) CHECK (tipo_anexo IN ('imagem', 'video', 'file')),
      data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      likes INTEGER NOT NULL DEFAULT 0,
      dislikes INTEGER NOT NULL DEFAULT 0,
      comentarios INTEGER NOT NULL DEFAULT 0,
      foi_denunciado BOOLEAN NOT NULL DEFAULT FALSE,
      oculto BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    // Tabela de interações de temas do fórum corrigida com cascade
    `CREATE TABLE IF NOT EXISTS forum_tema_interacao (
      id_interacao SERIAL PRIMARY KEY,
      id_tema INTEGER NOT NULL REFERENCES forum_tema(id_tema) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('like', 'dislike')),
      data_interacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_user_tema UNIQUE (id_tema, id_utilizador)
    );`,

    // Tabela de denúncias de temas do fórum corrigida com cascade
    `CREATE TABLE IF NOT EXISTS forum_tema_denuncia (
      id_denuncia SERIAL PRIMARY KEY,
      id_tema INTEGER NOT NULL REFERENCES forum_tema(id_tema) ON DELETE CASCADE,
      id_denunciante INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      motivo VARCHAR(100) NOT NULL,
      descricao TEXT,
      data_denuncia TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      resolvida BOOLEAN NOT NULL DEFAULT FALSE,
      acao_tomada VARCHAR(255)
    );`,

    // Tabela de comentários do fórum
    `CREATE TABLE IF NOT EXISTS forum_comentario (
      id_comentario SERIAL PRIMARY KEY,
      id_tema INTEGER NOT NULL REFERENCES forum_tema(id_tema) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      texto TEXT,
      anexo_url VARCHAR(255),
      anexo_nome VARCHAR(100),
      tipo_anexo VARCHAR(20) CHECK (tipo_anexo IN ('imagem', 'video', 'file')),
      data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      likes INTEGER NOT NULL DEFAULT 0,
      dislikes INTEGER NOT NULL DEFAULT 0,
      foi_denunciado BOOLEAN NOT NULL DEFAULT FALSE,
      oculto BOOLEAN NOT NULL DEFAULT FALSE
    );`
  ];

  // Executar a criação das tabelas em sequência
  for (const sql of createTablesSQL) {
    try {
      await sequelize.query(sql);
      console.log(`✅ Executado com sucesso: ${sql.substring(0, 60)}...`);
    } catch (error) {
      console.error(`❌ Erro ao criar tabela: ${error.message}`);
      console.error(sql);
      throw error; // Interromper a execução se houver um erro
    }
  }

  console.log("🎉 Todas as tabelas foram criadas com sucesso!");
  console.log("🔗 Constraints CASCADE configuradas para eliminação fácil de utilizadores");
  console.log("🛡️ Formadores: cursos ficam com formador igual NULL não são eliminados");
  console.log("🚀 Sistema de associação de cursos implementado");
};

module.exports = {
  createTablesInOrder
};