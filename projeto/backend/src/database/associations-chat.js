// Importar modelos
const User = require("./models/User");
const Topico = require("./models/Topico.js");
const ChatMensagem = require("./models/ChatMensagem");
const Area = require("./models/Area");
const Categoria = require("./models/Categoria");

// Adicionando às associações existentes

// Relação de mensagens de chat com tópicos e usuários
ChatMensagem.belongsTo(Topico, {
  foreignKey: "id_topico",
  as: "topico"
});

Topico.hasMany(ChatMensagem, {
  foreignKey: "id_topico",
  as: "mensagens"
});

ChatMensagem.belongsTo(User, {
  foreignKey: "id_usuario",
  as: "usuario"
});

User.hasMany(ChatMensagem, {
  foreignKey: "id_usuario",
  as: "mensagens_enviadas"
});

// Relações para tópicos
Topico.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria"
});

Categoria.hasMany(Topico, {
  foreignKey: "id_categoria",
  as: "topicos"
});

Topico.belongsTo(Area, {
  foreignKey: "id_area",
  as: "area"
});

Area.hasMany(Topico, {
  foreignKey: "id_area",
  as: "topicos"
});

Topico.belongsTo(User, {
  foreignKey: "id_criador",
  as: "criador"
});

User.hasMany(Topico, {
  foreignKey: "id_criador",
  as: "topicos_criados"
});

// Exportar os modelos com suas associações
module.exports = {
  ChatMensagem,
  Topico,
  User,
  Area,
  Categoria
};