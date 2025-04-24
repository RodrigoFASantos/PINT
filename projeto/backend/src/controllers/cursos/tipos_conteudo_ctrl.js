const TipoConteudo = require("../../database/models/TipoConteudo");

// Listar todos os tipos de conteúdo
const getAllTiposConteudo = async (req, res) => {
  try {
    const tipos = await TipoConteudo.findAll({
      where: { ativo: true },
      order: [['nome', 'ASC']]
    });
    res.json(tipos);
  } catch (error) {
    console.error("Erro ao buscar tipos de conteúdo:", error);
    res.status(500).json({ message: "Erro ao buscar tipos de conteúdo" });
  }
};

// Criar novo tipo de conteúdo
const createTipoConteudo = async (req, res) => {
  try {
    const { nome, icone, descricao } = req.body;
    
    if (!nome) {
      return res.status(400).json({ message: "Nome é obrigatório para o tipo de conteúdo" });
    }
    
    // Verificar se já existe
    const tipoExistente = await TipoConteudo.findOne({ where: { nome } });
    if (tipoExistente) {
      return res.status(400).json({ message: "Já existe um tipo de conteúdo com este nome" });
    }
    
    const novoTipo = await TipoConteudo.create({
      nome,
      icone,
      descricao
    });
    
    res.status(201).json({
      message: "Tipo de conteúdo criado com sucesso",
      tipo: novoTipo
    });
  } catch (error) {
    console.error("Erro ao criar tipo de conteúdo:", error);
    res.status(500).json({ message: "Erro ao criar tipo de conteúdo" });
  }
};

// Atualizar tipo de conteúdo
const updateTipoConteudo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, icone, descricao, ativo } = req.body;
    
    const tipo = await TipoConteudo.findByPk(id);
    if (!tipo) {
      return res.status(404).json({ message: "Tipo de conteúdo não encontrado" });
    }
    
    // Atualizar campos
    if (nome) tipo.nome = nome;
    if (icone !== undefined) tipo.icone = icone;
    if (descricao !== undefined) tipo.descricao = descricao;
    if (ativo !== undefined) tipo.ativo = ativo;
    
    await tipo.save();
    
    res.json({
      message: "Tipo de conteúdo atualizado com sucesso",
      tipo
    });
  } catch (error) {
    console.error("Erro ao atualizar tipo de conteúdo:", error);
    res.status(500).json({ message: "Erro ao atualizar tipo de conteúdo" });
  }
};

// Desativar tipo de conteúdo
const deleteTipoConteudo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tipo = await TipoConteudo.findByPk(id);
    if (!tipo) {
      return res.status(404).json({ message: "Tipo de conteúdo não encontrado" });
    }
    
    // Desativar em vez de excluir permanentemente
    await tipo.update({ ativo: false });
    
    res.json({
      message: "Tipo de conteúdo desativado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao desativar tipo de conteúdo:", error);
    res.status(500).json({ message: "Erro ao desativar tipo de conteúdo" });
  }
};

module.exports = {
  getAllTiposConteudo,
  createTipoConteudo,
  updateTipoConteudo,
  deleteTipoConteudo
};