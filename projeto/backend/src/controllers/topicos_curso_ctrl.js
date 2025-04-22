const TopicoCurso = require("../database/models/TopicoCurso");
const PastaCurso = require("../database/models/PastaCurso");
const ConteudoCurso = require("../database/models/ConteudoCurso");

// Obter todos os tópicos de um curso com suas pastas e conteúdos
const getTopicosByCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;
    
    const topicos = await TopicoCurso.findAll({
      where: { 
        id_curso,
        ativo: true 
      },
      order: [
        ['ordem', 'ASC'],
        [{ model: PastaCurso, as: 'pastas' }, 'ordem', 'ASC'],
        [{ model: PastaCurso, as: 'pastas' }, { model: ConteudoCurso, as: 'conteudos' }, 'ordem', 'ASC']
      ],
      include: [
        {
          model: PastaCurso,
          as: 'pastas',
          where: { ativo: true },
          required: false,
          include: [
            {
              model: ConteudoCurso,
              as: 'conteudos',
              where: { ativo: true },
              required: false
            }
          ]
        }
      ]
    });

    // Adicionar propriedade expanded para cada tópico e pasta (para frontend)
    const topicosFormatados = topicos.map(topico => {
      const topicoObj = topico.toJSON();
      topicoObj.expanded = false; // inicialmente fechado
      
      if (topicoObj.pastas) {
        topicoObj.pastas = topicoObj.pastas.map(pasta => {
          pasta.expanded = false; // inicialmente fechado
          return pasta;
        });
      }
      
      return topicoObj;
    });

    res.json(topicosFormatados);
  } catch (error) {
    console.error("Erro ao buscar tópicos do curso:", error);
    res.status(500).json({ message: "Erro ao buscar tópicos" });
  }
};

// Criar um novo tópico
const createTopico = async (req, res) => {
  try {
    const { nome, id_curso, ordem } = req.body;

    if (!nome || !id_curso) {
      return res.status(400).json({ message: "Nome e ID do curso são obrigatórios" });
    }

    const novoTopico = await TopicoCurso.create({
      nome,
      id_curso,
      ordem: ordem || 1
    });

    res.status(201).json({ message: "Tópico criado com sucesso", topico: novoTopico });
  } catch (error) {
    console.error("Erro ao criar tópico:", error);
    res.status(500).json({ message: "Erro ao criar tópico" });
  }
};

// Obter um tópico específico
const getTopicoById = async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await TopicoCurso.findByPk(id, {
      include: [
        {
          model: PastaCurso,
          as: 'pastas',
          where: { ativo: true },
          required: false,
          include: [
            {
              model: ConteudoCurso,
              as: 'conteudos',
              where: { ativo: true },
              required: false
            }
          ]
        }
      ]
    });

    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    res.json(topico);
  } catch (error) {
    console.error("Erro ao buscar tópico:", error);
    res.status(500).json({ message: "Erro ao buscar tópico" });
  }
};

// Atualizar um tópico
const updateTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ordem, ativo } = req.body;

    const topico = await TopicoCurso.findByPk(id);

    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    // Atualizar campos
    if (nome !== undefined) topico.nome = nome;
    if (ordem !== undefined) topico.ordem = ordem;
    if (ativo !== undefined) topico.ativo = ativo;

    await topico.save();

    res.json({ message: "Tópico atualizado com sucesso", topico });
  } catch (error) {
    console.error("Erro ao atualizar tópico:", error);
    res.status(500).json({ message: "Erro ao atualizar tópico" });
  }
};

// Excluir um tópico (soft delete)
const deleteTopico = async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await TopicoCurso.findByPk(id);

    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    // Soft delete - apenas marcar como inativo
    topico.ativo = false;
    await topico.save();

    // Também marcar todas as pastas e conteúdos como inativos
    await PastaCurso.update(
      { ativo: false },
      { where: { id_topico: id } }
    );

    // Buscar todas as pastas deste tópico
    const pastas = await PastaCurso.findAll({
      where: { id_topico: id },
      attributes: ['id_pasta']
    });

    const pastaIds = pastas.map(pasta => pasta.id_pasta);

    // Marcar conteúdos como inativos
    if (pastaIds.length > 0) {
      await ConteudoCurso.update(
        { ativo: false },
        { where: { id_pasta: pastaIds } }
      );
    }

    res.json({ message: "Tópico removido com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir tópico:", error);
    res.status(500).json({ message: "Erro ao excluir tópico" });
  }
};

module.exports = {
  getTopicosByCurso,
  createTopico,
  getTopicoById,
  updateTopico,
  deleteTopico
};