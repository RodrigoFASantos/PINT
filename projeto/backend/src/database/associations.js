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

const models = { Area, AssociarCursos, Avaliacao, Cargo, Categoria, ChatMensagem, ChatInteracao, ChatDenuncia, ConteudoCurso, Curso, FormadorCategoria, FormadorArea, Inscricao_Curso, OcorrenciaCurso, PastaCurso, PushSubscription, Quiz, QuizOpcao, QuizPergunta, QuizResposta, QuizRespostaDetalhe, TipoConteudo, Topico_Area, Curso_Topicos, Trabalho_Entregue, User, User_Pendente, FormadorAssociacoesPendentes, Notificacao, NotificacaoUtilizador, ForumTema, ForumTemaInteracao, ForumTemaDenuncia, ForumComentario, Curso_Presenca, Formando_Presenca };

// ========== ASSOCIAÇÕES ==========
// === Associações User_Pendente ===
User_Pendente.belongsTo(Cargo, { foreignKey: "id_cargo", as: "cargo", constraints: false });
User_Pendente.hasOne(FormadorAssociacoesPendentes, { foreignKey: "id_pendente", as: "associacoes" });

// === Associações FormadorAssociacoesPendentes ===
FormadorAssociacoesPendentes.belongsTo(User_Pendente, { foreignKey: "id_pendente", as: "usuario_pendente", onDelete: 'CASCADE' });

// === Associações User ===
User.belongsTo(Cargo, { foreignKey: "id_cargo", as: "cargo" });
User.hasMany(PushSubscription, { foreignKey: "id_utilizador", as: "subscriptions" });
User.hasMany(Curso, { foreignKey: "id_formador", as: "cursos_ministrados" });
User.belongsToMany(Curso, { through: Inscricao_Curso, foreignKey: "id_utilizador", otherKey: "id_curso", as: "cursos" });

// === Associações AssociarCursos ===
AssociarCursos.belongsTo(Curso, { foreignKey: "id_curso_origem", as: "cursoOrigem" });
AssociarCursos.belongsTo(Curso, { foreignKey: "id_curso_destino", as: "cursoDestino" });

// === Adicionar associações bidirecionais em Curso === 
Curso.hasMany(AssociarCursos, { foreignKey: "id_curso_origem", as: "cursosAssociadosOrigem" });
Curso.hasMany(AssociarCursos, { foreignKey: "id_curso_destino", as: "cursosAssociadosDestino" });

// === Formadores com categorias e áreas === 
User.belongsToMany(Categoria, { through: FormadorCategoria, foreignKey: "id_formador", otherKey: "id_categoria", as: "categorias_formador" });
User.belongsToMany(Area, { through: FormadorArea, foreignKey: "id_formador", otherKey: "id_area", as: "areas_formador" });
User.hasMany(ChatMensagem, { foreignKey: "id_utilizador", as: "mensagens_enviadas" });

// === User com interações e denúncias === 
User.hasMany(ChatInteracao, { foreignKey: "id_utilizador", as: "interacoes" });
User.hasMany(ChatDenuncia, { foreignKey: "id_denunciante", as: "denuncias_feitas" });

// === Associações Cargo ===
Cargo.hasMany(User, { foreignKey: "id_cargo", as: "utilizadores" });

// === Associações Categoria ===
Categoria.hasMany(Area, { foreignKey: "id_categoria", as: "areas" });
Cargo.hasMany(User_Pendente, { foreignKey: "id_cargo", as: "utilizadores_pendentes", constraints: false });
Categoria.hasMany(Curso, { foreignKey: "id_categoria", as: "cursos" });

// === Categoria com Formadores === 
Categoria.belongsToMany(User, { through: FormadorCategoria, foreignKey: "id_categoria", otherKey: "id_formador", as: "formadores" });

// === Associações Area ===
Area.belongsTo(Categoria, { foreignKey: "id_categoria", as: "categoriaParent" });
Area.hasMany(Curso, { foreignKey: "id_area", as: "cursos" });

// === Area com Formadores === 
Area.belongsToMany(User, { through: FormadorArea, foreignKey: "id_area", otherKey: "id_formador", as: "formadores" });

// === Associações Curso ===
Curso.belongsTo(User, { foreignKey: "id_formador", as: "formador" });
Curso.belongsTo(Area, { foreignKey: "id_area", as: "area" });
Curso.belongsTo(Categoria, { foreignKey: "id_categoria", as: "categoria" });
Curso.belongsTo(Topico_Area, { foreignKey: "id_topico_area", as: "Topico_Area" });
Topico_Area.hasMany(Curso, { foreignKey: "id_topico_area", as: "cursos_associados" });
Curso.belongsToMany(User, { through: Inscricao_Curso, foreignKey: "id_curso", otherKey: "id_utilizador", as: "utilizadores" });
Curso.hasMany(Quiz, { foreignKey: "id_curso", as: "quizzes" });
Curso.hasMany(OcorrenciaCurso, { foreignKey: "id_curso_original", as: "ocorrencias" });
Curso.hasMany(Curso_Topicos, { foreignKey: "id_curso", as: "topicos" });
Curso.hasMany(ConteudoCurso, { foreignKey: "id_curso", as: "conteudos" });

