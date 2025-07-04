const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendRegistrationEmail, sendPasswordResetEmail } = require("../../utils/emailService");
const fs = require("fs");
const path = require("path");
const uploadUtils = require("../../middleware/upload");

const User_Pendente = require("../../database/models/User_Pendente.js");
const User = require("../../database/models/User.js");
const Cargo = require("../../database/models/Cargo");
const FormadorAssociacoesPendentes = require("../../database/models/Formador_Associacoes_Pendentes");
const FormadorCategoria = require("../../database/models/Formador_Categoria");
const FormadorArea = require("../../database/models/Formador_Area");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const Curso = require("../../database/models/Curso");

/**
 * CONTROLADORES PARA GESTÃO COMPLETA DE UTILIZADORES
 * 
 * Este módulo centraliza todas as operações relacionadas com utilizadores,
 * incluindo autenticação, registo, gestão de perfis e operações administrativas.
 * Suporta diferentes tipos de utilizadores (administradores, formadores, formandos)
 * com permissões e funcionalidades específicas para cada cargo.
 */

// =============================================================================
// FUNÇÕES DE CONSULTA E LISTAGEM
// =============================================================================

/**
 * Obter lista completa de todos os utilizadores registados
 * 
 * Retorna todos os utilizadores do sistema para fins administrativos,
 * excluindo informações sensíveis como palavras-passe.
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar utilizadores" });
  }
};

/**
 * Obter dados específicos de um utilizador pelo seu identificador
 * 
 * Fornece informação detalhada sobre um utilizador específico,
 * incluindo o cargo associado mas excluindo dados sensíveis.
 */
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId, {
      include: [{ model: Cargo, as: 'cargo' }]
    });

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Remover informação sensível da resposta
    const userWithoutPassword = { ...user.toJSON() };
    delete userWithoutPassword.password;

    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar utilizador" });
  }
};

/**
 * Listar todos os formadores registados no sistema
 * 
 * Retorna utilizadores com cargo de formador (id_cargo = 2)
 * para facilitar a gestão e atribuição de cursos.
 */
const getFormadores = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 2 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar formadores" });
  }
};

/**
 * Listar todos os formandos registados no sistema
 * 
 * Retorna utilizadores com cargo de formando (id_cargo = 3)
 * para gestão de inscrições e acompanhamento académico.
 */
const getFormandos = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 3 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar formandos" });
  }
};

/**
 * Listar todos os gestores/administradores do sistema
 * 
 * Retorna utilizadores com cargo administrativo (id_cargo = 1)
 * para operações de supervisão e gestão da plataforma.
 */
const getGestores = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 1 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar gestores" });
  }
};

// =============================================================================
// SISTEMA DE UPLOAD E GESTÃO DE IMAGENS
// =============================================================================

/**
 * Inicializar ficheiros de imagem padrão para utilizadores
 * 
 * Cria ficheiros de avatar e capa padrão caso não existam,
 * garantindo que todos os utilizadores tenham imagens de fallback.
 */
const initDefaultUserImages = () => {
  try {
    // Garantir que o diretório base existe
    const usersDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users');
    uploadUtils.ensureDir(usersDir);

    const avatarPath = path.join(usersDir, 'AVATAR.png');
    const capaPath = path.join(usersDir, 'CAPA.png');

    // Verificar se os ficheiros padrão já existem
    if (!fs.existsSync(avatarPath) || !fs.existsSync(capaPath)) {
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
      }
    }
  } catch (error) {
    // Não interromper a aplicação por falha na inicialização de imagens
  }
};

/**
 * Processar upload de imagem de perfil do utilizador
 * 
 * Gere o carregamento, validação e armazenamento de avatares,
 * incluindo a remoção de ficheiros antigos e atualização da base de dados.
 */
