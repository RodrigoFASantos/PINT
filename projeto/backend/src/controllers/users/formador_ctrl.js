const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Curso, Categoria, Area, Inscricao_Curso } = require('../../database/associations');
const User_Pendente = require('../../database/models/User_Pendente');
const FormadorCategoria = require("../../database/models/Formador_Categoria");
const FormadorArea = require("../../database/models/Formador_Area");
const { Op } = require('sequelize');
const { sendRegistrationEmail } = require("../../utils/emailService");
const fs = require('fs');
const path = require('path');
const uploadUtils = require('../../middleware/upload');
const FormadorAssociacoesPendentes = require("../../database/models/Formador_Associacoes_Pendentes");




// Obter todos os formadores com paginação
const getAllFormadores = async (req, res) => {
  try {
    console.log("📋 Buscando lista de formadores");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Busca usuários com cargo de formador (id_cargo = 2)
    console.log("🔍 Buscando na tabela User com id_cargo = 2");

    try {
      const result = await User.findAndCountAll({
        where: {
          id_cargo: 2
        },
        include: [
          {
            model: Categoria,
            as: "categorias_formador",
            through: { attributes: [] }, // Exclui os atributos da tabela de junção
            required: false
          },
          {
            model: Area,
            as: "areas_formador",
            through: { attributes: [] }, // Exclui os atributos da tabela de junção
            required: false
          }
        ],
        limit,
        offset,
        order: [['nome', 'ASC']]
      });

      const formadores = result.rows;
      const count = result.count;

      console.log(`✅ Encontrados ${count} formadores na tabela User`);

      return res.json({
        formadores,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });

    } catch (error) {
      console.error("❌ Erro ao buscar formadores:", error.message);
      console.error(error.stack);
      return res.status(500).json({ message: "Erro ao listar formadores", error: error.message });
    }

  } catch (error) {
    console.error("❌ Erro geral ao listar formadores:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Erro ao listar formadores", error: error.message });
  }
};

// Obter um formador específico por ID
const getFormadorById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando formador com ID: ${id}`);

    // Verifica se existe um usuário com esse ID e que seja formador
    let usuario = null;
    try {
      console.log(`🔍 Buscando usuário com ID: ${id}`);
      usuario = await User.findByPk(id, {
        include: [
          {
            model: Categoria,
            as: "categorias_formador",
            through: { attributes: [] },
            required: false
          },
          {
            model: Area,
            as: "areas_formador",
            through: { attributes: [] },
            required: false
          }
        ]
      });

      if (!usuario) {
        return res.status(404).json({ message: "Formador não encontrado" });
      }

      // Se o usuário NÃO for um formador (id_cargo != 2), retorna erro
      if (usuario.id_cargo !== 2) {
        console.log("⚠️ ATENÇÃO: O usuário encontrado NÃO é um formador (id_cargo != 2)");
        return res.status(404).json({ message: "Formador não encontrado" });
      }

    } catch (userError) {
      console.error("❌ Erro ao buscar usuário:", userError.message);
      console.error(userError.stack);
      return res.status(500).json({ message: "Erro ao buscar formador", error: userError.message });
    }

    // Busca os cursos do formador
    console.log(`🔍 Buscando cursos para o formador ID: ${id}`);

    let cursos = [];
    try {
      cursos = await Curso.findAll({
        where: {
          id_formador: id
        }
      });
      console.log(`✅ Encontrados ${cursos.length} cursos para o formador`);
    } catch (cursosError) {
      console.error("❌ Erro ao buscar cursos:", cursosError.message);
      console.error(cursosError.stack);
      cursos = [];
    }

    console.log("✅ Retornando dados do formador a partir da tabela User");
    return res.json({
      ...usuario.toJSON(),
      cursos_ministrados: cursos
    });

  } catch (error) {
    console.error("❌ Erro geral ao buscar formador:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Erro ao buscar formador", error: error.message });
  }
};

// Obter cursos ministrados por um formador
const getCursosFormador = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando cursos do formador ID: ${id}`);

    // Verificar primeiro se o usuário é um formador
    const usuario = await User.findByPk(id);
    if (!usuario || usuario.id_cargo !== 2) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    let cursos = [];
    try {
      cursos = await Curso.findAll({
        where: {
          id_formador: id
        },
        order: [['created_at', 'DESC']]
      });
      console.log(`✅ Encontrados ${cursos.length} cursos para o formador ${id}`);
    } catch (error) {
      console.error("❌ Erro ao buscar cursos:", error.message);
      console.error(error.stack);
      cursos = [];
    }

    return res.json(cursos);
  } catch (error) {
    console.error("❌ Erro geral ao buscar cursos do formador:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Erro ao buscar cursos do formador", error: error.message });
  }
};


