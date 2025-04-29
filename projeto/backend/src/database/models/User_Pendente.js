


/*
Modelo para a tabela de utilizadores pendentes
Este modelo é utilizado para armazenar informações de usuários que estão em processo de registro, mas ainda não foram confirmados, ou seja, ainda não clicaram no botão de confirmar registo no email.
*/




const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcrypt');

const User_Pendente = sequelize.define('pending_user', {
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
User_Pendente.beforeCreate(async (User_Pendente) => {
  if (User_Pendente.password) {
    const salt = await bcrypt.genSalt(10);
    User_Pendente.password = await bcrypt.hash(User_Pendente.password, salt);
  }
});

module.exports = User_Pendente;