const uploadImagemPerfil = async (req, res) => {
  try {
    // Verificar se foi enviada uma imagem
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
    }

    const userId = req.utilizador.id_utilizador;
    const userEmail = req.utilizador.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, message: "Utilizador não autenticado corretamente" });
    }

    // Verificar se o utilizador existe na base de dados
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilizador não encontrado" });
    }

    // Preparar estrutura de diretórios
    const userSlug = userEmail.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);

    uploadUtils.ensureDir(userDir);

    const fileName = `${userEmail}_AVATAR.png`;
    const filePath = path.join(userDir, fileName);
    const dbPath = `uploads/users/${userSlug}/${fileName}`;

    // Remover ficheiros de avatar antigos
    const files = fs.readdirSync(userDir);
    files.forEach(file => {
      if (file.startsWith(`${userEmail}_AVATAR`) && file.endsWith('.png')) {
        const oldFilePath = path.join(userDir, file);
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) {
          // Não interromper o processo por falha na remoção
        }
      }
    });

    // Processar o novo ficheiro
    fs.copyFileSync(req.file.path, filePath);

    // Limpar ficheiro temporário
    if (req.file.path !== filePath && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Atualizar referência na base de dados
    await User.update(
      { foto_perfil: dbPath },
      { where: { id_utilizador: userId } }
    );

    return res.status(200).json({
      success: true,
      message: "Imagem de perfil atualizada com sucesso",
      path: dbPath
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao processar a imagem de perfil",
      error: error.message
    });
  }
};

/**
 * Processar upload de imagem de capa do utilizador
 * 
 * Semelhante ao upload de perfil, mas para imagens de banner/capa,
 * mantendo a mesma estrutura de validação e armazenamento.
 */
const uploadImagemCapa = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
    }

    const userId = req.utilizador.id_utilizador;
    const userEmail = req.utilizador.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, message: "Utilizador não autenticado corretamente" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilizador não encontrado" });
    }

    const userSlug = userEmail.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);

    uploadUtils.ensureDir(userDir);

    const fileName = `${userEmail}_CAPA.png`;
    const filePath = path.join(userDir, fileName);
    const dbPath = `uploads/users/${userSlug}/${fileName}`;

    // Remover ficheiros de capa antigos
    const files = fs.readdirSync(userDir);
    files.forEach(file => {
      if (file.startsWith(`${userEmail}_CAPA`) && file.endsWith('.png')) {
        const oldFilePath = path.join(userDir, file);
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) {
          // Continuar mesmo com erro na remoção
        }
      }
    });

    fs.copyFileSync(req.file.path, filePath);

    if (req.file.path !== filePath && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    await User.update(
      { foto_capa: dbPath },
      { where: { id_utilizador: userId } }
    );

    return res.status(200).json({
      success: true,
      message: "Imagem de capa atualizada com sucesso",
      path: dbPath
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao processar a imagem de capa",
      error: error.message
    });
  }
};

// =============================================================================
// GESTÃO DE PERFIS E DADOS PESSOAIS
// =============================================================================

/**
 * Obter perfil completo do utilizador autenticado
 * 
 * Retorna todos os dados do perfil do utilizador atual,
 * incluindo cargo, imagens e configurações de conta.
 */
const perfilUser = async (req, res) => {
  try {
    const userId = req.utilizador.id_utilizador;

    const user = await User.findByPk(userId, {
      include: [{ model: Cargo, as: 'cargo' }]
    });

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Definir imagens padrão caso não existam
    if (!user.foto_perfil) {
      user.foto_perfil = "AVATAR.png";
    }
    if (!user.foto_capa) {
      user.foto_capa = "CAPA.png";
    }

    // Garantir que primeiro_login seja tratado como número
    const userResponse = {
      ...user.get({ plain: true }),
      primeiro_login: Number(user.primeiro_login)
    };

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter o perfil do utilizador" });
  }
};

/**
 * Atualizar dados do perfil do utilizador
 * 
 * Permite modificação de informações pessoais como nome, contactos,
 * morada e outros dados não sensíveis do perfil.
 */