// Função antiga - manter para compatibilidade, mas redirecionar para o novo fluxo
const createFormador = async (req, res) => {
  // Redirecionar para o novo método de registro
  return registerFormador(req, res);
};


// Função para registrar um novo formador (pendente de confirmação)
const registerFormador = async (req, res) => {
  try {
    console.log("📋 Iniciando registro de formador pendente");
    const {
      nome,
      email,
      password,
      idade,
      telefone,
      morada,
      codigo_postal,
      categorias, // Novo parâmetro
      areas,      // Novo parâmetro
      curso       // Novo parâmetro
    } = req.body;
    const senha_temporaria = password;

    // Validar campos obrigatórios
    if (!nome || !email || !password || !idade || !telefone || !morada || !codigo_postal) {
      return res.status(400).json({
        message: "Dados incompletos para registrar formador",
        campos_necessarios: "nome, email, password, idade, telefone, morada, codigo_postal"
      });
    }

    // Verificar se o email já existe em usuários ativos
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Este email já está registrado. Por favor, use outro email." });
    }

    // Verificar se há um registro pendente com este email
    const pendingUser = await User_Pendente.findOne({ where: { email } });
    if (pendingUser) {
      // Se o registro estiver expirado, podemos removê-lo e permitir um novo
      if (new Date() > new Date(pendingUser.expires_at)) {
        await pendingUser.destroy();
      } else {
        return res.status(400).json({
          message: "Já existe um registro pendente com este email. Verifique a caixa de entrada para ativar a conta ou aguarde o prazo de expiração para tentar novamente."
        });
      }
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Gerar token para confirmação de email
    const token = jwt.sign(
      { email, nome },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Calcular data de expiração (24 horas a partir de agora)
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    // Criar registro pendente
    const novoPendente = await User_Pendente.create({
      id_cargo: 2, // Cargo de formador
      nome,
      idade: parseInt(idade),
      email,
      telefone,
      morada,
      codigo_postal,
      password: senha_temporaria,
      token,
      expires_at
    });

    // NOVO: Salvar as associações pendentes se foram fornecidas
    if (categorias?.length > 0 || areas?.length > 0 || curso) {
      try {
        await FormadorAssociacoesPendentes.create({
          id_pendente: novoPendente.id,
          categorias: categorias || [],
          areas: areas || [],
          cursos: curso ? [curso] : []
        });
        console.log("✅ Associações pendentes salvas para confirmação posterior");
      } catch (assocError) {
        console.error("⚠️ Erro ao salvar associações pendentes:", assocError);
        // Não falharemos o registro por causa disso
      }
    }

    // Preparar dados para o email
    const userForEmail = {
      id: novoPendente.id,
      nome: novoPendente.nome,
      email: novoPendente.email,
      idade: novoPendente.idade,
      telefone: novoPendente.telefone,
      morada: novoPendente.morada,
      codigo_postal: novoPendente.codigo_postal,
      cargo_descricao: 'Formador',
      senha_temporaria: senha_temporaria,
      token: token
    };

    try {
      // Enviar email de confirmação
      await sendRegistrationEmail(userForEmail);
      console.log(`✅ Email de confirmação enviado para: ${email}`);
    } catch (emailError) {
      console.error("❌ Erro ao enviar email de confirmação:", emailError);

      // Mesmo com erro no email, mantemos o registro pendente, mas informamos o problema
      return res.status(200).json({
        message: "Formador registrado, mas houve um problema ao enviar o email de confirmação. Por favor, use a opção 'Reenviar confirmação' na tela de login.",
        pendingId: novoPendente.id,
        warning: "Problema ao enviar email"
      });
    }

    return res.status(201).json({
      message: "Formador registrado com sucesso! Um email de confirmação foi enviado.",
      pendingId: novoPendente.id
    });

  } catch (error) {
    console.error("❌ Erro ao registrar formador:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Erro ao registrar formador", error: error.message });
  }
};









