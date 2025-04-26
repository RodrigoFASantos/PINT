


/*
Modelo para a tabela de usuários pendentes
Este modelo é utilizado para armazenar informações de usuários que estão em processo de registro, mas ainda não foram confirmados, ou seja, ainda não clicaram no botão de confirmar registo no email.
*/




const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcrypt');

const PendingUser = sequelize.define('pending_user', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_cargo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  idade: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'pending_users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'

});

// Hook para hashear a senha antes de salvar
PendingUser.beforeCreate(async (pendingUser) => {
  if (pendingUser.password) {
    const salt = await bcrypt.genSalt(10);
    pendingUser.password = await bcrypt.hash(pendingUser.password, salt);
  }
});

module.exports = PendingUser;