const updatePerfilUser = async (req, res) => {
  try {
    // Determinar se é atualização própria ou administrativa
    const userId = req.params.id || req.utilizador.id_utilizador;

    const {
      nome, email, telefone, idade, morada, cidade, distrito,
      freguesia, codigo_postal, descricao, id_cargo
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Construir objeto com dados para atualização
    const updateData = {
      ...(nome && { nome }),
      ...(email && { email }),
      ...(telefone && { telefone }),
      ...(idade && { idade }),
      ...(morada && { morada }),
      ...(cidade && { cidade }),
      ...(distrito && { distrito }),
      ...(freguesia && { freguesia }),
      ...(codigo_postal && { codigo_postal }),
      ...(descricao && { descricao }),
      ...(id_cargo && { id_cargo })
    };

    await User.update(updateData, { where: { id_utilizador: userId } });

    const updatedUser = await User.findByPk(userId);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar o perfil do utilizador" });
  }
};

/**
 * Alterar palavra-passe do utilizador
 * 
 * Suporta tanto a alteração via token de recuperação quanto
 * alteração normal com verificação da palavra-passe atual.
 */
const changePassword = async (req, res) => {
  try {
    const { token, password, id_utilizador, senha_atual, nova_senha } = req.body;

    // Cenário 1: Alteração via token de recuperação
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
          primeiro_login: 0
        },
        { where: { id_utilizador: userId } }
      );

      return res.json({
        message: "Palavra-passe alterada com sucesso",
        primeiro_login: 0
      });
    }

    // Cenário 2: Alteração via autenticação normal
    let userIdToUse = id_utilizador;

    if (!userIdToUse && req.user && req.user.id_utilizador) {
      userIdToUse = req.user.id_utilizador;
    }

    if (!userIdToUse) {
      return res.status(400).json({ message: "ID do utilizador é obrigatório" });
    }

    const user = await User.findByPk(userIdToUse);

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Verificar palavra-passe atual (exceto no primeiro login)
    if (user.primeiro_login !== 1 && senha_atual) {
      const validPassword = await bcrypt.compare(senha_atual, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Palavra-passe atual incorreta" });
      }
    }

    const senhaParaAtualizar = nova_senha || password;

    if (!senhaParaAtualizar) {
      return res.status(400).json({ message: "Nova palavra-passe é obrigatória" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senhaParaAtualizar, salt);

    await User.update(
      {
        password: hashedPassword,
        primeiro_login: 0
      },
      { where: { id_utilizador: userIdToUse } }
    );

    return res.json({
      message: "Palavra-passe alterada com sucesso",
      primeiro_login: 0
    });
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor ao alterar palavra-passe" });
  }
};

// =============================================================================
// AUTENTICAÇÃO E REGISTO DE UTILIZADORES
// =============================================================================

/**
 * Criar novo utilizador no sistema
 * 
 * Processa o registo de novos utilizadores, criando primeiro um registo pendente
 * que requer confirmação por email antes da ativação da conta.
 */
