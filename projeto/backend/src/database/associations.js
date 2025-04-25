const Area = require('./models/Area');
const Avaliacao = require('./models/Avaliacao');
const Cargo = require('./models/Cargo');
const Categoria = require('./models/Categoria');
const ChatMensagem = require('./models/ChatMensagem');
const Comentario_Topico = require('./models/Comentario_Topico');
const ConteudoCurso = require('./models/ConteudoCurso');
const Curso = require('./models/Curso');
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
const Topico = require('./models/Topico');
const Topico_Categoria = require('./models/Topico_Categoria');
const TopicoCurso = require('./models/TopicoCurso');
const Trabalho_Entregue = require('./models/Trabalho_Entregue');
const User = require('./models/User');

// Coleção de todos os modelos para uso nas funções associate
const models = {
  Area,
  Avaliacao,
  Cargo,
  Categoria,
  ChatMensagem,
  Comentario_Topico,
  ConteudoCurso,
  Curso,
  Inscricao_Curso,
  OcorrenciaCurso,
  PastaCurso,
  PushSubscription,
  Quiz,
  QuizOpcao,
  QuizPergunta,
  QuizResposta,
  QuizRespostaDetalhe,
  TipoConteudo,
  Topico,
  Topico_Categoria,
  TopicoCurso,
  Trabalho_Entregue,
  User
};

// ========== DEFINIÇÃO DE TODAS AS ASSOCIAÇÕES ==========

// === Associações User ===
User.belongsTo(Cargo, {
  foreignKey: "id_cargo",
  as: "cargo"
});

User.hasMany(PushSubscription, {
  foreignKey: "id_utilizador",
  as: "subscriptions"
});

User.hasMany(Curso, {
  foreignKey: "id_formador",
  as: "cursos_ministrados"
});

User.belongsToMany(Curso, {
  through: Inscricao_Curso,
  foreignKey: "id_utilizador",
  otherKey: "id_curso",
  as: "cursos"
});


User.hasMany(ChatMensagem, {
  foreignKey: "id_usuario", // Mantido como está pois corresponde ao campo no modelo
  as: "mensagens_enviadas"
});

User.hasMany(Topico, {
  foreignKey: "id_criador",
  as: "topicos_criados"
});

// === Associações Cargo ===
Cargo.hasMany(User, {
  foreignKey: "id_cargo",
  as: "utilizadores"
});

// === Associações Categoria ===
Categoria.hasMany(Area, {
  foreignKey: "id_categoria",
  as: "areas"
});

Categoria.hasMany(Curso, {
  foreignKey: "id_categoria",
  as: "cursos"
});

Categoria.hasMany(Topico, {
  foreignKey: "id_categoria",
  as: "topicos"
});

// === Associações Area ===
Area.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoriaParent"
});

Area.hasMany(Curso, {
  foreignKey: "id_area",
  as: "cursos"
});

Area.hasMany(Topico, {
  foreignKey: "id_area",
  as: "topicos"
});

// === Associações Curso ===
Curso.belongsTo(User, {
  foreignKey: "id_formador",
  as: "formador"
});

Curso.belongsTo(Area, {
  foreignKey: "id_area",
  as: "area"
});

Curso.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria"
});

Curso.belongsToMany(User, {
  through: Inscricao_Curso,
  foreignKey: "id_curso",
  otherKey: "id_utilizador",
  as: "utilizadores"
});


Curso.hasMany(Quiz, {
  foreignKey: "id_curso",
  as: "quizzes"
});

Curso.hasMany(OcorrenciaCurso, {
  foreignKey: "id_curso_original",
  as: "ocorrencias"
});

Curso.hasMany(TopicoCurso, {
  foreignKey: "id_curso",
  as: "topicos"
});

Curso.hasMany(ConteudoCurso, {
  foreignKey: "id_curso",
  as: "conteudos"
});

// === Associações Inscricao_Curso ===
Inscricao_Curso.belongsTo(User, {
  foreignKey: "id_utilizador",
  as: "utilizador"
});

Inscricao_Curso.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "curso"
});


// === Associações Quiz e relacionados ===
Quiz.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "curso"
});

