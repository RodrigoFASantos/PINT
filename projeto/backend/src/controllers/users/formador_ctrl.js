const bcrypt = require('bcrypt');
const { User, Curso, Categoria, Area} = require('../../database/associations');
const FormadorCategoria = require("../../database/models/Formador_Categoria");
const FormadorArea = require("../../database/models/Formador_Area");
const { Op } = require('sequelize');

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

// Atualizar cargo de usuário para formador (id_cargo = 2)
const createFormador = async (req, res) => {
  try {
    const { id_utilizador, nome, email, telefone, idade, password, morada, codigo_postal } = req.body;
    
    console.log("📋 Criando formador com dados:", { 
      nome, email, telefone
    });
    
    // Verificação inicial
    if (!email) {
      return res.status(400).json({ message: "Email é obrigatório" });
    }
    
    // Verificar se já existe um usuário com este email
    let usuario = await User.findOne({
      where: { 
        email: email
      }
    });
    
    // Se o usuário já existir, verificamos se podemos atualizá-lo para formador
    if (usuario) {
      console.log(`📝 Usuário com email ${email} já existe, atualizando para formador`);
      
      // Verificar se já é um formador
      if (usuario.id_cargo === 2) {
        return res.status(400).json({ message: "Este usuário já é um formador" });
      }
      
      // Atualizar para formador
      await usuario.update({
        id_cargo: 2,
        ...(nome && { nome }),
        ...(telefone && { telefone })
      });
    } else {
      // Se o usuário não existir, criamos um novo
      console.log(`📝 Criando novo usuário formador com email ${email}`);
      
      // Verificar campos obrigatórios para novo usuário
      if (!nome || !password || !idade || !telefone || !morada || !codigo_postal) {
        return res.status(400).json({ 
          message: "Dados incompletos para criar usuário", 
          campos_necessarios: "nome, email, password, idade, telefone, morada, codigo_postal" 
        });
      }
      
      // Gerar hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Usar AVATAR.png padrão - sem processamento de imagem
      const foto_perfil = 'AVATAR.png';
      
      // Criar o usuário com cargo de formador
      usuario = await User.create({
        nome,
        email,
        password: hashedPassword,
        idade: parseInt(idade),
        telefone,
        morada,
        codigo_postal,
        id_cargo: 2, // Formador
        foto_perfil,
        primeiro_login: 1 // Primeiro login
      });
    }
    
    // Verificação de sucesso
    if (!usuario) {
      return res.status(500).json({ message: "Erro ao criar ou atualizar usuário" });
    }
    
    return res.status(200).json({
      message: "Usuário criado/promovido a formador com sucesso",
      formador: usuario
    });
  } catch (error) {
    console.error("❌ Erro ao criar formador:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Erro ao criar formador", error: error.message });
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

// NOVAS FUNÇÕES PARA GERENCIAR CATEGORIAS E ÁREAS DOS FORMADORES

// Obter categorias de um formador
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

// Obter áreas de um formador
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

module.exports = {
  getAllFormadores,
  getFormadorById,
  getCursosFormador,
  createFormador,
  updateFormador,
  deleteFormador,
  getCategoriasFormador,
  addCategoriasFormador,
  removeFormadorCategoria,
  getAreasFormador,
  addAreasFormador,
  removeFormadorArea
};