const createUser = async (req, res) => {
  try {
    const { nome, email, password, idade, telefone, morada, codigo_postal, cargo } = req.body;

    // Validar campos obrigatórios
    if (!nome || !email || !password) {
      return res.status(400).json({ message: "Campos obrigatórios: nome, email e password" });
    }

    // Verificar se o email já está em uso
    const emailExistenteAtivo = await User.findOne({ where: { email } });
    if (emailExistenteAtivo) {
      return res.status(400).json({ message: "Este e-mail já está em uso por um utilizador ativo" });
    }

    const emailExistentePendente = await User_Pendente.findOne({ where: { email } });
    if (emailExistentePendente) {
      return res.status(400).json({ message: "Este e-mail já está pendente de confirmação" });
    }

    // Determinar cargo do utilizador
    let cargoId, cargoDescricao;
    
    if (cargo === 'gestor') {
      cargoId = 1;
      cargoDescricao = 'Gestor';
    } else if (cargo === 'formador') {
      cargoId = 2;
      cargoDescricao = 'Formador';
    } else {
      cargoId = 3;
      cargoDescricao = 'Formando';
    }

    // Gerar token para confirmação de email
    const token = jwt.sign(
      { email, nome },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar utilizador pendente
    const novoPendente = await User_Pendente.create({
      nome,
      email,
      password: hashedPassword,
      idade: idade || 0,
      telefone: telefone || null,
      id_cargo: cargoId,
      token,
      expires_at
    });

    // Processar associações especiais para formadores
    if (cargo === 'formador' && req.body.categorias) {
      try {
        await FormadorAssociacoesPendentes.create({
          id_pendente: novoPendente.id,
          categorias: req.body.categorias || [],
          areas: req.body.areas || [],
          cursos: req.body.cursos ? [req.body.cursos] : []
        });
      } catch (assocError) {
        // Não falhar o registo por problemas com associações
      }
    }

    // Enviar email de confirmação
    try {
      const userForEmail = {
        id: novoPendente.id,
        nome: novoPendente.nome,
        email: novoPendente.email,
        idade: novoPendente.idade,
        telefone: novoPendente.telefone,
        morada: morada || 'Não informado',
        codigo_postal: codigo_postal || 'Não informado',
        cargo_descricao: cargoDescricao,
        senha_temporaria: password,
        token: token
      };

      await sendRegistrationEmail(userForEmail);
    } catch (emailError) {
      // Continuar mesmo com falha no envio do email
    }

    const pendenteSemSenha = { ...novoPendente.toJSON() };
    delete pendenteSemSenha.password;
    delete pendenteSemSenha.token;

    return res.status(201).json({
      message: `Utilizador ${cargoDescricao} registado com sucesso! Um email de confirmação foi enviado.`,
      utilizador: pendenteSemSenha
    });

  } catch (error) {
    return res.status(500).json({
      message: "Erro ao criar utilizador",
      error: error.message
    });
  }
};

/**
 * Confirmar conta através de token enviado por email
 * 
 * Ativa contas pendentes após verificação do token,
 * criando o utilizador definitivo e processando associações especiais.
 */
const confirmAccount = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token não fornecido" });
    }

    // Verificar validade do token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }

    // Procurar registo pendente
    const pendingUser = await User_Pendente.findOne({
      where: {
        email: decoded.email,
        token: token
      }
    });

    if (!pendingUser) {
      return res.status(404).json({ message: "Registo pendente não encontrado" });
    }

    // Verificar expiração
    if (new Date() > new Date(pendingUser.expires_at)) {
      await pendingUser.destroy();
      return res.status(401).json({ message: "Link de confirmação expirado. Por favor, registe-se novamente." });
    }

    // Criar utilizador definitivo
    const newUser = await User.create({
      id_cargo: pendingUser.id_cargo,
      nome: pendingUser.nome,
      idade: pendingUser.idade,
      email: pendingUser.email,
      telefone: pendingUser.telefone,
      password: pendingUser.password,
      primeiro_login: 1,
      foto_perfil: "AVATAR.png",
      foto_capa: "CAPA.png"
    });

    // Processar associações pendentes para formadores
    try {
      const associacoesPendentes = await FormadorAssociacoesPendentes.findOne({
        where: { id_pendente: pendingUser.id }
      });

      if (associacoesPendentes) {
        // Processar categorias
        if (associacoesPendentes.categorias && associacoesPendentes.categorias.length > 0) {
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
          const dataAtual = new Date();
          for (const area of associacoesPendentes.areas) {
            await FormadorArea.create({
              id_formador: newUser.id_utilizador,
              id_area: typeof area === 'object' ? area.id_area : area,
              data_associacao: dataAtual
            });
          }
        }

        // Processar inscrições em cursos
        if (associacoesPendentes.cursos && associacoesPendentes.cursos.length > 0) {
          for (const cursoId of associacoesPendentes.cursos) {
            try {
              await Inscricao_Curso.create({
                id_utilizador: newUser.id_utilizador,
                id_curso: typeof cursoId === 'object' ? cursoId.id_curso : cursoId,
                data_inscricao: new Date(),
                estado: "inscrito"
              });
            } catch (error) {
              // Continuar mesmo com falha na inscrição
            }
          }
        }

        await associacoesPendentes.destroy();
      }
    } catch (assocError) {
      // Não falhar a confirmação por problemas com associações
    }

    // Criar estrutura de pastas para o utilizador
    try {
      const userSlug = pendingUser.email.replace(/@/g, '_at_').replace(/\./g, '_');
      const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);

      uploadUtils.ensureDir(userDir);

      // Copiar imagens padrão se existirem
      const avatarSource = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', 'AVATAR.png');
      const capaSource = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', 'CAPA.png');

      const avatarDest = path.join(userDir, `${pendingUser.email}_AVATAR.png`);
      const capaDest = path.join(userDir, `${pendingUser.email}_CAPA.png`);

      if (fs.existsSync(avatarSource)) {
        fs.copyFileSync(avatarSource, avatarDest);
      }

      if (fs.existsSync(capaSource)) {
        fs.copyFileSync(capaSource, capaDest);
      }

      // Atualizar caminhos na base de dados
      const dbPathAvatar = `uploads/users/${userSlug}/${pendingUser.email}_AVATAR.png`;
      const dbPathCapa = `uploads/users/${userSlug}/${pendingUser.email}_CAPA.png`;

      await User.update(
        {
          foto_perfil: dbPathAvatar,
          foto_capa: dbPathCapa
        },
        { where: { id_utilizador: newUser.id_utilizador } }
      );
    } catch (dirError) {
      // Não interromper o processo por falha na criação de pastas
    }

    // Limpar registo pendente
    await pendingUser.destroy();

    // Gerar token de autenticação para login automático
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
    res.status(500).json({ message: "Erro no servidor ao confirmar conta" });
  }
};

