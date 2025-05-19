const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendRegistrationEmail } = require("../../utils/emailService");
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









/*
 FUNÇÕES DE CONSULTA
*/

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar utilizadores" });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId, {
      include: [{ model: Cargo, as: 'cargo' }]
    });

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Remover a senha da resposta
    const userWithoutPassword = { ...user.toJSON() };
    delete userWithoutPassword.password;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Erro ao procurar utilizador:", error);
    res.status(500).json({ message: "Erro ao procurar utilizador" });
  }
};

const getFormadores = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 2 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar formadores" });
  }
};

const getFormandos = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 3 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar formandos" });
  }
};

const getGestores = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 1 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar gestores" });
  }
};

/**
 * FUNÇÕES DE UPLOAD DE IMAGENS
 */



const initDefaultUserImages = () => {
  try {
    // Garantir que o diretório base exista
    const usersDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users');
    uploadUtils.ensureDir(usersDir);

    // Caminhos para os ficheiros padrão
    const avatarPath = path.join(usersDir, 'AVATAR.png');
    const capaPath = path.join(usersDir, 'CAPA.png');

    // Verificar se os ficheiros padrão já existem
    if (!fs.existsSync(avatarPath) || !fs.existsSync(capaPath)) {
      console.log('A criar ficheiros de imagem padrão para utilizadores...');

      // Se os ficheiros não existirem, pode usar um método para criá-los
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
        console.warn('Ficheiros de imagem padrão não encontrados em resources!');
        // Aqui você poderia criar imagens em branco ou usar outra estratégia
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar imagens padrão:', error);
  }
};


/**
 * Função auxiliar para migrar e limpar ficheiros de imagem do utilizador
 * Esta função garante que apenas os ficheiros mais recentes permaneçam
 * @param {string} userDir - Diretório do utilizador
 * @param {string} userEmail - Email do utilizador
 * @param {string} tipo - Tipo de imagem (AVATAR ou CAPA)
 * @returns {Object} Informações sobre o ficheiro mais recente
 */

const uploadImagemPerfil = async (req, res) => {
  try {
    // 1. Verificar se a imagem foi enviada
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
    }

    // 2. Verificar se o utilizador existe
    const userId = req.utilizador.id_utilizador;
    const userEmail = req.utilizador.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, message: "Utilizador não autenticado corretamente" });
    }

    // 3. Procurar o utilizador para garantir que existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilizador não encontrado" });
    }

    // 4. Preparar o diretório e caminho do ficheiro
    const userSlug = userEmail.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);

    // Garantir que o diretório exista
    uploadUtils.ensureDir(userDir);

    // Nome fixo do ficheiro (sem timestamp)
    const fileName = `${userEmail}_AVATAR.png`;
    const filePath = path.join(userDir, fileName);

    // Caminho relativo para a base de dados
    const dbPath = `uploads/users/${userSlug}/${fileName}`;

    // 5. Remover qualquer ficheiro existente com mesmo nome base
    const files = fs.readdirSync(userDir);
    files.forEach(file => {
      // Encontrar TODOS os ficheiros que correspondem ao padrão email_AVATAR*.png
      if (file.startsWith(`${userEmail}_AVATAR`) && file.endsWith('.png')) {
        const oldFilePath = path.join(userDir, file);
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Ficheiro antigo removido: ${oldFilePath}`);
        } catch (err) {
          console.error(`Erro ao remover ficheiro antigo: ${oldFilePath}`, err);
        }
      }
    });

    // 6. Mover o ficheiro temporário para o destino final
    fs.copyFileSync(req.file.path, filePath);

    // Remover o ficheiro temporário
    if (req.file.path !== filePath && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 7. Atualizar o caminho na base de dados
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


const uploadImagemCapa = async (req, res) => {
  try {
    // 1. Verificar se a imagem foi enviada
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" });
    }

    // 2. Verificar se o utilizador existe
    const userId = req.utilizador.id_utilizador;
    const userEmail = req.utilizador.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, message: "Utilizador não autenticado corretamente" });
    }

    // 3. Procurar o utilizador para garantir que existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilizador não encontrado" });
    }

    // 4. Preparar o diretório e caminho do ficheiro
    const userSlug = userEmail.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);

    // Garantir que o diretório exista
    uploadUtils.ensureDir(userDir);

    // Nome fixo do ficheiro (sem timestamp)
    const fileName = `${userEmail}_CAPA.png`;
    const filePath = path.join(userDir, fileName);

    // Caminho relativo para a base de dados
    const dbPath = `uploads/users/${userSlug}/${fileName}`;

    // 5. Remover qualquer ficheiro existente com mesmo nome base
    const files = fs.readdirSync(userDir);
    files.forEach(file => {
      // Encontrar TODOS os ficheiros que correspondem ao padrão email_CAPA*.png
      if (file.startsWith(`${userEmail}_CAPA`) && file.endsWith('.png')) {
        const oldFilePath = path.join(userDir, file);
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Ficheiro antigo removido: ${oldFilePath}`);
        } catch (err) {
          console.error(`Erro ao remover ficheiro antigo: ${oldFilePath}`, err);
        }
      }
    });

    // 6. Mover o ficheiro temporário para o destino final
    fs.copyFileSync(req.file.path, filePath);

    // Remover o ficheiro temporário
    if (req.file.path !== filePath && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 7. Atualizar o caminho na base de dados
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


/**
 * FUNÇÕES DE GESTÃO DE PERFIL
 */

const perfilUser = async (req, res) => {
  try {
    console.log('Utilizador autenticado:', req.user);

    const userId = req.utilizador.id_utilizador;
    console.log('ID do utilizador:', userId);

    const user = await User.findByPk(userId, {
      include: [{ model: Cargo, as: 'cargo' }]
    });

    console.log('Utilizador encontrado:', user ? 'Sim' : 'Não');

    if (!user) {
      console.log('Utilizador não encontrado');
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Adicionar imagem predefinida se não existir
    if (!user.foto_perfil) {
      console.log('A definir foto de perfil padrão');
      user.foto_perfil = "AVATAR.png";
    }
    if (!user.foto_capa) {
      console.log('A definir foto de capa padrão');
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

/* const updatePerfilUser = async (req, res) => {
  try {
    // Utilizar o ID dos parâmetros, não do utilizador autenticado, pois é o admin a atualizar o perfil de outro utilizador
    const userId = req.params.id;
    const {
      nome,
      email,
      telefone,
      idade,
      morada,
      cidade,
      distrito,
      freguesia,
      codigo_postal,
      descricao,
      id_cargo // Adicionado: permitir atualização do cargo
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Criar objeto com os campos para atualizar
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
      ...(id_cargo && { id_cargo }) // Adicionado: permitir atualização do cargo
    };

    // Atualizar os campos
    await User.update(updateData, { where: { id_utilizador: userId } });

    const updatedUser = await User.findByPk(userId);
    res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ message: "Erro ao atualizar o perfil do utilizador" });
  }
};
 */

const updatePerfilUser = async (req, res) => {
  try {
    // Verificar se é atualização do próprio perfil ou de outro utilizador (admin)
    const userId = req.params.id || req.utilizador.id_utilizador;

    const {
      nome,
      email,
      telefone,
      idade,
      morada,
      cidade,
      distrito,
      freguesia,
      codigo_postal,
      descricao,
      id_cargo
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Criar objeto com os campos para atualizar
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

    // Atualizar os campos
    await User.update(updateData, { where: { id_utilizador: userId } });

    const updatedUser = await User.findByPk(userId);
    res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ message: "Erro ao atualizar o perfil do utilizador" });
  }
};



const changePassword = async (req, res) => {
  try {
    console.log('Requisição de alteração de palavra-passe recebida:', req.body);

    // Extrair dados da requisição
    const { token, password, id_utilizador, senha_atual, nova_senha } = req.body;

    // Caso 1: Alteração via token (recuperação de palavra-passe)
    if (token) {
      console.log('Alteração via token de recuperação de palavra-passe');

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

      console.log('Palavra-passe alterada com sucesso via token de recuperação');
      return res.json({
        message: "Palavra-passe alterada com sucesso",
        primeiro_login: 0
      });
    }

    // Caso 2: Alteração via autenticação normal
    // Se o utilizador estiver autenticado, usar o ID do token
    let userIdToUse = id_utilizador;

    // Se não foi fornecido ID explicitamente mas está autenticado
    if (!userIdToUse && req.user && req.user.id_utilizador) {
      console.log('A usar ID do utilizador do token:', req.user.id_utilizador);
      userIdToUse = req.user.id_utilizador;
    }

    if (!userIdToUse) {
      console.error('ID do utilizador não fornecido');
      return res.status(400).json({ message: "ID do utilizador é obrigatório" });
    }

    console.log('Procurar utilizador com ID:', userIdToUse);
    const user = await User.findByPk(userIdToUse);

    if (!user) {
      console.error('Utilizador não encontrado');
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Verificar palavra-passe atual a menos que seja primeiro login
    if (user.primeiro_login !== 1 && senha_atual) {
      console.log('A verificar palavra-passe atual (não é primeiro login)');
      const validPassword = await bcrypt.compare(senha_atual, user.password);
      if (!validPassword) {
        console.error('Palavra-passe atual incorreta');
        return res.status(401).json({ message: "Palavra-passe atual incorreta" });
      }
    } else {
      console.log('Primeiro login ou palavra-passe atual não fornecida');
    }

    // Determinar qual palavra-passe usar
    const senhaParaAtualizar = nova_senha || password;

    if (!senhaParaAtualizar) {
      console.error('Nova palavra-passe não fornecida');
      return res.status(400).json({ message: "Nova palavra-passe é obrigatória" });
    }

    console.log('A gerar hash da nova palavra-passe');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senhaParaAtualizar, salt);

    console.log('A atualizar palavra-passe e definir primeiro_login como 0');
    const updateResult = await User.update(
      {
        password: hashedPassword,
        primeiro_login: 0
      },
      { where: { id_utilizador: userIdToUse } }
    );

    console.log('Resultado da atualização:', updateResult);

    return res.json({
      message: "Palavra-passe alterada com sucesso",
      primeiro_login: 0
    });
  } catch (error) {
    console.error("Erro ao alterar palavra-passe:", error);
    res.status(500).json({ message: "Erro no servidor ao alterar palavra-passe" });
  }
};

/**
 * Criar um utilizador
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
const createUser = async (req, res) => {
  try {
    console.log("🔍 A iniciar criação de utilizador pendente");
    const { nome, email, password, idade, telefone, morada, codigo_postal, cargo } = req.body;

    // Validar campos obrigatórios
    if (!nome || !email || !password) {
      return res.status(400).json({ message: "Campos obrigatórios: nome, email e password" });
    }

    // Verificar se o e-mail já está em uso (tanto em utilizadores ativos quanto pendentes)
    const emailExistenteAtivo = await User.findOne({ where: { email } });
    if (emailExistenteAtivo) {
      return res.status(400).json({ message: "Este e-mail já está em uso por um utilizador ativo" });
    }

    const emailExistentePendente = await User_Pendente.findOne({ where: { email } });
    if (emailExistentePendente) {
      return res.status(400).json({ message: "Este e-mail já está pendente de confirmação" });
    }

    // Determinar o cargo corretamente (1 = gestor, 2 = formador, 3 = formando)
    let cargoId;
    let cargoDescricao;

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

    console.log(`🔍 Cargo selecionado: ${cargo}, ID do cargo: ${cargoId}, Descrição: ${cargoDescricao}`);

    // Gerar token para confirmação
    const token = jwt.sign(
      { email, nome },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Definir data de expiração do token (24 horas)
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    // Hash da palavra-passe
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

    console.log(`✅ Utilizador pendente criado com ID: ${novoPendente.id}`);

    // Verificar se há informações adicionais (associações) para formadores
    if (cargo === 'formador' && req.body.categorias) {
      try {
        // Criar entrada na tabela de associações pendentes
        await FormadorAssociacoesPendentes.create({
          id_pendente: novoPendente.id,
          categorias: req.body.categorias || [],
          areas: req.body.areas || [],
          cursos: req.body.cursos ? [req.body.cursos] : []
        });
        console.log(`✅ Associações pendentes criadas para formador: ${novoPendente.id}`);
      } catch (assocError) {
        console.error(`⚠️ Erro ao criar associações pendentes: ${assocError.message}`);
        // Não falhar o registo por causa disso
      }
    }

    // Enviar email com os dados da conta e token de confirmação
    try {
      // Preparar dados para o email
      const userForEmail = {
        id: novoPendente.id,
        nome: novoPendente.nome,
        email: novoPendente.email,
        idade: novoPendente.idade,
        telefone: novoPendente.telefone,
        morada: morada || 'Não informado',
        codigo_postal: codigo_postal || 'Não informado',
        cargo_descricao: cargoDescricao,
        senha_temporaria: password, // Enviar a palavra-passe em texto simples no email
        token: token
      };

      // Enviar email com os dados da conta
      await sendRegistrationEmail(userForEmail);
      console.log(`✅ Email enviado para: ${email}`);
    } catch (emailError) {
      console.error("⚠️ Erro ao enviar email:", emailError);
      // Continuar normalmente mesmo que o email falhe
    }

    // Se for um formador, notificar os administradores
    if (cargo === 'formador') {
      try {
        await notificacaoController.notificarNovoFormador(novoPendente);
        console.log(`✅ Notificação de novo formador enviada para os administradores`);
      } catch (notifError) {
        console.error("⚠️ Erro ao enviar notificação de novo formador:", notifError);
        // Continuar normalmente mesmo se a notificação falhar
      }
    }

    // Preparar resposta sem informações sensíveis
    const pendenteSemSenha = { ...novoPendente.toJSON() };
    delete pendenteSemSenha.password;
    delete pendenteSemSenha.token;

    return res.status(201).json({
      message: `Utilizador ${cargoDescricao} registado com sucesso! Um email de confirmação foi enviado.`,
      utilizador: pendenteSemSenha
    });

  } catch (error) {
    console.error("❌ Erro ao criar utilizador:", error);
    return res.status(500).json({
      message: "Erro ao criar utilizador",
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

    // Procurar o registo pendente
    const pendingUser = await User_Pendente.findOne({
      where: {
        email: decoded.email,
        token: token
      }
    });

    if (!pendingUser) {
      return res.status(404).json({ message: "Registo pendente não encontrado" });
    }

    // Verificar se o token não expirou (dupla verificação)
    if (new Date() > new Date(pendingUser.expires_at)) {
      await pendingUser.destroy();
      return res.status(401).json({ message: "Link de confirmação expirado. Por favor, registe-se novamente." });
    }

    // Criar o utilizador definitivo
    const newUser = await User.create({
      id_cargo: pendingUser.id_cargo,
      nome: pendingUser.nome,
      idade: pendingUser.idade,
      email: pendingUser.email,
      telefone: pendingUser.telefone,
      password: pendingUser.password, // Já está em hash
      primeiro_login: 1,
      foto_perfil: "AVATAR.png",
      foto_capa: "CAPA.png"
    });

    // NOVO: Procurar e processar associações pendentes
    try {
      const associacoesPendentes = await FormadorAssociacoesPendentes.findOne({
        where: { id_pendente: pendingUser.id }
      });

      if (associacoesPendentes) {
        console.log("✅ Encontradas associações pendentes para processar");

        // Processar categorias
        if (associacoesPendentes.categorias && associacoesPendentes.categorias.length > 0) {
          console.log(`✅ A processar ${associacoesPendentes.categorias.length} categorias`);
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
          console.log(`✅ A processar ${associacoesPendentes.areas.length} áreas`);
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
          console.log(`✅ A processar ${associacoesPendentes.cursos.length} cursos`);

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

    // Criar pasta do utilizador após confirmar a conta
    try {
      // Criar diretório do utilizador baseado no email
      const userSlug = pendingUser.email.replace(/@/g, '_at_').replace(/\./g, '_');
      const userDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'users', userSlug);

      // Garantir que o diretório exista
      uploadUtils.ensureDir(userDir);

      console.log(`Diretório do utilizador criado em: ${userDir}`);

      // Copiar imagens padrão para a pasta do utilizador, se necessário
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

      // Atualizar os caminhos das imagens na base de dados
      const dbPathAvatar = `uploads/users/${userSlug}/${pendingUser.email}_AVATAR.png`;
      const dbPathCapa = `uploads/users/${userSlug}/${pendingUser.email}_CAPA.png`;

      await User.update(
        {
          foto_perfil: dbPathAvatar,
          foto_capa: dbPathCapa
        },
        { where: { id_utilizador: newUser.id_utilizador } }
      );

      console.log('Caminhos das imagens atualizados na base de dados');
    } catch (dirError) {
      console.error("Erro ao criar diretório do utilizador:", dirError);
      // Não interromper o processo se a criação da pasta falhar
    }

    // Remover o registo pendente
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

    // MODIFICAÇÃO: Incluir o email do utilizador no token
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

    // Procurar registo pendente
    const pendingUser = await User_Pendente.findOne({ where: { email } });

    if (!pendingUser) {
      return res.status(404).json({ message: "Registo pendente não encontrado para este email" });
    }

    // Verificar se o utilizador já está registado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await pendingUser.destroy(); // Remover registo pendente obsoleto
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
 * Apagar um utilizador
**/

const deleteUser = async (req, res) => {
  console.log('===== Apagar UTILIZADOR =====');
  console.log('ID recebido:', req.params.id);
  console.log('Utilizador autenticado:', req.user);

  try {
    const userId = req.params.id;

    // Verificar se o utilizador existe
    const user = await User.findByPk(userId);
    console.log('Utilizador encontrado:', user ? 'Sim' : 'Não');

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    console.log('Cargo do utilizador:', user.id_cargo);

    // Verificar se o utilizador tem inscrições em cursos (qualquer cargo)
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_utilizador: userId }
    });

    console.log('Inscrições encontradas:', inscricoes.length);

    if (inscricoes.length > 0 || user.id_cargo === 2) {
      // Se for um formador, verificar cursos ativos que ele leciona
      if (user.id_cargo === 2) {
        const cursosAtivos = await Curso.findAll({
          where: {
            id_formador: userId,
            ativo: true
          }
        });

        if (cursosAtivos.length > 0) {
          const cursoInfo = cursosAtivos.map(curso => ({
            id: curso.id_curso,
            nome: curso.nome,
            descricao: curso.descricao,
            data_inicio: curso.data_inicio,
            data_fim: curso.data_fim,
            status: curso.ativo ? 'Ativo' : 'Inativo'
          }));

          return res.status(400).json({
            message: "Não é possível eliminar este formador pois possui cursos ativos",
            cursos: cursoInfo,
            tipo: "formador_com_cursos"
          });
        }
      }

      // Se tem apenas inscrições (não é formador com cursos ativos)
      return res.status(400).json({
        message: "Não é possível eliminar este utilizador pois está inscrito em cursos",
        inscricoes: inscricoes.length,
        tipo: "utilizador_com_inscricoes"
      });
    }

    console.log('A iniciar eliminação do utilizador...');
    // Proceder com a exclusão (o delete cascade é tratado no modelo)
    await user.destroy();

    console.log('Utilizador eliminado com sucesso');
    return res.status(200).json({
      message: "Utilizador eliminado com sucesso"
    });

  } catch (error) {
    console.error("===== ERRO AO ELIMINAR UTILIZADOR =====");
    console.error("Erro completo:", error);
    console.error("Stack trace:", error.stack);

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
  verifyToken,

  perfilUser,
  changePassword,
  updatePerfilUser,

  uploadImagemPerfil,
  uploadImagemCapa,

  initDefaultUserImages
};