// Atualizar formador
const updateFormador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, foto_perfil, telefone, data_nascimento, biografia } = req.body;

    // Verificar se o usuário existe e é um formador
    const usuario = await User.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    if (usuario.id_cargo !== 2) {
      return res.status(400).json({ message: "Este usuário não é um formador" });
    }

    // Atualizar informações
    await usuario.update({
      ...(nome && { nome }),
      ...(email && { email }),
      ...(foto_perfil && { foto_perfil }),
      ...(telefone && { telefone }),
      ...(data_nascimento && { data_nascimento }),
      ...(biografia && { biografia })
    });

    return res.json(usuario);
  } catch (error) {
    console.error("❌ Erro ao atualizar formador:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Erro ao atualizar formador", error: error.message });
  }
};

// Remover status de formador (alterar id_cargo)
const deleteFormador = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário existe e é um formador
    const usuario = await User.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    if (usuario.id_cargo !== 2) {
      return res.status(400).json({ message: "Este usuário não é um formador" });
    }

    // Verificar se há cursos associados a este formador
    const cursos = await Curso.findAll({
      where: { id_formador: id }
    });

    if (cursos.length > 0) {
      return res.status(400).json({
        message: "Não é possível remover este formador pois existem cursos associados a ele",
        cursos_count: cursos.length
      });
    }

    // Remover todas as associações com categorias e áreas
    try {
      await FormadorCategoria.destroy({
        where: { id_formador: id }
      });

      await FormadorArea.destroy({
        where: { id_formador: id }
      });
    } catch (associationError) {
      console.error("⚠️ Erro ao remover associações do formador:", associationError);
    }

    // Alterar cargo para usuário normal (formando)
    await usuario.update({ id_cargo: 3 });

    return res.json({
      message: "Status de formador removido com sucesso",
      usuario
    });
  } catch (error) {
    console.error("❌ Erro ao excluir formador:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Erro ao excluir formador", error: error.message });
  }
};














/*
 FUNÇÕES PARA GERIR CATEGORIAS E ÁREAS DOS FORMADORES
*/

const getCategoriasFormador = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Obter categorias do formador
    const categorias = await Categoria.findAll({
      include: [
        {
          model: User,
          as: "formadores",
          where: { id_utilizador: id },
          through: { attributes: [] },
          attributes: []
        }
      ]
    });

    return res.json(categorias);
  } catch (error) {
    console.error("❌ Erro ao buscar categorias do formador:", error);
    return res.status(500).json({ message: "Erro ao buscar categorias do formador", error: error.message });
  }
};

const getAreasFormador = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Obter áreas do formador
    const areas = await Area.findAll({
      include: [
        {
          model: User,
          as: "formadores",
          where: { id_utilizador: id },
          through: { attributes: [] },
          attributes: []
        },
        {
          model: Categoria,
          as: "categoriaParent"
        }
      ]
    });

    return res.json(areas);
  } catch (error) {
    console.error("❌ Erro ao buscar áreas do formador:", error);
    return res.status(500).json({ message: "Erro ao buscar áreas do formador", error: error.message });
  }
};


// Adicionar categorias a um formador
const addCategoriasFormador = async (req, res) => {
  try {
    const { id } = req.params;
    const { categorias } = req.body;

    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      return res.status(400).json({ message: "É necessário fornecer uma lista de IDs de categorias" });
    }

    // Verificar se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Verificar se todas as categorias existem
    const categoriasEncontradas = await Categoria.findAll({
      where: {
        id_categoria: {
          [Op.in]: categorias
        }
      }
    });

    if (categoriasEncontradas.length !== categorias.length) {
      return res.status(400).json({
        message: "Uma ou mais categorias não existem",
        categoriasEncontradas: categoriasEncontradas.map(c => c.id_categoria)
      });
    }

    // Criar associações formador-categoria
    const associacoes = [];
    const dataAtual = new Date();

    for (const categoriaId of categorias) {
      // Verificar se a associação já existe
      const associacaoExistente = await FormadorCategoria.findOne({
        where: {
          id_formador: id,
          id_categoria: categoriaId
        }
      });

      if (!associacaoExistente) {
        const novaAssociacao = await FormadorCategoria.create({
          id_formador: id,
          id_categoria: categoriaId,
          data_associacao: dataAtual
        });
        associacoes.push(novaAssociacao);
      }
    }

    // Buscar todas as categorias atualizadas do formador
    const categoriasAtualizadas = await Categoria.findAll({
      include: [
        {
          model: User,
          as: "formadores",
          where: { id_utilizador: id },
          through: { attributes: [] },
          attributes: []
        }
      ]
    });

    return res.status(201).json({
      message: `${associacoes.length} categorias adicionadas ao formador`,
      categorias: categoriasAtualizadas
    });
  } catch (error) {
    console.error("❌ Erro ao adicionar categorias ao formador:", error);
    return res.status(500).json({ message: "Erro ao adicionar categorias ao formador", error: error.message });
  }
};

