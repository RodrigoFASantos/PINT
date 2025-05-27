const { Op } = require('sequelize');
const User = require('../../database/models/User');
const Inscricao_Curso = require('../../database/models/Inscricao_Curso');
const Curso = require('../../database/models/Curso');
const Categoria = require('../../database/models/Categoria');
const Area = require('../../database/models/Area');
const Avaliacao = require('../../database/models/Avaliacao');

/*
 FUNÇÕES DE CONSULTA PERCURSO FORMANDOS
*/

const buscarSugestoesFormandos = async (req, res) => {
  try {
    const { termo } = req.query;
    
    // Condições de busca
    let whereConditions = {};
    if (termo && termo.length >= 1) {
      whereConditions = {
        [Op.or]: [
          { nome: { [Op.like]: `%${termo}%` } },
          { email: { [Op.like]: `%${termo}%` } }
        ]
      };
    }

    // Buscar utilizadores
    const users = await User.findAll({
      where: whereConditions,
      attributes: ['id_utilizador', 'nome', 'email'],
      order: [['nome', 'ASC']],
      limit: termo ? 50 : 200
    });

    // Filtrar apenas os que têm inscrições
    const formandosComInscricoes = [];
    
    for (const user of users) {
      const temInscricoes = await Inscricao_Curso.count({
        where: { id_utilizador: user.id_utilizador }
      });
      
      if (temInscricoes > 0) {
        formandosComInscricoes.push({
          id: user.id_utilizador,
          nome: user.nome,
          email: user.email
        });
      }
    }

    res.json(formandosComInscricoes);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar formandos" });
  }
};

const getPercursoFormandos = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: "Email do formando é obrigatório" });
    }

    // Buscar utilizador
    const utilizador = await User.findOne({
      where: { email: email.toLowerCase().trim() },
      attributes: ['id_utilizador', 'nome', 'email']
    });

    if (!utilizador) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Buscar inscrições do formando
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_utilizador: utilizador.id_utilizador },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email']
        },
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'nome', 'data_inicio', 'data_fim', 'duracao', 'estado'],
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['nome'],
              required: false
            },
            {
              model: Area,
              as: 'area',
              attributes: ['nome'],
              required: false
            }
          ]
        },
        {
          model: Avaliacao,
          as: 'avaliacao',
          attributes: ['nota', 'horas_presenca', 'certificado', 'data_avaliacao'],
          required: false
        }
      ],
      order: [
        [{ model: Curso, as: 'curso' }, 'data_inicio', 'DESC']
      ]
    });

    if (inscricoes.length === 0) {
      return res.status(404).json({ message: "Nenhuma inscrição encontrada para este formando" });
    }

    // Formatar dados para o frontend
    const dadosFormatados = inscricoes.map(inscricao => {
      const curso = inscricao.curso;
      const avaliacao = inscricao.avaliacao;
      
      return {
        emailUtilizador: utilizador.email,
        nomeUtilizador: utilizador.nome,
        cursoId: curso.id_curso,
        nomeCurso: curso.nome,
        categoria: curso.categoria?.nome || 'Não especificada',
        area: curso.area?.nome || 'Não especificada',
        dataInicio: curso.data_inicio,
        dataFim: curso.data_fim,
        cargaHorariaReal: avaliacao?.horas_presenca || curso.duracao || 0,
        cargaHorariaCurso: curso.duracao || 0,
        estadoCurso: curso.estado,
        notaFinal: avaliacao?.nota || null,
        horasPresenca: avaliacao?.horas_presenca || 0,
        certificado: avaliacao?.certificado || false,
        dataAvaliacao: avaliacao?.data_avaliacao || null,
        dataInscricao: inscricao.data_inscricao,
        inscricaoAtiva: inscricao.ativo,
        status: determinarStatusCurso(curso, avaliacao)
      };
    });

    res.json(dadosFormatados);
  } catch (error) {
    console.error("Erro ao obter percurso formativo:", error);
    res.status(500).json({ message: "Erro ao obter percurso formativo" });
  }
};

const getEstatisticasGerais = async (req, res) => {
  try {
    const totalInscricoes = await Inscricao_Curso.count();
    const inscricoesAtivas = await Inscricao_Curso.count({ where: { ativo: true } });
    
    let certificadosEmitidos = 0;
    let mediaGeral = 'N/A';
    
    try {
      certificadosEmitidos = await Avaliacao.count({ where: { certificado: true } });
      
      const mediaResult = await Avaliacao.findOne({
        attributes: [[Avaliacao.sequelize.fn('AVG', Avaliacao.sequelize.col('nota')), 'media']],
        where: { nota: { [Op.not]: null } },
        raw: true
      });
      
      if (mediaResult?.media) {
        mediaGeral = parseFloat(mediaResult.media).toFixed(1);
      }
    } catch (error) {
      console.warn('Erro ao calcular estatísticas avançadas');
    }

    const estatisticas = {
      totalFormandos: 0,
      totalInscricoes,
      inscricoesAtivas,
      certificadosEmitidos,
      mediaGeral,
      taxaAtividade: totalInscricoes > 0 ? ((inscricoesAtivas / totalInscricoes) * 100).toFixed(1) : '0.0',
      taxaCertificacao: totalInscricoes > 0 ? ((certificadosEmitidos / totalInscricoes) * 100).toFixed(1) : '0.0'
    };

    res.json(estatisticas);
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    res.status(500).json({ message: "Erro ao calcular estatísticas" });
  }
};

/**
 * Função auxiliar para determinar o status do curso
 */
const determinarStatusCurso = (curso, avaliacao) => {
  try {
    const hoje = new Date();
    const dataInicio = curso.data_inicio ? new Date(curso.data_inicio) : null;
    const dataFim = curso.data_fim ? new Date(curso.data_fim) : null;
    
    if (avaliacao && avaliacao.certificado) {
      return 'Concluído';
    }
    
    if (avaliacao && avaliacao.nota !== null && dataFim && dataFim < hoje) {
      return 'Concluído';
    }
    
    if (dataInicio && dataInicio > hoje) {
      return 'Agendado';
    }
    
    if (dataFim && dataFim < hoje) {
      return 'Terminado';
    }
    
    if (dataInicio && dataInicio <= hoje && dataFim && dataFim >= hoje) {
      return 'Em Andamento';
    }
    
    return curso.estado === 'planeado' ? 'Agendado' : 
           curso.estado === 'em_curso' ? 'Em Andamento' : 
           curso.estado === 'terminado' ? 'Terminado' : 'Indefinido';
  } catch (error) {
    return 'Indefinido';
  }
};

module.exports = {
  buscarSugestoesFormandos,
  getPercursoFormandos,
  getEstatisticasGerais
};