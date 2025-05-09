const AssociarCursos = require('../../database/models/AssociarCurso');
const Curso = require('../../database/models/Curso');
const { Op } = require('sequelize');

// Criar uma associação entre cursos
const associarCursos = async (req, res) => {
  try {
    const { id_curso_origem, id_curso_destino, descricao } = req.body;

    if (!id_curso_origem || !id_curso_destino) {
      return res.status(400).json({ message: "IDs dos cursos são obrigatórios" });
    }

    // Verificar se os cursos existem
    const cursoOrigem = await Curso.findByPk(id_curso_origem);
    const cursoDestino = await Curso.findByPk(id_curso_destino);

    if (!cursoOrigem || !cursoDestino) {
      return res.status(404).json({ message: "Um ou ambos os cursos não foram encontrados" });
    }

    // Verificar se a associação já existe
    const associacaoExistente = await AssociarCursos.findOne({
      where: {
        [Op.or]: [
          {
            id_curso_origem: id_curso_origem,
            id_curso_destino: id_curso_destino
          },
          {
            id_curso_origem: id_curso_destino,
            id_curso_destino: id_curso_origem
          }
        ]
      }
    });

    if (associacaoExistente) {
      return res.status(400).json({ message: "Associação já existe entre estes cursos" });
    }

    // Criar a associação
    const novaAssociacao = await AssociarCursos.create({
      id_curso_origem,
      id_curso_destino,
      descricao
    });

    res.status(201).json({
      message: "Cursos associados com sucesso",
      associacao: novaAssociacao
    });
  } catch (error) {
    console.error("Erro ao associar cursos:", error);
    res.status(500).json({ message: "Erro ao associar cursos", error: error.message });
  }
};

// Obter associações de um curso
const getAssociacoesCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;

    // Curso pode ser origem ou destino na associação
    const associacoes = await AssociarCursos.findAll({
      where: {
        [Op.or]: [
          { id_curso_origem: id_curso },
          { id_curso_destino: id_curso }
        ]
      },
      include: [
        {
          model: Curso,
          as: 'cursoOrigem',
          attributes: ['id_curso', 'nome', 'descricao', 'imagem_path']
        },
        {
          model: Curso,
          as: 'cursoDestino',
          attributes: ['id_curso', 'nome', 'descricao', 'imagem_path']
        }
      ]
    });

    res.json(associacoes);
  } catch (error) {
    console.error("Erro ao listar associações do curso:", error);
    res.status(500).json({ message: "Erro ao listar associações do curso", error: error.message });
  }
};

// Remover uma associação
const removerAssociacao = async (req, res) => {
  try {
    const { id_associacao } = req.params;

    const associacao = await AssociarCursos.findByPk(id_associacao);
    if (!associacao) {
      return res.status(404).json({ message: "Associação não encontrada" });
    }

    await associacao.destroy();
    res.json({ message: "Associação removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover associação:", error);
    res.status(500).json({ message: "Erro ao remover associação", error: error.message });
  }
};

module.exports = {
  associarCursos,
  getAssociacoesCurso,
  removerAssociacao
};