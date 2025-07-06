/**
 * MODELO: TÓPICOS DE ÁREA (3º nível da hierarquia)
 * 
 * Define tópicos de discussão específicos para cada área de formação.
 * Serve como ponto central para:
 * - Discussões e chats de conversa
 * - Associação com cursos específicos  
 * - Organização de fóruns temáticos
 * 
 * HIERARQUIA: Categoria → Área → Tópico → Curso
 * 
 * REGRAS CRÍTICAS DE INTEGRIDADE:
 * - Eliminar tópico remove automaticamente:
 *   • Todos os chats de conversa associados
 *   • Todos os cursos associados ao tópico
 *   • Todas as inscrições de formandos nesses cursos
 *   • Todas as associações de formadores
 * 
 * Esta é uma das regras mais importantes do sistema!
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Topico_Area = sequelize.define("topico_area", {
  id_topico: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: "Identificador único do tópico"
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
    comment: "Categoria à qual o tópico pertence (para filtragem rápida)"
  },
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "areas",
      key: "id_area",
    },
    comment: "Área específica do tópico (chave estrangeira principal)"
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Título do tópico de discussão (deve ser único dentro da área)"
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Descrição detalhada do tópico (opcional)"
  },
  criado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Utilizador que criou o tópico (administrador ou formador)"
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data e hora de criação do tópico"
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: "Indica se o tópico está ativo/disponível para discussão"
  }
}, {
  tableName: "topico_area",
  timestamps: false,
  comment: "Tópicos de discussão por área - ponto central da hierarquia educacional",
  indexes: [
    {
      // Índice composto para pesquisas por área
      fields: ['id_area', 'ativo']
    },
    {
      // Índice para pesquisas por categoria
      fields: ['id_categoria', 'ativo']
    },
    {
      // Índice para ordenação por data
      fields: ['data_criacao']
    }
  ]
});

module.exports = Topico_Area;