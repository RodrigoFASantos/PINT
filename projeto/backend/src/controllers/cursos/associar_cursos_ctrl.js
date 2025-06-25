const AssociarCursos = require('../../database/models/AssociarCurso');
const Curso = require('../../database/models/Curso');
const { Op } = require('sequelize');

// Criar uma associação entre cursos
const associarCursos = async (req, res) => {
  try {
    const { id_curso_origem, id_curso_destino, descricao } = req.body;
    
    console.log("Dados recebidos para associação:", { id_curso_origem, id_curso_destino, descricao });

    if (!id_curso_origem || !id_curso_destino) {
      console.log("Erro: IDs dos cursos são obrigatórios");
      return res.status(400).json({ message: "IDs dos cursos são obrigatórios", error: "IDS_MISSING" });
    }

    // Verificar se os cursos existem
    const cursoOrigem = await Curso.findByPk(id_curso_origem);
    const cursoDestino = await Curso.findByPk(id_curso_destino);

    console.log("Curso origem encontrado:", !!cursoOrigem, cursoOrigem ? cursoOrigem.nome : "N/A");
    console.log("Curso destino encontrado:", !!cursoDestino, cursoDestino ? cursoDestino.nome : "N/A");

    if (!cursoOrigem || !cursoDestino) {
      console.log("Erro: Um ou ambos os cursos não foram encontrados");
      return res.status(404).json({ 
        message: "Um ou ambos os cursos não foram encontrados",
        error: "CURSO_NOT_FOUND",
        origemExiste: !!cursoOrigem,
        destinoExiste: !!cursoDestino
      });
    }

    // Verificar se a associação já existe em qualquer direção
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

    console.log("Associação já existe:", !!associacaoExistente);

    if (associacaoExistente) {
      console.log("Erro: Associação já existe entre estes cursos");
      return res.status(400).json({ 
        message: "Associação já existe entre estes cursos",
        error: "ASSOCIATION_EXISTS"
      });
    }

    // Criar a associação
    const novaAssociacao = await AssociarCursos.create({
      id_curso_origem,
      id_curso_destino,
      descricao
    });

    console.log("Associação criada com sucesso:", novaAssociacao.id_associacao);

    res.status(201).json({
      message: "Cursos associados com sucesso",
      associacao: novaAssociacao
    });
  } catch (error) {
    console.error("Erro ao associar cursos:", error);
    res.status(500).json({ message: "Erro ao associar cursos", error: error.message });
  }
};

// Obter associações de um curso específico
const getAssociacoesCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;

    console.log("A procurar associações para o curso:", id_curso);

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
          attributes: ['id_curso', 'nome', 'descricao', 'imagem_path', 'tipo', 'estado']
        },
        {
          model: Curso,
          as: 'cursoDestino',
          attributes: ['id_curso', 'nome', 'descricao', 'imagem_path', 'tipo', 'estado']
        }
      ]
    });

    console.log("Encontradas", associacoes.length, "associações para o curso", id_curso);

    res.json(associacoes);
  } catch (error) {
    console.error("Erro ao listar associações do curso:", error);
    res.status(500).json({ message: "Erro ao listar associações do curso", error: error.message });
  }
};

// Remover uma associação específica
const removerAssociacao = async (req, res) => {
  try {
    const { id_associacao } = req.params;

    console.log("A tentar remover associação:", id_associacao);

    const associacao = await AssociarCursos.findByPk(id_associacao);
    
    if (!associacao) {
      console.log("Associação não encontrada:", id_associacao);
      return res.status(404).json({ message: "Associação não encontrada" });
    }

    await associacao.destroy();
    
    console.log("Associação removida com sucesso:", id_associacao);
    
    res.json({ message: "Associação removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover associação:", error);
    res.status(500).json({ message: "Erro ao remover associação", error: error.message });
  }
};

// Obter todas as associações do sistema para administração
const getAllAssociacoes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await AssociarCursos.findAndCountAll({
      include: [
        {
          model: Curso,
          as: 'cursoOrigem',
          attributes: ['id_curso', 'nome', 'descricao', 'imagem_path', 'tipo', 'estado']
        },
        {
          model: Curso,
          as: 'cursoDestino',
          attributes: ['id_curso', 'nome', 'descricao', 'imagem_path', 'tipo', 'estado']
        }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit
    });

    res.json({
      associacoes: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Erro ao listar todas as associações:", error);
    res.status(500).json({ message: "Erro ao listar associações", error: error.message });
  }
};

module.exports = {
  associarCursos,
  getAssociacoesCurso,
  removerAssociacao,
  getAllAssociacoes
};