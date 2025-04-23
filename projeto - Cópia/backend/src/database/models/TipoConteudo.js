const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const TipoConteudo = sequelize.define("tipos_conteudo", {
  id_tipo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  icone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: "tipos_conteudo",
  timestamps: false,
});

module.exports = TipoConteudo;