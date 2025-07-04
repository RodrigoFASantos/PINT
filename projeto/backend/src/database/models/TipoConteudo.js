// =============================================================================
// MODELO: TIPOS DE CONTEÚDO
// =============================================================================
// Define os diferentes tipos de conteúdos disponíveis na plataforma
// Permite categorização visual com ícones para melhor organização

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
    comment: "Nome do tipo de conteúdo (ex: PDF, Vídeo, Apresentação)"
  },
  icone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Nome do ícone ou classe CSS para representação visual"
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Descrição do tipo de conteúdo"
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: "Indica se o tipo está ativo/disponível para uso"
  }
}, {
  tableName: "tipos_conteudo",
  timestamps: false,
});

module.exports = TipoConteudo;