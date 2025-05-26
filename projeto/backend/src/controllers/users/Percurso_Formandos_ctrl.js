const { Op } = require('sequelize');
const Inscricao_Curso = require('../../database/models/Inscricao_Curso');
const User = require('../../database/models/User');
const Curso = require('../../database/models/Curso');
const Categoria = require('../../database/models/Categoria');
const Area = require('../../database/models/Area');
const Avaliacao = require('../../database/models/Avaliacao');

/**
 * @desc Obter o percurso formativo de todos os formandos
 * @route GET /admin/percurso-formandos
 * @access Private (Admin only)
 */
const getPercursoFormandos = async (req, res) => {
  try {
    console.log('📊 A processar pedido de percurso formativo dos formandos...');

    // Buscar todas as inscrições com dados relacionados
    const inscricoes = await Inscricao_Curso.findAll({
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email'],
          required: true
        },
        {
          model: Curso,
          as: 'curso',
          attributes: [
            'id_curso',
            'nome',
            'data_inicio',
            'data_fim',
            'duracao',
            'estado'
          ],
          required: true,
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['id_categoria', 'nome'],
              required: false
            },
            {
              model: Area,
              as: 'area',
              attributes: ['id_area', 'nome'],
              required: false
            }
          ]
        },
        {
          model: Avaliacao,
          as: 'avaliacao',
          attributes: [
            'nota',
            'horas_presenca',
            'horas_totais',
            'certificado',
            'data_avaliacao'
          ],
          required: false
        }
      ],
      attributes: [
        'id_inscricao',
        'data_inscricao',
        'ativo'
      ],
      order: [
        [{ model: User, as: 'utilizador' }, 'nome', 'ASC'],
        [{ model: Curso, as: 'curso' }, 'data_inicio', 'DESC']
      ]
    });

    console.log(`📋 Encontradas ${inscricoes.length} inscrições`);

    // Transformar os dados para o formato esperado pelo frontend
    const dadosFormatados = inscricoes.map(inscricao => {
      const utilizador = inscricao.utilizador;
      const curso = inscricao.curso;
      const avaliacao = inscricao.avaliacao;
      const categoria = curso.categoria;
      const area = curso.area;

      return {
        // Dados do utilizador
        emailUtilizador: utilizador.email,
        nomeUtilizador: utilizador.nome,
        
        // Dados do curso
        cursoId: curso.id_curso,
        nomeCurso: curso.nome,
        categoria: categoria ? categoria.nome : 'Não especificada',
        area: area ? area.nome : 'Não especificada',
        dataInicio: curso.data_inicio,
        dataFim: curso.data_fim,
        cargaHoraria: curso.duracao || 0,
        estadoCurso: curso.estado,
        
        // Dados da avaliação
        notaFinal: avaliacao ? avaliacao.nota : null,
        horasPresenca: avaliacao ? avaliacao.horas_presenca : null,
        horasTotais: avaliacao ? avaliacao.horas_totais : null,
        certificado: avaliacao ? avaliacao.certificado : false,
        dataAvaliacao: avaliacao ? avaliacao.data_avaliacao : null,
        
        // Dados da inscrição
        dataInscricao: inscricao.data_inscricao,
        inscricaoAtiva: inscricao.ativo,
        
        // Status calculado (pode ser usado pelo frontend se necessário)
        status: determinarStatusCurso(curso, avaliacao)
      };
    });

    console.log('✅ Dados formatados com sucesso');
    
    res.status(200).json(dadosFormatados);

  } catch (error) {
    console.error('❌ Erro ao obter percurso formativo dos formandos:', error);
    
    res.status(500).json({
      message: 'Erro interno do servidor ao obter percurso formativo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Função auxiliar para determinar o status do curso
 * @param {Object} curso - Dados do curso
 * @param {Object} avaliacao - Dados da avaliação (pode ser null)
 * @returns {string} Status do curso
 */
const determinarStatusCurso = (curso, avaliacao) => {
  const hoje = new Date();
  const dataInicio = curso.data_inicio ? new Date(curso.data_inicio) : null;
  const dataFim = curso.data_fim ? new Date(curso.data_fim) : null;
  
  // Se tem avaliação com certificado, está concluído
  if (avaliacao && avaliacao.certificado) {
    return 'Concluído';
  }
  
  // Se o curso terminou e tem nota, está concluído
  if (avaliacao && avaliacao.nota !== null && dataFim && dataFim < hoje) {
    return 'Concluído';
  }
  
  // Se a data de início ainda não chegou, está agendado
  if (dataInicio && dataInicio > hoje) {
    return 'Agendado';
  }
  
  // Se a data de fim já passou mas sem avaliação/nota, consideramos terminado mas não avaliado
  if (dataFim && dataFim < hoje) {
    return 'Terminado';
  }
  
  // Se está entre as datas de início e fim, está em andamento
  if (dataInicio && dataInicio <= hoje && dataFim && dataFim >= hoje) {
    return 'Em Andamento';
  }
  
  // Usar o estado do curso como fallback
  switch (curso.estado) {
    case 'planeado':
      return 'Agendado';
    case 'em_curso':
      return 'Em Andamento';
    case 'terminado':
      return 'Terminado';
    default:
      return 'Indefinido';
  }
};

module.exports = {
  getPercursoFormandos
};