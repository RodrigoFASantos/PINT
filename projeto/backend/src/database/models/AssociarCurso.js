const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const AssociarCursos = sequelize.define('associar_cursos', {
  id_associacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_curso_origem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'curso',
      key: 'id_curso'
    }
  },
  id_curso_destino: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'curso',
      key: 'id_curso'
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'associar_cursos'
});

module.exports = AssociarCursos;