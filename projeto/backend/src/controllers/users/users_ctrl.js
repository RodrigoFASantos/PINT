const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../database/models/User.js");
const User_Pendente = require("../../database/models/User_Pendente.js");
const Cargo = require("../../database/models/Cargo");
const { sendRegistrationEmail } = require("../../utils/emailService");
const fs = require("fs");
const path = require("path");
const uploadUtils = require("../../middleware/upload");


const FormadorAssociacoesPendentes = require("../../database/models/Formador_Associacoes_Pendentes");
const FormadorCategoria = require("../../database/models/Formador_Categoria");
const FormadorArea = require("../../database/models/Formador_Area");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");

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

/**
 * Criar um novo usuário
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
const createUser = async (req, res) => {
  try {
    console.log("🔍 Iniciando criação de usuário");
    const { nome, email, password, idade, telefone, morada, codigo_postal, cargo } = req.body;
    const senha_temporaria = password; // Guardar a senha em texto puro para o email

    // Validar campos obrigatórios
    if (!nome || !email || !password) {
      return res.status(400).json({ message: "Campos obrigatórios: nome, email e password" });
    }

    // Verificar se o e-mail já está em uso
    const emailExistente = await User.findOne({ where: { email } });
    if (emailExistente) {
      return res.status(400).json({ message: "Este e-mail já está em uso" });
    }

    // Determinar o cargo padrão (3 = formando)
    const cargoId = cargo === 'formador' ? 2 : 3;
    const cargoDescricao = cargo === 'formador' ? 'Formador' : 'Formando';

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Caminho da imagem (se existir)
    let imagemPath = null;
    if (req.file) {
      // Usar email como parte do nome do arquivo para evitar conflitos
      const userSlug = email.replace(/@/g, '_at_').replace(/\./g, '_');
      imagemPath = `uploads/users/${userSlug}/${email}_AVATAR.png`;

      // Criar diretório do usuário se ainda não existir
      const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);
      uploadUtils.ensureDir(userDir);

      console.log(`✅ Imagem salva em: ${imagemPath}`);
    }

    // Criar o usuário no banco de dados
    const novoUsuario = await User.create({
      nome,
      email,
      password: hashedPassword,
      idade: idade || null,
      telefone: telefone || null,
      morada: morada || null,
      codigo_postal: codigo_postal || null,
      id_cargo: cargoId,
      foto_perfil: imagemPath,
      ativo: true,
      data_registo: new Date()
    });

    // Remover a senha da resposta
    const usuarioSemSenha = { ...novoUsuario.toJSON() };
    delete usuarioSemSenha.password;

    // Enviar email com os dados da conta
    try {
      // Gerar token para anexar ao email (opcional, podemos usar só para fins informativos)
      const token = jwt.sign(
        { id_utilizador: novoUsuario.id_utilizador, email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Preparar dados para o email
      const userForEmail = {
        id: novoUsuario.id_utilizador,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        idade: novoUsuario.idade,
        telefone: novoUsuario.telefone,
        morada: novoUsuario.morada,
        codigo_postal: novoUsuario.codigo_postal,
        cargo_descricao: cargoDescricao,
        senha_temporaria: senha_temporaria, // Enviar a senha em texto puro no email
        token: token
      };

      // Enviar email com os dados da conta
      await sendRegistrationEmail(userForEmail);
      console.log(`✅ Email enviado para: ${email}`);
    } catch (emailError) {
      console.error("⚠️ Erro ao enviar email:", emailError);
      // Continuar normalmente mesmo que o email falhe
    }

    console.log(`✅ Usuário criado com sucesso: ${novoUsuario.id_utilizador}`);

    return res.status(201).json({
      message: `Usuário ${cargo === 'formador' ? 'formador' : ''} criado com sucesso!`,
      ...usuarioSemSenha
    });

  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
    return res.status(500).json({
      message: "Erro ao criar usuário",
      error: error.message,
      detalhes: error.stack
    });
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

    // NOVO: Buscar e processar associações pendentes
    try {
      const associacoesPendentes = await FormadorAssociacoesPendentes.findOne({
        where: { id_pendente: pendingUser.id }
      });

      if (associacoesPendentes) {
        console.log("✅ Encontradas associações pendentes para processar");
        
        // Processar categorias
        if (associacoesPendentes.categorias && associacoesPendentes.categorias.length > 0) {
          console.log(`✅ Processando ${associacoesPendentes.categorias.length} categorias`);
          const dataAtual = new Date();
          
          for (const categoria of associacoesPendentes.categorias) {
            await FormadorCategoria.create({
              id_formador: newUser.id_utilizador,
              id_categoria: typeof categoria === 'object' ? categoria.id_categoria : categoria,
              data_associacao: dataAtual
            });
          }
        }
        
        // Processar áreas
        if (associacoesPendentes.areas && associacoesPendentes.areas.length > 0) {
          console.log(`✅ Processando ${associacoesPendentes.areas.length} áreas`);
          const dataAtual = new Date();
          
          for (const area of associacoesPendentes.areas) {
            await FormadorArea.create({
              id_formador: newUser.id_utilizador,
              id_area: typeof area === 'object' ? area.id_area : area,
              data_associacao: dataAtual
            });
          }
        }
        
        // Processar cursos
        if (associacoesPendentes.cursos && associacoesPendentes.cursos.length > 0) {
          console.log(`✅ Processando ${associacoesPendentes.cursos.length} cursos`);
          
          for (const cursoId of associacoesPendentes.cursos) {
            try {
              // Criar inscrição no curso
              await Inscricao_Curso.create({
                id_utilizador: newUser.id_utilizador,
                id_curso: typeof cursoId === 'object' ? cursoId.id_curso : cursoId,
                data_inscricao: new Date(),
                estado: "inscrito"
              });
              
              console.log(`✅ Formador inscrito no curso ID: ${cursoId}`);
            } catch (error) {
              console.error(`⚠️ Erro ao inscrever formador no curso ID: ${cursoId}`, error);
              // Continuar com os próximos cursos mesmo se um falhar
            }
          }
        }


        // Remover as associações pendentes
        await associacoesPendentes.destroy();
        console.log("✅ Associações pendentes processadas e removidas");
      }
    } catch (assocError) {
      console.error("⚠️ Erro ao processar associações pendentes:", assocError);
      // Não falharemos a confirmação por causa disso
    }

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



/**
 * Função auxiliar para migrar e limpar arquivos de imagem do usuário
 * Esta função garante que apenas os arquivos mais recentes permaneçam
 * @param {string} userDir - Diretório do usuário
 * @param {string} userEmail - Email do usuário
 * @param {string} tipo - Tipo de imagem (AVATAR ou CAPA)
 * @returns {Object} Informações sobre o arquivo mais recente
 */
