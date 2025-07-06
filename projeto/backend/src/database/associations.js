/**
 * ASSOCIAÇÕES DOS MODELOS SEQUELIZE (VERSÃO CORRIGIDA)
 * 
 * Define todas as relações entre as tabelas da base de dados seguindo a estrutura hierárquica:
 * Categoria → Área → Tópico → Curso (com sistema de chat e fórum integrado)
 * 
 * Versão corrigida para evitar erros de campos inexistentes na BD
 */

// Importação de todos os modelos da plataforma de formação
const Area = require('./models/Area');
const Avaliacao = require('./models/Avaliacao');
const Cargo = require('./models/Cargo');
const Categoria = require('./models/Categoria');
const ChatMensagem = require('./models/ChatMensagem');
const ChatInteracao = require('./models/ChatInteracoes');
const ChatDenuncia = require('./models/ChatDenuncia');
const ConteudoCurso = require('./models/ConteudoCurso');
const Curso = require('./models/Curso');
const FormadorCategoria = require('./models/Formador_Categoria');
const FormadorArea = require('./models/Formador_Area');
const Inscricao_Curso = require('./models/Inscricao_Curso');
const OcorrenciaCurso = require('./models/OcorrenciaCurso');
const PastaCurso = require('./models/PastaCurso');
const PushSubscription = require('./models/PushSubscription');
const Quiz = require('./models/Quiz');
const QuizOpcao = require('./models/QuizOpcao');
const QuizPergunta = require('./models/QuizPergunta');
const QuizResposta = require('./models/QuizResposta');
const QuizRespostaDetalhe = require('./models/QuizRespostaDetalhe');
const TipoConteudo = require('./models/TipoConteudo');
const Curso_Topicos = require('./models/Curso_Topicos');
const Trabalho_Entregue = require('./models/Trabalho_Entregue');
const User = require('./models/User');
const User_Pendente = require('./models/User_Pendente');
const FormadorAssociacoesPendentes = require('./models/Formador_Associacoes_Pendentes');
const Notificacao = require('./models/Notificacao');
const NotificacaoUtilizador = require('./models/NotificacaoUtilizador');
const AssociarCursos = require('./models/AssociarCurso');
const Topico_Area = require('./models/Topico_Area');
const ForumTema = require('./models/ForumTema');
const ForumTemaInteracao = require('./models/ForumTemaInteracao');
const ForumTemaDenuncia = require('./models/ForumTemaDenuncia');
const ForumComentario = require('./models/ForumComentario');
const Curso_Presenca = require('./models/Curso_Presenca');
const Formando_Presenca = require('./models/Formando_Presenca');

// Objeto exportado com todos os modelos para referência externa
const models = { 
  Area, AssociarCursos, Avaliacao, Cargo, Categoria, ChatMensagem, ChatInteracao, ChatDenuncia, 
  ConteudoCurso, Curso, FormadorCategoria, FormadorArea, Inscricao_Curso, OcorrenciaCurso, 
  PastaCurso, PushSubscription, Quiz, QuizOpcao, QuizPergunta, QuizResposta, QuizRespostaDetalhe, 
  TipoConteudo, Topico_Area, Curso_Topicos, Trabalho_Entregue, User, User_Pendente, 
  FormadorAssociacoesPendentes, Notificacao, NotificacaoUtilizador, ForumTema, ForumTemaInteracao, 
  ForumTemaDenuncia, ForumComentario, Curso_Presenca, Formando_Presenca 
};

// =============================================================================
// HIERARQUIA PRINCIPAL: CATEGORIA → ÁREA → TÓPICO → CURSO
// =============================================================================

/**
 * CATEGORIAS (1º nível da hierarquia)
 * Agrupam grandes áreas de conhecimento (ex: Informática, Gestão, Saúde)
 */
Categoria.hasMany(Area, { 
  foreignKey: "id_categoria", 
  as: "areas",
  onDelete: 'RESTRICT'
});
Categoria.hasMany(Curso, { 
  foreignKey: "id_categoria", 
  as: "cursos" 
});

/**
 * ÁREAS (2º nível da hierarquia)  
 * Especializam as categorias (ex: Programação Web, Design Gráfico, Enfermagem)
 */
