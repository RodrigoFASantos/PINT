const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../database/models/User.js");
const Cargo = require("../database/models/Cargo");
const { sendRegistrationEmail } = require("../utils/emailService"); //email
const fs = require("fs");
const path = require("path");

const createUser = async (req, res) => {
  try {
    const { id_cargo, nome, idade, email, telefone, password } = req.body;

    if (!id_cargo || !nome || !idade || !email || !telefone || !password) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      id_cargo,
      nome,
      idade,
      email,
      telefone,
      password: hashedPassword,
      primeiro_login: 1,
      foto_perfil: "AVATAR.png", // Valor padrão
      foto_capa: "CAPA.png"      // Valor padrão
    });

    // Enviar email de confirmação
    await sendRegistrationEmail(newUser);

    res.status(201).json({ message: "Utilizador criado com sucesso!", user: newUser });
  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    res.status(500).json({ message: "Erro no servidor ao criar utilizador." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar utilizadores" });
  }
};

const getFormadores = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 2 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar formadores" });
  }
};

const getFormandos = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 3 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar formandos" });
  }
};

const getGestores = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 1 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar gestores" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id_utilizador, nova_password } = req.body;

    if (!id_utilizador || !nova_password) {
      return res.status(400).json({ message: "ID do utilizador e nova password são obrigatórios!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nova_password, salt);

    await User.update(
      { password: hashedPassword, primeiro_login: 0 },
      { where: { id_utilizador } }
    );

    res.json({ message: "Password alterada com sucesso!" });
  } catch (error) {
    console.error("Erro ao alterar password:", error);
    res.status(500).json({ message: "Erro no servidor ao alterar password." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [{ model: Cargo, as: "cargo" }]
    });

    if (!user) return res.status(404).json({ message: "Utilizador não encontrado!" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Credenciais inválidas!" });

    const token = jwt.sign(
      {
        id_utilizador: user.id_utilizador,
        nome: user.nome,
        id_cargo: user.cargo?.id_cargo,
        cargo: user.cargo?.descricao || null
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      id_utilizador: user.id_utilizador,
      nome: user.nome,
      id_cargo: user.cargo?.id_cargo,
      cargo: user.cargo?.descricao || null,
      primeiro_login: user.primeiro_login
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ message: "Erro no servidor ao fazer login." });
  }
};

const perfilUser = async (req, res) => {
  try {
    console.log('Usuário autenticado:', req.user);
    
    const userId = req.user.id_utilizador;
    console.log('ID do usuário:', userId);

    const user = await User.findByPk(userId, {
      include: [{ model: Cargo, as: 'cargo' }]
    });

    console.log('Usuário encontrado:', user ? 'Sim' : 'Não');

    if (!user) {
      console.log('Usuário não encontrado');
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Adicionar imagem default se não existir
    if (!user.foto_perfil) {
      console.log('Definindo foto de perfil padrão');
      user.foto_perfil = "AVATAR.png";
    }
    if (!user.foto_capa) {
      console.log('Definindo foto de capa padrão');
      user.foto_capa = "CAPA.png";
    }

    console.log('Perfil recuperado com sucesso');
    res.json(user);
  } catch (error) {
    console.error("Erro ao obter o perfil:", error);
    res.status(500).json({ message: "Erro ao obter o perfil do utilizador" });
  }
};

const updatePerfilUser = async (req, res) => {
  try {
    const userId = req.user.id_utilizador;
    const { nome, email, telefone, idade } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    await User.update(
      { nome, email, telefone, idade },
      { where: { id_utilizador: userId } }
    );

    const updatedUser = await User.findByPk(userId);
    res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ message: "Erro ao atualizar o perfil do utilizador" });
  }
};

// Novas funções de upload de imagens
const uploadImagemPerfil = async (req, res) => {
  try {
    console.log('Iniciando upload de imagem de perfil');
    if (!req.file) {
      console.log('Nenhuma imagem enviada');
      return res.status(400).json({ message: "Nenhuma imagem enviada" });
    }
    
    // Buscar informações do usuário
    const userId = req.user.id_utilizador;
    console.log('ID do usuário:', userId);
    const user = await User.findByPk(userId);
    
    if (!user || !user.email) {
      console.log('Usuário não encontrado ou sem email:', user ? 'Tem user mas sem email' : 'User não encontrado');
      // Remover arquivo temporário
      fs.unlinkSync(path.join("uploads/users/", req.file.filename));
      return res.status(404).json({ message: "Usuário não encontrado ou sem email" });
    }
    
    console.log('Email do usuário:', user.email);
    
    // Criar o nome do arquivo final usando o email do usuário - sempre AVATAR para perfil
    const tipoImagem = "AVATAR";
    const finalFilename = `${user.email}_${tipoImagem}.png`;
    const tempPath = path.join("uploads/users/", req.file.filename);
    const finalPath = path.join("uploads/users/", finalFilename);
    
    console.log('Arquivo temporário:', tempPath);
    console.log('Arquivo final:', finalPath);
    
    // Remover arquivo existente com mesmo nome, se houver
    if (fs.existsSync(finalPath)) {
      console.log('Removendo arquivo existente');
      fs.unlinkSync(finalPath);
    }
    
    // Renomear o arquivo
    console.log('Renomeando arquivo');
    fs.renameSync(tempPath, finalPath);
    
    // Atualizar o banco de dados
    console.log('Atualizando banco de dados com nome do arquivo:', finalFilename);
    try {
      const updateResult = await User.update(
        { foto_perfil: finalFilename },
        { where: { id_utilizador: userId } }
      );
      console.log('Resultado da atualização:', updateResult);
    } catch (dbError) {
      console.error('Erro ao atualizar banco de dados:', dbError);
      throw dbError;
    }
    
    // Verificar se a atualização foi bem-sucedida
    const updatedUser = await User.findByPk(userId);
    console.log('Campo foto_perfil após atualização:', updatedUser.foto_perfil);
    
    res.json({ 
      message: "Imagem de perfil atualizada com sucesso",
      path: `/uploads/users/${finalFilename}`
    });
  } catch (error) {
    console.error("Erro ao fazer upload de imagem de perfil:", error);
    res.status(500).json({ message: "Erro ao processar imagem" });
  }
};

const uploadImagemCapa = async (req, res) => {
  try {
    console.log('Iniciando upload de imagem de capa');
    if (!req.file) {
      console.log('Nenhuma imagem enviada');
      return res.status(400).json({ message: "Nenhuma imagem enviada" });
    }
    
    // Buscar informações do usuário
    const userId = req.user.id_utilizador;
    console.log('ID do usuário:', userId);
    const user = await User.findByPk(userId);
    
    if (!user || !user.email) {
      console.log('Usuário não encontrado ou sem email:', user ? 'Tem user mas sem email' : 'User não encontrado');
      // Remover arquivo temporário
      fs.unlinkSync(path.join("uploads/users/", req.file.filename));
      return res.status(404).json({ message: "Usuário não encontrado ou sem email" });
    }
    
    console.log('Email do usuário:', user.email);
    
    // Criar o nome do arquivo final usando o email do usuário - sempre CAPA para capa
    const tipoImagem = "CAPA";
    const finalFilename = `${user.email}_${tipoImagem}.png`;
    const tempPath = path.join("uploads/users/", req.file.filename);
    const finalPath = path.join("uploads/users/", finalFilename);
    
    console.log('Arquivo temporário:', tempPath);
    console.log('Arquivo final:', finalPath);
    
    // Remover arquivo existente com mesmo nome, se houver
    if (fs.existsSync(finalPath)) {
      console.log('Removendo arquivo existente');
      fs.unlinkSync(finalPath);
    }
    
    // Renomear o arquivo
    console.log('Renomeando arquivo');
    fs.renameSync(tempPath, finalPath);
    
    // Atualizar o banco de dados
    console.log('Atualizando banco de dados com nome do arquivo:', finalFilename);
    try {
      const updateResult = await User.update(
        { foto_capa: finalFilename },
        { where: { id_utilizador: userId } }
      );
      console.log('Resultado da atualização:', updateResult);
    } catch (dbError) {
      console.error('Erro ao atualizar banco de dados:', dbError);
      throw dbError;
    }
    
    // Verificar se a atualização foi bem-sucedida
    const updatedUser = await User.findByPk(userId);
    console.log('Campo foto_capa após atualização:', updatedUser.foto_capa);
    
    res.json({ 
      message: "Imagem de capa atualizada com sucesso",
      path: `/uploads/users/${finalFilename}`
    });
  } catch (error) {
    console.error("Erro ao fazer upload de imagem de capa:", error);
    res.status(500).json({ message: "Erro ao processar imagem" });
  }
};

module.exports = { 
  getAllUsers, 
  getFormadores, 
  getFormandos, 
  getGestores, 
  createUser, 
  loginUser, 
  perfilUser, 
  changePassword, 
  updatePerfilUser,
  uploadImagemPerfil,
  uploadImagemCapa
};