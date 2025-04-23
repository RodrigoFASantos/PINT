const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Topico = sequelize.define('topicos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categorias',
      key: 'id_categoria'
    }
  },
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'areas',
      key: 'id_area'
    }
  },
  id_criador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    }
  },
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dataCriacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'topicos',
  timestamps: false,
  indexes: [
    {
      name: 'idx_topicos_categoria',
      fields: ['id_categoria']
    },
    {
      name: 'idx_topicos_area',
      fields: ['id_area']
    },
    {
      name: 'idx_topicos_criador',
      fields: ['id_criador']
    }
  ]
});

module.exports = Topico;