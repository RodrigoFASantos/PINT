/**
 * MODELO: ÁREAS DE FORMAÇÃO (2º nível da hierarquia)
 * 
 * Define as áreas específicas dentro de cada categoria de formação.
 * Exemplo: Categoria "Informática" pode ter áreas como "Programação Web", 
 * "Redes e Sistemas", "Design Gráfico", etc.
 * 
 * HIERARQUIA: Categoria → Área → Tópico → Curso
 * 
 * REGRAS DE INTEGRIDADE:
 * - Nome deve ser único dentro da mesma categoria
 * - Deve pertencer sempre a uma categoria válida
 * - Só pode ser eliminada se não tiver tópicos dependentes
 * - Serve como filtro secundário na navegação do sistema
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Area = sequelize.define("areas", {
  id_area: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: "Identificador único da área"
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Nome da área de formação (ex: Programação Web, Design Gráfico, Redes e Sistemas)"
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
    comment: "Categoria pai à qual esta área pertence (chave estrangeira)"
  },
}, {
  tableName: "areas",
  timestamps: false,
  comment: "Áreas específicas dentro de cada categoria de formação",
  indexes: [
    {
      // Índice composto para pesquisas por categoria
      fields: ['id_categoria', 'nome']
    }
  ]
});

module.exports = Area;