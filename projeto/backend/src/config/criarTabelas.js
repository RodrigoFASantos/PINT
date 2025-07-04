const sequelize = require("../config/db");

/**
 * Cria todas as tabelas da aplicação na ordem correta
 * 
 * A ordem é fundamental devido às dependências de chaves estrangeiras:
 * 1. Tabelas base (cargos, categorias)
 * 2. Utilizadores e dependências
 * 3. Cursos e estrutura académica
 * 4. Sistema de mensagens e fórum
 * 5. Avaliações e certificações
 * 
 * Configurado com CASCADE DELETE para facilitar gestão de dados
 */
const createTablesInOrder = async () => {
  const createTablesSQL = [
    // Tabela de cargos/funções dos utilizadores
    `CREATE TABLE IF NOT EXISTS cargos (
      id_cargo SERIAL PRIMARY KEY,
      descricao VARCHAR(255) NOT NULL
    );`,

    // Tabela para utilizadores em processo de registo (validação de email)
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

    // Tabela principal de utilizadores do sistema
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

    // Sistema de categorização de cursos - nível superior
    `CREATE TABLE IF NOT EXISTS categorias (
      id_categoria SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL UNIQUE
    );`,

    // Áreas específicas dentro de cada categoria
    `CREATE TABLE IF NOT EXISTS areas (
      id_area SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria)
    );`,

    // Associações pendentes de formadores (durante registo)
    `CREATE TABLE IF NOT EXISTS formador_associacoes_pendentes (
      id SERIAL PRIMARY KEY,
      id_pendente INTEGER NOT NULL REFERENCES "User_Pendente"(id) ON DELETE CASCADE,
      categorias JSONB DEFAULT '[]',
      areas JSONB DEFAULT '[]',
      cursos JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_pendente UNIQUE (id_pendente)
    );`,

    // Ligação entre formadores e categorias que podem lecionar
    `CREATE TABLE IF NOT EXISTS formador_categoria (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_categoria UNIQUE (id_formador, id_categoria)
    );`,

    // Ligação entre formadores e áreas específicas
    `CREATE TABLE IF NOT EXISTS formador_area (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_area INTEGER NOT NULL REFERENCES areas(id_area) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_area UNIQUE (id_formador, id_area)
    );`,

    // Tópicos de discussão dentro de cada área
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

    // Tabela principal de cursos
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

    // Sistema de associação entre cursos (pré-requisitos, sequências)
    `CREATE TABLE IF NOT EXISTS associar_cursos (
      id_associacao SERIAL PRIMARY KEY,
      id_curso_origem INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      id_curso_destino INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      descricao TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_course_association UNIQUE(id_curso_origem, id_curso_destino),
      CONSTRAINT check_different_courses CHECK (id_curso_origem != id_curso_destino)
    );`,

    // Inscrições de formandos em cursos
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

    // Registo de presenças para cursos síncronos
    `CREATE TABLE IF NOT EXISTS curso_presenca (
      id_curso_presenca SERIAL PRIMARY KEY,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      data_inicio DATE NOT NULL,
      data_fim DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fim TIME NOT NULL,
      codigo VARCHAR(20) NOT NULL
    );`,

    // Registo individual de presença de cada formando
    `CREATE TABLE IF NOT EXISTS formando_presenca (
      id_formando_presenca SERIAL PRIMARY KEY,
      id_curso_presenca INTEGER NOT NULL REFERENCES curso_presenca(id_curso_presenca) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      presenca BOOLEAN NOT NULL DEFAULT TRUE,
      duracao DECIMAL(5,2) NULL
    );`,

    // Avaliações finais e certificações
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

    // Sistema de edições/ocorrências de cursos
    `CREATE TABLE IF NOT EXISTS ocorrencias_cursos (
      id_ocorrencia SERIAL PRIMARY KEY,
      id_curso_original INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      id_curso_nova_ocorrencia INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      numero_edicao INTEGER NOT NULL
    );`,

    // Sistema de notificações da aplicação
    `CREATE TABLE IF NOT EXISTS notificacoes (
      id_notificacao SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      mensagem TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('curso_adicionado', 'formador_alterado', 'formador_criado', 'admin_criado', 'data_curso_alterada')),
      id_referencia INTEGER,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      enviado_email BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    // Ligação entre notificações e utilizadores (quem recebe)
    `CREATE TABLE IF NOT EXISTS notificacoes_utilizadores (
      id SERIAL PRIMARY KEY,
      id_notificacao INTEGER NOT NULL REFERENCES notificacoes(id_notificacao) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      lida BOOLEAN NOT NULL DEFAULT FALSE,
      data_leitura TIMESTAMP WITH TIME ZONE,
      CONSTRAINT unique_notificacao_utilizador UNIQUE (id_notificacao, id_utilizador)
    );`,

    // Sistema de quizzes/questionários
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

    // Perguntas individuais dos quizzes
    `CREATE TABLE IF NOT EXISTS quiz_perguntas (
      id_pergunta SERIAL PRIMARY KEY,
      id_quiz INTEGER NOT NULL REFERENCES quizzes(id_quiz) ON DELETE CASCADE,
      pergunta TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('multipla_escolha', 'verdadeiro_falso', 'resposta_curta')),
      pontos INTEGER NOT NULL DEFAULT 1,
      ordem INTEGER NOT NULL DEFAULT 0
    );`,

    // Opções de resposta para perguntas de múltipla escolha
    `CREATE TABLE IF NOT EXISTS quiz_opcoes (
      id_opcao SERIAL PRIMARY KEY,
      id_pergunta INTEGER NOT NULL REFERENCES quiz_perguntas(id_pergunta) ON DELETE CASCADE,
      texto TEXT NOT NULL,
      correta BOOLEAN NOT NULL DEFAULT FALSE,
      ordem INTEGER NOT NULL DEFAULT 0
    );`,

    // Respostas dos utilizadores aos quizzes
    `CREATE TABLE IF NOT EXISTS quiz_respostas (
      id_resposta SERIAL PRIMARY KEY,
      id_inscricao INTEGER NOT NULL REFERENCES inscricoes_cursos(id_inscricao) ON DELETE CASCADE,
      id_quiz INTEGER NOT NULL REFERENCES quizzes(id_quiz) ON DELETE CASCADE,
      data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      data_conclusao TIMESTAMP WITH TIME ZONE,
      nota DECIMAL(5,2),
      completo BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    // Detalhes de cada resposta individual
    `CREATE TABLE IF NOT EXISTS quiz_respostas_detalhes (
      id_resposta_detalhe SERIAL PRIMARY KEY,
      id_resposta INTEGER NOT NULL REFERENCES quiz_respostas(id_resposta) ON DELETE CASCADE,
      id_pergunta INTEGER NOT NULL REFERENCES quiz_perguntas(id_pergunta) ON DELETE CASCADE,
      resposta_texto TEXT,
      id_opcao INTEGER REFERENCES quiz_opcoes(id_opcao) ON DELETE CASCADE,
      correta BOOLEAN,
      pontos_obtidos DECIMAL(5,2)
    );`,

    // Sistema de notificações push
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id_subscription SERIAL PRIMARY KEY,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      endpoint VARCHAR(500) NOT NULL,
      p256dh VARCHAR(500) NOT NULL,
      auth VARCHAR(500) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Tipos de conteúdo suportados pela aplicação
    `CREATE TABLE IF NOT EXISTS tipos_conteudo (
      id_tipo SERIAL PRIMARY KEY,
      nome VARCHAR(50) NOT NULL UNIQUE,
      icone VARCHAR(50),
      descricao VARCHAR(255),
      ativo BOOLEAN DEFAULT TRUE
    );`,

    // Estrutura de tópicos dentro de cada curso
    `CREATE TABLE IF NOT EXISTS curso_topico (
      id_topico SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      arquivo_path VARCHAR(500),
      dir_path VARCHAR(500)
    );`,

    // Pastas organizacionais dentro de cada tópico
    `CREATE TABLE IF NOT EXISTS curso_topico_pasta (
      id_pasta SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      arquivo_path VARCHAR(500),
      id_topico INTEGER NOT NULL REFERENCES curso_topico(id_topico) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      data_limite TIMESTAMP WITH TIME ZONE
    );`,

    // Conteúdos específicos (ficheiros, links, vídeos) dentro das pastas
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

    // Sistema de entrega de trabalhos pelos formandos
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

    // Sistema de chat/mensagens instantâneas
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

    // Sistema de likes/dislikes para mensagens de chat
    `CREATE TABLE IF NOT EXISTS chat_interacoes (
      id_interacao SERIAL PRIMARY KEY,
      id_mensagem INTEGER NOT NULL REFERENCES chat_mensagens(id) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('like', 'dislike')),
      data_interacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_user_message UNIQUE (id_mensagem, id_utilizador)
    );`,

    // Sistema de denúncias para mensagens de chat
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

    // Temas/tópicos do fórum de discussão
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

    // Interações (likes/dislikes) nos temas do fórum
    `CREATE TABLE IF NOT EXISTS forum_tema_interacao (
      id_interacao SERIAL PRIMARY KEY,
      id_tema INTEGER NOT NULL REFERENCES forum_tema(id_tema) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('like', 'dislike')),
      data_interacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_user_tema UNIQUE (id_tema, id_utilizador)
    );`,

    // Sistema de denúncias para temas do fórum
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

    // Comentários aos temas do fórum
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

  // Executar cada comando SQL sequencialmente
  for (const sql of createTablesSQL) {
    try {
      await sequelize.query(sql);
      console.log(`✅ Executado com sucesso: ${sql.substring(0, 60)}...`);
    } catch (error) {
      console.error(`❌ Erro ao criar tabela: ${error.message}`);
      console.error(sql);
      throw error;
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