// Remover uma categoria de um formador
const removeFormadorCategoria = async (req, res) => {
  try {
    const { id, categoriaId } = req.params;

    // Verificar se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(categoriaId);
    if (!categoria) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }

    // Remover associação
    const deletedRows = await FormadorCategoria.destroy({
      where: {
        id_formador: id,
        id_categoria: categoriaId
      }
    });

    if (deletedRows === 0) {
      return res.status(404).json({ message: "Associação não encontrada" });
    }

    return res.json({
      message: "Categoria removida do formador com sucesso"
    });
  } catch (error) {
    console.error("❌ Erro ao remover categoria do formador:", error);
    return res.status(500).json({ message: "Erro ao remover categoria do formador", error: error.message });
  }
};

// Adicionar áreas a um formador
const addAreasFormador = async (req, res) => {
  try {
    const { id } = req.params;
    const { areas } = req.body;

    if (!areas || !Array.isArray(areas) || areas.length === 0) {
      return res.status(400).json({ message: "É necessário fornecer uma lista de IDs de áreas" });
    }

    // Verificar se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Verificar se todas as áreas existem
    const areasEncontradas = await Area.findAll({
      where: {
        id_area: {
          [Op.in]: areas
        }
      }
    });

    if (areasEncontradas.length !== areas.length) {
      return res.status(400).json({
        message: "Uma ou mais áreas não existem",
        areasEncontradas: areasEncontradas.map(a => a.id_area)
      });
    }

    // Criar associações formador-área
    const associacoes = [];
    const dataAtual = new Date();

    for (const areaId of areas) {
      // Verificar se a associação já existe
      const associacaoExistente = await FormadorArea.findOne({
        where: {
          id_formador: id,
          id_area: areaId
        }
      });

      if (!associacaoExistente) {
        const novaAssociacao = await FormadorArea.create({
          id_formador: id,
          id_area: areaId,
          data_associacao: dataAtual
        });
        associacoes.push(novaAssociacao);

        // Obter a categoria da área e adicionar o formador a ela também
        const area = areasEncontradas.find(a => a.id_area === areaId);
        if (area) {
          await FormadorCategoria.findOrCreate({
            where: {
              id_formador: id,
              id_categoria: area.id_categoria
            },
            defaults: {
              data_associacao: dataAtual
            }
          });
        }
      }
    }

    // Buscar todas as áreas atualizadas do formador
    const areasAtualizadas = await Area.findAll({
      include: [
        {
          model: User,
          as: "formadores",
          where: { id_utilizador: id },
          through: { attributes: [] },
          attributes: []
        },
        {
          model: Categoria,
          as: "categoriaParent"
        }
      ]
    });

    return res.status(201).json({
      message: `${associacoes.length} áreas adicionadas ao formador`,
      areas: areasAtualizadas
    });
  } catch (error) {
    console.error("❌ Erro ao adicionar áreas ao formador:", error);
    return res.status(500).json({ message: "Erro ao adicionar áreas ao formador", error: error.message });
  }
};

// Remover uma área de um formador
const removeFormadorArea = async (req, res) => {
  try {
    const { id, areaId } = req.params;

    // Verificar se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Verificar se a área existe
    const area = await Area.findByPk(areaId);
    if (!area) {
      return res.status(404).json({ message: "Área não encontrada" });
    }

    // Remover associação
    const deletedRows = await FormadorArea.destroy({
      where: {
        id_formador: id,
        id_area: areaId
      }
    });

    if (deletedRows === 0) {
      return res.status(404).json({ message: "Associação não encontrada" });
    }

    return res.json({
      message: "Área removida do formador com sucesso"
    });
  } catch (error) {
    console.error("❌ Erro ao remover área do formador:", error);
    return res.status(500).json({ message: "Erro ao remover área do formador", error: error.message });
  }
};


















