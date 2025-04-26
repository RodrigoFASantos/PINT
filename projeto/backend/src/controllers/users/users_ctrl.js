const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../database/models/User.js");
const PendingUser = require("../../database/models/PendingUser.js");
const Cargo = require("../../database/models/Cargo");
const { sendRegistrationEmail } = require("../../utils/emailService"); //email
const fs = require("fs");
const path = require("path");

/**
 * Função para verificar email e enviar confirmação
 * @param {Object} userData - Dados do usuário para criar
 * @returns {Object} - Objeto com status do envio e dados do usuário criado ou erro
 */
const verifyAndSendEmail = async (userData) => {
  try {
    // Verificar se o email já existe em usuários ativos
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      return { 
        success: false, 
        error: "Este email já está registrado. Por favor, use outro email ou recupere sua senha."
      };
    }

    // Verificar se há um registro pendente com este email
    const pendingUser = await PendingUser.findOne({ where: { email: userData.email } });
    if (pendingUser) {
      // Se o registro estiver expirado, podemos removê-lo e permitir um novo
      if (new Date() > new Date(pendingUser.expires_at)) {
        await pendingUser.destroy();
      } else {
        return {
          success: false,
          error: "Já existe um registro pendente com este email. Verifique sua caixa de entrada para ativar sua conta ou aguarde o prazo de expiração para tentar novamente."
        };
      }
    }

    // Testar o envio de email antes de criar o usuário
    const tempUser = {
      id: 0, // ID temporário
      nome: userData.nome,
      email: userData.email,
      telefone: userData.telefone
    };

    try {
      console.log(`Verificando se é possível enviar email para: ${userData.email}`);
      // Nota: Não envie o email real aqui, apenas verifique se o endereço é válido
      // Podemos usar uma validação mais simples aqui
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error("Endereço de email inválido");
      }
      
      console.log('Validação de email passou!');
      return { success: true };
    } catch (emailError) {
      console.error("Erro ao verificar email:", emailError);
      return { 
        success: false, 
        error: "Não foi possível validar o endereço de email. Verifique se o endereço está correto."
      };
    }
  } catch (error) {
    console.error("Erro ao verificar email:", error);
    return { 
      success: false, 
      error: "Erro ao verificar disponibilidade do email."
    };
  }
};

/**
 * Função para criar um registro de usuário pendente
 */
const createUser = async (req, res) => {
  try {
    const { id_cargo, nome, idade, email, telefone, password } = req.body;

    // Validar campos obrigatórios
    if (!id_cargo || !nome || !idade || !email || !telefone || !password) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
    }

    // Primeiro verificar se podemos usar este email
    const emailCheck = await verifyAndSendEmail({ nome, email, telefone });
    if (!emailCheck.success) {
      return res.status(400).json({ message: emailCheck.error });
    }

    // Criar token de confirmação
    const token = jwt.sign(
      { email, nome },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Token expira em 24 horas
    );

    // Calcular data de expiração (24 horas a partir de agora)
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    // Criar usuário pendente
    const pendingUser = await PendingUser.create({
      id_cargo,
      nome,
      idade,
      email,
      telefone,
      password, // Será hasheada pelo hook beforeCreate
      token,
      expires_at
    });

    // Enviar email de confirmação com o token
    try {
      // Adaptar o usuário pendente para o formato esperado por sendRegistrationEmail
      const userForEmail = {
        id_utilizador: pendingUser.id,
        nome: pendingUser.nome,
        email: pendingUser.email,
        token: pendingUser.token // Adicionar o token para usar no email
      };
      
      await sendRegistrationEmail(userForEmail);
      console.log('Email de confirmação enviado com sucesso!');
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError);
      // Remover o usuário pendente se falhar o envio de email
      await pendingUser.destroy();
      return res.status(500).json({ 
        message: "Não foi possível enviar o email de confirmação. O registro foi cancelado." 
      });
    }

    // Tudo deu certo!
    res.status(201).json({ 
      message: "Pré-registro realizado com sucesso! Verifique seu email para confirmar o registro.", 
      email: pendingUser.email
    });
  } catch (error) {
    console.error("Erro ao criar registro pendente:", error);
    
    if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].path === 'email') {
      return res.status(400).json({ 
        message: "Este email já está registrado. Por favor, use outro email ou recupere sua senha." 
      });
    }
    
    res.status(500).json({ message: "Erro no servidor ao processar o registro." });
  }
};

/**
 * Função para confirmar conta e criar usuário definitivo
 */