// === Associações FormadorCategoria ===
FormadorCategoria.belongsTo(User, { foreignKey: "id_formador", as: "formador" });
FormadorCategoria.belongsTo(Categoria, { foreignKey: "id_categoria", as: "categoria" });

// === Associações FormadorArea ===
FormadorArea.belongsTo(User, { foreignKey: "id_formador", as: "formador" });
FormadorArea.belongsTo(Area, { foreignKey: "id_area", as: "area" });

// === Associações Inscricao_Curso ===
Inscricao_Curso.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });
Inscricao_Curso.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });

// === CORREÇÃO IMPORTANTE: Associação Inscricao_Curso -> Avaliacao ===
// Uma inscrição TEM UMA avaliação (hasOne)
Inscricao_Curso.hasOne(Avaliacao, { 
  foreignKey: "id_inscricao", 
  as: "avaliacao" 
});

// === CORREÇÃO: Associação reversa QuizResposta com Inscricao_Curso ===
Inscricao_Curso.hasMany(QuizResposta, { foreignKey: "id_inscricao", as: "quiz_respostas" });

// === Associações Quiz e relacionados ===
Quiz.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
Quiz.hasMany(QuizPergunta, { foreignKey: "id_quiz", as: "perguntas" });
Quiz.hasMany(QuizResposta, { foreignKey: "id_quiz", as: "respostas" });
QuizPergunta.belongsTo(Quiz, { foreignKey: "id_quiz", as: "quiz" });
QuizPergunta.hasMany(QuizOpcao, { foreignKey: "id_pergunta", as: "opcoes" });
QuizOpcao.belongsTo(QuizPergunta, { foreignKey: "id_pergunta", as: "pergunta" });
QuizResposta.belongsTo(Quiz, { foreignKey: "id_quiz", as: "quiz" });
QuizResposta.belongsTo(Inscricao_Curso, { foreignKey: "id_inscricao", as: "inscricao" });
QuizResposta.hasMany(QuizRespostaDetalhe, { foreignKey: "id_resposta", as: "detalhes" });
QuizRespostaDetalhe.belongsTo(QuizResposta, { foreignKey: "id_resposta", as: "resposta" });
QuizRespostaDetalhe.belongsTo(QuizPergunta, { foreignKey: "id_pergunta", as: "pergunta" });
QuizRespostaDetalhe.belongsTo(QuizOpcao, { foreignKey: "id_opcao", as: "opcao" });

// === Associações OcorrenciaCurso ===
OcorrenciaCurso.belongsTo(Curso, { foreignKey: "id_curso_original", as: "curso_original" });

OcorrenciaCurso.belongsTo(Curso, { foreignKey: "id_curso_nova_ocorrencia", as: "curso_nova_ocorrencia" });

// === Associações Topico_Area ===
Topico_Area.belongsTo(Categoria, { foreignKey: "id_categoria", as: "categoria" });
Topico_Area.belongsTo(User, { foreignKey: "criado_por", as: "criador" });
Topico_Area.belongsTo(Area, { foreignKey: "id_area", as: "area", required: true });

// Associação recíproca opcional === 
Area.hasMany(Topico_Area, { foreignKey: "id_area", as: "topicos_categoria" });

// === Associações Curso_Topicos ===
Curso_Topicos.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
Curso_Topicos.hasMany(PastaCurso, { foreignKey: "id_topico", as: "pastas" });

// === Associações PastaCurso ===
PastaCurso.belongsTo(Curso_Topicos, { foreignKey: "id_topico", as: "topico" });
PastaCurso.hasMany(ConteudoCurso, { foreignKey: "id_pasta", as: "conteudos" });

// === Associações ConteudoCurso ===
ConteudoCurso.belongsTo(PastaCurso, { foreignKey: "id_pasta", as: "pasta" });
ConteudoCurso.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });

// === Associações ChatMensagem ===
ChatMensagem.belongsTo(Topico_Area, { foreignKey: "id_topico", as: "topico" });
Topico_Area.hasMany(ChatMensagem, { foreignKey: "id_topico", as: "mensagens" });
ChatMensagem.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });

// === ChatMensagem com ChatInteracao e ChatDenuncia === 
ChatMensagem.hasMany(ChatInteracao, { foreignKey: "id_mensagem", as: "interacoes" });
ChatMensagem.hasMany(ChatDenuncia, { foreignKey: "id_mensagem", as: "denuncias_recebidas" });

