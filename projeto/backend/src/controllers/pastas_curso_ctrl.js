const PastaCurso = require("../database/models/PastaCurso");
const ConteudoCurso = require("../database/models/ConteudoCurso");

// Criar uma nova pasta
const createPasta = async (req, res) => {
  try {
    const { nome, id_topico, ordem } = req.body;

    if (!nome || !id_topico) {
      return res.status(400).json({ message: "Nome e ID do tópico são obrigatórios" });
    }

    const novaPasta = await PastaCurso.create({
      nome,
      id_topico,
      ordem: ordem || 1
    });

    res.status(201).json({ message: "Pasta criada com sucesso", pasta: novaPasta });
  } catch (error) {
    console.error("Erro ao criar pasta:", error);
    res.status(500).json({ message: "Erro ao criar pasta" });
  }
};

// Obter todas as pastas de um tópico com seus conteúdos
const getPastasByTopico = async (req, res) => {
  try {
    const { id_topico } = req.params;
    
    const pastas = await PastaCurso.findAll({
      where: { 
        id_topico,
        ativo: true 
      },
      order: [
        ['ordem', 'ASC'],
        [{ model: ConteudoCurso, as: 'conteudos' }, 'ordem', 'ASC']
      ],
      include: [
        {
          model: ConteudoCurso,
          as: 'conteudos',
          where: { ativo: true },
          required: false
        }
      ]
    });

    // Adicionar propriedade expanded para cada pasta (para frontend)
    const pastasFormatadas = pastas.map(pasta => {
      const pastaObj = pasta.toJSON();
      pastaObj.expanded = false; // inicialmente fechado
      return pastaObj;
    });

    res.json(pastasFormatadas);
  } catch (error) {
    console.error("Erro ao buscar pastas do tópico:", error);
    res.status(500).json({ message: "Erro ao buscar pastas" });
  }
};

// Obter uma pasta específica
const getPastaById = async (req, res) => {
  try {
    const { id } = req.params;

    const pasta = await PastaCurso.findByPk(id, {
      include: [
        {
          model: ConteudoCurso,
          as: 'conteudos',
          where: { ativo: true },
          required: false
        }
      ]
    });

    if (!pasta) {
      return res.status(404).json({ message: "Pasta não encontrada" });
    }

    res.json(pasta);
  } catch (error) {
    console.error("Erro ao buscar pasta:", error);
    res.status(500).json({ message: "Erro ao buscar pasta" });
  }
};

// Atualizar uma pasta
const updatePasta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ordem, ativo } = req.body;

    const pasta = await PastaCurso.findByPk(id);

    if (!pasta) {
      return res.status(404).json({ message: "Pasta não encontrada" });
    }

    // Atualizar campos
    if (nome !== undefined) pasta.nome = nome;
    if (ordem !== undefined) pasta.ordem = ordem;
    if (ativo !== undefined) pasta.ativo = ativo;

    await pasta.save();

    res.json({ message: "Pasta atualizada com sucesso", pasta });
  } catch (error) {
    console.error("Erro ao atualizar pasta:", error);
    res.status(500).json({ message: "Erro ao atualizar pasta" });
  }
};

// Excluir uma pasta (soft delete)
const deletePasta = async (req, res) => {
  try {
    const { id } = req.params;

    const pasta = await PastaCurso.findByPk(id);

    if (!pasta) {
      return res.status(404).json({ message: "Pasta não encontrada" });
    }

    // Soft delete - apenas marcar como inativo
    pasta.ativo = false;
    await pasta.save();

    // Também marcar todos os conteúdos como inativos
    await ConteudoCurso.update(
      { ativo: false },
      { where: { id_pasta: id } }
    );

    res.json({ message: "Pasta removida com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir pasta:", error);
    res.status(500).json({ message: "Erro ao excluir pasta" });
  }
};

module.exports = {
  createPasta,
  getPastasByTopico,
  getPastaById,
  updatePasta,
  deletePasta
};