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
    onDelete: 'CASCADE'
  },
  id_curso_destino: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'curso',
      key: 'id_curso'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição opcional da relação entre os cursos'
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
    naoAssociarAoMesmoCurso() {
      if (this.id_curso_origem === this.id_curso_destino) {
        throw new Error('Um curso não pode ser associado a si mesmo');
      }
    }
  }
});

module.exports = AssociarCursos;