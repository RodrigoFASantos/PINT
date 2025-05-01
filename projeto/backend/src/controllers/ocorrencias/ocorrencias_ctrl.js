const OcorrenciaCurso = require("../../database/models/OcorrenciaCurso");
const Curso = require("../../database/models/Curso");
const { sequelize } = require("../../config/db");

// Criar nova ocorrência de curso
const criarNovaOcorrencia = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id_curso_original, data_inicio, data_fim, id_formador } = req.body;
    
    // Validar entrada
    if (!id_curso_original || !data_inicio || !data_fim) {
      await transaction.rollback();
      return res.status(400).json({ message: "Dados incompletos para criar nova ocorrência" });
    }
    
    // Buscar curso original
    const cursoOriginal = await Curso.findByPk(id_curso_original, { transaction });
    if (!cursoOriginal) {
      await transaction.rollback();
      return res.status(404).json({ message: "Curso original não encontrado" });
    }
    
    // Verificar último número de edição
    const ultimaOcorrencia = await OcorrenciaCurso.findOne({
      where: { id_curso_original },
      order: [['numero_edicao', 'DESC']],
      transaction
    });
    
    const numeroEdicao = ultimaOcorrencia ? ultimaOcorrencia.numero_edicao + 1 : 1;
    
    // Criar novo curso baseado no original
    const novoCurso = await Curso.create({
      nome: `${cursoOriginal.nome} - Edição ${numeroEdicao}`,
      descricao: cursoOriginal.descricao,
      tipo: cursoOriginal.tipo,
      vagas: cursoOriginal.vagas,
      data_inicio,
      data_fim,
      estado: "planeado",
      ativo: true,
      id_formador: id_formador || cursoOriginal.id_formador,
      id_area: cursoOriginal.id_area,
      imagem_path: cursoOriginal.imagem_path
    }, { transaction });
    
    // Registrar ocorrência
    const novaOcorrencia = await OcorrenciaCurso.create({
      id_curso_original,
      id_curso_nova_ocorrencia: novoCurso.id_curso,
      numero_edicao: numeroEdicao
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      message: "Nova ocorrência do curso criada com sucesso",
      ocorrencia: novaOcorrencia,
      curso: novoCurso
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao criar nova ocorrência:", error);
    res.status(500).json({ message: "Erro ao criar nova ocorrência" });
  }
};

// Listar ocorrências de um curso
const listarOcorrencias = async (req, res) => {
  try {
    const { id_curso } = req.params;
    
    // Buscar todas as ocorrências do curso
    const ocorrencias = await OcorrenciaCurso.findAll({
      where: { id_curso_original: id_curso },
      include: [
        {
          model: Curso,
          as: "curso_nova_ocorrencia",
          attributes: ['id_curso', 'nome', 'data_inicio', 'data_fim', 'estado']
        }
      ],
      order: [['numero_edicao', 'ASC']]
    });
    
    res.json(ocorrencias);
  } catch (error) {
    console.error("Erro ao listar ocorrências:", error);
    res.status(500).json({ message: "Erro ao listar ocorrências do curso" });
  }
};

// Obter detalhes de uma ocorrência específica
const getOcorrenciaById = async (req, res) => {
  try {
    const { id_ocorrencia } = req.params;
    
    const ocorrencia = await OcorrenciaCurso.findByPk(id_ocorrencia, {
      include: [
        {
          model: Curso,
          as: "curso_original",
          attributes: ['id_curso', 'nome', 'data_inicio', 'data_fim', 'estado']
        },
        {
          model: Curso,
          as: "curso_nova_ocorrencia",
          attributes: ['id_curso', 'nome', 'data_inicio', 'data_fim', 'estado']
        }
      ]
    });
    
    if (!ocorrencia) {
      return res.status(404).json({ message: "Ocorrência não encontrada" });
    }
    
    res.json(ocorrencia);
  } catch (error) {
    console.error("Erro ao buscar ocorrência:", error);
    res.status(500).json({ message: "Erro ao buscar ocorrência" });
  }
};

module.exports = {
  criarNovaOcorrencia,
  listarOcorrencias,
  getOcorrenciaById
};