const migrarELimparArquivosImagem = async (userDir, userEmail, tipo) => {
  console.log(`🧹 LIMPEZA: Iniciando migração/limpeza de arquivos ${tipo} para ${userEmail}`);
  
  try {
    // Garantir que o diretório exista
    if (!fs.existsSync(userDir)) {
      console.log(`🧹 LIMPEZA: Diretório ${userDir} não existe, criando...`);
      fs.mkdirSync(userDir, { recursive: true });
      return null;
    }
    
    // Ler todos os arquivos no diretório
    const files = fs.readdirSync(userDir);
    
    // Filtrar arquivos pelo tipo (AVATAR ou CAPA)
    const tipoFiles = files.filter(file => 
      file.includes(`${userEmail}_${tipo}`) || 
      file.startsWith(`${userEmail}_${tipo}_`)
    );
    
    console.log(`🧹 LIMPEZA: Encontrados ${tipoFiles.length} arquivos de ${tipo}`);
    
    if (tipoFiles.length === 0) {
      console.log(`🧹 LIMPEZA: Nenhum arquivo de ${tipo} encontrado`);
      return null;
    }
    
    // Obter informações dos arquivos
    const fileInfos = tipoFiles.map(file => {
      const filePath = path.join(userDir, file);
      const stats = fs.statSync(filePath);
      
      // Extrair timestamp do nome ou usar a data de modificação
      let timestamp;
      const tsMatch = file.match(/_${tipo}_(\d+)\.png$/);
      if (tsMatch) {
        timestamp = parseInt(tsMatch[1]);
      } else {
        timestamp = stats.mtimeMs;
      }
      
      return {
        file,
        path: filePath,
        size: stats.size,
        timestamp,
        modified: stats.mtime
      };
    });
    
    // Ordenar por timestamp (mais recente primeiro)
    fileInfos.sort((a, b) => b.timestamp - a.timestamp);
    
    const newestFile = fileInfos[0];
    
    // Se temos mais de um arquivo, manter apenas o mais recente
    if (fileInfos.length > 1) {
      console.log(`🧹 LIMPEZA: Migrando para novo formato e mantendo apenas o arquivo mais recente (${newestFile.file})`);
      
      // Se o arquivo mais recente não estiver no formato com timestamp, migrar
      if (!newestFile.file.match(/_${tipo}_\d+\.png$/)) {
        const timestamp = Date.now();
        const newFilename = `${userEmail}_${tipo}_${timestamp}.png`;
        const newFilePath = path.join(userDir, newFilename);
        
        console.log(`🧹 LIMPEZA: Migrando arquivo ${newestFile.file} para novo formato: ${newFilename}`);
        fs.copyFileSync(newestFile.path, newFilePath);
        
        // Atualizar a referência para o novo arquivo
        newestFile.file = newFilename;
        newestFile.path = newFilePath;
        newestFile.timestamp = timestamp;
      }
      
      // Remover os arquivos mais antigos
      for (let i = 1; i < fileInfos.length; i++) {
        console.log(`🧹 LIMPEZA: Removendo arquivo antigo: ${fileInfos[i].file}`);
        fs.unlinkSync(fileInfos[i].path);
      }
    }
    
    // Garantir que o arquivo tenha conteúdo válido
    if (newestFile.size === 0) {
      console.log(`🧹 LIMPEZA: Arquivo vazio detectado (${newestFile.file}), removendo...`);
      fs.unlinkSync(newestFile.path);
      return null;
    }
    
    console.log(`🧹 LIMPEZA: Arquivo final de ${tipo}: ${newestFile.file} (${formatBytes(newestFile.size)})`);
    
    // Retornar informações do arquivo mais recente
    return {
      filename: newestFile.file,
      path: newestFile.path,
      size: newestFile.size,
      timestamp: newestFile.timestamp,
      dbPath: `uploads/users/${userEmail.replace(/@/g, '_at_').replace(/\./g, '_')}/${newestFile.file}`
    };
    
  } catch (error) {
    console.error(`🔴 LIMPEZA: Erro ao migrar/limpar arquivos ${tipo}:`, error);
    return null;
  }
};

