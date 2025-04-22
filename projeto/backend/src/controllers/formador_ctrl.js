const { User, Curso } = require('../database/associations');
const { Op } = require('sequelize');

// Tenta importar o modelo Formador, se existir
let Formador;
try {
  Formador = require('../models/Formador');
  console.log("✅ Modelo Formador importado com sucesso");
} catch (error) {
  console.log("⚠️ Modelo Formador não encontrado, usando apenas o modelo User:", error.message);
}

// Obter todos os formadores com paginação
const getAllFormadores = async (req, res) => {
  try {
    console.log("📋 Buscando lista de formadores");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Busca usuários com cargo de formador (id_cargo = 2)
    console.log("🔍 Buscando na tabela User com id_cargo = 2");
    let formadores, count;
    
    try {
      const result = await User.findAndCountAll({
        where: {
          id_cargo: 2 
        },
        limit,
        offset,
        order: [['nome', 'ASC']]
      });
      
      formadores = result.rows;
      count = result.count;
      
      console.log(`✅ Encontrados ${count} formadores na tabela User`);
      if (formadores.length > 0) {
        console.log("📊 IDs dos formadores encontrados:", formadores.map(f => f.id));
      }
    } catch (userError) {
      console.error("❌ Erro ao buscar na tabela User:", userError.message);
      console.error(userError.stack);
      
      // Se ocorrer erro, vai tentar na tabela Formador
      formadores = [];
      count = 0;
    }
    
    // Se não encontrou ou deu erro, tenta na tabela Formador se existir
    if ((formadores.length === 0) && Formador) {
      console.log("🔍 Tentando buscar na tabela Formador");
      try {
        const formadorResult = await Formador.findAndCountAll({
          limit,
          offset,
          order: [['nome', 'ASC']]
        });
        
        formadores = formadorResult.rows;
        count = formadorResult.count;
        
        console.log(`✅ Encontrados ${count} formadores na tabela Formador`);
        if (formadores.length > 0) {
          console.log("📊 IDs dos formadores encontrados:", formadores.map(f => f.id));
        }
      } catch (formadorError) {
        console.error("❌ Erro ao buscar na tabela Formador:", formadorError.message);
        console.error(formadorError.stack);
      }
    }
    
    return res.json({
      formadores,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
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
    console.log("Formador disponível:", !!Formador);
    console.log("Curso disponível:", !!Curso);
    
    // Primeiro, verifica se existe um usuário com esse ID
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
        }
      }
    } catch (userError) {
      console.error("❌ Erro ao buscar usuário:", userError.message);
      console.error(userError.stack);
    }
    
    // Se é um formador (id_cargo = 2), busca os cursos
    if (usuario && usuario.id_cargo === 2) {
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
    }
    
    // Se não encontrou na tabela User ou não é formador, tenta na tabela Formador
    if (Formador) {
      console.log(`🔍 Buscando na tabela Formador com ID: ${id}`);
      
      let formador = null;
      try {
        formador = await Formador.findOne({
          where: {
            [Op.or]: [
              { id: id },
              { id_utilizador: id }
            ]
          }
        });
        console.log("Formador encontrado na tabela Formador:", formador ? "✅ Sim" : "❌ Não");
        
        if (formador) {
          // Buscar cursos ministrados
          console.log(`🔍 Buscando cursos para o formador ID: ${formador.id_utilizador || id}`);
          
          let cursos = [];
          try {
            cursos = await Curso.findAll({
              where: {
                id_formador: formador.id_utilizador || id
              }
            });
            console.log(`✅ Encontrados ${cursos.length} cursos para o formador`);
          } catch (cursosError) {
            console.error("❌ Erro ao buscar cursos:", cursosError.message);
            console.error(cursosError.stack);
            cursos = [];
          }
          
          console.log("✅ Retornando dados do formador a partir da tabela Formador");
          return res.json({
            ...formador.toJSON(),
            cursos_ministrados: cursos
          });
        }
      } catch (formadorError) {
        console.error("❌ Erro ao buscar na tabela Formador:", formadorError.message);
        console.error(formadorError.stack);
      }
    }
    
    // Se chegou aqui, não encontrou o formador
    console.log("❌ Nenhum formador encontrado com o ID:", id);
    return res.status(404).json({ message: "Formador não encontrado" });
    
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

// Criar formador - apenas se o modelo Formador existir
const createFormador = async (req, res) => {
  try {
    if (!Formador) {
      return res.status(501).json({ 
        message: "Funcionalidade não implementada. O modelo Formador não está disponível." 
      });
    }
    
    const { id_utilizador, nome, email, foto_perfil, telefone, data_nascimento, biografia, area_especializacao, departamento, competencias } = req.body;
    
    // Verifica se já existe um formador com o mesmo id_utilizador
    const formadorExistente = await Formador.findOne({
      where: { 
        [Op.or]: [
          { id_utilizador },
          { email }
        ]
      }
    });
    
    if (formadorExistente) {
      return res.status(400).json({ message: "Já existe um formador cadastrado com este ID de utilizador ou email" });
    }
    
    const novoFormador = await Formador.create({
      id_utilizador,
      nome,
      email,
      foto_perfil,
      telefone,
      idade: req.body.idade,
      foto_capa: req.body.foto_capa
    });
    
    return res.status(201).json(novoFormador);
  } catch (error) {
    console.error("❌ Erro ao criar formador:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Erro ao criar formador", error: error.message });
  }
};

// Atualizar formador - apenas se o modelo Formador existir
const updateFormador = async (req, res) => {
  try {
    if (!Formador) {
      return res.status(501).json({ 
        message: "Funcionalidade não implementada. O modelo Formador não está disponível." 
      });
    }
    
    const { id } = req.params;
    const { nome, email, foto_perfil, telefone, data_nascimento, biografia, area_especializacao, departamento, competencias } = req.body;
    
    const formador = await Formador.findByPk(id);
    
    if (!formador) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }
    
    await formador.update({
      nome,
      email,
      foto_perfil,
      telefone,
      idade: req.body.idade,
      foto_capa: req.body.foto_capa
    });
    
    return res.json(formador);
  } catch (error) {
    console.error("❌ Erro ao atualizar formador:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Erro ao atualizar formador", error: error.message });
  }
};

// Excluir formador - apenas se o modelo Formador existir
const deleteFormador = async (req, res) => {
  try {
    if (!Formador) {
      return res.status(501).json({ 
        message: "Funcionalidade não implementada. O modelo Formador não está disponível." 
      });
    }
    
    const { id } = req.params;
    
    const formador = await Formador.findByPk(id);
    
    if (!formador) {
      return res.status(404).json({ message: "Formador não encontrado" });
    }
    
    await formador.destroy();
    
    return res.json({ message: "Formador excluído com sucesso" });
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