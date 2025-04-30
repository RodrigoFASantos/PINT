const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../database/models/User.js");
const User_Pendente = require("../../database/models/User_Pendente.js");
const Cargo = require("../../database/models/Cargo");
const { sendRegistrationEmail } = require("../../utils/emailService");
const fs = require("fs");
const path = require("path");
const uploadUtils = require("../../middleware/upload");

/**
 * FUNÇÕES AUXILIARES
 */

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
    const pendingUser = await User_Pendente.findOne({ where: { email: userData.email } });
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

const prepararPastaUsuario = async (userId) => {
  try {
    // Buscar informações do usuário
    const user = await User.findByPk(userId);

    if (!user || !user.email) {
      throw new Error("Usuário não encontrado ou sem email");
    }

    // Criar slug do usuário baseado no email
    const userSlug = user.email.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);

    // Garantir que o diretório exista
    uploadUtils.ensureDir(userDir);

    // Retornar informações úteis
    return {
      user,
      userSlug,
      userDir,
      dbPathBase: `uploads/users/${userSlug}`
    };
  } catch (error) {
    console.error("Erro ao preparar pasta do usuário:", error);
    throw error;
  }
};

const initDefaultUserImages = () => {
  try {
    // Garantir que o diretório base exista
    const usersDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users');
    uploadUtils.ensureDir(usersDir);

    // Caminhos para os arquivos padrão
    const avatarPath = path.join(usersDir, 'AVATAR.png');
    const capaPath = path.join(usersDir, 'CAPA.png');

    // Verificar se os arquivos padrão já existem
    if (!fs.existsSync(avatarPath) || !fs.existsSync(capaPath)) {
      console.log('Criando arquivos de imagem padrão para usuários...');

      // Se os arquivos não existirem, pode usar um método para criá-los
      // Isso pode envolver copiar de uma pasta de recursos ou criar imagens padrão

      // Exemplo: Se as imagens estiverem em uma pasta 'resources'
      const resourcesDir = path.join(__dirname, '../../resources');

      if (fs.existsSync(path.join(resourcesDir, 'AVATAR.png')) &&
        fs.existsSync(path.join(resourcesDir, 'CAPA.png'))) {

        fs.copyFileSync(
          path.join(resourcesDir, 'AVATAR.png'),
          avatarPath
        );

        fs.copyFileSync(
          path.join(resourcesDir, 'CAPA.png'),
          capaPath
        );

        console.log('Imagens padrão copiadas com sucesso.');
      } else {
        console.warn('Arquivos de imagem padrão não encontrados em resources!');
        // Aqui você poderia criar imagens em branco ou usar outra estratégia
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar imagens padrão:', error);
  }
};

/**
 * FUNÇÕES DE REGISTRO E AUTENTICAÇÃO
 */

/**
 * Função para gerar uma senha aleatória segura
 * @param {number} length - Comprimento da senha
 * @returns {string} - Senha aleatória gerada
 */
const generateRandomPassword = (length = 10) => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=";
  let password = "";

  // Garantir que pelo menos um caractere de cada categoria esteja presente
  password += charset.substr(Math.floor(Math.random() * 26), 1); // Letra maiúscula
  password += charset.substr(26 + Math.floor(Math.random() * 26), 1); // Letra minúscula
  password += charset.substr(52 + Math.floor(Math.random() * 10), 1); // Número
  password += charset.substr(62 + Math.floor(Math.random() * 14), 1); // Caractere especial

  // Preencher o resto da senha aleatoriamente
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Embaralhar a senha para garantir que não haja um padrão reconhecível
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
};

const createUser = async (req, res) => {
  try {
    const {
      id_cargo,
      nome,
      idade,
      email,
      telefone,
      morada,
      codigo_postal,
      password // Senha opcional - se não for fornecida, será gerada aleatoriamente
    } = req.body;

    // Validar campos obrigatórios
    if (!id_cargo || !nome || !idade || !email || !telefone) {
      return res.status(400).json({ message: "Campos obrigatórios: id_cargo, nome, idade, email, telefone" });
    }

    // Buscar descrição do cargo
    let cargo_descricao = "";
    try {
      const cargo = await Cargo.findByPk(id_cargo);
      if (cargo) {
        cargo_descricao = cargo.descricao;
      }
    } catch (cargoError) {
      console.error("Erro ao buscar cargo:", cargoError);
    }

    // Primeiro verificar se podemos usar este email
    const emailCheck = await verifyAndSendEmail({ nome, email, telefone });
    if (!emailCheck.success) {
      return res.status(400).json({ message: emailCheck.error });
    }

    // Gerar senha aleatória se não for fornecida
    const senha_temporaria = password || generateRandomPassword(12);
    console.log(`Senha gerada para ${email}: ${senha_temporaria}`);

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
    const pendingUser = await User_Pendente.create({
      id_cargo,
      nome,
      idade,
      email,
      telefone,
      morada: morada || "",
      codigo_postal: codigo_postal || "",
      password: senha_temporaria, // Será hasheada pelo hook beforeCreate
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
        token: pendingUser.token,
        idade: pendingUser.idade,
        telefone: pendingUser.telefone,
        morada: pendingUser.morada,
        codigo_postal: pendingUser.codigo_postal,
        cargo_descricao: cargo_descricao,
        senha_temporaria: senha_temporaria // Importante! Passar a senha temporária para o email
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
    const pendingUser = await User_Pendente.findOne({
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

    // Criar pasta do usuário após confirmar a conta
    try {
      // Criar diretório do usuário baseado no email
      const userSlug = pendingUser.email.replace(/@/g, '_at_').replace(/\./g, '_');
      const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);

      // Garantir que o diretório exista
      uploadUtils.ensureDir(userDir);

      console.log(`Diretório do usuário criado em: ${userDir}`);

      // Copiar imagens padrão para a pasta do usuário, se necessário
      const avatarSource = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', 'AVATAR.png');
      const capaSource = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', 'CAPA.png');

      const avatarDest = path.join(userDir, `${pendingUser.email}_AVATAR.png`);
      const capaDest = path.join(userDir, `${pendingUser.email}_CAPA.png`);

      // Verificar se as imagens padrão existem e copiá-las
      if (fs.existsSync(avatarSource)) {
        fs.copyFileSync(avatarSource, avatarDest);
        console.log(`Avatar padrão copiado para ${avatarDest}`);
      }

      if (fs.existsSync(capaSource)) {
        fs.copyFileSync(capaSource, capaDest);
        console.log(`Capa padrão copiada para ${capaDest}`);
      }

      // Atualizar os caminhos das imagens no banco de dados
      const dbPathAvatar = `uploads/users/${userSlug}/${pendingUser.email}_AVATAR.png`;
      const dbPathCapa = `uploads/users/${userSlug}/${pendingUser.email}_CAPA.png`;

      await User.update(
        {
          foto_perfil: dbPathAvatar,
          foto_capa: dbPathCapa
        },
        { where: { id_utilizador: newUser.id_utilizador } }
      );

      console.log('Caminhos das imagens atualizados no banco de dados');
    } catch (dirError) {
      console.error("Erro ao criar diretório do usuário:", dirError);
      // Não interromper o processo se a criação da pasta falhar
    }

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

    // MODIFICAÇÃO: Incluir o email do usuário no token
    const token = jwt.sign(
      {
        id_utilizador: user.id_utilizador,
        nome: user.nome,
        email: user.email, // ADICIONADO: incluir email no token
        id_cargo: user.cargo?.id_cargo,
        cargo: user.cargo?.descricao || null
      },
      process.env.JWT_SECRET || 'segredo', // Usa o segredo padrão se não estiver definido
      { expiresIn: "1h" }
    );

    res.json({
      token,
      id_utilizador: user.id_utilizador,
      nome: user.nome,
      email: user.email, // ADICIONADO: incluir email na resposta
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

const resendConfirmation = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email não fornecido" });
    }

    // Buscar registro pendente
    const pendingUser = await User_Pendente.findOne({ where: { email } });

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
        token: token
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

/**
 * FUNÇÕES DE GESTÃO DE PERFIL
 */

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

    // Convertemos primeiro_login para número para garantir 
    // que o frontend receba o valor correto
    const userResponse = {
      ...user.get({ plain: true }),
      primeiro_login: Number(user.primeiro_login)
    };

    console.log('Perfil recuperado com sucesso, primeiro_login:', userResponse.primeiro_login);
    res.json(userResponse);
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

const changePassword = async (req, res) => {
  try {
    console.log('Requisição de alteração de senha recebida:', req.body);

    // Extrair dados da requisição
    const { token, password, id_utilizador, senha_atual, nova_senha } = req.body;

    // Caso 1: Alteração via token (recuperação de senha)
    if (token) {
      console.log('Alteração via token de recuperação de senha');

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        console.error('Token inválido:', error);
        return res.status(401).json({ message: "Token inválido ou expirado" });
      }

      const userId = decoded.id_utilizador;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.update(
        {
          password: hashedPassword,
          primeiro_login: 0
        },
        { where: { id_utilizador: userId } }
      );

      console.log('Senha alterada com sucesso via token de recuperação');
      return res.json({
        message: "Senha alterada com sucesso",
        primeiro_login: 0
      });
    }

    // Caso 2: Alteração via autenticação normal
    // Se o utilizador estiver autenticado, usar o ID do token
    let userIdToUse = id_utilizador;

    // Se não foi fornecido ID explicitamente mas está autenticado
    if (!userIdToUse && req.user && req.user.id_utilizador) {
      console.log('Usando ID do usuário do token:', req.user.id_utilizador);
      userIdToUse = req.user.id_utilizador;
    }

    if (!userIdToUse) {
      console.error('ID do usuário não fornecido');
      return res.status(400).json({ message: "ID do usuário é obrigatório" });
    }

    console.log('Buscando usuário com ID:', userIdToUse);
    const user = await User.findByPk(userIdToUse);

    if (!user) {
      console.error('Usuário não encontrado');
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verificar senha atual a menos que seja primeiro login
    if (user.primeiro_login !== 1 && senha_atual) {
      console.log('Verificando senha atual (não é primeiro login)');
      const validPassword = await bcrypt.compare(senha_atual, user.password);
      if (!validPassword) {
        console.error('Senha atual incorreta');
        return res.status(401).json({ message: "Senha atual incorreta" });
      }
    } else {
      console.log('Primeiro login ou senha atual não fornecida');
    }

    // Determinar qual senha usar
    const senhaParaAtualizar = nova_senha || password;

    if (!senhaParaAtualizar) {
      console.error('Nova senha não fornecida');
      return res.status(400).json({ message: "Nova senha é obrigatória" });
    }

    console.log('Gerando hash da nova senha');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senhaParaAtualizar, salt);

    console.log('Atualizando senha e definindo primeiro_login como 0');
    const updateResult = await User.update(
      {
        password: hashedPassword,
        primeiro_login: 0
      },
      { where: { id_utilizador: userIdToUse } }
    );

    console.log('Resultado da atualização:', updateResult);

    return res.json({
      message: "Senha alterada com sucesso",
      primeiro_login: 0
    });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ message: "Erro no servidor ao alterar senha" });
  }
};
/**
 * FUNÇÕES DE UPLOAD DE IMAGENS
 */
const uploadImagemPerfil = async (req, res) => {
  try {
    console.log('Iniciando upload de imagem de perfil');

    if (!req.file) {
      console.log('Nenhuma imagem enviada');
      return res.status(400).json({ message: "Nenhuma imagem enviada" });
    }

    const userId = req.user.id_utilizador;
    console.log('ID do usuário:', userId);

    // Usar a função auxiliar para preparar a pasta
    let userInfo;
    try {
      userInfo = await prepararPastaUsuario(userId);
    } catch (error) {
      // Remover arquivo temporário
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: error.message });
    }

    // Criar o nome do arquivo final
    const finalFilename = `${userInfo.user.email}_AVATAR.png`;
    const tempPath = req.file.path;
    const finalPath = path.join(userInfo.userDir, finalFilename);

    console.log('Arquivo temporário:', tempPath);
    console.log('Arquivo final:', finalPath);

    // Remover arquivo existente se houver
    if (fs.existsSync(finalPath)) {
      console.log('Removendo arquivo existente');
      fs.unlinkSync(finalPath);
    }

    // Mover o arquivo para o diretório do usuário
    const movido = uploadUtils.moverArquivo(tempPath, finalPath);
    if (!movido) {
      return res.status(500).json({ message: "Erro ao mover o arquivo de imagem" });
    }

    // Caminho relativo para salvar no banco de dados
    const dbPath = `${userInfo.dbPathBase}/${finalFilename}`;

    // Atualizar o banco de dados
    console.log('Atualizando banco de dados com nome do arquivo:', dbPath);
    try {
      const updateResult = await User.update(
        { foto_perfil: dbPath },
        { where: { id_utilizador: userId } }
      );
      console.log('Resultado da atualização:', updateResult);
    } catch (dbError) {
      console.error('Erro ao atualizar banco de dados:', dbError);
      throw dbError;
    }

    res.json({
      message: "Imagem de perfil atualizada com sucesso",
      path: dbPath
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

    const userId = req.user.id_utilizador;
    console.log('ID do usuário:', userId);

    // Usar a função auxiliar para preparar a pasta
    let userInfo;
    try {
      userInfo = await prepararPastaUsuario(userId);
    } catch (error) {
      // Remover arquivo temporário
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: error.message });
    }

    // Criar o nome do arquivo final
    const finalFilename = `${userInfo.user.email}_CAPA.png`;
    const tempPath = req.file.path;
    const finalPath = path.join(userInfo.userDir, finalFilename);

    console.log('Arquivo temporário:', tempPath);
    console.log('Arquivo final:', finalPath);

    // Remover arquivo existente se houver
    if (fs.existsSync(finalPath)) {
      console.log('Removendo arquivo existente');
      fs.unlinkSync(finalPath);
    }

    // Mover o arquivo para o diretório do usuário
    const movido = uploadUtils.moverArquivo(tempPath, finalPath);
    if (!movido) {
      return res.status(500).json({ message: "Erro ao mover o arquivo de imagem" });
    }

    // Caminho relativo para salvar no banco de dados
    const dbPath = `${userInfo.dbPathBase}/${finalFilename}`;

    // Atualizar o banco de dados
    console.log('Atualizando banco de dados com nome do arquivo:', dbPath);
    try {
      const updateResult = await User.update(
        { foto_capa: dbPath },
        { where: { id_utilizador: userId } }
      );
      console.log('Resultado da atualização:', updateResult);
    } catch (dbError) {
      console.error('Erro ao atualizar banco de dados:', dbError);
      throw dbError;
    }

    res.json({
      message: "Imagem de capa atualizada com sucesso",
      path: dbPath
    });
  } catch (error) {
    console.error("Erro ao fazer upload de imagem de capa:", error);
    res.status(500).json({ message: "Erro ao processar imagem" });
  }
};




/**
 * FUNÇÕES DE CONSULTA DE USUÁRIOS
 */

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



module.exports = {

  getAllUsers,
  getFormadores,
  getFormandos,
  getGestores,

  createUser,
  loginUser,
  confirmAccount,
  resendConfirmation,
  verifyToken,

  perfilUser,
  changePassword,
  updatePerfilUser,

  uploadImagemPerfil,
  uploadImagemCapa,

  initDefaultUserImages
};