Quiz.hasMany(QuizPergunta, {
  foreignKey: "id_quiz",
  as: "perguntas"
});

Quiz.hasMany(QuizResposta, {
  foreignKey: "id_quiz",
  as: "respostas"
});

QuizPergunta.belongsTo(Quiz, {
  foreignKey: "id_quiz",
  as: "quiz"
});

QuizPergunta.hasMany(QuizOpcao, {
  foreignKey: "id_pergunta",
  as: "opcoes"
});

QuizOpcao.belongsTo(QuizPergunta, {
  foreignKey: "id_pergunta",
  as: "pergunta"
});

QuizResposta.belongsTo(Quiz, {
  foreignKey: "id_quiz",
  as: "quiz"
});

QuizResposta.belongsTo(Inscricao_Curso, {
  foreignKey: "id_inscricao",
  as: "inscricao"
});

QuizResposta.hasMany(QuizRespostaDetalhe, {
  foreignKey: "id_resposta",
  as: "detalhes"
});

QuizRespostaDetalhe.belongsTo(QuizResposta, {
  foreignKey: "id_resposta",
  as: "resposta"
});

QuizRespostaDetalhe.belongsTo(QuizPergunta, {
  foreignKey: "id_pergunta",
  as: "pergunta"
});

QuizRespostaDetalhe.belongsTo(QuizOpcao, {
  foreignKey: "id_opcao",
  as: "opcao"
});

// === Associações OcorrenciaCurso ===
OcorrenciaCurso.belongsTo(Curso, {
  foreignKey: "id_curso_original",
  as: "curso_original"
});

OcorrenciaCurso.belongsTo(Curso, {
  foreignKey: "id_curso_nova_ocorrencia",
  as: "curso_nova_ocorrencia"
});

// === Associações Topico ===
Topico.belongsTo(User, {
  foreignKey: "id_criador",
  as: "criador"
});

Topico.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria"
});

Topico.belongsTo(Area, {
  foreignKey: "id_area",
  as: "area"
});

Topico.hasMany(ChatMensagem, {
  foreignKey: "id_topico",
  as: "mensagens"
});

// === Associações Topico_Categoria ===
Topico_Categoria.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria"
});

Topico_Categoria.belongsTo(User, {
  foreignKey: "criado_por",
  as: "criador"
});

Topico_Categoria.hasMany(Comentario_Topico, {
  foreignKey: "id_topico",
  as: "comentarios"
});

// === Associações TopicoCurso ===
TopicoCurso.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "curso"
});

TopicoCurso.hasMany(PastaCurso, {
  foreignKey: "id_topico",
  as: "pastas"
});

// === Associações PastaCurso ===
PastaCurso.belongsTo(TopicoCurso, {
  foreignKey: "id_topico",
  as: "topico"
});

PastaCurso.hasMany(ConteudoCurso, {
  foreignKey: "id_pasta",
  as: "conteudos"
});

// === Associações ConteudoCurso ===
ConteudoCurso.belongsTo(PastaCurso, {
  foreignKey: "id_pasta",
  as: "pasta"
});

ConteudoCurso.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "curso"
});

// === Associações ChatMensagem ===
ChatMensagem.belongsTo(Topico, {
  foreignKey: "id_topico",
  as: "topico"
});

ChatMensagem.belongsTo(User, {
  foreignKey: "id_usuario",
  as: "usuario"
});

// === Associações Comentario_Topico ===
Comentario_Topico.belongsTo(Topico_Categoria, {
  foreignKey: "id_topico",
  as: "topico"
});

Comentario_Topico.belongsTo(User, {
  foreignKey: "id_utilizador",
  as: "utilizador"
});

// === Associações Trabalho_Entregue ===
Trabalho_Entregue.belongsTo(Inscricao_Curso, {
  foreignKey: "id_inscricao",
  as: "inscricao"
});

// === Associações Avaliacao ===
Avaliacao.belongsTo(Inscricao_Curso, {
  foreignKey: "id_inscricao",
  as: "inscricao"
});

// Chamar funções associate para os modelos que as têm
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
    console.log(`Aplicadas associações para o modelo: ${model.name || 'Desconhecido'}`);
  }
});

// Exportar todos os modelos configurados
module.exports = models;