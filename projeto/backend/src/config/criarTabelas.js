const sequelize = require("../config/db");

/**
 * CRIAÇÃO DE TABELAS DA PLATAFORMA DE FORMAÇÃO - VERSÃO CORRIGIDA E ALINHADA
 * 
 * ✅ ATUALIZADO: 100% alinhado com os modelos Sequelize fornecidos
 * ✅ CORRIGIDO: Todos os campos dos models incluídos
 * ✅ MELHORADO: Estrutura idêntica aos models
 * 
 * Cria todas as tabelas na ordem correta respeitando as dependências de chaves estrangeiras
 * e implementando as regras de integridade da hierarquia educacional:
 * 
 * HIERARQUIA PRINCIPAL: Categoria → Área → Tópico → Curso
 * 
 * REGRAS DE INTEGRIDADE IMPLEMENTADAS:
 * 1. Eliminar categoria: apenas se não tiver áreas (RESTRICT)
 * 2. Eliminar área: apenas se não tiver tópicos (RESTRICT)  
 * 3. Eliminar tópico: remove cursos e chats em cascata (CASCADE)
 * 4. Eliminar curso: remove associações formador/formando (CASCADE)
 * 5. Eliminar utilizador: cursos ficam com formador NULL (SET NULL)
 * 
 * A ordem de criação é fundamental para evitar erros de dependências!
 */
