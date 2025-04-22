const User = require("./models/User");
const Curso = require("./models/Curso");
const InscricaoCurso = require("./models/Inscricao_Curso");
const Quiz = require("./models/Quiz");
const QuizPergunta = require("./models/QuizPergunta");
const QuizOpcao = require("./models/QuizOpcao");
const QuizResposta = require("./models/QuizResposta");
const QuizRespostaDetalhe = require("./models/QuizRespostaDetalhe");
const OcorrenciaCurso = require("./models/OcorrenciaCurso");
const Categoria = require("./models/Categoria");
const Area = require("./models/Area");
const InscricaoCursoCancelada = require("./models/InscricaoCursoCancelada");
const Formador = require("./models/Formador");
const TopicoCurso = require("./models/TopicoCurso");
const PastaCurso = require("./models/PastaCurso");
const ConteudoCurso = require("./models/ConteudoCurso");

// Relação entre Curso e Categoria


User.belongsToMany(Curso, {
  through: InscricaoCurso,
  foreignKey: "id_utilizador",
  otherKey: "id_curso",
  as: "cursos"
});

Curso.belongsToMany(User, {
  through: InscricaoCurso,
  foreignKey: "id_curso",
  otherKey: "id_utilizador",
  as: "utilizadores"
});

// Relações para inscrições canceladas


User.hasMany(InscricaoCursoCancelada, {
  foreignKey: "id_utilizador",
  as: "inscricoes_canceladas"
});

Curso.hasMany(InscricaoCursoCancelada, {
  foreignKey: "id_curso",
  as: "inscricoes_canceladas"
});

// Quiz pertence a um Curso
Quiz.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "curso"
});

Curso.hasMany(Quiz, {
  foreignKey: "id_curso",
  as: "quizzes"
});

// Quiz tem muitas Perguntas
Quiz.hasMany(QuizPergunta, {
  foreignKey: "id_quiz",
  as: "perguntas"
});

QuizPergunta.belongsTo(Quiz, {
  foreignKey: "id_quiz",
  as: "quiz"
});

// Pergunta tem muitas Opções
QuizPergunta.hasMany(QuizOpcao, {
  foreignKey: "id_pergunta",
  as: "opcoes"
});

QuizOpcao.belongsTo(QuizPergunta, {
  foreignKey: "id_pergunta",
  as: "pergunta"
});

// Respostas
Quiz.hasMany(QuizResposta, {
  foreignKey: "id_quiz",
  as: "respostas"
});

QuizResposta.belongsTo(Quiz, {
  foreignKey: "id_quiz",
  as: "quiz"
});

QuizResposta.belongsTo(InscricaoCurso, {
  foreignKey: "id_inscricao",
  as: "inscricao"
});

// Detalhes das respostas
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

// Curso original tem várias ocorrências
Curso.hasMany(OcorrenciaCurso, {
  foreignKey: "id_curso_original",
  as: "ocorrencias"
});

// Nova ocorrência está relacionada ao curso original
OcorrenciaCurso.belongsTo(Curso, {
  foreignKey: "id_curso_original",
  as: "curso_original"
});

OcorrenciaCurso.belongsTo(Curso, {
  foreignKey: "id_curso_nova_ocorrencia",
  as: "curso_nova_ocorrencia"
});

Curso.belongsTo(User, {
  foreignKey: "id_formador",
  as: "formador_curso"
});

User.hasMany(Curso, {
  foreignKey: "id_formador",
  as: "cursos_ministrados"
});

Area.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria"
});

Categoria.hasMany(Area, {
  foreignKey: "id_categoria",
  as: "areas"
});

// Relação entre Curso e Area
Curso.belongsTo(Area, {
  foreignKey: "id_area",
  as: "area_curso"
});

Area.hasMany(Curso, {
  foreignKey: "id_area",
  as: "cursos"
});

User.hasOne(Formador, {
  foreignKey: "id_utilizador",
  as: "detalhes_formador"
});

Formador.belongsTo(User, {
  foreignKey: "id_utilizador",
  as: "usuario"
});

// Associações para Tópicos, Pastas e Conteúdos
Curso.hasMany(TopicoCurso, {
  foreignKey: "id_curso",
  as: "topicos"
});

TopicoCurso.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "curso"
});

TopicoCurso.hasMany(PastaCurso, {
  foreignKey: "id_topico",
  as: "pastas"
});

PastaCurso.belongsTo(TopicoCurso, {
  foreignKey: "id_topico",
  as: "topico"
});

PastaCurso.hasMany(ConteudoCurso, {
  foreignKey: "id_pasta",
  as: "conteudos"
});

ConteudoCurso.belongsTo(PastaCurso, {
  foreignKey: "id_pasta",
  as: "pasta"
});

// Relação direta entre Curso e ConteudoCurso
Curso.hasMany(ConteudoCurso, {
  foreignKey: "id_curso",
  as: "conteudos"
});

ConteudoCurso.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "curso"
});

// No final do arquivo associations.js
module.exports = { 
  User, 
  Curso, 
  InscricaoCurso, 
  InscricaoCursoCancelada,
  Quiz, 
  QuizPergunta, 
  QuizOpcao, 
  QuizResposta, 
  QuizRespostaDetalhe, 
  OcorrenciaCurso, 
  Categoria, 
  Area,
  Formador, 
  TopicoCurso,
  PastaCurso,
  ConteudoCurso
};