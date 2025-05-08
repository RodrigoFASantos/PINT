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
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false,
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
  },
  id_referencia: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "ID do objeto relacionado (curso, formador, etc.)",
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  enviado_email: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
}, {
  tableName: "notificacoes",
  timestamps: false,
});

module.exports = Notificacao;