// === Associações ChatInteracao ===
ChatInteracao.belongsTo(ChatMensagem, { foreignKey: "id_mensagem", as: "mensagem" });
ChatInteracao.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });

// === Associações ChatDenuncia ===
ChatDenuncia.belongsTo(ChatMensagem, { foreignKey: "id_mensagem", as: "mensagem" });
ChatDenuncia.belongsTo(User, { foreignKey: "id_denunciante", as: "denunciante" });

// === Associações Trabalho_Entregue ===
Trabalho_Entregue.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });
Trabalho_Entregue.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
User.hasMany(Trabalho_Entregue, { foreignKey: "id_utilizador", as: "trabalhos" });
Curso.hasMany(Trabalho_Entregue, { foreignKey: "id_curso", as: "trabalhos_entregues" });

// === Associações Avaliacao ===
// Uma avaliação PERTENCE A uma inscrição (belongsTo)
Avaliacao.belongsTo(Inscricao_Curso, { foreignKey: "id_inscricao", as: "inscricao" });

// === Chamar funções associate para os modelos que as têm === 
Object.values(models).forEach(model => { 
  if (typeof model.associate === 'function') { 
    model.associate(models); 
    console.log(`✅ Aplicadas associações para o modelo: ${model.name || 'Desconhecido'}`); 
  } 
});

// === Associações Notificação ===
Notificacao.hasMany(NotificacaoUtilizador, { foreignKey: "id_notificacao", as: "destinatarios" });
NotificacaoUtilizador.belongsTo(Notificacao, { foreignKey: "id_notificacao", as: "notificacao" });
User.hasMany(NotificacaoUtilizador, { foreignKey: "id_utilizador", as: "notificacoes" });
NotificacaoUtilizador.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });

// === Criar associações para ForumTema === 
ForumTema.belongsTo(Topico_Area, { foreignKey: 'id_topico', as: 'topico' });
ForumTema.belongsTo(User, { foreignKey: 'id_utilizador', as: 'utilizador' });
ForumTema.hasMany(ForumTemaInteracao, { foreignKey: 'id_tema', as: 'interacoes' });
ForumTema.hasMany(ForumTemaDenuncia, { foreignKey: 'id_tema', as: 'denuncias' });
ForumTema.hasMany(ForumComentario, { foreignKey: 'id_tema', as: 'tema_comentarios' });

// === Criar associações para ForumTemaInteracao === 
ForumTemaInteracao.belongsTo(ForumTema, { foreignKey: 'id_tema', as: 'tema' });
ForumTemaInteracao.belongsTo(User, { foreignKey: 'id_utilizador', as: 'utilizador' });

// === Criar associações para ForumTemaDenuncia === 
ForumTemaDenuncia.belongsTo(ForumTema, { foreignKey: 'id_tema', as: 'tema' });
ForumTemaDenuncia.belongsTo(User, { foreignKey: 'id_denunciante', as: 'denunciante' });

// === Criar associações para ForumComentario === 
ForumComentario.belongsTo(ForumTema, { foreignKey: 'id_tema', as: 'tema' });
ForumComentario.belongsTo(User, { foreignKey: 'id_utilizador', as: 'utilizador' });

// === Associação entre Trabalho e Pasta === 
Trabalho_Entregue.belongsTo(PastaCurso, { foreignKey: "id_pasta", as: "pasta" });

// === Associação recíproca === 
PastaCurso.hasMany(Trabalho_Entregue, { foreignKey: "id_pasta", as: "trabalhos" });

// === Associações Curso_Presenca === 
Curso_Presenca.belongsTo(Curso, { foreignKey: "id_curso", as: "curso" });
Curso.hasMany(Curso_Presenca, { foreignKey: "id_curso", as: "presencas" });

// === Associações Formando_Presenca === 
Formando_Presenca.belongsTo(Curso_Presenca, { foreignKey: "id_curso_presenca", as: "presenca_curso" });
Formando_Presenca.belongsTo(User, { foreignKey: "id_utilizador", as: "utilizador" });
User.hasMany(Formando_Presenca, { foreignKey: "id_utilizador", as: "presencas_marcadas" });
Curso_Presenca.hasMany(Formando_Presenca, { foreignKey: "id_curso_presenca", as: "registros_presenca" });

// === LOG DE CONFIRMAÇÃO DAS ASSOCIAÇÕES CRÍTICAS ===
console.log("🔗 ASSOCIAÇÕES CRÍTICAS CONFIGURADAS:");
console.log("✅ Inscricao_Curso -> Avaliacao (hasOne)");
console.log("✅ Avaliacao -> Inscricao_Curso (belongsTo)");
console.log("✅ Inscricao_Curso -> Curso (belongsTo)");
console.log("✅ Inscricao_Curso -> User (belongsTo)");

module.exports = models;