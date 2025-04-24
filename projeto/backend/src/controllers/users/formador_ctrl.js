const { User, Curso } = require('../../database/associations');
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
        limit,
        offset,
        order: [['nome', 'ASC']]
      });
      
      const formadores = result.rows;
      const count = result.count;
      
      console.log(`✅ Encontrados ${count} formadores na tabela User`);
      if (formadores.length > 0) {
        console.log("📊 IDs dos formadores encontrados:", formadores.map(f => f.id));
      }
      
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
    
    // Para debug, vamos verificar as tabelas disponíveis
    console.log("📊 Verificando tabelas disponíveis:");
    console.log("User disponível:", !!User);
    console.log("Curso disponível:", !!Curso);
    
    // Verifica se existe um usuário com esse ID e que seja formador
    let usuario = null;
    try {
      console.log(`🔍 Buscando usuário com ID: ${id}`);
      usuario = await User.findByPk(id);
      console.log("Usuário encontrado:", usuario ? "✅ Sim" : "❌ Não");
      
      if (usuario) {
        console.log(`Cargo do usuário: ${usuario.id_cargo}`);
        
        // Se o usuário NÃO for um formador (id_cargo != 2), vamos logar isso
        if (usuario.id_cargo !== 2) {
          console.log("⚠️ ATENÇÃO: O usuário encontrado NÃO é um formador (id_cargo != 2)");
          return res.status(404).json({ message: "Formador não encontrado" });
        }
      } else {
        return res.status(404).json({ message: "Formador não encontrado" });
      }
    } catch (userError) {
      console.error("❌ Erro ao buscar usuário:", userError.message);
      console.error(userError.stack);
      return res.status(500).json({ message: "Erro ao buscar formador", error: userError.message });
    }
    
    // Se é um formador (id_cargo = 2), busca os cursos
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
    const { id_utilizador, nome, email, foto_perfil, telefone } = req.body;
    
    // Verificar se o usuário existe
    let usuario = await User.findOne({
      where: { 
        [Op.or]: [
          { id: id_utilizador },
          { email }
        ]
      }
    });
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    
    // Verificar se já é um formador
    if (usuario.id_cargo === 2) {
      return res.status(400).json({ message: "Este usuário já é um formador" });
    }
    
    // Atualizar para formador
    await usuario.update({
      id_cargo: 2,
      ...(nome && { nome }),
      ...(foto_perfil && { foto_perfil }),
      ...(telefone && { telefone })
    });
    
    return res.status(200).json({
      message: "Usuário promovido a formador com sucesso",
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
    const { nome, email, foto_perfil, telefone, data_nascimento, biografia, area_especializacao, departamento, competencias } = req.body;
    
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
      ...(biografia && { biografia }),
      ...(area_especializacao && { area_especializacao }),
      ...(departamento && { departamento }),
      ...(competencias && { competencias })
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

module.exports = {
  getAllFormadores,
  getFormadorById,
  getCursosFormador,
  createFormador,
  updateFormador,
  deleteFormador
};