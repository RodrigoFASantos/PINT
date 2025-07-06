/**
 * MODELO: CATEGORIAS DE FORMAÇÃO (1º nível da hierarquia)
 * 
 * Define as grandes categorias de cursos que organizam todo o sistema educacional.
 * Exemplos: Informática, Gestão, Saúde, Turismo, etc.
 * 
 * HIERARQUIA: Categoria → Área → Tópico → Curso
 * 
 * REGRAS DE INTEGRIDADE:
 * - Nome deve ser único no sistema
 * - Só pode ser eliminada se não tiver áreas dependentes
 * - Serve como filtro principal na navegação do sistema
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Categoria = sequelize.define("categorias", {
  id_categoria: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: "Identificador único da categoria"
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: "Nome único da categoria de formação (ex: Informática, Gestão, Saúde)"
  },
}, {
  tableName: "categorias",
  timestamps: false,
  comment: "Categorias principais que agrupam áreas de formação"
});

module.exports = Categoria;