const createTablesInOrder = async () => {
  console.log('🏗️ [CREATE-TABLES] A iniciar criação de tabelas...');
  
  const createTablesSQL = [
    
    // =============================================================================
    // TABELAS BASE (sem dependências)
    // =============================================================================
    
    /**
     * CARGOS/FUNÇÕES DOS UTILIZADORES
     * Define os tipos de utilizadores do sistema (Admin, Formador, Formando)
     */
    `CREATE TABLE IF NOT EXISTS cargos (
      id_cargo SERIAL PRIMARY KEY,
      descricao VARCHAR(255) NOT NULL UNIQUE
    );`,

    /**
     * UTILIZADORES PENDENTES 
     * Utilizadores em processo de registo (aguardam validação de email)
     * Model: User_Pendente.js
     */
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

    /**
     * UTILIZADORES PRINCIPAIS
     * Utilizadores ativos do sistema - SEM TIMESTAMPS AUTOMÁTICOS
     * Model: User.js (timestamps: false)
     */
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

    // =============================================================================
    // HIERARQUIA EDUCACIONAL (Categoria → Área → Tópico → Curso)
    // =============================================================================

    /**
     * CATEGORIAS (1º nível da hierarquia)
     * Grandes áreas de conhecimento (ex: Informática, Gestão)
     * Model: Categoria.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS categorias (
      id_categoria SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL UNIQUE
    );`,

    /**
     * ÁREAS (2º nível da hierarquia)  
     * Especializam as categorias (ex: Programação Web, Design)
     * Model: Area.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS areas (
      id_area SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria) ON DELETE RESTRICT
    );`,

    /**
     * ASSOCIAÇÕES PENDENTES DE FORMADORES
     * Especialidades de formadores aguardando aprovação
     * Model: Formador_Associacoes_Pendentes.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS formador_associacoes_pendentes (
      id SERIAL PRIMARY KEY,
      id_pendente INTEGER NOT NULL REFERENCES "User_Pendente"(id) ON DELETE CASCADE,
      categorias JSONB DEFAULT '[]',
      areas JSONB DEFAULT '[]',
      cursos JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_pendente UNIQUE (id_pendente)
    );`,

    /**
     * ESPECIALIDADES DOS FORMADORES - CATEGORIAS
     * Define quais categorias um formador pode lecionar
     * Model: Formador_Categoria.js (timestamps: false) - CORRIGIDO com campos em falta
     */
    `CREATE TABLE IF NOT EXISTS formador_categoria (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      observacoes TEXT,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      CONSTRAINT unique_formador_categoria UNIQUE (id_formador, id_categoria)
    );`,

    /**
     * ESPECIALIDADES DOS FORMADORES - ÁREAS
     * Define quais áreas específicas um formador domina
     * Model: Formador_Area.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS formador_area (
      id SERIAL PRIMARY KEY,
      id_formador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_area INTEGER NOT NULL REFERENCES areas(id_area) ON DELETE CASCADE,
      data_associacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_formador_area UNIQUE (id_formador, id_area)
    );`,

    /**
     * TÓPICOS DE ÁREA (3º nível da hierarquia)
     * Organizam discussões e cursos por temas específicos
     * Model: Topico_Area.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS topico_area (
      id_topico SERIAL PRIMARY KEY,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria),
      id_area INTEGER NOT NULL REFERENCES areas(id_area) ON DELETE RESTRICT,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      criado_por INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ativo BOOLEAN NOT NULL DEFAULT TRUE
    );`,

    /**
     * CURSOS (4º nível da hierarquia)
     * Conteúdo educacional final associado a tópicos
     * Model: Curso.js (timestamps: false) - SEM TIMESTAMPS AUTOMÁTICOS
     */
    `CREATE TABLE IF NOT EXISTS curso (
      id_curso SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      descricao TEXT,
      tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('sincrono', 'assincrono')),
      vagas INTEGER,
      duracao INTEGER NOT NULL,
      data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
      data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
      estado VARCHAR(30) NOT NULL DEFAULT 'planeado' 
        CHECK (estado IN ('planeado', 'em_curso', 'terminado')),
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      id_formador INTEGER REFERENCES utilizadores(id_utilizador) ON DELETE SET NULL,
      id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria),
      id_area INTEGER NOT NULL REFERENCES areas(id_area),
      id_topico_area INTEGER NOT NULL REFERENCES topico_area(id_topico) ON DELETE CASCADE,
      imagem_path VARCHAR(500),
      dir_path VARCHAR(500)
    );`,

    // =============================================================================
    // SISTEMA DE ASSOCIAÇÕES E INSCRIÇÕES
    // =============================================================================

    /**
     * ASSOCIAÇÕES ENTRE CURSOS
     * Define pré-requisitos e sequências de cursos
     * Model: AssociarCurso.js (timestamps: true)
     */
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

    /**
     * INSCRIÇÕES DE FORMANDOS EM CURSOS
     * Model: Inscricao_Curso.js (timestamps: false) - APENAS CAMPOS QUE EXISTEM NO MODEL
     */
    `CREATE TABLE IF NOT EXISTS inscricoes_cursos (
      id_inscricao SERIAL PRIMARY KEY,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      estado VARCHAR(30) NOT NULL DEFAULT 'inscrito' 
        CHECK (estado IN ('inscrito', 'cancelado')),
      motivacao TEXT,
      expectativas TEXT,
      nota_final DECIMAL(5,2),
      certificado_gerado BOOLEAN NOT NULL DEFAULT FALSE,
      motivo_cancelamento TEXT,
      data_cancelamento TIMESTAMP WITH TIME ZONE,
      cancelado_por INTEGER REFERENCES utilizadores(id_utilizador),
      CONSTRAINT unique_utilizador_curso UNIQUE (id_utilizador, id_curso)
    );`,

    // =============================================================================
    // SISTEMA DE PRESENÇAS
    // =============================================================================

    /**
     * SESSÕES DE PRESENÇA POR CURSO
     * Model: Curso_Presenca.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS curso_presenca (
      id_curso_presenca SERIAL PRIMARY KEY,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      data_inicio DATE NOT NULL,
      data_fim DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fim TIME NOT NULL,
      codigo VARCHAR(20) NOT NULL
    );`,

    /**
     * REGISTO INDIVIDUAL DE PRESENÇAS
     * Model: Formando_Presenca.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS formando_presenca (
      id_formando_presenca SERIAL PRIMARY KEY,
      id_curso_presenca INTEGER NOT NULL REFERENCES curso_presenca(id_curso_presenca) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      presenca BOOLEAN NOT NULL DEFAULT TRUE,
      duracao DECIMAL(5,2)
    );`,

    // =============================================================================
    // SISTEMA DE AVALIAÇÕES E CERTIFICAÇÕES
    // =============================================================================

    /**
     * AVALIAÇÕES FINAIS DOS CURSOS
     * Model: Avaliacao.js (timestamps: false)
     */
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

    /**
     * OCORRÊNCIAS/EDIÇÕES DE CURSOS
     * Model: OcorrenciaCurso.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS ocorrencias_cursos (
      id_ocorrencia SERIAL PRIMARY KEY,
      id_curso_original INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      id_curso_nova_ocorrencia INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      numero_edicao INTEGER NOT NULL
    );`,

    // =============================================================================
    // SISTEMA DE NOTIFICAÇÕES
    // =============================================================================

    /**
     * NOTIFICAÇÕES GLOBAIS
     * Model: Notificacao.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS notificacoes (
      id_notificacao SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      mensagem TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('curso_adicionado', 'formador_alterado', 
        'formador_criado', 'admin_criado', 'data_curso_alterada')),
      id_referencia INTEGER,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      enviado_email BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    /**
     * NOTIFICAÇÕES POR UTILIZADOR
     * Model: NotificacaoUtilizador.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS notificacoes_utilizadores (
      id SERIAL PRIMARY KEY,
      id_notificacao INTEGER NOT NULL REFERENCES notificacoes(id_notificacao) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      lida BOOLEAN NOT NULL DEFAULT FALSE,
      data_leitura TIMESTAMP WITH TIME ZONE,
      CONSTRAINT unique_notificacao_utilizador UNIQUE (id_notificacao, id_utilizador)
    );`,

    // =============================================================================
    // SISTEMA DE QUIZZES/QUESTIONÁRIOS
    // =============================================================================

    /**
     * QUIZZES DOS CURSOS
     * Model: Quiz.js (timestamps: false)
     */
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

    /**
     * PERGUNTAS DOS QUIZZES
     * Model: QuizPergunta.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS quiz_perguntas (
      id_pergunta SERIAL PRIMARY KEY,
      id_quiz INTEGER NOT NULL REFERENCES quizzes(id_quiz) ON DELETE CASCADE,
      pergunta TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('multipla_escolha', 'verdadeiro_falso', 'resposta_curta', 'multipla_resposta')),
      pontos INTEGER NOT NULL DEFAULT 4,
      ordem INTEGER NOT NULL DEFAULT 0
    );`,

    /**
     * OPÇÕES DE RESPOSTA (para perguntas de múltipla escolha)
     * Model: QuizOpcao.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS quiz_opcoes (
      id_opcao SERIAL PRIMARY KEY,
      id_pergunta INTEGER NOT NULL REFERENCES quiz_perguntas(id_pergunta) ON DELETE CASCADE,
      texto TEXT NOT NULL,
      correta BOOLEAN NOT NULL DEFAULT FALSE,
      ordem INTEGER NOT NULL DEFAULT 0
    );`,

    /**
     * RESPOSTAS DOS UTILIZADORES AOS QUIZZES
     * Model: QuizResposta.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS quiz_respostas (
      id_resposta SERIAL PRIMARY KEY,
      id_inscricao INTEGER NOT NULL REFERENCES inscricoes_cursos(id_inscricao) ON DELETE CASCADE,
      id_quiz INTEGER NOT NULL REFERENCES quizzes(id_quiz) ON DELETE CASCADE,
      data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      data_conclusao TIMESTAMP WITH TIME ZONE,
      nota DECIMAL(5,2),
      completo BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    /**
     * DETALHES DAS RESPOSTAS INDIVIDUAIS
     * Model: QuizRespostaDetalhe.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS quiz_respostas_detalhes (
      id_resposta_detalhe SERIAL PRIMARY KEY,
      id_resposta INTEGER NOT NULL REFERENCES quiz_respostas(id_resposta) ON DELETE CASCADE,
      id_pergunta INTEGER NOT NULL REFERENCES quiz_perguntas(id_pergunta) ON DELETE CASCADE,
      resposta_texto TEXT,
      id_opcao INTEGER REFERENCES quiz_opcoes(id_opcao) ON DELETE CASCADE,
      correta BOOLEAN,
      pontos_obtidos DECIMAL(5,2)
    );`,

    // =============================================================================
    // SISTEMA DE NOTIFICAÇÕES PUSH
    // =============================================================================

    /**
     * SUBSCRIÇÕES PARA NOTIFICAÇÕES PUSH
     * Model: PushSubscription.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id_subscription SERIAL PRIMARY KEY,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      endpoint VARCHAR(500) NOT NULL,
      p256dh VARCHAR(500) NOT NULL,
      auth VARCHAR(500) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // =============================================================================
    // SISTEMA DE CONTEÚDOS DOS CURSOS
    // =============================================================================

    /**
     * TIPOS DE CONTEÚDO SUPORTADOS
     * Model: TipoConteudo.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS tipos_conteudo (
      id_tipo SERIAL PRIMARY KEY,
      nome VARCHAR(50) NOT NULL UNIQUE,
      icone VARCHAR(50),
      descricao VARCHAR(255),
      ativo BOOLEAN DEFAULT TRUE
    );`,

    /**
     * TÓPICOS DENTRO DE CURSOS (organização interna)
     * Model: Curso_Topicos.js (timestamps: false)
     * Nome da tabela: curso_topico
     */
    `CREATE TABLE IF NOT EXISTS curso_topico (
      id_topico SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      id_curso INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      arquivo_path VARCHAR(500),
      dir_path VARCHAR(500)
    );`,

    /**
     * PASTAS DENTRO DOS TÓPICOS DOS CURSOS
     * Model: PastaCurso.js (timestamps: false)
     * Nome da tabela: curso_topico_pasta
     */
    `CREATE TABLE IF NOT EXISTS curso_topico_pasta (
      id_pasta SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      arquivo_path VARCHAR(500),
      id_topico INTEGER NOT NULL REFERENCES curso_topico(id_topico) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 1,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      data_limite TIMESTAMP WITH TIME ZONE
    );`,

    /**
     * CONTEÚDOS ESPECÍFICOS (ficheiros, links, vídeos)
     * Model: ConteudoCurso.js (timestamps: false)
     * Nome da tabela: curso_topico_pasta_conteudo
     */
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

    // =============================================================================
    // SISTEMA DE TRABALHOS ENTREGUES
    // =============================================================================

    /**
     * TRABALHOS ENTREGUES PELOS FORMANDOS
     * Model: Trabalho_Entregue.js (timestamps: false)
     */
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

    // =============================================================================
    // SISTEMA DE CHAT E DISCUSSÃO (baseado em tópicos de área)
    // =============================================================================

    /**
     * MENSAGENS DE CHAT ASSOCIADAS A TÓPICOS
     * Model: ChatMensagem.js (timestamps: false)
     * REGRA CRÍTICA: Eliminar tópico remove todas as mensagens
     */
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

    /**
     * INTERAÇÕES COM MENSAGENS (likes/dislikes)
     * Model: ChatInteracoes.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS chat_interacoes (
      id_interacao SERIAL PRIMARY KEY,
      id_mensagem INTEGER NOT NULL REFERENCES chat_mensagens(id) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('like', 'dislike')),
      data_interacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_user_message UNIQUE (id_mensagem, id_utilizador)
    );`,

    /**
     * DENÚNCIAS DE MENSAGENS
     * Model: ChatDenuncia.js (timestamps: false)
     */
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

    // =============================================================================
    // SISTEMA DE FÓRUM (temas e comentários)
    // =============================================================================

    /**
     * TEMAS DO FÓRUM ASSOCIADOS A TÓPICOS
     * Model: ForumTema.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS forum_tema (
      id_tema SERIAL PRIMARY KEY,
      id_topico INTEGER NOT NULL REFERENCES topico_area(id_topico) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      titulo VARCHAR(255),
      texto TEXT,
      anexo_url VARCHAR(255),
      anexo_nome VARCHAR(100),
      tipo_anexo VARCHAR(20) CHECK (tipo_anexo IS NULL OR tipo_anexo IN ('imagem', 'video', 'file')),
      data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      likes INTEGER NOT NULL DEFAULT 0,
      dislikes INTEGER NOT NULL DEFAULT 0,
      comentarios INTEGER NOT NULL DEFAULT 0,
      foi_denunciado BOOLEAN NOT NULL DEFAULT FALSE,
      oculto BOOLEAN NOT NULL DEFAULT FALSE
    );`,

    /**
     * INTERAÇÕES COM TEMAS DO FÓRUM
     * Model: ForumTemaInteracao.js (timestamps: false)
     */
    `CREATE TABLE IF NOT EXISTS forum_tema_interacao (
      id_interacao SERIAL PRIMARY KEY,
      id_tema INTEGER NOT NULL REFERENCES forum_tema(id_tema) ON DELETE CASCADE,
      id_utilizador INTEGER NOT NULL REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE,
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('like', 'dislike')),
      data_interacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_user_tema UNIQUE (id_tema, id_utilizador)
    );`,

    /**
     * DENÚNCIAS DE TEMAS DO FÓRUM
     * Model: ForumTemaDenuncia.js (timestamps: false)
     */
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

    /**
     * COMENTÁRIOS AOS TEMAS DO FÓRUM
     * Model: ForumComentario.js (timestamps: false)
     */
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
    );`,

    // =============================================================================
    // INSERÇÃO DE DADOS ESSENCIAIS INICIAIS
    // =============================================================================

    /**
     * CARGOS PADRÃO DO SISTEMA
     */
    `INSERT INTO cargos (descricao) VALUES 
      ('Administrador'),
      ('Formador'),
      ('Formando')
    ON CONFLICT (descricao) DO NOTHING;`,

    /**
     * CATEGORIAS INICIAIS DE EXEMPLO
     */
    `INSERT INTO categorias (nome) VALUES 
      ('Tecnologias de Informação'),
      ('Gestão e Administração'),
      ('Design e Comunicação'),
      ('Saúde e Bem-estar'),
      ('Educação e Formação')
    ON CONFLICT (nome) DO NOTHING;`,

    /**
     * TIPOS DE CONTEÚDO PADRÃO
     */
    `INSERT INTO tipos_conteudo (nome, icone, descricao) VALUES 
      ('PDF', 'fa-file-pdf', 'Documentos em formato PDF'),
      ('Video', 'fa-video', 'Ficheiros de vídeo'),
      ('Imagem', 'fa-image', 'Ficheiros de imagem'),
      ('Link', 'fa-link', 'Links externos'),
      ('Documento', 'fa-file-word', 'Documentos de texto')
    ON CONFLICT (nome) DO NOTHING;`
  ];

  console.log(`📋 [CREATE-TABLES] Preparadas ${createTablesSQL.length} queries SQL`);

  let successCount = 0;
  let errorCount = 0;

  // Executar cada comando SQL sequencialmente com logging detalhado
  for (let i = 0; i < createTablesSQL.length; i++) {
    const sql = createTablesSQL[i];
    try {
      // Extrair nome da tabela do SQL para logging
      const tableMatch = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i) || 
                         sql.match(/CREATE TABLE IF NOT EXISTS "([^"]+)"/i) ||
                         sql.match(/INSERT INTO (\w+)/i);
      const tableName = tableMatch ? tableMatch[1] : `Query ${i + 1}`;
      
      console.log(`⚙️ [CREATE-TABLES] Executando: ${tableName}`);
      await sequelize.query(sql);
      successCount++;
      
      // Log especial para tabelas críticas
      if (['inscricoes_cursos', 'curso', 'formador_categoria'].includes(tableName)) {
        console.log(`✅ [CREATE-TABLES] CRÍTICO: Tabela ${tableName} criada com sucesso`);
      }
      
    } catch (error) {
      errorCount++;
      console.error(`❌ [CREATE-TABLES] Erro na query ${i + 1}:`, error.message);
      
      // Para algumas tabelas críticas, re-throw o erro
      if (sql.includes('curso') || sql.includes('inscricoes_cursos') || sql.includes('formador_categoria')) {
        console.error('🚨 [CREATE-TABLES] Erro em tabela crítica - a parar execução');
        throw error;
      }
      
      // Para outras tabelas, apenas log do erro e continuar
      console.warn(`⚠️ [CREATE-TABLES] Continuando apesar do erro...`);
    }
  }

  console.log('📊 [CREATE-TABLES] Resumo da execução:');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📋 Total: ${createTablesSQL.length}`);
  
  if (errorCount === 0) {
    console.log('🎉 [CREATE-TABLES] Todas as tabelas criadas com sucesso!');
  } else if (successCount > errorCount) {
    console.log('⚠️ [CREATE-TABLES] Criação concluída com alguns erros');
  } else {
    console.log('🚨 [CREATE-TABLES] Muitos erros na criação das tabelas');
  }
};

