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
    allowNull: false
  },
  id_curso_destino: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'associar_cursos'
});

module.exports = AssociarCursos;