const confirmAccount = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token não fornecido" });
    }

    // Verificar se o token é válido e não expirou
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }

    // Buscar o registro pendente
    const pendingUser = await PendingUser.findOne({ 
      where: { 
        email: decoded.email,
        token: token
      } 
    });

    if (!pendingUser) {
      return res.status(404).json({ message: "Registro pendente não encontrado" });
    }

    // Verificar se o token não expirou (dupla verificação)
    if (new Date() > new Date(pendingUser.expires_at)) {
      await pendingUser.destroy();
      return res.status(401).json({ message: "Link de confirmação expirado. Por favor, registre-se novamente." });
    }

    // Criar o usuário definitivo
    const newUser = await User.create({
      id_cargo: pendingUser.id_cargo,
      nome: pendingUser.nome,
      idade: pendingUser.idade,
      email: pendingUser.email,
      telefone: pendingUser.telefone,
      password: pendingUser.password, // Já está hasheada
      primeiro_login: 1,
      foto_perfil: "AVATAR.png",
      foto_capa: "CAPA.png"
    });

    // Remover o registro pendente
    await pendingUser.destroy();

    // Gerar um token de autenticação para login automático
    const authToken = jwt.sign(
      {
        id_utilizador: newUser.id_utilizador,
        nome: newUser.nome,
        id_cargo: newUser.id_cargo
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ 
      message: "Conta confirmada com sucesso!", 
      token: authToken,
      user: {
        id_utilizador: newUser.id_utilizador,
        nome: newUser.nome,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error("Erro ao confirmar conta:", error);
    res.status(500).json({ message: "Erro no servidor ao confirmar conta" });
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

const verifyToken = (req, res) => {
  const token = req.body.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: "Token inválido ou expirado" });
  }
};

// Função para reenviar email de confirmação
const resendConfirmation = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email não fornecido" });
    }

    // Buscar registro pendente
    const pendingUser = await PendingUser.findOne({ where: { email } });
    
    if (!pendingUser) {
      return res.status(404).json({ message: "Registro pendente não encontrado para este email" });
    }

    // Verificar se o usuário já está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await pendingUser.destroy(); // Remover registro pendente obsoleto
      return res.status(400).json({ 
        message: "Este email já está registrado como usuário ativo. Por favor, faça login ou recupere sua senha." 
      });
    }

    // Gerar novo token
    const token = jwt.sign(
      { email: pendingUser.email, nome: pendingUser.nome },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Atualizar token e data de expiração
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);
    
    await pendingUser.update({
      token,
      expires_at
    });

    // Enviar novo email
    try {
      const userForEmail = {
        id_utilizador: pendingUser.id,
        nome: pendingUser.nome,
        email: pendingUser.email,
        token: pendingUser.token
      };
      
      await sendRegistrationEmail(userForEmail);
      console.log('Email de confirmação reenviado com sucesso!');
      
      res.json({ message: "Email de confirmação reenviado com sucesso!" });
    } catch (emailError) {
      console.error("Erro ao reenviar email:", emailError);
      res.status(500).json({ message: "Erro ao enviar o email de confirmação." });
    }
  } catch (error) {
    console.error("Erro ao reenviar confirmação:", error);
    res.status(500).json({ message: "Erro no servidor ao processar a solicitação." });
  }
};

// Função para alterar senha
const changePassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Se for fornecido token (caso de recuperação de senha)
    if (token) {
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ message: "Token inválido ou expirado" });
      }

      const userId = decoded.id_utilizador;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.update(
        { 
          password: hashedPassword,
          primeiro_login: 0 // Marcar como não sendo mais o primeiro login
        }, 
        { where: { id_utilizador: userId } }
      );

      return res.json({ message: "Senha alterada com sucesso" });
    } 
    
    // Se não for fornecido token, verificar ID do usuário e senha atual
    const { id_utilizador, senha_atual, nova_senha } = req.body;
    
    if (!id_utilizador) {
      return res.status(400).json({ message: "ID do usuário é obrigatório" });
    }

    const user = await User.findByPk(id_utilizador);
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Se for primeiro login, não precisamos verificar a senha atual
    if (user.primeiro_login !== 1 && senha_atual) {
      const validPassword = await bcrypt.compare(senha_atual, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nova_senha || password, salt);

    await User.update(
      { 
        password: hashedPassword,
        primeiro_login: 0 // Marcar como não sendo mais o primeiro login
      }, 
      { where: { id_utilizador } }
    );

    return res.json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ message: "Erro no servidor ao alterar senha" });
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

// Funções de upload de imagens
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
  verifyToken,
  getFormadores, 
  getFormandos, 
  getGestores, 
  createUser, 
  loginUser, 
  confirmAccount,
  resendConfirmation,
  perfilUser, 
  changePassword, 
  updatePerfilUser,
  uploadImagemPerfil,
  uploadImagemCapa
};