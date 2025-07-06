const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const Categoria = require("../../database/models/Categoria");
const Area = require("../../database/models/Area");
const { sequelize } = require("../../config/db");
const emailService = require('../../utils/emailService');
const { Op } = require('sequelize');

/**
 * CONTROLADORES PARA GESTÃO COMPLETA DE INSCRIÇÕES EM CURSOS
 * 
 * Versão corrigida para resolver erros de campos inexistentes na BD
 */

// =============================================================================
// CONSULTA E LISTAGEM DE INSCRIÇÕES
// =============================================================================

/**
 * Obter lista completa de todas as inscrições do sistema
 */
const getAllInscricoes = async (req, res) => {
  try {
    console.log('📋 [INSCRICOES] A carregar todas as inscrições do sistema');
    
    const inscricoes = await Inscricao_Curso.findAll({
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ['id_utilizador', 'nome', 'email'],
          required: false
        },
        {
          model: Curso,
          as: "curso",
          attributes: ['id_curso', 'nome', 'tipo'],
          required: false
        }
      ],
      order: [['data_inscricao', 'DESC']]
    });
    
    console.log(`✅ [INSCRICOES] ${inscricoes.length} inscrições encontradas`);
    res.json(inscricoes);
  } catch (error) {
    console.error('❌ [INSCRICOES] Erro ao carregar todas as inscrições:', error.message);
    console.error('📍 [INSCRICOES] Stack trace:', error.stack);
    
    res.status(500).json({ 
      message: "Erro ao procurar inscrições",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * ✅ FUNÇÃO CRÍTICA CORRIGIDA: Verificar se utilizador está inscrito num curso específico
 */
const verificarInscricao = async (req, res) => {
  try {
    console.log('🔍 [INSCRICOES] === INÍCIO DA VERIFICAÇÃO DE INSCRIÇÃO ===');
    
    const { id_curso } = req.params;
    const id_utilizador = req.user?.id_utilizador || req.utilizador?.id_utilizador;

    console.log('📋 [INSCRICOES] Dados da requisição:', {
      id_curso,
      id_utilizador,
      user: req.user ? 'Presente' : 'Ausente',
      utilizador: req.utilizador ? 'Presente' : 'Ausente'
    });

    if (!id_curso) {
      return res.status(400).json({ 
        message: "ID do curso é obrigatório",
        providedParams: req.params
      });
    }

    if (!id_utilizador) {
      return res.status(401).json({
        message: "Utilizador não autenticado",
        error: "USER_ID_MISSING"
      });
    }

    // Verificar conexão com base de dados
    try {
      await sequelize.authenticate();
      console.log('✅ [INSCRICOES] Conexão com BD confirmada');
    } catch (dbError) {
      console.error('❌ [INSCRICOES] Erro de conexão:', dbError.message);
      return res.status(503).json({
        message: "Serviço temporariamente indisponível",
        error: "DATABASE_CONNECTION_FAILED"
      });
    }

    // Verificar se o curso existe
    let cursoExiste;
    try {
      cursoExiste = await Curso.findByPk(id_curso, {
        attributes: ['id_curso', 'nome', 'ativo']
      });
    } catch (cursoError) {
      console.error('❌ [INSCRICOES] Erro ao verificar curso:', cursoError.message);
      return res.status(500).json({
        message: "Erro ao verificar dados do curso",
        error: process.env.NODE_ENV === 'development' ? cursoError.message : 'Erro interno'
      });
    }

    if (!cursoExiste) {
      return res.status(404).json({
        message: "Curso não encontrado",
        cursoId: id_curso
      });
    }

    // Procurar inscrição
    let inscricao;
    try {
      inscricao = await Inscricao_Curso.findOne({
        where: {
          id_utilizador,
          id_curso,
          estado: "inscrito"
        },
        attributes: ['id_inscricao', 'data_inscricao', 'estado']
      });
    } catch (inscricaoError) {
      console.error('❌ [INSCRICOES] Erro ao verificar inscrição:', inscricaoError.message);
      return res.status(500).json({
        message: "Erro ao verificar inscrição",
        error: process.env.NODE_ENV === 'development' ? inscricaoError.message : 'Erro interno'
      });
    }

    const resultado = {
      inscrito: !!inscricao,
      inscricao: inscricao ? {
        id: inscricao.id_inscricao,
        data_inscricao: inscricao.data_inscricao,
        estado: inscricao.estado
      } : null,
      curso: {
        id: cursoExiste.id_curso,
        nome: cursoExiste.nome,
        ativo: cursoExiste.ativo
      },
      utilizador: {
        id: id_utilizador
      }
    };

    console.log('✅ [INSCRICOES] Verificação concluída:', { inscrito: resultado.inscrito });
    return res.json(resultado);

  } catch (error) {
    console.error('❌ [INSCRICOES] ERRO na verificação de inscrição:', error.message);
    console.error('📍 [INSCRICOES] Stack trace:', error.stack);

    res.status(500).json({
      message: "Erro interno ao verificar inscrição",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Obter inscrições de um curso específico
 */
const getInscricoesPorCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;
    const id_utilizador = req.user?.id_utilizador || req.utilizador?.id_utilizador;
    const id_cargo = req.user?.id_cargo || req.utilizador?.id_cargo;
    
    console.log(`👥 [INSCRICOES] A carregar inscrições do curso ${id_curso}`);

    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      console.warn(`⚠️ [INSCRICOES] Curso ${id_curso} não encontrado`);
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar permissões de acesso
    if (id_cargo !== 1 && id_utilizador !== curso.id_formador) {
      console.warn(`⚠️ [INSCRICOES] Acesso negado para utilizador ${id_utilizador}`);
      return res.status(403).json({ message: "Acesso negado" });
    }

    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso, estado: "inscrito" },
      include: [
        { 
          model: User, 
          as: "utilizador", 
          attributes: ["id_utilizador", "nome", "email"],
          required: false
        }
      ],
      order: [["data_inscricao", "DESC"]]
    });

    console.log(`✅ [INSCRICOES] ${inscricoes.length} inscrições encontradas`);
    res.json(inscricoes);
  } catch (error) {
    console.error('❌ [INSCRICOES] Erro ao carregar inscrições do curso:', error.message);
    res.status(500).json({ 
      message: "Erro ao procurar inscrições do curso",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * ✅ FUNÇÃO CRÍTICA CORRIGIDA: Obter histórico completo de inscrições do utilizador autenticado
 */
const getMinhasInscricoes = async (req, res) => {
  try {
    const id_utilizador = req.user?.id_utilizador || req.utilizador?.id_utilizador;
    
    console.log(`📚 [INSCRICOES] A carregar histórico de inscrições do utilizador ${id_utilizador}`);

    if (!id_utilizador) {
      console.error('❌ [INSCRICOES] ID do utilizador não encontrado');
      return res.status(401).json({
        message: "Utilizador não autenticado",
        error: "USER_ID_MISSING"
      });
    }

    // Verificar conexão com a base de dados
    try {
      await sequelize.authenticate();
      console.log('✅ [INSCRICOES] Conexão com base de dados confirmada');
    } catch (dbError) {
      console.error('❌ [INSCRICOES] Erro de conexão com base de dados:', dbError.message);
      return res.status(503).json({
        message: "Serviço temporariamente indisponível",
        error: "DATABASE_CONNECTION_FAILED"
      });
    }

    let inscricoes = [];
    
    try {
      console.log('🔍 [INSCRICOES] A executar query de inscrições...');
      
      // Query principal com relacionamentos seguros
      inscricoes = await Inscricao_Curso.findAll({
        where: { id_utilizador },
        include: [
          {
            model: Curso,
            as: "curso",
            required: false,
            attributes: ['id_curso', 'nome', 'tipo', 'data_inicio', 'data_fim', 'duracao', 'imagem_path', 'estado'],
            include: [
              {
                model: Categoria,
                as: "categoria",
                attributes: ['nome'],
                required: false
              },
              {
                model: Area,
                as: "area", 
                attributes: ['nome'],
                required: false
              }
            ]
          }
        ],
        order: [['data_inscricao', 'DESC']]
      });

      console.log(`📊 [INSCRICOES] ${inscricoes.length} inscrições carregadas com relacionamentos`);

    } catch (queryError) {
      console.error('❌ [INSCRICOES] Erro na query principal:', queryError.message);
      
      // Fallback: query básica sem relacionamentos
      try {
        console.log('🔄 [INSCRICOES] Tentando query básica...');
        
        inscricoes = await Inscricao_Curso.findAll({
          where: { id_utilizador },
          order: [['data_inscricao', 'DESC']]
        });

        console.log(`📊 [INSCRICOES] ${inscricoes.length} inscrições carregadas (modo básico)`);
      } catch (basicError) {
        console.error('❌ [INSCRICOES] Erro na query básica:', basicError.message);
        return res.status(500).json({
          message: "Erro ao carregar inscrições",
          error: process.env.NODE_ENV === 'development' ? basicError.message : 'Erro interno'
        });
      }
    }

    if (inscricoes.length === 0) {
      console.log('ℹ️ [INSCRICOES] Nenhuma inscrição encontrada');
      return res.json([]);
    }

    // Processar dados para formato do frontend
    const inscricoesFormatadas = [];
    
    for (const inscricao of inscricoes) {
      try {
        let curso = inscricao.curso;
        
        // Se não tem curso associado, carregar manualmente
        if (!curso && inscricao.id_curso) {
          try {
            curso = await Curso.findByPk(inscricao.id_curso, {
              attributes: ['id_curso', 'nome', 'tipo', 'data_inicio', 'data_fim', 'duracao', 'imagem_path', 'estado'],
              include: [
                {
                  model: Categoria,
                  as: "categoria",
                  attributes: ['nome'],
                  required: false
                },
                {
                  model: Area,
                  as: "area",
                  attributes: ['nome'],
                  required: false
                }
              ]
            });
          } catch (cursoError) {
            console.warn('⚠️ [INSCRICOES] Erro ao carregar curso individual:', cursoError.message);
          }
        }

        if (curso) {
          const inscricaoFormatada = {
            cursoId: curso.id_curso,
            nomeCurso: curso.nome || 'Curso sem nome',
            categoria: curso.categoria?.nome || 'Sem categoria',
            area: curso.area?.nome || 'Sem área',
            dataInicio: curso.data_inicio || null,
            dataFim: curso.data_fim || null,
            cargaHoraria: curso.duracao || 0,
            tipo: curso.tipo || 'N/A',
            status: calcularStatusCurso(curso),
            estado_inscricao: inscricao.estado || 'inscrito',
            data_inscricao: inscricao.data_inscricao,
            imagem_path: curso.imagem_path || null
          };

          inscricoesFormatadas.push(inscricaoFormatada);
        } else {
          console.warn(`⚠️ [INSCRICOES] Curso não encontrado para inscrição ${inscricao.id_inscricao}`);
          
          // Incluir mesmo sem dados do curso
          const inscricaoFormatada = {
            cursoId: inscricao.id_curso,
            nomeCurso: 'Curso não disponível',
            categoria: 'Sem categoria',
            area: 'Sem área',
            dataInicio: null,
            dataFim: null,
            cargaHoraria: 0,
            tipo: 'N/A',
            status: 'Indisponível',
            estado_inscricao: inscricao.estado || 'inscrito',
            data_inscricao: inscricao.data_inscricao,
            imagem_path: null
          };

          inscricoesFormatadas.push(inscricaoFormatada);
        }
      } catch (processError) {
        console.warn('⚠️ [INSCRICOES] Erro ao processar inscrição individual:', processError.message);
      }
    }

    console.log(`✅ [INSCRICOES] ${inscricoesFormatadas.length} inscrições formatadas com sucesso`);
    res.json(inscricoesFormatadas);
    
  } catch (error) {
    console.error('❌ [INSCRICOES] Erro geral ao carregar histórico:', error.message);
    console.error('📍 [INSCRICOES] Stack trace:', error.stack);
    
    res.status(500).json({ 
      message: "Erro ao buscar inscrições", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
      timestamp: new Date().toISOString()
    });
  }
};

// =============================================================================
// CRIAÇÃO E GESTÃO DE INSCRIÇÕES
// =============================================================================

/**
 * Criar nova inscrição em curso
 */
const createInscricao = async (req, res) => {
  try {
    console.log('📝 [INSCRICOES] A iniciar processo de nova inscrição');
    const { id_utilizador, id_curso, motivacao, expectativas } = req.body;
    
    const userIdFromToken = req.user?.id_utilizador || req.utilizador?.id_utilizador;
    const userRole = req.user?.id_cargo || req.utilizador?.id_cargo;

    // Determinar utilizador para inscrição
    const utilizadorParaInscrever = id_utilizador || userIdFromToken;

    // Verificar permissões de inscrição
    if (userRole !== 1 && utilizadorParaInscrever != userIdFromToken) {
      console.warn(`⚠️ [INSCRICOES] Utilizador ${userIdFromToken} tentou inscrever outro utilizador`);
      return res.status(403).json({
        message: "Não pode inscrever outros utilizadores em cursos"
      });
    }

    if (!utilizadorParaInscrever || !id_curso) {
      return res.status(400).json({
        message: "ID do utilizador e ID do curso são obrigatórios"
      });
    }

    // Verificar se já está inscrito
    const inscricaoExistente = await Inscricao_Curso.findOne({
      where: {
        id_utilizador: utilizadorParaInscrever,
        id_curso,
        estado: "inscrito"
      }
    });

    if (inscricaoExistente) {
      return res.status(400).json({
        message: "Já está inscrito neste curso"
      });
    }

    // Obter e validar dados do curso
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    if (!curso.ativo) {
      return res.status(400).json({
        message: "Este curso não está disponível para inscrições"
      });
    }

    // Verificar período de inscrição
    const dataAtual = new Date();
    if (dataAtual > new Date(curso.data_inicio)) {
      return res.status(400).json({
        message: "O período de inscrição deste curso já encerrou"
      });
    }

    // Gestão de vagas para cursos síncronos
    if (curso.tipo === "sincrono" && curso.vagas) {
      if (curso.vagas <= 0) {
        return res.status(400).json({
          message: "Não há vagas disponíveis para este curso"
        });
      }

      // Decrementar vagas disponíveis
      curso.vagas = curso.vagas - 1;
      await curso.save();
      console.log(`📊 [INSCRICOES] Vagas do curso ${id_curso} atualizadas`);
    }

    // Criar nova inscrição
    const novaInscricao = await Inscricao_Curso.create({
      id_utilizador: utilizadorParaInscrever,
      id_curso,
      motivacao: motivacao || null,
      expectativas: expectativas || null,
      data_inscricao: new Date(),
      estado: "inscrito"
    });

    console.log(`✅ [INSCRICOES] Nova inscrição criada com ID ${novaInscricao.id_inscricao}`);

    // Enviar email de confirmação (não crítico)
    try {
      const utilizador = await User.findByPk(utilizadorParaInscrever);
      if (emailService && emailService.sendCourseInscricaoEmail) {
        await emailService.sendCourseInscricaoEmail(utilizador, curso);
        console.log('📧 [INSCRICOES] Email de confirmação enviado');
      }
    } catch (emailError) {
      console.warn('⚠️ [INSCRICOES] Erro ao enviar email (não crítico):', emailError.message);
    }

    res.status(201).json({
      message: "Inscrição realizada com sucesso!",
      inscricao: {
        id: novaInscricao.id_inscricao,
        data_inscricao: novaInscricao.data_inscricao
      },
      vagasRestantes: curso.vagas
    });

  } catch (error) {
    console.error('❌ [INSCRICOES] Erro ao criar inscrição:', error.message);
    
    res.status(500).json({
      message: "Erro no servidor ao processar inscrição.",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Cancelar inscrição em curso
 */
const cancelarInscricao = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_cancelamento } = req.body;
    const userRole = req.user?.id_cargo || req.utilizador?.id_cargo;
    const userId = req.user?.id_utilizador || req.utilizador?.id_utilizador;

    console.log(`🗑️ [INSCRICOES] A iniciar cancelamento da inscrição ${id}`);

    // Procurar inscrição
    const inscricao = await Inscricao_Curso.findByPk(id);
    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }

    // Verificar permissões
    const curso = await Curso.findByPk(inscricao.id_curso);
    const isAdmin = userRole === 1;
    const isFormadorDoCurso = userRole === 2 && curso && userId === curso.id_formador;

    if (!isAdmin && !isFormadorDoCurso) {
      return res.status(403).json({
        message: "Apenas administradores e formadores do curso podem cancelar inscrições"
      });
    }

    if (inscricao.estado === "cancelado") {
      return res.status(400).json({
        message: "Esta inscrição já foi cancelada anteriormente."
      });
    }

    // Atualizar estado da inscrição
    inscricao.estado = "cancelado";
    inscricao.motivo_cancelamento = motivo_cancelamento;
    inscricao.data_cancelamento = new Date();
    inscricao.cancelado_por = userId;
    await inscricao.save();

    // Atualizar vagas do curso se aplicável
    if (curso && curso.vagas !== null) {
      curso.vagas += 1;
      await curso.save();
      console.log(`📊 [INSCRICOES] Vagas do curso incrementadas`);
    }

    console.log('✅ [INSCRICOES] Inscrição cancelada com sucesso');

    return res.json({
      message: "Inscrição cancelada com sucesso",
      inscricao_cancelada_id: inscricao.id_inscricao
    });

  } catch (error) {
    console.error('❌ [INSCRICOES] Erro no cancelamento:', error.message);
    
    return res.status(500).json({
      message: "Erro ao processar cancelamento de inscrição",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Obter inscrições do utilizador autenticado com filtros
 */
const getInscricoesUtilizador = async (req, res) => {
  try {
    const id_utilizador = req.user?.id_utilizador || req.utilizador?.id_utilizador;
    console.log(`📚 [INSCRICOES] A carregar inscrições ativas do utilizador ${id_utilizador}`);

    // Procurar inscrições ativas
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_utilizador,
        estado: 'inscrito'
      },
      include: [
        {
          model: Curso,
          as: "curso",
          required: false,
          include: [
            {
              model: Categoria,
              as: "categoria",
              attributes: ['nome'],
              required: false
            },
            {
              model: Area,
              as: "area",
              attributes: ['nome'],
              required: false
            }
          ]
        }
      ],
      order: [['data_inscricao', 'DESC']]
    });

    console.log(`📊 [INSCRICOES] ${inscricoes.length} inscrições ativas encontradas`);

    // Formatar dados para resposta
    const inscricoesFormatadas = inscricoes.map(inscricao => {
      const curso = inscricao.curso;
      return {
        id: inscricao.id_inscricao,
        cursoId: curso?.id_curso || null,
        nomeCurso: curso?.nome || 'Curso não disponível',
        categoria: curso?.categoria?.nome || "N/A",
        area: curso?.area?.nome || "N/A",
        dataInicio: curso?.data_inicio || null,
        dataFim: curso?.data_fim || null,
        tipoCurso: curso?.tipo || 'N/A',
        vagasTotais: curso?.vagas || null,
        dataInscricao: inscricao.data_inscricao,
        status: calcularStatusCurso(curso)
      };
    });

    res.json(inscricoesFormatadas);
  } catch (error) {
    console.error('❌ [INSCRICOES] Erro ao carregar inscrições do utilizador:', error.message);
    res.status(500).json({
      message: "Erro ao procurar inscrições",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Calcular status atual de um curso baseado nas datas
 */
function calcularStatusCurso(curso) {
  if (!curso || !curso.data_inicio || !curso.data_fim) {
    return "Agendado";
  }

  const hoje = new Date();
  const dataInicio = new Date(curso.data_inicio);
  const dataFim = new Date(curso.data_fim);

  if (hoje < dataInicio) {
    return "Agendado";
  } else if (hoje >= dataInicio && hoje <= dataFim) {
    return "Em curso";
  } else {
    return "Terminado";
  }
}

/**
 * Remover todas as inscrições relacionadas a um curso específico
 */
const removerInscricoesDoCurso = async (id_curso, transaction) => {
  try {
    console.log(`🗑️ [INSCRICOES] A remover inscrições do curso ${id_curso}`);
    
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso },
      transaction
    });

    await Inscricao_Curso.destroy({
      where: { id_curso },
      transaction
    });

    console.log(`✅ [INSCRICOES] ${inscricoes.length} inscrições removidas do curso ${id_curso}`);
    return inscricoes.length;
  } catch (error) {
    console.error('❌ [INSCRICOES] Erro ao remover inscrições do curso:', error.message);
    throw error;
  }
};

module.exports = {
  getMinhasInscricoes,
  getAllInscricoes,
  getInscricoesPorCurso,
  createInscricao,
  cancelarInscricao,
  getInscricoesUtilizador,
  removerInscricoesDoCurso,
  verificarInscricao
};