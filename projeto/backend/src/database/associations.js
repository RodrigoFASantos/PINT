// =============================================================================
// ASSOCIAÇÕES DOS MODELOS SEQUELIZE
// =============================================================================
// Define todas as relações entre as tabelas da base de dados
// Organizado por domínios funcionais para facilitar manutenção

// =============================================================================
// IMPORTAÇÃO DE TODOS OS MODELOS
// =============================================================================
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

// Objeto com todos os modelos para referência
const models = { 
  Area, AssociarCursos, Avaliacao, Cargo, Categoria, ChatMensagem, ChatInteracao, ChatDenuncia, 
  ConteudoCurso, Curso, FormadorCategoria, FormadorArea, Inscricao_Curso, OcorrenciaCurso, 
  PastaCurso, PushSubscription, Quiz, QuizOpcao, QuizPergunta, QuizResposta, QuizRespostaDetalhe, 
  TipoConteudo, Topico_Area, Curso_Topicos, Trabalho_Entregue, User, User_Pendente, 
  FormadorAssociacoesPendentes, Notificacao, NotificacaoUtilizador, ForumTema, ForumTemaInteracao, 
  ForumTemaDenuncia, ForumComentario, Curso_Presenca, Formando_Presenca 
};

// =============================================================================
// ASSOCIAÇÕES: SISTEMA DE UTILIZADORES
// =============================================================================

// Utilizadores Pendentes (candidatos à aprovação)
User_Pendente.belongsTo(Cargo, { 
  foreignKey: "id_cargo", 
  as: "cargo", 
  constraints: false 
});
User_Pendente.hasOne(FormadorAssociacoesPendentes, { 
  foreignKey: "id_pendente", 
  as: "associacoes" 
});

// Associações Pendentes de Formadores
FormadorAssociacoesPendentes.belongsTo(User_Pendente, { 
  foreignKey: "id_pendente", 
  as: "usuario_pendente", 
  onDelete: 'CASCADE' 
});

// Utilizadores Principais
User.belongsTo(Cargo, { foreignKey: "id_cargo", as: "cargo" });
User.hasMany(PushSubscription, { foreignKey: "id_utilizador", as: "subscriptions" });
User.hasMany(Curso, { foreignKey: "id_formador", as: "cursos_ministrados" });
User.belongsToMany(Curso, { 
  through: Inscricao_Curso, 
  foreignKey: "id_utilizador", 
  otherKey: "id_curso", 
  as: "cursos" 
});
User.hasMany(Inscricao_Curso, { foreignKey: "id_utilizador", as: "inscricoes" });
User.hasMany(ChatMensagem, { foreignKey: "id_utilizador", as: "mensagens_enviadas" });
User.hasMany(ChatInteracao, { foreignKey: "id_utilizador", as: "interacoes" });
User.hasMany(ChatDenuncia, { foreignKey: "id_denunciante", as: "denuncias_feitas" });
User.hasMany(NotificacaoUtilizador, { foreignKey: "id_utilizador", as: "notificacoes" });
User.hasMany(Trabalho_Entregue, { foreignKey: "id_utilizador", as: "trabalhos" });
User.hasMany(Formando_Presenca, { foreignKey: "id_utilizador", as: "presencas_marcadas" });

// Cargos
Cargo.hasMany(User, { foreignKey: "id_cargo", as: "utilizadores" });
Cargo.hasMany(User_Pendente, { 
  foreignKey: "id_cargo", 
  as: "utilizadores_pendentes", 
  constraints: false 
});

// =============================================================================
// ASSOCIAÇÕES: ESPECIALIDADES DOS FORMADORES
// =============================================================================

// Formadores com Categorias (muitos-para-muitos)
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

// Formadores com Áreas (muitos-para-muitos)
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

// Tabelas intermédias de especialidades
FormadorCategoria.belongsTo(User, { foreignKey: "id_formador", as: "formador" });
FormadorCategoria.belongsTo(Categoria, { foreignKey: "id_categoria", as: "categoria" });
FormadorArea.belongsTo(User, { foreignKey: "id_formador", as: "formador" });
FormadorArea.belongsTo(Area, { foreignKey: "id_area", as: "area" });

// =============================================================================
// ASSOCIAÇÕES: HIERARQUIA DE CATEGORIAS E ÁREAS
// =============================================================================

// Categorias principais
Categoria.hasMany(Area, { foreignKey: "id_categoria", as: "areas" });
Categoria.hasMany(Curso, { foreignKey: "id_categoria", as: "cursos" });

// Áreas específicas
Area.belongsTo(Categoria, { foreignKey: "id_categoria", as: "categoriaParent" });
Area.hasMany(Curso, { foreignKey: "id_area", as: "cursos" });
Area.hasMany(Topico_Area, { foreignKey: "id_area", as: "topicos_categoria" });