/**
 * Autenticar utilizador no sistema
 * 
 * Processa credenciais de login, verifica validade da palavra-passe
 * e gera token JWT para manter a sessão autenticada.
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar dados de entrada
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email e password são obrigatórios" 
      });
    }

    // Procurar utilizador na base de dados
    let user;
    try {
      user = await User.findOne({ where: { email } });
    } catch (dbError) {
      return res.status(500).json({ 
        success: false,
        message: "Erro na consulta à base de dados",
        error: dbError.message 
      });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Utilizador não encontrado!" 
      });
    }

    // Verificar palavra-passe
    let validPassword;
    try {
      validPassword = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      return res.status(500).json({ 
        success: false,
        message: "Erro ao verificar credenciais"
      });
    }

    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: "Credenciais inválidas!" 
      });
    }

    // Obter informações do cargo
    let cargoInfo = null;
    try {
      const cargo = await Cargo.findByPk(user.id_cargo);
      if (cargo) {
        cargoInfo = {
          id_cargo: cargo.id_cargo,
          descricao: cargo.descricao
        };
      }
    } catch (cargoError) {
      // Continuar sem informações do cargo se houver erro
    }

    // Gerar token JWT
    let token;
    try {
      const jwtSecret = process.env.JWT_SECRET || 'desenvolvimento-secreto';
      
      token = jwt.sign(
        {
          id_utilizador: user.id_utilizador,
          nome: user.nome,
          email: user.email,
          id_cargo: user.id_cargo,
          cargo: cargoInfo?.descricao || null
        },
        jwtSecret,
        { expiresIn: "24h" }
      );
    } catch (jwtError) {
      return res.status(500).json({ 
        success: false,
        message: "Erro ao gerar token de autenticação"
      });
    }

    // Preparar resposta com dados do utilizador
    const response = {
      success: true,
      message: "Login realizado com sucesso",
      token,
      // Dados diretos para compatibilidade com AuthContext
      id_utilizador: user.id_utilizador,
      nome: user.nome,
      email: user.email,
      id_cargo: user.id_cargo,
      cargo: cargoInfo?.descricao || null,
      primeiro_login: user.primeiro_login,
      foto_perfil: user.foto_perfil,
      foto_capa: user.foto_capa,
      // Estrutura alternativa para compatibilidade
      user: {
        id_utilizador: user.id_utilizador,
        nome: user.nome,
        email: user.email,
        id_cargo: user.id_cargo,
        cargo: cargoInfo?.descricao || null,
        primeiro_login: user.primeiro_login,
        foto_perfil: user.foto_perfil,
        foto_capa: user.foto_capa
      }
    };

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Erro interno no servidor",
      error: error.message
    });
  }
};

/**
 * Verificar validade de token JWT
 * 
 * Confirma se um token ainda é válido e retorna
 * os dados do utilizador associado.
 */
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

/**
 * Reenviar email de confirmação para conta pendente
 * 
 * Gera novo token e reenvia o email de ativação
 * para utilizadores que não confirmaram a conta.
 */
const resendConfirmation = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email não fornecido" });
    }

    // Procurar registo pendente
    const pendingUser = await User_Pendente.findOne({ where: { email } });

    if (!pendingUser) {
      return res.status(404).json({ 
        message: "Registo pendente não encontrado para este email" 
      });
    }

    // Verificar se já está registado como utilizador ativo
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await pendingUser.destroy();
      return res.status(400).json({
        message: "Este email já está registado como utilizador ativo. Por favor, faça login ou recupere a sua palavra-passe."
      });
    }

    // Gerar novo token
    const token = jwt.sign(
      { email: pendingUser.email, nome: pendingUser.nome },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    await pendingUser.update({ token, expires_at });

    // Preparar dados para reenvio
    const userForEmail = {
      id: pendingUser.id,
      nome: pendingUser.nome,
      email: pendingUser.email,
      idade: pendingUser.idade,
      telefone: pendingUser.telefone,
      token: token
    };

    // Reenviar email
    try {
      await sendRegistrationEmail(userForEmail);
      res.json({ 
        message: "Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada." 
      });
    } catch (emailError) {
      res.status(500).json({ 
        message: "Erro ao enviar o email de confirmação." 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Erro no servidor ao processar a solicitação." 
    });
  }
};

