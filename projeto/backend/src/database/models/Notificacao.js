// =============================================================================
// MODELO: NOTIFICAÇÕES GLOBAIS
// =============================================================================
// Define as notificações do sistema que podem ser enviadas aos utilizadores
// Suporta diferentes tipos de eventos e referências a objetos específicos

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Notificacao = sequelize.define("notificacoes", {
  id_notificacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Título da notificação"
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Conteúdo detalhado da notificação"
  },
  tipo: {
    type: DataTypes.ENUM(
      "curso_adicionado",
      "formador_alterado",
      "formador_criado",
      "admin_criado",
      "data_curso_alterada"
    ),
    allowNull: false,
    comment: "Tipo de evento que gerou a notificação"
  },
  id_referencia: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "ID do objeto relacionado (curso, formador, etc.)"
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data de criação da notificação"
  },
  enviado_email: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se foi enviada por email"
  }
}, {
  tableName: "notificacoes",
  timestamps: false,
});

module.exports = Notificacao;