// =============================================================================
// ASSOCIAÇÕES: SISTEMA DE CURSOS
// =============================================================================

// Curso Principal
Curso.belongsTo(User, { foreignKey: "id_formador", as: "formador" });
Curso.belongsTo(Area, { foreignKey: "id_area", as: "area" });
Curso.belongsTo(Categoria, { foreignKey: "id_categoria", as: "categoria" });
Curso.belongsTo(Topico_Area, { foreignKey: "id_topico_area", as: "Topico_Area" });
Curso.belongsToMany(User, { 
  through: Inscricao_Curso, 
  foreignKey: "id_curso", 
  otherKey: "id_utilizador", 
  as: "utilizadores" 
});

// Hierarquia de Conteúdos: Curso > Tópicos > Pastas > Conteúdos
Curso.hasMany(Curso_Topicos, { foreignKey: "id_curso", as: "topicos" });
Curso_Topicos.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
Curso_Topicos.hasMany(PastaCurso, { foreignKey: "id_topico", as: "pastas" });
PastaCurso.belongsTo(Curso_Topicos, { foreignKey: "id_topico", as: "topico" });
PastaCurso.hasMany(ConteudoCurso, { foreignKey: "id_pasta", as: "conteudos" });
ConteudoCurso.belongsTo(PastaCurso, { foreignKey: "id_pasta", as: "pasta" });
ConteudoCurso.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
Curso.hasMany(ConteudoCurso, { foreignKey: "id_curso", as: "conteudos" });

// Associações entre Cursos (pré-requisitos, relacionados)
AssociarCursos.belongsTo(Curso, { foreignKey: "id_curso_origem", as: "cursoOrigem" });
AssociarCursos.belongsTo(Curso, { foreignKey: "id_curso_destino", as: "cursoDestino" });
Curso.hasMany(AssociarCursos, { foreignKey: "id_curso_origem", as: "cursosAssociadosOrigem" });
Curso.hasMany(AssociarCursos, { foreignKey: "id_curso_destino", as: "cursosAssociadosDestino" });

// Ocorrências/Edições de Cursos
Curso.hasMany(OcorrenciaCurso, { foreignKey: "id_curso_original", as: "ocorrencias" });
OcorrenciaCurso.belongsTo(Curso, { foreignKey: "id_curso_original", as: "curso_original" });
OcorrenciaCurso.belongsTo(Curso, { foreignKey: "id_curso_nova_ocorrencia", as: "curso_nova_ocorrencia" });

// =============================================================================
// ASSOCIAÇÕES: INSCRIÇÕES E AVALIAÇÕES
// =============================================================================

// Inscrições em Cursos
Inscricao_Curso.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });
Inscricao_Curso.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });

// Sistema de Avaliações (uma inscrição = uma avaliação)
Inscricao_Curso.hasOne(Avaliacao, { foreignKey: "id_inscricao", as: "avaliacao" });
Avaliacao.belongsTo(Inscricao_Curso, { foreignKey: "id_inscricao", as: "inscricao" });

// Respostas a Quizzes
Inscricao_Curso.hasMany(QuizResposta, { foreignKey: "id_inscricao", as: "quiz_respostas" });

// =============================================================================
// ASSOCIAÇÕES: SISTEMA DE QUIZZES
// =============================================================================

// Estrutura: Curso > Quiz > Perguntas > Opções
Curso.hasMany(Quiz, { foreignKey: "id_curso", as: "quizzes" });
Quiz.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
Quiz.hasMany(QuizPergunta, { foreignKey: "id_quiz", as: "perguntas" });
Quiz.hasMany(QuizResposta, { foreignKey: "id_quiz", as: "respostas" });

QuizPergunta.belongsTo(Quiz, { foreignKey: "id_quiz", as: "quiz" });
QuizPergunta.hasMany(QuizOpcao, { foreignKey: "id_pergunta", as: "opcoes" });
QuizOpcao.belongsTo(QuizPergunta, { foreignKey: "id_pergunta", as: "pergunta" });

// Respostas dos Formandos
QuizResposta.belongsTo(Quiz, { foreignKey: "id_quiz", as: "quiz" });
QuizResposta.belongsTo(Inscricao_Curso, { foreignKey: "id_inscricao", as: "inscricao" });
QuizResposta.hasMany(QuizRespostaDetalhe, { foreignKey: "id_resposta", as: "detalhes" });

QuizRespostaDetalhe.belongsTo(QuizResposta, { foreignKey: "id_resposta", as: "resposta" });
QuizRespostaDetalhe.belongsTo(QuizPergunta, { foreignKey: "id_pergunta", as: "pergunta" });
QuizRespostaDetalhe.belongsTo(QuizOpcao, { foreignKey: "id_opcao", as: "opcao" });

// =============================================================================
// ASSOCIAÇÕES: SISTEMA DE PRESENÇAS
// =============================================================================