/**
 * Solicitar recuperação de palavra-passe
 * 
 * Envia email com token para redefinição de palavra-passe
 * para utilizadores que esqueceram as suas credenciais.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email é obrigatório" });
    }

    // Procurar utilizador ativo
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ 
        message: "Não foi encontrado nenhum utilizador com este email" 
      });
    }

    // Gerar token de recuperação válido por 1 hora
    const resetToken = jwt.sign(
      { 
        id_utilizador: user.id_utilizador, 
        email: user.email,
        tipo: 'password_reset' 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Enviar email de recuperação
    try {
      await sendPasswordResetEmail(user, resetToken);
      res.json({ 
        message: "Email de recuperação enviado com sucesso! Verifique sua caixa de entrada." 
      });
    } catch (emailError) {
      res.status(500).json({ 
        message: "Erro ao enviar email de recuperação. Tente novamente mais tarde." 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Erro no servidor ao processar solicitação de recuperação." 
    });
  }
};

/**
 * Redefinir palavra-passe com token de recuperação
 * 
 * Permite alterar a palavra-passe usando o token
 * enviado por email no processo de recuperação.
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ 
        message: "Token e nova senha são obrigatórios" 
      });
    }

    // Verificar e decodificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ 
        message: "Token inválido ou expirado" 
      });
    }

    // Verificar se é token de recuperação de palavra-passe
    if (decoded.tipo !== 'password_reset') {
      return res.status(401).json({ 
        message: "Token inválido para recuperação de senha" 
      });
    }

    // Procurar utilizador
    const user = await User.findByPk(decoded.id_utilizador);
    if (!user) {
      return res.status(404).json({ 
        message: "Utilizador não encontrado" 
      });
    }

    // Gerar hash da nova palavra-passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Atualizar palavra-passe na base de dados
    await User.update(
      { 
        password: hashedPassword,
        primeiro_login: 0
      },
      { where: { id_utilizador: decoded.id_utilizador } }
    );

    res.json({ 
      message: "Senha redefinida com sucesso! Pode agora fazer login com a nova senha." 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Erro no servidor ao redefinir senha." 
    });
  }
};

/**
 * Eliminar utilizador do sistema
 * 
 * Remove permanentemente um utilizador e todos os dados associados.
 * Inclui verificações de integridade para evitar eliminações problemáticas.
 */
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Verificar se o utilizador existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Verificação especial para formadores com cursos ativos
    if (user.id_cargo === 2) {
      const cursosAtivos = await Curso.findAll({
        where: { id_formador: userId, ativo: true }
      });

      if (cursosAtivos.length > 0) {
        const cursoInfo = cursosAtivos.map(curso => ({
          id: curso.id_curso,
          nome: curso.nome,
          descricao: curso.descricao,
          data_inicio: curso.data_inicio,
          data_fim: curso.data_fim,
          status: 'Ativo'
        }));

        return res.status(400).json({
          message: "Não é possível eliminar este formador pois possui cursos ativos",
          cursos: cursoInfo,
          tipo: "formador_com_cursos"
        });
      }
    }

    // Eliminar utilizador (CASCADE elimina automaticamente dados relacionados)
    await user.destroy();

    return res.status(200).json({
      message: "Utilizador eliminado com sucesso"
    });

  } catch (error) {
    return res.status(500).json({
      message: "Erro ao eliminar utilizador",
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getFormadores,
  getFormandos,
  getGestores,
  getUserById,

  createUser,
  deleteUser,
  loginUser,
  confirmAccount,
  resendConfirmation,
  forgotPassword,        
  resetPassword,         
  verifyToken,

  perfilUser,
  changePassword,
  updatePerfilUser,

  uploadImagemPerfil,
  uploadImagemCapa,

  initDefaultUserImages
};