/**
 * Função auxiliar para verificar se as tabelas críticas existem
 */
const verificarTabelasCriticas = async () => {
  const tabelasCriticas = [
    'utilizadores',
    'cargos', 
    'categorias',
    'areas',
    'curso',
    'inscricoes_cursos',
    'formador_categoria',
    'formador_area'
  ];

  console.log('🔍 [CREATE-TABLES] A verificar tabelas críticas...');

  for (const tabela of tabelasCriticas) {
    try {
      const result = await sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = '${tabela}'
        );`,
        { type: sequelize.QueryTypes.SELECT }
      );
      
      const existe = result[0].exists;
      console.log(`${existe ? '✅' : '❌'} [CREATE-TABLES] Tabela ${tabela}: ${existe ? 'Existe' : 'Não encontrada'}`);
      
      if (!existe) {
        throw new Error(`Tabela crítica ${tabela} não existe`);
      }
      
    } catch (error) {
      console.error(`❌ [CREATE-TABLES] Erro ao verificar tabela ${tabela}:`, error.message);
      throw error;
    }
  }

  console.log('✅ [CREATE-TABLES] Todas as tabelas críticas verificadas');
};

/**
 * Função para verificar campos específicos das tabelas críticas
 */
const verificarCamposTabelas = async () => {
  console.log('🔍 [CREATE-TABLES] A verificar campos das tabelas...');

  try {
    // Verificar campos da tabela formador_categoria (que estava a dar erro)
    const camposFormadorCategoria = await sequelize.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'formador_categoria'
       ORDER BY ordinal_position;`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('📋 [CREATE-TABLES] Campos da tabela formador_categoria:');
    camposFormadorCategoria.forEach(campo => {
      console.log(`   • ${campo.column_name} (${campo.data_type}) ${campo.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Verificar campos da tabela inscricoes_cursos
    const camposInscricoes = await sequelize.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'inscricoes_cursos'
       ORDER BY ordinal_position;`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('📋 [CREATE-TABLES] Campos da tabela inscricoes_cursos:');
    camposInscricoes.forEach(campo => {
      console.log(`   • ${campo.column_name} (${campo.data_type}) ${campo.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Verificar campos da tabela curso
    const camposCurso = await sequelize.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'curso'
       ORDER BY ordinal_position;`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('📋 [CREATE-TABLES] Campos da tabela curso:');
    camposCurso.forEach(campo => {
      console.log(`   • ${campo.column_name} (${campo.data_type}) ${campo.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Verificar se os campos críticos existem
    const camposCriticos = {
      'formador_categoria': ['observacoes', 'ativo'],
      'quiz_perguntas': ['pontos'],
      'quiz_opcoes': ['ordem']
    };
    
    for (const [tabela, campos] of Object.entries(camposCriticos)) {
      for (const campo of campos) {
        const result = await sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = '${tabela}' AND column_name = '${campo}'
          );`,
          { type: sequelize.QueryTypes.SELECT }
        );
        
        const existe = result[0].exists;
        if (existe) {
          console.log(`✅ [CREATE-TABLES] Campo ${tabela}.${campo}: Existe`);
        } else {
          console.warn(`⚠️ [CREATE-TABLES] Campo ${tabela}.${campo}: NÃO EXISTE`);
        }
      }
    }

  } catch (error) {
    console.error('❌ [CREATE-TABLES] Erro ao verificar campos:', error.message);
  }
};

/**
 * Função para verificar constraints e foreign keys
 */
const verificarConstraints = async () => {
  console.log('🔍 [CREATE-TABLES] A verificar constraints...');

  try {
    // Verificar foreign keys críticas
    const foreignKeys = await sequelize.query(
      `SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('curso', 'inscricoes_cursos', 'formador_categoria', 'quiz_perguntas', 'quiz_opcoes')
      ORDER BY tc.table_name, kcu.column_name;`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('📋 [CREATE-TABLES] Foreign Keys encontradas:');
    foreignKeys.forEach(fk => {
      console.log(`   • ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

  } catch (error) {
    console.error('❌ [CREATE-TABLES] Erro ao verificar constraints:', error.message);
  }
};

module.exports = {
  createTablesInOrder,
  verificarTabelasCriticas,
  verificarCamposTabelas,
  verificarConstraints
};