// Função auxiliar para formatar bytes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};



const uploadImagemPerfil = async (req, res) => {
  try {
    // 1. Verificar se a imagem foi enviada
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
    }

    // 2. Verificar se o usuário existe
    const userId = req.user.id_utilizador;
    const userEmail = req.user.email;
    
    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, message: "Usuário não autenticado corretamente" });
    }

    // 3. Buscar o usuário para garantir que existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado" });
    }

    // 4. Preparar o diretório e caminho do arquivo
    const userSlug = userEmail.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);
    
    // Garantir que o diretório exista
    uploadUtils.ensureDir(userDir);
    
    // Nome fixo do arquivo (sem timestamp)
    const fileName = `${userEmail}_AVATAR.png`;
    const filePath = path.join(userDir, fileName);
    
    // Caminho relativo para o banco de dados
    const dbPath = `uploads/users/${userSlug}/${fileName}`;

    // 5. Remover qualquer arquivo existente com mesmo nome base
    const files = fs.readdirSync(userDir);
    files.forEach(file => {
      // Encontrar TODOS os arquivos que correspondem ao padrão email_AVATAR*.png
      if (file.startsWith(`${userEmail}_AVATAR`) && file.endsWith('.png')) {
        const oldFilePath = path.join(userDir, file);
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Arquivo antigo removido: ${oldFilePath}`);
        } catch (err) {
          console.error(`Erro ao remover arquivo antigo: ${oldFilePath}`, err);
        }
      }
    });

    // 6. Mover o arquivo temporário para o destino final
    fs.copyFileSync(req.file.path, filePath);
    
    // Remover o arquivo temporário
    if (req.file.path !== filePath && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 7. Atualizar o caminho no banco de dados
    await User.update(
      { foto_perfil: dbPath },
      { where: { id_utilizador: userId } }
    );

    // 8. Responder com sucesso
    return res.status(200).json({
      success: true,
      message: "Imagem de perfil atualizada com sucesso",
      path: dbPath
    });
    
  } catch (error) {
    console.error("Erro ao processar upload de imagem de perfil:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao processar a imagem de perfil",
      error: error.message
    });
  }
};

/**
 * Upload de imagem de capa - versão simplificada com nome fixo
 */
const uploadImagemCapa = async (req, res) => {
  try {
    // 1. Verificar se a imagem foi enviada
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
    }

    // 2. Verificar se o usuário existe
    const userId = req.user.id_utilizador;
    const userEmail = req.user.email;
    
    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, message: "Usuário não autenticado corretamente" });
    }

    // 3. Buscar o usuário para garantir que existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado" });
    }

    // 4. Preparar o diretório e caminho do arquivo
    const userSlug = userEmail.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);
    
    // Garantir que o diretório exista
    uploadUtils.ensureDir(userDir);
    
    // Nome fixo do arquivo (sem timestamp)
    const fileName = `${userEmail}_CAPA.png`;
    const filePath = path.join(userDir, fileName);
    
    // Caminho relativo para o banco de dados
    const dbPath = `uploads/users/${userSlug}/${fileName}`;

    // 5. Remover qualquer arquivo existente com mesmo nome base
    const files = fs.readdirSync(userDir);
    files.forEach(file => {
      // Encontrar TODOS os arquivos que correspondem ao padrão email_CAPA*.png
      if (file.startsWith(`${userEmail}_CAPA`) && file.endsWith('.png')) {
        const oldFilePath = path.join(userDir, file);
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Arquivo antigo removido: ${oldFilePath}`);
        } catch (err) {
          console.error(`Erro ao remover arquivo antigo: ${oldFilePath}`, err);
        }
      }
    });

    // 6. Mover o arquivo temporário para o destino final
    fs.copyFileSync(req.file.path, filePath);
    
    // Remover o arquivo temporário
    if (req.file.path !== filePath && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 7. Atualizar o caminho no banco de dados
    await User.update(
      { foto_capa: dbPath },
      { where: { id_utilizador: userId } }
    );

    // 8. Responder com sucesso
    return res.status(200).json({
      success: true,
      message: "Imagem de capa atualizada com sucesso",
      path: dbPath
    });
    
  } catch (error) {
    console.error("Erro ao processar upload de imagem de capa:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao processar a imagem de capa",
      error: error.message
    });
  }
};








const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verificar se o utilizador existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }
    
    // Verificar se é um formador com cursos ativos
    if (user.id_cargo === 2) { // id_cargo 2 = Formador
      const cursosAtivos = await Curso.findAll({
        where: { 
          id_formador: userId,
          ativo: true
        }
      });
      
      if (cursosAtivos.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível eliminar este formador pois possui cursos ativos",
          cursos: cursosAtivos
        });
      }
    }
    
    // Proceder com a exclusão (o delete cascade é tratado no modelo)
    await user.destroy();
    
    return res.status(200).json({
      message: "Utilizador eliminado com sucesso"
    });
    
  } catch (error) {
    console.error("Erro ao eliminar utilizador:", error);
    return res.status(500).json({
      message: "Erro ao eliminar utilizador",
      error: error.message
    });
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
  deleteUser,
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