Area.belongsTo(Categoria, { 
  foreignKey: "id_categoria", 
  as: "categoriaParent" 
});
Area.hasMany(Curso, { 
  foreignKey: "id_area", 
  as: "cursos" 
});

// ✅ CORRIGIDO: Verificar se Topico_Area existe antes de criar associação
try {
  if (Topico_Area) {
    Area.hasMany(Topico_Area, { 
      foreignKey: "id_area", 
      as: "topicos_categoria",
      onDelete: 'RESTRICT'
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Modelo Topico_Area não disponível para associação com Area');
}

/**
 * TÓPICOS (3º nível da hierarquia)
 * Organizam discussões e cursos por temas específicos dentro de cada área
 */
try {
  if (Topico_Area) {
    Topico_Area.belongsTo(Categoria, { 
      foreignKey: "id_categoria", 
      as: "categoria" 
    });
    Topico_Area.belongsTo(Area, { 
      foreignKey: "id_area", 
      as: "area", 
      required: true
    });
    Topico_Area.belongsTo(User, { 
      foreignKey: "criado_por", 
      as: "criador" 
    });
    Topico_Area.hasMany(Curso, { 
      foreignKey: "id_topico_area", 
      as: "cursos_associados",
      onDelete: 'CASCADE'
    });
    
    // ✅ CORRIGIDO: Verificar se ChatMensagem existe
    try {
      if (ChatMensagem) {
        Topico_Area.hasMany(ChatMensagem, { 
          foreignKey: "id_topico", 
          as: "mensagens",
          onDelete: 'CASCADE'
        });
      }
    } catch (error) {
      console.warn('⚠️ [ASSOCIATIONS] Modelo ChatMensagem não disponível para associação com Topico_Area');
    }
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Modelo Topico_Area não disponível para associações principais');
}

/**
 * CURSOS (4º nível da hierarquia)
 * Conteúdo educacional final associado a tópicos específicos
 */
Curso.belongsTo(User, { 
  foreignKey: "id_formador", 
  as: "formador",
  onDelete: 'SET NULL'
});
Curso.belongsTo(Area, { 
  foreignKey: "id_area", 
  as: "area" 
});
Curso.belongsTo(Categoria, { 
  foreignKey: "id_categoria", 
  as: "categoria" 
});

// ✅ CORRIGIDO: Verificar se Topico_Area existe
try {
  if (Topico_Area) {
    Curso.belongsTo(Topico_Area, { 
      foreignKey: "id_topico_area", 
      as: "Topico_Area" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Associação Curso -> Topico_Area não criada');
}

// =============================================================================
// SISTEMA DE UTILIZADORES E PERMISSÕES
// =============================================================================

/**
 * UTILIZADORES PENDENTES (candidatos à aprovação)
 */
try {
  if (User_Pendente && Cargo) {
    User_Pendente.belongsTo(Cargo, { 
      foreignKey: "id_cargo", 
      as: "cargo", 
      constraints: false
    });
  }
  if (User_Pendente && FormadorAssociacoesPendentes) {
    User_Pendente.hasOne(FormadorAssociacoesPendentes, { 
      foreignKey: "id_pendente", 
      as: "associacoes" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Erro ao criar associações de User_Pendente:', error.message);
}

/**
 * ASSOCIAÇÕES PENDENTES DE FORMADORES
 */
try {
  if (FormadorAssociacoesPendentes && User_Pendente) {
    FormadorAssociacoesPendentes.belongsTo(User_Pendente, { 
      foreignKey: "id_pendente", 
      as: "usuario_pendente", 
      onDelete: 'CASCADE'
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Erro ao criar associações de FormadorAssociacoesPendentes:', error.message);
}

/**
 * UTILIZADORES PRINCIPAIS DO SISTEMA
 */
User.belongsTo(Cargo, { 
  foreignKey: "id_cargo", 
  as: "cargo" 
});

// ✅ CORRIGIDO: Verificar cada modelo antes de criar associação
try {
  if (PushSubscription) {
    User.hasMany(PushSubscription, { 
      foreignKey: "id_utilizador", 
      as: "subscriptions" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Modelo PushSubscription não disponível');
}

User.hasMany(Curso, { 
  foreignKey: "id_formador", 
  as: "cursos_ministrados" 
});
User.hasMany(Inscricao_Curso, { 
  foreignKey: "id_utilizador", 
  as: "inscricoes" 
});

try {
  if (ChatMensagem) {
    User.hasMany(ChatMensagem, { 
      foreignKey: "id_utilizador", 
      as: "mensagens_enviadas" 
    });
  }
  if (ChatInteracao) {
    User.hasMany(ChatInteracao, { 
      foreignKey: "id_utilizador", 
      as: "interacoes" 
    });
  }
  if (ChatDenuncia) {
    User.hasMany(ChatDenuncia, { 
      foreignKey: "id_denunciante", 
      as: "denuncias_feitas" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Alguns modelos de Chat não disponíveis');
}

try {
  if (NotificacaoUtilizador) {
    User.hasMany(NotificacaoUtilizador, { 
      foreignKey: "id_utilizador", 
      as: "notificacoes" 
    });
  }
  if (Trabalho_Entregue) {
    User.hasMany(Trabalho_Entregue, { 
      foreignKey: "id_utilizador", 
      as: "trabalhos" 
    });
  }
  if (Formando_Presenca) {
    User.hasMany(Formando_Presenca, { 
      foreignKey: "id_utilizador", 
      as: "presencas_marcadas" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Alguns modelos auxiliares não disponíveis');
}

/**
 * CARGOS/FUNÇÕES DOS UTILIZADORES
 */
Cargo.hasMany(User, { 
  foreignKey: "id_cargo", 
  as: "utilizadores" 
});

try {
  if (User_Pendente) {
    Cargo.hasMany(User_Pendente, { 
      foreignKey: "id_cargo", 
      as: "utilizadores_pendentes", 
      constraints: false
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] User_Pendente não disponível para Cargo');
}

// =============================================================================
// ESPECIALIDADES DOS FORMADORES (relações muitos-para-muitos)
// =============================================================================

/**
 * FORMADORES COM CATEGORIAS GERAIS
 */
try {
  if (FormadorCategoria) {
    User.belongsToMany(Categoria, { 
      through: FormadorCategoria, 
      foreignKey: "id_formador", 
      otherKey: "id_categoria", 
      as: "categorias_formador" 
    });
    Categoria.belongsToMany(User, { 
      through: FormadorCategoria, 
      foreignKey: "id_categoria", 
      otherKey: "id_formador", 
      as: "formadores" 
    });

    FormadorCategoria.belongsTo(User, { 
      foreignKey: "id_formador", 
      as: "formador" 
    });
    FormadorCategoria.belongsTo(Categoria, { 
      foreignKey: "id_categoria", 
      as: "categoria" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] FormadorCategoria não disponível');
}

/**
 * FORMADORES COM ÁREAS ESPECÍFICAS
 */
try {
  if (FormadorArea) {
    User.belongsToMany(Area, { 
      through: FormadorArea, 
      foreignKey: "id_formador", 
      otherKey: "id_area", 
      as: "areas_formador" 
    });
    Area.belongsToMany(User, { 
      through: FormadorArea, 
      foreignKey: "id_area", 
      otherKey: "id_formador", 
      as: "formadores" 
    });

    FormadorArea.belongsTo(User, { 
      foreignKey: "id_formador", 
      as: "formador" 
    });
    FormadorArea.belongsTo(Area, { 
      foreignKey: "id_area", 
      as: "area" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] FormadorArea não disponível');
}

// =============================================================================
// INSCRIÇÕES E ASSOCIAÇÕES DE CURSOS
// =============================================================================

/**
 * INSCRIÇÕES DE FORMANDOS EM CURSOS
 */
User.belongsToMany(Curso, { 
  through: Inscricao_Curso, 
  foreignKey: "id_utilizador", 
  otherKey: "id_curso", 
  as: "cursos" 
});
Curso.belongsToMany(User, { 
  through: Inscricao_Curso, 
  foreignKey: "id_curso", 
  otherKey: "id_utilizador", 
  as: "utilizadores" 
});

Inscricao_Curso.belongsTo(User, { 
  foreignKey: "id_utilizador", 
  as: "utilizador" 
});
Inscricao_Curso.belongsTo(Curso, { 
  foreignKey: "id_curso", 
  as: "curso" 
});

/**
 * ASSOCIAÇÕES ENTRE CURSOS
 */
try {
  if (AssociarCursos) {
    AssociarCursos.belongsTo(Curso, { 
      foreignKey: "id_curso_origem", 
      as: "cursoOrigem" 
    });
    AssociarCursos.belongsTo(Curso, { 
      foreignKey: "id_curso_destino", 
      as: "cursoDestino" 
    });
    Curso.hasMany(AssociarCursos, { 
      foreignKey: "id_curso_origem", 
      as: "cursosAssociadosOrigem" 
    });
    Curso.hasMany(AssociarCursos, { 
      foreignKey: "id_curso_destino", 
      as: "cursosAssociadosDestino" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] AssociarCursos não disponível');
}

/**
 * OCORRÊNCIAS/EDIÇÕES DE CURSOS
 */
try {
  if (OcorrenciaCurso) {
    Curso.hasMany(OcorrenciaCurso, { 
      foreignKey: "id_curso_original", 
      as: "ocorrencias" 
    });
    OcorrenciaCurso.belongsTo(Curso, { 
      foreignKey: "id_curso_original", 
      as: "curso_original" 
    });
    OcorrenciaCurso.belongsTo(Curso, { 
      foreignKey: "id_curso_nova_ocorrencia", 
      as: "curso_nova_ocorrencia" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] OcorrenciaCurso não disponível');
}

// =============================================================================
// SISTEMA DE AVALIAÇÕES E CERTIFICAÇÕES
// =============================================================================

/**
 * AVALIAÇÕES FINAIS DOS CURSOS
 */
try {
  if (Avaliacao) {
    Inscricao_Curso.hasOne(Avaliacao, { 
      foreignKey: "id_inscricao", 
      as: "avaliacao" 
    });
    Avaliacao.belongsTo(Inscricao_Curso, { 
      foreignKey: "id_inscricao", 
      as: "inscricao" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Avaliacao não disponível');
}

/**
 * RESPOSTAS A QUIZZES/QUESTIONÁRIOS
 */
try {
  if (QuizResposta) {
    Inscricao_Curso.hasMany(QuizResposta, { 
      foreignKey: "id_inscricao", 
      as: "quiz_respostas" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] QuizResposta não disponível');
}

// =============================================================================
// SISTEMA DE QUIZZES/QUESTIONÁRIOS
// =============================================================================

try {
  if (Quiz) {
    Curso.hasMany(Quiz, { 
      foreignKey: "id_curso", 
      as: "quizzes" 
    });
    Quiz.belongsTo(Curso, { 
      foreignKey: "id_curso", 
      as: "curso" 
    });
  }
  
  if (Quiz && QuizPergunta) {
    Quiz.hasMany(QuizPergunta, { 
      foreignKey: "id_quiz", 
      as: "perguntas" 
    });
    QuizPergunta.belongsTo(Quiz, { 
      foreignKey: "id_quiz", 
      as: "quiz" 
    });
  }
  
  if (Quiz && QuizResposta) {
    Quiz.hasMany(QuizResposta, { 
      foreignKey: "id_quiz", 
      as: "respostas" 
    });
    QuizResposta.belongsTo(Quiz, { 
      foreignKey: "id_quiz", 
      as: "quiz" 
    });
  }
  
  if (QuizPergunta && QuizOpcao) {
    QuizPergunta.hasMany(QuizOpcao, { 
      foreignKey: "id_pergunta", 
      as: "opcoes" 
    });
    QuizOpcao.belongsTo(QuizPergunta, { 
      foreignKey: "id_pergunta", 
      as: "pergunta" 
    });
  }
  
  if (QuizResposta && QuizRespostaDetalhe) {
    QuizResposta.hasMany(QuizRespostaDetalhe, { 
      foreignKey: "id_resposta", 
      as: "detalhes" 
    });
    QuizRespostaDetalhe.belongsTo(QuizResposta, { 
      foreignKey: "id_resposta", 
      as: "resposta" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Alguns modelos de Quiz não disponíveis:', error.message);
}

// =============================================================================
// SISTEMA DE PRESENÇAS
// =============================================================================

try {
  if (Curso_Presenca) {
    Curso.hasMany(Curso_Presenca, { 
      foreignKey: "id_curso", 
      as: "presencas" 
    });
    Curso_Presenca.belongsTo(Curso, { 
      foreignKey: "id_curso", 
      as: "curso" 
    });
  }
  
  if (Curso_Presenca && Formando_Presenca) {
    Curso_Presenca.hasMany(Formando_Presenca, { 
      foreignKey: "id_curso_presenca", 
      as: "registros_presenca" 
    });
    Formando_Presenca.belongsTo(Curso_Presenca, { 
      foreignKey: "id_curso_presenca", 
      as: "presenca_curso" 
    });
  }
  
  if (Formando_Presenca) {
    Formando_Presenca.belongsTo(User, { 
      foreignKey: "id_utilizador", 
      as: "utilizador" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Modelos de Presença não disponíveis:', error.message);
}

// =============================================================================
// HIERARQUIA DE CONTEÚDOS: CURSO → TÓPICOS → PASTAS → CONTEÚDOS
// =============================================================================

try {
  if (Curso_Topicos) {
    Curso.hasMany(Curso_Topicos, { 
      foreignKey: "id_curso", 
      as: "topicos" 
    });
    Curso_Topicos.belongsTo(Curso, { 
      foreignKey: "id_curso", 
      as: "curso" 
    });
  }
  
  if (Curso_Topicos && PastaCurso) {
    Curso_Topicos.hasMany(PastaCurso, { 
      foreignKey: "id_topico", 
      as: "pastas" 
    });
    PastaCurso.belongsTo(Curso_Topicos, { 
      foreignKey: "id_topico", 
      as: "topico" 
    });
  }
  
  if (PastaCurso && ConteudoCurso) {
    PastaCurso.hasMany(ConteudoCurso, { 
      foreignKey: "id_pasta", 
      as: "conteudos" 
    });
    ConteudoCurso.belongsTo(PastaCurso, { 
      foreignKey: "id_pasta", 
      as: "pasta" 
    });
  }
  
  if (ConteudoCurso) {
    ConteudoCurso.belongsTo(Curso, { 
      foreignKey: "id_curso", 
      as: "curso" 
    });
    Curso.hasMany(ConteudoCurso, { 
      foreignKey: "id_curso", 
      as: "conteudos" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Modelos de Conteúdo não disponíveis:', error.message);
}

// =============================================================================
// SISTEMA DE TRABALHOS ENTREGUES
// =============================================================================

try {
  if (Trabalho_Entregue) {
    Curso.hasMany(Trabalho_Entregue, { 
      foreignKey: "id_curso", 
      as: "trabalhos_entregues" 
    });
    Trabalho_Entregue.belongsTo(User, { 
      foreignKey: "id_utilizador", 
      as: "utilizador" 
    });
    Trabalho_Entregue.belongsTo(Curso, { 
      foreignKey: "id_curso", 
      as: "curso" 
    });
    
    if (PastaCurso) {
      Trabalho_Entregue.belongsTo(PastaCurso, { 
        foreignKey: "id_pasta", 
        as: "pasta" 
      });
      PastaCurso.hasMany(Trabalho_Entregue, { 
        foreignKey: "id_pasta", 
        as: "trabalhos" 
      });
    }
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Trabalho_Entregue não disponível');
}

// =============================================================================
// SISTEMA DE CHAT E DISCUSSÃO
// =============================================================================

try {
  if (ChatMensagem && Topico_Area) {
    ChatMensagem.belongsTo(Topico_Area, { 
      foreignKey: "id_topico", 
      as: "topico" 
    });
  }
  
  if (ChatMensagem) {
    ChatMensagem.belongsTo(User, { 
      foreignKey: "id_utilizador", 
      as: "utilizador" 
    });
  }
  
  if (ChatMensagem && ChatInteracao) {
    ChatMensagem.hasMany(ChatInteracao, { 
      foreignKey: "id_mensagem", 
      as: "interacoes" 
    });
    ChatInteracao.belongsTo(ChatMensagem, { 
      foreignKey: "id_mensagem", 
      as: "mensagem" 
    });
    ChatInteracao.belongsTo(User, { 
      foreignKey: "id_utilizador", 
      as: "utilizador" 
    });
  }
  
  if (ChatMensagem && ChatDenuncia) {
    ChatMensagem.hasMany(ChatDenuncia, { 
      foreignKey: "id_mensagem", 
      as: "denuncias_recebidas" 
    });
    ChatDenuncia.belongsTo(ChatMensagem, { 
      foreignKey: "id_mensagem", 
      as: "mensagem" 
    });
    ChatDenuncia.belongsTo(User, { 
      foreignKey: "id_denunciante", 
      as: "denunciante" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Modelos de Chat não disponíveis:', error.message);
}

// =============================================================================
// SISTEMA DE FÓRUM
// =============================================================================

try {
  if (ForumTema && Topico_Area) {
    ForumTema.belongsTo(Topico_Area, { 
      foreignKey: 'id_topico', 
      as: 'topico' 
    });
  }
  
  if (ForumTema) {
    ForumTema.belongsTo(User, { 
      foreignKey: 'id_utilizador', 
      as: 'utilizador' 
    });
  }
  
  if (ForumTema && ForumTemaInteracao) {
    ForumTema.hasMany(ForumTemaInteracao, { 
      foreignKey: 'id_tema', 
      as: 'interacoes' 
    });
    ForumTemaInteracao.belongsTo(ForumTema, { 
      foreignKey: 'id_tema', 
      as: 'tema' 
    });
    ForumTemaInteracao.belongsTo(User, { 
      foreignKey: 'id_utilizador', 
      as: 'utilizador' 
    });
  }
  
  if (ForumTema && ForumTemaDenuncia) {
    ForumTema.hasMany(ForumTemaDenuncia, { 
      foreignKey: 'id_tema', 
      as: 'denuncias' 
    });
    ForumTemaDenuncia.belongsTo(ForumTema, { 
      foreignKey: 'id_tema', 
      as: 'tema' 
    });
    ForumTemaDenuncia.belongsTo(User, { 
      foreignKey: 'id_denunciante', 
      as: 'denunciante' 
    });
  }
  
  if (ForumTema && ForumComentario) {
    ForumTema.hasMany(ForumComentario, { 
      foreignKey: 'id_tema', 
      as: 'tema_comentarios' 
    });
    ForumComentario.belongsTo(ForumTema, { 
      foreignKey: 'id_tema', 
      as: 'tema' 
    });
    ForumComentario.belongsTo(User, { 
      foreignKey: 'id_utilizador', 
      as: 'utilizador' 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Modelos de Fórum não disponíveis:', error.message);
}

// =============================================================================
// SISTEMA DE NOTIFICAÇÕES
// =============================================================================

try {
  if (Notificacao && NotificacaoUtilizador) {
    Notificacao.hasMany(NotificacaoUtilizador, { 
      foreignKey: "id_notificacao", 
      as: "destinatarios" 
    });
    NotificacaoUtilizador.belongsTo(Notificacao, { 
      foreignKey: "id_notificacao", 
      as: "notificacao" 
    });
    NotificacaoUtilizador.belongsTo(User, { 
      foreignKey: "id_utilizador", 
      as: "utilizador" 
    });
  }
} catch (error) {
  console.warn('⚠️ [ASSOCIATIONS] Modelos de Notificação não disponíveis:', error.message);
}

// =============================================================================
// APLICAÇÃO DE ASSOCIAÇÕES AUTOMÁTICAS DOS MODELOS
// =============================================================================

/**
 * Executa métodos associate() personalizados dos modelos se existirem
 */
Object.values(models).forEach(model => { 
  try {
    if (model && typeof model.associate === 'function') { 
      model.associate(models); 
    }
  } catch (error) {
    console.warn(`⚠️ [ASSOCIATIONS] Erro ao executar associate() para modelo:`, error.message);
  }
});

console.log('✅ [ASSOCIATIONS] Associações dos modelos carregadas com tratamento de erros');

module.exports = models;