const getFormadorProfile = async (req, res) => {
  try {
    const userId = req.user.id_utilizador;

    // Verificar se o usuário é um formador
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    if (user.id_cargo !== 2) {
      return res.status(400).json({ message: "Este usuário não é um formador" });
    }

    // Buscar o formador com suas categorias e áreas
    const formador = await User.findByPk(userId, {
      include: [
        {
          model: Categoria,
          as: "categorias_formador",
          through: { attributes: [] },
          include: [
            {
              model: Area,
              as: "areas",
              required: false
            }
          ]
        },
        {
          model: Area,
          as: "areas_formador",
          through: { attributes: [] },
          include: [
            {
              model: Categoria,
              as: "categoriaParent",
              attributes: ["id_categoria", "nome"]
            }
          ]
        }
      ]
    });

    // Buscar cursos em que o formador está inscrito
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_utilizador: userId,
        estado: 'inscrito'
      },
      include: [
        {
          model: Curso,
          as: "curso",
          include: [
            {
              model: Categoria,
              as: "categoria",
              attributes: ['nome']
            },
            {
              model: Area,
              as: "area",
              attributes: ['nome']
            }
          ]
        }
      ]
    });

    // Buscar cursos ministrados pelo formador
    const cursosMinistrados = await Curso.findAll({
      where: { id_formador: userId },
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ['nome']
        },
        {
          model: Area,
          as: "area",
          attributes: ['nome']
        }
      ]
    });

    // Organizar as categorias e áreas no formato desejado
    const categoriasComAreas = {};

    // Processar as categorias e suas áreas
    if (formador.categorias_formador && formador.categorias_formador.length > 0) {
      formador.categorias_formador.forEach(categoria => {
        if (!categoriasComAreas[categoria.id_categoria]) {
          categoriasComAreas[categoria.id_categoria] = {
            id: categoria.id_categoria,
            nome: categoria.nome,
            areas: []
          };
        }
      });
    }

    // Processar as áreas e associá-las às suas categorias
    if (formador.areas_formador && formador.areas_formador.length > 0) {
      formador.areas_formador.forEach(area => {
        if (area.categoriaParent && categoriasComAreas[area.categoriaParent.id_categoria]) {
          categoriasComAreas[area.categoriaParent.id_categoria].areas.push({
            id: area.id_area,
            nome: area.nome
          });
        }
      });
    }

    // Converter para um array para facilitar o uso no frontend
    const categoriasFormatadas = Object.values(categoriasComAreas);

    // Formatar os dados dos cursos inscritos
    const cursosInscritos = inscricoes.map(inscricao => ({
      id: inscricao.id_inscricao,
      cursoId: inscricao.curso.id_curso,
      nome: inscricao.curso.nome,
      categoria: inscricao.curso.categoria ? inscricao.curso.categoria.nome : "N/A",
      area: inscricao.curso.area ? inscricao.curso.area.nome : "N/A",
      dataInicio: inscricao.curso.data_inicio,
      dataFim: inscricao.curso.data_fim,
      tipo: inscricao.curso.tipo,
      dataInscricao: inscricao.data_inscricao
    }));

    // Formatar os dados dos cursos ministrados
    const cursosMinistradosFormatados = cursosMinistrados.map(curso => ({
      id: curso.id_curso,
      nome: curso.nome,
      categoria: curso.categoria ? curso.categoria.nome : "N/A",
      area: curso.area ? curso.area.nome : "N/A",
      dataInicio: curso.data_inicio,
      dataFim: curso.data_fim,
      tipo: curso.tipo,
      vagas: curso.vagas
    }));

    // Enviar todos os dados para o frontend
    return res.json({
      categorias: categoriasFormatadas,
      cursosInscritos: cursosInscritos,
      cursosMinistrados: cursosMinistradosFormatados
    });
  } catch (error) {
    console.error("Erro ao buscar perfil do formador:", error);
    return res.status(500).json({
      message: "Erro ao buscar perfil do formador",
      error: error.message
    });
  }
};






module.exports = {
  getAllFormadores,
  getFormadorById,
  getCursosFormador,
  createFormador,
  registerFormador,
  updateFormador,
  deleteFormador,
  getCategoriasFormador,
  addCategoriasFormador,
  removeFormadorCategoria,
  getAreasFormador,
  addAreasFormador,
  removeFormadorArea,
  getFormadorProfile
};