// Sessões de Presença por Curso
Curso.hasMany(Curso_Presenca, { foreignKey: "id_curso", as: "presencas" });
Curso_Presenca.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });

// Presenças Individuais dos Formandos
Curso_Presenca.hasMany(Formando_Presenca, { foreignKey: "id_curso_presenca", as: "registros_presenca" });
Formando_Presenca.belongsTo(Curso_Presenca, { foreignKey: "id_curso_presenca", as: "presenca_curso" });
Formando_Presenca.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });

// =============================================================================
// ASSOCIAÇÕES: SISTEMA DE TRABALHOS
// =============================================================================

// Trabalhos Entregues pelos Formandos
Curso.hasMany(Trabalho_Entregue, { foreignKey: "id_curso", as: "trabalhos_entregues" });
Trabalho_Entregue.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });
Trabalho_Entregue.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
Trabalho_Entregue.belongsTo(PastaCurso, { foreignKey: "id_pasta", as: "pasta" });
PastaCurso.hasMany(Trabalho_Entregue, { foreignKey: "id_pasta", as: "trabalhos" });

// =============================================================================
// ASSOCIAÇÕES: SISTEMA DE CHAT
// =============================================================================

// Tópicos de Discussão
Topico_Area.belongsTo(Categoria, { foreignKey: "id_categoria", as: "categoria" });
Topico_Area.belongsTo(Area, { foreignKey: "id_area", as: "area", required: true });
Topico_Area.belongsTo(User, { foreignKey: "criado_por", as: "criador" });
Topico_Area.hasMany(Curso, { foreignKey: "id_topico_area", as: "cursos_associados" });
Topico_Area.hasMany(ChatMensagem, { foreignKey: "id_topico", as: "mensagens" });

// Mensagens de Chat
ChatMensagem.belongsTo(Topico_Area, { foreignKey: "id_topico", as: "topico" });
ChatMensagem.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });
ChatMensagem.hasMany(ChatInteracao, { foreignKey: "id_mensagem", as: "interacoes" });
ChatMensagem.hasMany(ChatDenuncia, { foreignKey: "id_mensagem", as: "denuncias_recebidas" });

// Interações com Mensagens (likes/dislikes)
ChatInteracao.belongsTo(ChatMensagem, { foreignKey: "id_mensagem", as: "mensagem" });
ChatInteracao.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });

// Denúncias de Mensagens
ChatDenuncia.belongsTo(ChatMensagem, { foreignKey: "id_mensagem", as: "mensagem" });
ChatDenuncia.belongsTo(User, { foreignKey: "id_denunciante", as: "denunciante" });

// =============================================================================
// ASSOCIAÇÕES: SISTEMA DE FÓRUM
// =============================================================================

// Temas do Fórum
ForumTema.belongsTo(Topico_Area, { foreignKey: 'id_topico', as: 'topico' });
ForumTema.belongsTo(User, { foreignKey: 'id_utilizador', as: 'utilizador' });
ForumTema.hasMany(ForumTemaInteracao, { foreignKey: 'id_tema', as: 'interacoes' });
ForumTema.hasMany(ForumTemaDenuncia, { foreignKey: 'id_tema', as: 'denuncias' });
ForumTema.hasMany(ForumComentario, { foreignKey: 'id_tema', as: 'tema_comentarios' });

// Interações com Temas
ForumTemaInteracao.belongsTo(ForumTema, { foreignKey: 'id_tema', as: 'tema' });
ForumTemaInteracao.belongsTo(User, { foreignKey: 'id_utilizador', as: 'utilizador' });

// Denúncias de Temas
ForumTemaDenuncia.belongsTo(ForumTema, { foreignKey: 'id_tema', as: 'tema' });
ForumTemaDenuncia.belongsTo(User, { foreignKey: 'id_denunciante', as: 'denunciante' });

// Comentários nos Temas
ForumComentario.belongsTo(ForumTema, { foreignKey: 'id_tema', as: 'tema' });
ForumComentario.belongsTo(User, { foreignKey: 'id_utilizador', as: 'utilizador' });

// =============================================================================
// ASSOCIAÇÕES: SISTEMA DE NOTIFICAÇÕES
// =============================================================================

// Notificações Globais e por Utilizador
Notificacao.hasMany(NotificacaoUtilizador, { foreignKey: "id_notificacao", as: "destinatarios" });
NotificacaoUtilizador.belongsTo(Notificacao, { foreignKey: "id_notificacao", as: "notificacao" });
NotificacaoUtilizador.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });

// =============================================================================
// APLICAR ASSOCIAÇÕES AUTOMÁTICAS DOS MODELOS
// =============================================================================

// Executa métodos associate() personalizados dos modelos (se existirem)
Object.values(models).forEach(model => { 
  if (typeof model.associate === 'function') { 
    model.associate(models); 
  } 
});

console.log("✅ Associações dos modelos carregadas com sucesso");

module.exports = models;