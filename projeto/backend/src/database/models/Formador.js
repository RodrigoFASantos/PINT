const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Formador = sequelize.define('Formador', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  foto_perfil: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  idade: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  foto_capa: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'formadores',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Formador;