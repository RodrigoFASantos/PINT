// =============================================================================
// MODELO: ASSOCIAÇÕES ENTRE CURSOS
// =============================================================================
// Permite criar relações entre cursos (pré-requisitos, cursos relacionados, etc.)
// Útil para criar percursos formativos ou sugerir cursos complementares

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const AssociarCursos = sequelize.define('AssociarCursos', {
  id_associacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_curso_origem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'curso',
      key: 'id_curso'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: "Curso que está a ser associado"
  },
  id_curso_destino: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'curso',
      key: 'id_curso'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: "Curso ao qual está a ser associado"
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição da relação entre os cursos (ex: pré-requisito, complementar)'
  }
}, {
  tableName: 'associar_cursos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: false,
      fields: ['id_curso_origem']
    },
    {
      unique: false,
      fields: ['id_curso_destino']
    },
    {
      unique: true,
      fields: ['id_curso_origem', 'id_curso_destino'],
      name: 'unique_course_association'
    }
  ],
  validate: {
    // Impede que um curso seja associado a si mesmo
    naoAssociarAoMesmoCurso() {
      if (this.id_curso_origem === this.id_curso_destino) {
        throw new Error('Um curso não pode ser associado a si mesmo');
      }
    }
  }
});

module.exports = AssociarCursos;