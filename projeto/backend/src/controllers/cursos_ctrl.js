const Curso = require("../database/models/Curso");
const Area = require("../database/models/Area");
const Categoria = require("../database/models/Categoria");
const User = require("../database/models/User");
const Conteudo = require("../database/models/Conteudo");
const Inscricao_Curso = require("../database/models/Inscricao_Curso");

// Obter todos os cursos com paginação
const getAllCursos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Curso.findAndCountAll({
      offset,
      limit,
      order: [['data_inicio', 'DESC']] // ordena por data de início (opcional)
    });

    res.json({
      cursos: rows,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);
    res.status(500).json({ message: "Erro ao buscar cursos" });
  }
};


// Criar um novo curso (recebe req.file da rota)
const createCurso = async (req, res) => {
  try {
    const { nome, descricao, tipo, vagas, data_inicio, data_fim, id_formador, id_area } = req.body;
    const imagem = req.file ? req.file.path : null;

    if (!nome || !tipo || !data_inicio || !data_fim || !id_area) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    const novoCurso = await Curso.create({
      nome,
      descricao,
      tipo,
      vagas: tipo === "sincrono" ? vagas : null,
      data_inicio,
      data_fim,
      id_formador,
      id_area,
      imagem_path: imagem // Guardar o caminho na BD, tipo "uploads/cursos/1710618592334.png"
    });

    res.status(201).json({ message: "Curso criado com sucesso!", curso: novoCurso });
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    res.status(500).json({ message: "Erro no servidor ao criar curso." });
  }
};

// Buscar curso por ID com detalhes
const getCursoById = async (req, res) => {
  try {
    const id = req.params.id;

    const curso = await Curso.findByPk(id, {
      include: [
        {
          model: Area,
          as: "area",
          include: { model: Categoria, as: "categoria" }
        },
        { model: Conteudo, as: "conteudos" },
        {
          model: User,
          as: "formador",
          attributes: ['id_utilizador', 'nome', 'email']
        }
      ]
    });

    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    res.json(curso);
  } catch (error) {
    console.error("Erro ao buscar curso:", error);
    res.status(500).json({ message: "Erro ao buscar curso" });
  }
};

// Listar inscrições de um curso
const getInscricoesCurso = async (req, res) => {
  try {
    const id_curso = req.params.id;

    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso },
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ['id_utilizador', 'nome', 'email', 'telefone']
        }
      ]
    });

    res.json(inscricoes);
  } catch (error) {
    console.error("Erro ao buscar inscrições do curso:", error);
    res.status(500).json({ message: "Erro ao buscar inscrições" });
  }
};

// Atualizar curso existente
const updateCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area } = req.body;

    const curso = await Curso.findByPk(id);

    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    // Atualizar campos
    if (nome) curso.nome = nome;
    if (descricao !== undefined) curso.descricao = descricao;
    if (tipo) curso.tipo = tipo;
    if (vagas !== undefined) curso.vagas = vagas;
    if (data_inicio) curso.data_inicio = data_inicio;
    if (data_fim) curso.data_fim = data_fim;
    if (estado) curso.estado = estado;
    if (ativo !== undefined) curso.ativo = ativo;
    if (id_formador) curso.id_formador = id_formador;
    if (id_area) curso.id_area = id_area;

    await curso.save();

    res.json({ message: "Curso atualizado com sucesso!", curso });
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    res.status(500).json({ message: "Erro no servidor ao atualizar curso." });
  }
};

// Excluir curso
const deleteCurso = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findByPk(id);

    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    await curso.destroy();

    res.json({ message: "Curso excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir curso:", error);
    res.status(500).json({ message: "Erro no servidor ao excluir curso." });
  }
};

module.exports = { getAllCursos, createCurso, getCursoById, getInscricoesCurso, updateCurso, deleteCurso };