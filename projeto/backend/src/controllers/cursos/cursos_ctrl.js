const User = require("../../database/models/User");
const Categoria = require("../../database/models/Categoria");
const Area = require("../../database/models/Area");
const Topico_Area = require("../../database/models/Topico_Area");
const Curso = require("../../database/models/Curso");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const Curso_Topicos = require("../../database/models/Curso_Topicos");
const PastaCurso = require("../../database/models/PastaCurso");
const ConteudoCurso = require("../../database/models/ConteudoCurso");
const AssociarCursos = require("../../database/models/AssociarCurso");
const uploadUtils = require('../../middleware/upload');
const { sequelize } = require("../../config/db");
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

let notificacaoController;
try {
  notificacaoController = require('../notificacoes/notificacoes_ctrl');
} catch (error) {
  console.warn('⚠️ [CURSOS] Controlador de notificações não encontrado:', error.message);
  notificacaoController = null;
}

const getAllCursos = async (req, res) => {
  try {
    console.log('📚 [CURSOS] A processar listagem de cursos');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { categoria, area, formador, search, tipo, estado, ativo, vagas, topico } = req.query;

    console.log('🔍 [CURSOS] Filtros aplicados:', { categoria, area, formador, search, tipo, estado, ativo, vagas, topico });

    const where = {};

    if (categoria && !isNaN(parseInt(categoria))) {
      where.id_categoria = parseInt(categoria, 10);
    }
    if (area && !isNaN(parseInt(area))) {
      where.id_area = parseInt(area, 10);
    }
    if (formador && !isNaN(parseInt(formador))) {
      where.id_formador = parseInt(formador, 10);
    }
    if (topico && !isNaN(parseInt(topico))) {
      where.id_topico_area = parseInt(topico, 10);
    }

    if (search && search.trim()) {
      where.nome = { [Op.iLike]: `%${search.trim()}%` };
    }

    if (tipo && ['sincrono', 'assincrono'].includes(tipo)) {
      where.tipo = tipo;
    }
    if (estado && ['planeado', 'em_curso', 'terminado', 'cancelado'].includes(estado)) {
      where.estado = estado;
    }

    if (ativo !== undefined) {
      where.ativo = ativo === 'false' ? false : true;
    }

    if (vagas && !isNaN(parseInt(vagas))) {
      where.vagas = { [Op.gte]: parseInt(vagas, 10) };
    }

    const includeModels = [
      {
        model: User,
        as: "formador",
        attributes: ['id_utilizador', 'nome', 'email'],
        required: false
      },
      {
        model: Area,
        as: "area",
        required: false
      },
      {
        model: Categoria,
        as: "categoria",
        required: false
      }
    ];

    try {
      if (Topico_Area) {
        includeModels.push({
          model: Topico_Area,
          as: "Topico_Area",
          required: false
        });
      }
    } catch (err) {
      console.warn('⚠️ [CURSOS] Modelo Topico_Area não disponível:', err.message);
    }

    const { count, rows } = await Curso.findAndCountAll({
      where,
      offset,
      limit,
      order: [['data_inicio', 'DESC']],
      include: includeModels
    });

    if (rows.length === 0 && Object.keys(where).length === 0) {
      console.log('ℹ️ [CURSOS] Nenhum resultado - a tentar consulta básica para debug');
      
      const todosOsCursos = await Curso.findAndCountAll({
        limit,
        offset,
        order: [['data_inicio', 'DESC']],
        include: includeModels
      });
      
      console.log(`✅ [CURSOS] ${todosOsCursos.count} cursos encontrados (consulta básica)`);
      return res.json({
        cursos: todosOsCursos.rows,
        total: todosOsCursos.count,
        totalPages: Math.ceil(todosOsCursos.count / limit),
        currentPage: page
      });
    }

    console.log(`✅ [CURSOS] ${count} cursos encontrados com filtros aplicados`);
    res.json({
      cursos: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao listar cursos:', error.message);
    res.status(500).json({ 
      message: "Erro ao procurar cursos",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const getCursosByCategoria = async (req, res) => {
  try {
    const { categorias } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!categorias) {
      console.warn('⚠️ [CURSOS] Parâmetro "categorias" em falta na query string');
      return res.status(400).json({ message: "É necessário fornecer pelo menos uma categoria" });
    }

    const categoriaIds = categorias.split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));
    
    if (categoriaIds.length === 0) {
      return res.status(400).json({ message: "IDs de categoria inválidos" });
    }
    
    console.log(`🏷️ [CURSOS] A filtrar por categorias:`, categoriaIds);

    const { count, rows } = await Curso.findAndCountAll({
      where: {
        id_categoria: { [Op.in]: categoriaIds },
        ativo: true
      },
      include: [
        {
          model: Categoria,
          as: "categoria",
          required: false
        },
        {
          model: Area,
          as: "area",
          required: false
        }
      ],
      offset,
      limit,
      order: [['nome', 'ASC']]
    });

    console.log(`✅ [CURSOS] ${count} cursos encontrados para as categorias especificadas`);
    res.json({
      cursos: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao filtrar por categoria:', error.message);
    res.status(500).json({ 
      message: "Erro ao procurar cursos por categoria",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const getCursoById = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id_utilizador || req.utilizador?.id_utilizador;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "ID de curso inválido" });
    }

    console.log(`📖 [CURSOS] A carregar detalhes do curso ${id} para utilizador ${userId || 'anónimo'}`);

    const curso = await Curso.findByPk(id, {
      include: [
        {
          model: User,
          as: "formador",
          attributes: ['id_utilizador', 'nome', 'email'],
          required: false
        },
        {
          model: Area,
          as: "area",
          required: false
        },
        {
          model: Categoria,
          as: "categoria",
          required: false
        },
        {
          model: Curso_Topicos,
          as: "topicos",
          where: { ativo: true },
          required: false,
          order: [['ordem', 'ASC']]
        },
        {
          model: Topico_Area,
          as: "Topico_Area",
          required: false
        }
      ]
    });

    if (!curso) {
      console.warn(`⚠️ [CURSOS] Curso ${id} não encontrado na base de dados`);
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    console.log(`🔍 [CURSOS] Curso encontrado: ${curso.nome}`);
    console.log(`🔍 [CURSOS] ID tópico área: ${curso.id_topico_area}`);
    console.log(`🔍 [CURSOS] Tópico área carregado:`, curso.Topico_Area ? curso.Topico_Area.titulo : 'NULL');

    const cursoComDetalhes = curso.toJSON();

    // Se o tópico de área não foi carregado pela associação, buscar manualmente
    if (curso.id_topico_area && !curso.Topico_Area) {
      try {
        console.log(`🔍 [CURSOS] A buscar tópico de área ${curso.id_topico_area} manualmente`);
        const topicoArea = await Topico_Area.findByPk(curso.id_topico_area);
        if (topicoArea) {
          cursoComDetalhes.Topico_Area = topicoArea.toJSON();
          console.log(`✅ [CURSOS] Tópico área carregado manualmente: ${topicoArea.titulo}`);
          
          // Verificar inconsistência de área
          if (topicoArea.id_area && topicoArea.id_area !== curso.id_area) {
            console.warn(`⚠️ [CURSOS] INCONSISTÊNCIA DETECTADA:`);
            console.warn(`   - Curso está na área: ${curso.id_area}`);
            console.warn(`   - Tópico pertence à área: ${topicoArea.id_area}`);
            console.warn(`   - Tópico: ${topicoArea.titulo}`);
            
            // Adicionar informação sobre a inconsistência na resposta
            cursoComDetalhes.inconsistencia_area = {
              curso_area: curso.id_area,
              topico_area: topicoArea.id_area,
              topico_titulo: topicoArea.titulo,
              requer_correcao: true
            };
          }
        }
      } catch (topicoError) {
        console.warn(`⚠️ [CURSOS] Erro ao carregar tópico área manualmente:`, topicoError.message);
      }
    } else if (curso.Topico_Area) {
      // Verificar inconsistência mesmo quando o tópico foi carregado pela associação
      if (curso.Topico_Area.id_area && curso.Topico_Area.id_area !== curso.id_area) {
        console.warn(`⚠️ [CURSOS] INCONSISTÊNCIA DETECTADA (associação):`);
        console.warn(`   - Curso está na área: ${curso.id_area}`);
        console.warn(`   - Tópico pertence à área: ${curso.Topico_Area.id_area}`);
        console.warn(`   - Tópico: ${curso.Topico_Area.titulo}`);
        
        cursoComDetalhes.inconsistencia_area = {
          curso_area: curso.id_area,
          topico_area: curso.Topico_Area.id_area,
          topico_titulo: curso.Topico_Area.titulo,
          requer_correcao: true
        };
      }
    }

    const dataAtual = new Date();
    const dataFimCurso = new Date(curso.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;

    cursoComDetalhes.terminado = cursoTerminado;

    if (cursoTerminado && userId) {
      try {
        const inscricao = await Inscricao_Curso.findOne({
          where: {
            id_utilizador: userId,
            id_curso: id,
            estado: 'inscrito'
          }
        });

        cursoComDetalhes.acessoPermitido = !!inscricao;
        console.log(`🔐 [CURSOS] Acesso para curso terminado: ${!!inscricao ? 'permitido' : 'negado'}`);
      } catch (error) {
        console.warn('⚠️ [CURSOS] Erro ao verificar permissões de acesso:', error.message);
        cursoComDetalhes.acessoPermitido = false;
      }
    } else if (cursoTerminado) {
      cursoComDetalhes.acessoPermitido = false;
    } else {
      cursoComDetalhes.acessoPermitido = true;
    }

    try {
      if (curso.tipo === 'sincrono' && curso.vagas) {
        const inscricoesAtivas = await Inscricao_Curso.count({ 
          where: { 
            id_curso: id, 
            estado: 'inscrito' 
          } 
        });
        cursoComDetalhes.inscricoesAtivas = inscricoesAtivas;
        cursoComDetalhes.vagasDisponiveis = Math.max(0, curso.vagas - inscricoesAtivas);
        console.log(`👥 [CURSOS] ${inscricoesAtivas}/${curso.vagas} inscrições ativas encontradas`);
      }
    } catch (inscricoesError) {
      console.warn('⚠️ [CURSOS] Erro ao contar inscrições:', inscricoesError.message);
      cursoComDetalhes.inscricoesAtivas = 0;
      cursoComDetalhes.vagasDisponiveis = curso.vagas || 0;
    }

    try {
      const associacoes = await AssociarCursos.findAll({
        where: {
          [Op.or]: [
            { id_curso_origem: id },
            { id_curso_destino: id }
          ]
        },
        include: [
          {
            model: Curso,
            as: 'cursoOrigem',
            attributes: ['id_curso', 'nome', 'descricao', 'imagem_path', 'tipo', 'estado'],
            required: false
          },
          {
            model: Curso,
            as: 'cursoDestino',
            attributes: ['id_curso', 'nome', 'descricao', 'imagem_path', 'tipo', 'estado'],
            required: false
          }
        ]
      });

      cursoComDetalhes.cursosAssociados = associacoes;
      console.log(`🔗 [CURSOS] ${associacoes.length} associações de cursos encontradas`);
    } catch (associacoesError) {
      console.warn('⚠️ [CURSOS] Erro ao carregar associações:', associacoesError.message);
      cursoComDetalhes.cursosAssociados = [];
    }

    console.log(`✅ [CURSOS] Detalhes do curso ${id} carregados com sucesso`);
    console.log(`🔍 [CURSOS] Resposta final - Tópico área:`, cursoComDetalhes.Topico_Area ? cursoComDetalhes.Topico_Area.titulo : 'NULL');
    
    res.json(cursoComDetalhes);
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao carregar curso:', error.message);
    res.status(500).json({ 
      message: "Erro ao procurar curso", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const getTopicoArea = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "ID de tópico inválido" });
    }
    
    console.log(`🔍 [CURSOS] A procurar tópico de área ${id}`);

    const topico = await Topico_Area.findByPk(id);

    if (!topico) {
      console.warn(`⚠️ [CURSOS] Tópico de área ${id} não encontrado`);
      return res.status(404).json({ message: "Tópico de área não encontrado" });
    }

    console.log(`✅ [CURSOS] Tópico de área ${id} encontrado: ${topico.titulo}`);
    res.json(topico);
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao buscar tópico de área:', error.message);
    res.status(500).json({ 
      message: "Erro ao buscar tópico de área", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const createCurso = async (req, res) => {
  try {
    console.log('🆕 [CURSOS] A iniciar criação de novo curso');
    console.log('📋 [CURSOS] Dados recebidos:', req.body);
    
    const {
      nome, descricao, tipo, vagas, duracao, data_inicio, data_fim,
      id_formador, id_area, id_categoria, topicos, id_topico_area
    } = req.body;

    if (!nome?.trim()) {
      return res.status(400).json({ message: "Nome do curso é obrigatório!" });
    }
    if (!tipo || !['sincrono', 'assincrono'].includes(tipo)) {
      return res.status(400).json({ message: "Tipo de curso inválido!" });
    }
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: "Datas de início e fim são obrigatórias!" });
    }
    if (!id_area || isNaN(parseInt(id_area))) {
      return res.status(400).json({ message: "Área é obrigatória!" });
    }
    if (!id_categoria || isNaN(parseInt(id_categoria))) {
      return res.status(400).json({ message: "Categoria é obrigatória!" });
    }
    if (!duracao || isNaN(parseInt(duracao)) || parseInt(duracao) <= 0) {
      return res.status(400).json({ message: "Duração deve ser um número positivo!" });
    }

    const dataInicioObj = new Date(data_inicio);
    const dataFimObj = new Date(data_fim);
    if (dataFimObj <= dataInicioObj) {
      return res.status(400).json({ message: "Data de fim deve ser posterior à data de início!" });
    }

    if (!id_topico_area || isNaN(parseInt(id_topico_area))) {
      console.warn('⚠️ [CURSOS] Tópico não selecionado');
      return res.status(400).json({ message: "É necessário selecionar um tópico para o curso!" });
    }

    if (tipo === 'sincrono') {
      if (!id_formador || isNaN(parseInt(id_formador))) {
        console.warn('⚠️ [CURSOS] Formador obrigatório para curso síncrono');
        return res.status(400).json({ message: "É obrigatório selecionar um formador para cursos síncronos!" });
      }
      if (!vagas || isNaN(parseInt(vagas)) || parseInt(vagas) <= 0) {
        console.warn('⚠️ [CURSOS] Vagas obrigatórias para curso síncrono');
        return res.status(400).json({ message: "É necessário definir um número válido de vagas para cursos síncronos!" });
      }
    }

    const cursoExistente = await Curso.findOne({ 
      where: { 
        nome: { [Op.iLike]: nome.trim() }
      } 
    });
    if (cursoExistente) {
      console.warn('⚠️ [CURSOS] Tentativa de criar curso com nome duplicado:', nome);
      return res.status(400).json({
        message: "Já existe um curso com este nome. Por favor, escolhe um nome diferente.",
        error: "NOME_DUPLICADO"
      });
    }

    const cursoSlug = uploadUtils.normalizarNome(nome.trim());
    const cursoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug);
    uploadUtils.ensureDir(cursoDir);
    const dirPath = `uploads/cursos/${cursoSlug}`;

    console.log(`📁 [CURSOS] Diretório criado: ${dirPath}`);

    let imagemPath = null;
    if (req.file) {
      imagemPath = `${dirPath}/capa.png`;
      console.log(`🖼️ [CURSOS] Imagem de capa processada: ${imagemPath}`);
    }

    const t = await sequelize.transaction();

    try {
      let vagasFinais = null;
      if (tipo === 'sincrono') {
        vagasFinais = parseInt(vagas, 10);
      }

      const dadosCurso = {
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        tipo,
        vagas: vagasFinais,
        data_inicio: dataInicioObj,
        data_fim: dataFimObj,
        id_formador: tipo === 'sincrono' ? parseInt(id_formador) : null,
        id_area: parseInt(id_area),
        id_categoria: parseInt(id_categoria),
        id_topico_area: parseInt(id_topico_area),
        imagem_path: imagemPath,
        dir_path: dirPath,
        duracao: parseInt(duracao, 10),
        ativo: true,
        estado: 'planeado'
      };

      const novoCurso = await Curso.create(dadosCurso, { transaction: t });
      console.log(`✅ [CURSOS] Curso criado com ID ${novoCurso.id_curso}`);

      if (topicos && Array.isArray(topicos) && topicos.length > 0) {
        console.log(`📝 [CURSOS] A criar ${topicos.length} tópicos organizacionais adicionais`);
        
        for (let i = 0; i < topicos.length; i++) {
          const topico = topicos[i];
          if (topico.nome?.trim()) {
            await Curso_Topicos.create({
              nome: topico.nome.trim(),
              id_curso: novoCurso.id_curso,
              ordem: i + 1,
              ativo: true
            }, { transaction: t });
          }
        }
      }

      await t.commit();
      console.log('✅ [CURSOS] Transação de criação confirmada com sucesso');

      if (tipo === "sincrono" && id_formador) {
        try {
          await Inscricao_Curso.create({
            id_utilizador: parseInt(id_formador),
            id_curso: novoCurso.id_curso,
            data_inscricao: new Date(),
            estado: "inscrito"
          });
          console.log('👨‍🏫 [CURSOS] Formador auto-inscrito no curso com sucesso');
        } catch (enrollError) {
          console.warn('⚠️ [CURSOS] Erro na auto-inscrição do formador (não crítico):', enrollError.message);
        }
      }

      try {
        console.log('📢 [CURSOS] A processar notificações sobre novo curso...');
        
        if (!req.io) {
          console.warn('⚠️ [CURSOS] WebSocket não disponível - notificações podem falhar');
        }

        if (notificacaoController && notificacaoController.notificarNovoCurso) {
          const resultadoNotificacao = await notificacaoController.notificarNovoCurso(novoCurso, req.io);
          
          if (resultadoNotificacao) {
            console.log(`✅ [CURSOS] ${resultadoNotificacao.associacoes.length} notificações de novo curso enviadas`);
          } else {
            console.log('ℹ️ [CURSOS] Nenhuma notificação enviada (sem destinatários válidos)');
          }
        }
      } catch (notificationError) {
        console.warn('⚠️ [CURSOS] Erro ao enviar notificações (não crítico):', notificationError.message);
      }

      console.log('🎉 [CURSOS] Processo completo de criação de curso finalizado');
      res.status(201).json({
        message: "Curso criado com sucesso!",
        curso: {
          id_curso: novoCurso.id_curso,
          nome: novoCurso.nome
        }
      });

    } catch (error) {
      await t.rollback();
      console.error('❌ [CURSOS] Erro na transação - a reverter alterações:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('❌ [CURSOS] Erro geral ao criar curso:', error.message);
    res.status(500).json({ 
      message: "Erro no servidor ao criar curso.", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const getCursosSugeridos = async (req, res) => {
  try {
    const id_utilizador = req.user?.id_utilizador || req.utilizador?.id_utilizador;
    console.log(`🎯 [CURSOS] A gerar sugestões personalizadas para utilizador ${id_utilizador}`);

    if (!id_utilizador) {
      console.error('❌ [CURSOS] ID do utilizador não encontrado');
      return res.status(401).json({
        message: "Utilizador não autenticado",
        error: "USER_ID_MISSING"
      });
    }

    try {
      await sequelize.authenticate();
      console.log('✅ [CURSOS] Conexão com base de dados confirmada para sugestões');
    } catch (dbError) {
      console.error('❌ [CURSOS] Erro de conexão:', dbError.message);
      return res.status(503).json({
        message: "Serviço temporariamente indisponível",
        error: "DATABASE_CONNECTION_FAILED"
      });
    }

    let cursosSugeridos = [];

    try {
      const inscricoes = await Inscricao_Curso.findAll({
        where: { id_utilizador },
        attributes: ['id_curso']
      });

      const cursosInscritosIds = inscricoes.map(i => i.id_curso);
      console.log(`📊 [CURSOS] ${cursosInscritosIds.length} cursos no histórico do utilizador`);

      if (inscricoes.length > 0) {
        const cursosInscritos = await Curso.findAll({
          where: { id_curso: cursosInscritosIds },
          attributes: ['id_categoria', 'id_area']
        });

        const categoriasInscrito = [...new Set(cursosInscritos.map(c => c.id_categoria).filter(id => id))];
        const areasInscrito = [...new Set(cursosInscritos.map(c => c.id_area).filter(id => id))];

        console.log(`🏷️ [CURSOS] Categorias de interesse identificadas: ${categoriasInscrito.join(', ')}`);
        console.log(`🌍 [CURSOS] Áreas já exploradas: ${areasInscrito.join(', ')}`);

        if (categoriasInscrito.length > 0 && areasInscrito.length > 0) {
          const whereConditions = {
            id_categoria: { [Op.in]: categoriasInscrito },
            id_area: { [Op.notIn]: areasInscrito },
            id_curso: { [Op.notIn]: cursosInscritosIds },
            ativo: true
          };

          const orConditions = [
            { tipo: 'assincrono' }
          ];

          orConditions.push({
            tipo: 'sincrono',
            vagas: { [Op.gt]: 0 }
          });

          whereConditions[Op.or] = orConditions;

          cursosSugeridos = await Curso.findAll({
            where: whereConditions,
            limit: 10,
            order: [['data_inicio', 'DESC']]
          });

          console.log(`💡 [CURSOS] ${cursosSugeridos.length} sugestões baseadas em preferências geradas`);
        }
      }

      if (cursosSugeridos.length < 5) {
        console.log('🎲 [CURSOS] A gerar sugestões complementares...');
        
        const whereConditions = {
          ativo: true
        };

        if (cursosInscritosIds.length > 0) {
          whereConditions.id_curso = { [Op.notIn]: cursosInscritosIds };
        }

        whereConditions[Op.or] = [
          { tipo: 'assincrono' },
          { tipo: 'sincrono', vagas: { [Op.gt]: 0 } }
        ];

        const limiteSugestoes = Math.max(10 - cursosSugeridos.length, 5);

        const sugestoesFallback = await Curso.findAll({
          where: whereConditions,
          limit: limiteSugestoes,
          order: [['data_inicio', 'DESC']]
        });

        const idsExistentes = new Set(cursosSugeridos.map(c => c.id_curso));
        const novasSugestoes = sugestoesFallback.filter(curso => !idsExistentes.has(curso.id_curso));
        
        cursosSugeridos = [...cursosSugeridos, ...novasSugestoes];

        console.log(`🎲 [CURSOS] ${novasSugestoes.length} sugestões complementares adicionadas`);
      }

      cursosSugeridos = cursosSugeridos.slice(0, 10);

    } catch (queryError) {
      console.error('❌ [CURSOS] Erro nas consultas de sugestão:', queryError.message);
      
      try {
        cursosSugeridos = await Curso.findAll({
          where: {
            ativo: true,
            [Op.or]: [
              { tipo: 'assincrono' },
              { tipo: 'sincrono', vagas: { [Op.gt]: 0 } }
            ]
          },
          limit: 10,
          order: [['data_inicio', 'DESC']]
        });
        
        console.log(`🔄 [CURSOS] Fallback executado: ${cursosSugeridos.length} cursos disponíveis`);
      } catch (fallbackError) {
        console.error('❌ [CURSOS] Erro no fallback final:', fallbackError.message);
        return res.status(500).json({
          message: "Erro ao carregar sugestões de cursos",
          error: process.env.NODE_ENV === 'development' ? fallbackError.message : 'Erro interno'
        });
      }
    }

    console.log(`✅ [CURSOS] Sistema de recomendação concluído com ${cursosSugeridos.length} sugestões`);
    return res.json(cursosSugeridos);

  } catch (error) {
    console.error('❌ [CURSOS] Erro geral no sistema de recomendação:', error.message);
    console.error('📍 [CURSOS] Stack trace:', error.stack);
    
    res.status(500).json({ 
      message: "Erro no servidor ao procurar cursos sugeridos.",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
      timestamp: new Date().toISOString()
    });
  }
};

const updateCurso = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id_utilizador || req.utilizador?.id_utilizador;
    const userRole = req.user?.id_cargo || req.utilizador?.id_cargo;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "ID de curso inválido" });
    }

    console.log(`📝 [CURSOS] A atualizar curso ${id} por utilizador ${userId}`);

    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    if (userRole !== 1 && curso.id_formador !== userId) {
      return res.status(403).json({ message: "Não tens permissão para editar este curso" });
    }

    const {
      nome, descricao, tipo, vagas, duracao, data_inicio, data_fim,
      id_formador, id_area, id_categoria, id_topico_area, ativo, estado
    } = req.body;

    const dadosOriginais = { ...curso.dataValues };
    const dadosAtualizacao = {};
    const alteracoes = [];

    if (nome !== undefined && nome.trim() && nome.trim() !== curso.nome) {
      dadosAtualizacao.nome = nome.trim();
      alteracoes.push({
        campo: 'Nome',
        valor_antigo: curso.nome,
        valor_novo: nome.trim()
      });
    }
    
    if (descricao !== undefined && (descricao?.trim() || null) !== curso.descricao) {
      dadosAtualizacao.descricao = descricao?.trim() || null;
      alteracoes.push({
        campo: 'Descrição',
        valor_antigo: curso.descricao || 'Sem descrição',
        valor_novo: descricao?.trim() || 'Sem descrição'
      });
    }
    
    if (tipo !== undefined && ['sincrono', 'assincrono'].includes(tipo) && tipo !== curso.tipo) {
      dadosAtualizacao.tipo = tipo;
      alteracoes.push({
        campo: 'Tipo',
        valor_antigo: curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono',
        valor_novo: tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'
      });
    }
    
    if (vagas !== undefined && !isNaN(parseInt(vagas))) {
      const novasVagas = parseInt(vagas);
      if (novasVagas !== curso.vagas) {
        dadosAtualizacao.vagas = novasVagas;
        alteracoes.push({
          campo: 'Vagas',
          valor_antigo: curso.vagas?.toString() || 'Sem limite',
          valor_novo: novasVagas.toString()
        });
      }
    }
    
    if (duracao !== undefined && !isNaN(parseInt(duracao))) {
      const novaDuracao = parseInt(duracao);
      if (novaDuracao !== curso.duracao) {
        dadosAtualizacao.duracao = novaDuracao;
        alteracoes.push({
          campo: 'Duração',
          valor_antigo: `${curso.duracao}h`,
          valor_novo: `${novaDuracao}h`
        });
      }
    }
    
    if (data_inicio !== undefined) {
      const novaDataInicio = new Date(data_inicio);
      const dataInicioOriginal = new Date(curso.data_inicio);
      if (novaDataInicio.getTime() !== dataInicioOriginal.getTime()) {
        dadosAtualizacao.data_inicio = novaDataInicio;
        alteracoes.push({
          campo: 'Data de Início',
          valor_antigo: dataInicioOriginal.toLocaleDateString('pt-PT'),
          valor_novo: novaDataInicio.toLocaleDateString('pt-PT')
        });
      }
    }
    
    if (data_fim !== undefined) {
      const novaDataFim = new Date(data_fim);
      const dataFimOriginal = new Date(curso.data_fim);
      if (novaDataFim.getTime() !== dataFimOriginal.getTime()) {
        dadosAtualizacao.data_fim = novaDataFim;
        alteracoes.push({
          campo: 'Data de Fim',
          valor_antigo: dataFimOriginal.toLocaleDateString('pt-PT'),
          valor_novo: novaDataFim.toLocaleDateString('pt-PT')
        });
      }
    }
    
    if (id_formador !== undefined && !isNaN(parseInt(id_formador))) {
      const novoFormadorId = parseInt(id_formador);
      if (novoFormadorId !== curso.id_formador) {
        dadosAtualizacao.id_formador = novoFormadorId;
        
        try {
          const formadorAntigo = curso.id_formador ? await User.findByPk(curso.id_formador) : null;
          const formadorNovo = await User.findByPk(novoFormadorId);
          
          alteracoes.push({
            campo: 'Formador',
            valor_antigo: formadorAntigo?.nome || 'Não atribuído',
            valor_novo: formadorNovo?.nome || 'Não encontrado'
          });
        } catch (err) {
          alteracoes.push({
            campo: 'Formador',
            valor_antigo: 'Anterior',
            valor_novo: 'Novo formador'
          });
        }
      }
    }
    
    if (id_area !== undefined && !isNaN(parseInt(id_area))) {
      const novaAreaId = parseInt(id_area);
      if (novaAreaId !== curso.id_area) {
        dadosAtualizacao.id_area = novaAreaId;
        
        try {
          const areaAntiga = curso.id_area ? await Area.findByPk(curso.id_area) : null;
          const areaNova = await Area.findByPk(novaAreaId);
          
          alteracoes.push({
            campo: 'Área',
            valor_antigo: areaAntiga?.nome || 'Não atribuída',
            valor_novo: areaNova?.nome || 'Não encontrada'
          });
        } catch (err) {
          alteracoes.push({
            campo: 'Área',
            valor_antigo: 'Anterior',
            valor_novo: 'Nova área'
          });
        }
      }
    }
    
    if (id_categoria !== undefined && !isNaN(parseInt(id_categoria))) {
      const novaCategoriaId = parseInt(id_categoria);
      if (novaCategoriaId !== curso.id_categoria) {
        dadosAtualizacao.id_categoria = novaCategoriaId;
        
        try {
          const categoriaAntiga = curso.id_categoria ? await Categoria.findByPk(curso.id_categoria) : null;
          const categoriaNova = await Categoria.findByPk(novaCategoriaId);
          
          alteracoes.push({
            campo: 'Categoria',
            valor_antigo: categoriaAntiga?.nome || 'Não atribuída',
            valor_novo: categoriaNova?.nome || 'Não encontrada'
          });
        } catch (err) {
          alteracoes.push({
            campo: 'Categoria',
            valor_antigo: 'Anterior',
            valor_novo: 'Nova categoria'
          });
        }
      }
    }
    
    if (id_topico_area !== undefined && !isNaN(parseInt(id_topico_area))) {
      const novoTopicoId = parseInt(id_topico_area);
      if (novoTopicoId !== curso.id_topico_area) {
        dadosAtualizacao.id_topico_area = novoTopicoId;
        
        try {
          const topicoAntigo = curso.id_topico_area ? await Topico_Area.findByPk(curso.id_topico_area) : null;
          const topicoNovo = await Topico_Area.findByPk(novoTopicoId);
          
          alteracoes.push({
            campo: 'Tópico',
            valor_antigo: topicoAntigo?.titulo || 'Não atribuído',
            valor_novo: topicoNovo?.titulo || 'Não encontrado'
          });
        } catch (err) {
          alteracoes.push({
            campo: 'Tópico',
            valor_antigo: 'Anterior',
            valor_novo: 'Novo tópico'
          });
        }
      }
    }
    
    if (ativo !== undefined && ativo !== curso.ativo) {
      dadosAtualizacao.ativo = ativo;
      alteracoes.push({
        campo: 'Estado Ativo',
        valor_antigo: curso.ativo ? 'Ativo' : 'Inativo',
        valor_novo: ativo ? 'Ativo' : 'Inativo'
      });
    }
    
    if (estado !== undefined && ['planeado', 'em_curso', 'terminado', 'cancelado'].includes(estado) && estado !== curso.estado) {
      dadosAtualizacao.estado = estado;
      alteracoes.push({
        campo: 'Estado',
        valor_antigo: curso.estado || 'Não definido',
        valor_novo: estado
      });
    }

    if (dadosAtualizacao.data_inicio && dadosAtualizacao.data_fim) {
      if (dadosAtualizacao.data_fim <= dadosAtualizacao.data_inicio) {
        return res.status(400).json({ message: "Data de fim deve ser posterior à data de início!" });
      }
    }

    let imagemAtualizada = false;
    let nomeMudou = false;
    let pastaRenomeada = false;

    if (req.file) {
      const cursoSlug = uploadUtils.normalizarNome(dadosAtualizacao.nome || curso.nome);
      const dirPath = `uploads/cursos/${cursoSlug}`;
      const imagemPath = `${dirPath}/capa.png`;
      dadosAtualizacao.imagem_path = imagemPath;
      imagemAtualizada = true;

      alteracoes.push({
        campo: 'Imagem',
        valor_antigo: 'Imagem anterior',
        valor_novo: 'Nova imagem carregada'
      });
    }

    if (dadosAtualizacao.nome && dadosAtualizacao.nome !== curso.nome) {
      nomeMudou = true;
      const novoSlug = uploadUtils.normalizarNome(dadosAtualizacao.nome);
      const novoDirPath = `uploads/cursos/${novoSlug}`;
      
      try {
        const dirAnterior = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', uploadUtils.normalizarNome(curso.nome));
        const novoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', novoSlug);
        
        if (fs.existsSync(dirAnterior) && !fs.existsSync(novoDir)) {
          fs.renameSync(dirAnterior, novoDir);
          pastaRenomeada = true;
          dadosAtualizacao.dir_path = novoDirPath;
          
          if (curso.imagem_path) {
            dadosAtualizacao.imagem_path = `${novoDirPath}/capa.png`;
          }
        }
      } catch (error) {
        console.warn('Aviso: Não foi possível renomear pasta do curso:', error.message);
      }
    }

    await curso.update(dadosAtualizacao);

    let utilizadoresNotificados = 0;

    if (alteracoes.length > 0) {
      try {
        const inscricoes = await Inscricao_Curso.findAll({
          where: { 
            id_curso: id, 
            estado: 'inscrito' 
          },
          include: [{
            model: User,
            as: 'utilizador',
            attributes: ['id_utilizador', 'nome', 'email']
          }]
        });

        if (inscricoes.length > 0 && notificacaoController && notificacaoController.notificarAlteracaoCurso) {
          const resultadoNotificacao = await notificacaoController.notificarAlteracaoCurso(
            curso,
            alteracoes,
            inscricoes,
            req.io
          );
          
          if (resultadoNotificacao && resultadoNotificacao.utilizadoresNotificados) {
            utilizadoresNotificados = resultadoNotificacao.utilizadoresNotificados;
          }
        }
      } catch (notificationError) {
        console.warn('⚠️ [CURSOS] Erro ao enviar notificações de alteração (não crítico):', notificationError.message);
      }
    }

    console.log(`✅ [CURSOS] Curso ${id} atualizado com sucesso`);
    res.json({
      message: "Curso atualizado com sucesso",
      curso: curso,
      alteracoes: alteracoes,
      alteracoesNotificadas: utilizadoresNotificados,
      imagemAtualizada: imagemAtualizada,
      nomeMudou: nomeMudou,
      pastaRenomeada: pastaRenomeada
    });

  } catch (error) {
    console.error('❌ [CURSOS] Erro ao atualizar curso:', error.message);
    res.status(500).json({ 
      message: "Erro ao atualizar curso",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const deleteCurso = async (req, res) => {
  try {
    const id = req.params.id;
    const userRole = req.user?.id_cargo || req.utilizador?.id_cargo;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "ID de curso inválido" });
    }

    if (userRole !== 1) {
      return res.status(403).json({ message: "Só administradores podem eliminar cursos" });
    }

    console.log(`🗑️ [CURSOS] A iniciar eliminação do curso ${id}`);

    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    const t = await sequelize.transaction();

    try {
      await Inscricao_Curso.destroy({
        where: { id_curso: id },
        transaction: t
      });

      await Curso_Topicos.destroy({
        where: { id_curso: id },
        transaction: t
      });

      await AssociarCursos.destroy({
        where: {
          [Op.or]: [
            { id_curso_origem: id },
            { id_curso_destino: id }
          ]
        },
        transaction: t
      });

      await curso.destroy({ transaction: t });

      await t.commit();

      console.log(`✅ [CURSOS] Curso ${id} eliminado com sucesso`);
      res.json({ message: "Curso eliminado com sucesso" });

    } catch (error) {
      await t.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ [CURSOS] Erro ao eliminar curso:', error.message);
    res.status(500).json({ 
      message: "Erro ao eliminar curso",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const getInscricoesCurso = async (req, res) => {
  try {
    const id_curso = req.params.id;
    
    if (!id_curso || isNaN(parseInt(id_curso))) {
      return res.status(400).json({ message: "ID de curso inválido" });
    }
    
    console.log(`👥 [CURSOS] A carregar lista de inscrições do curso ${id_curso}`);

    const inscricoes = await Inscricao_Curso.findAll({
      where: { 
        id_curso: parseInt(id_curso), 
        estado: 'inscrito' 
      },
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ['id_utilizador', 'nome', 'email', 'telefone'],
          required: true
        }
      ],
      order: [['data_inscricao', 'DESC']]
    });

    console.log(`✅ [CURSOS] ${inscricoes.length} inscrições carregadas`);
    res.json(inscricoes);
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao carregar inscrições:', error.message);
    res.status(500).json({ 
      message: "Erro ao procurar inscrições",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const getTopicosCurso = async (req, res) => {
  try {
    const id_curso = req.params.id;
    
    if (!id_curso || isNaN(parseInt(id_curso))) {
      return res.status(400).json({ message: "ID de curso inválido" });
    }
    
    console.log(`📝 [CURSOS] A carregar tópicos organizacionais do curso ${id_curso}`);

    const topicos = await Curso_Topicos.findAll({
      where: { 
        id_curso: parseInt(id_curso), 
        ativo: true 
      },
      order: [['ordem', 'ASC']]
    });

    console.log(`✅ [CURSOS] ${topicos.length} tópicos organizacionais encontrados`);
    res.json(topicos);
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao carregar tópicos:', error.message);
    res.status(500).json({ 
      message: "Erro ao obter tópicos do curso",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const createCurso_Topicos = async (req, res) => {
  try {
    const id_curso = req.params.id;
    const { nome, ordem } = req.body;

    if (!id_curso || isNaN(parseInt(id_curso))) {
      return res.status(400).json({ message: "ID de curso inválido" });
    }

    if (!nome?.trim()) {
      console.warn('⚠️ [CURSOS] Nome do tópico é obrigatório');
      return res.status(400).json({ message: "Nome do tópico é obrigatório" });
    }

    console.log(`📝 [CURSOS] A criar tópico organizacional "${nome}" para curso ${id_curso}`);

    const curso = await Curso.findByPk(parseInt(id_curso));
    if (!curso) {
      console.warn(`⚠️ [CURSOS] Curso ${id_curso} não encontrado`);
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    const ultimaOrdem = await Curso_Topicos.max('ordem', {
      where: { id_curso: parseInt(id_curso) }
    }) || 0;

    const ordemFinal = ordem ? parseInt(ordem) : ultimaOrdem + 1;

    const novoTopico = await Curso_Topicos.create({
      nome: nome.trim(),
      id_curso: parseInt(id_curso),
      ordem: ordemFinal,
      ativo: true
    });

    console.log(`✅ [CURSOS] Tópico criado com ID ${novoTopico.id_topico} na posição ${ordemFinal}`);

    res.status(201).json({
      message: "Tópico criado com sucesso",
      topico: novoTopico
    });
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao criar tópico organizacional:', error.message);
    res.status(500).json({ 
      message: "Erro ao criar tópico",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const updateCurso_Topicos = async (req, res) => {
  try {
    const id_topico = req.params.id;
    const { nome, ordem, ativo } = req.body;

    if (!id_topico || isNaN(parseInt(id_topico))) {
      return res.status(400).json({ message: "ID de tópico inválido" });
    }

    console.log(`📝 [CURSOS] A atualizar tópico organizacional ${id_topico}`);

    const topico = await Curso_Topicos.findByPk(parseInt(id_topico));
    if (!topico) {
      console.warn(`⚠️ [CURSOS] Tópico ${id_topico} não encontrado`);
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    const dadosAtualizacao = {};
    if (nome !== undefined && nome.trim()) dadosAtualizacao.nome = nome.trim();
    if (ordem !== undefined && !isNaN(parseInt(ordem))) dadosAtualizacao.ordem = parseInt(ordem);
    if (ativo !== undefined) dadosAtualizacao.ativo = ativo;

    await topico.update(dadosAtualizacao);

    console.log(`✅ [CURSOS] Tópico ${id_topico} atualizado com sucesso`);

    res.json({
      message: "Tópico atualizado com sucesso",
      topico
    });
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao atualizar tópico:', error.message);
    res.status(500).json({ 
      message: "Erro ao atualizar tópico",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const deleteCurso_Topicos = async (req, res) => {
  try {
    const id_topico = req.params.id;
    
    if (!id_topico || isNaN(parseInt(id_topico))) {
      return res.status(400).json({ message: "ID de tópico inválido" });
    }
    
    console.log(`🗑️ [CURSOS] A tentar eliminar tópico organizacional ${id_topico}`);

    const topico = await Curso_Topicos.findByPk(parseInt(id_topico));
    if (!topico) {
      console.warn(`⚠️ [CURSOS] Tópico ${id_topico} não encontrado`);
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    const pastas = await PastaCurso.findAll({
      where: { id_topico: parseInt(id_topico) }
    });

    if (pastas.length > 0) {
      await topico.update({ ativo: false });
      console.log(`⚠️ [CURSOS] Tópico ${id_topico} desativado (tem ${pastas.length} pastas associadas)`);
      
      return res.json({
        message: "Tópico desativado com sucesso. Não foi possível eliminar pois possui pastas associadas.",
        desativado: true
      });
    }

    await topico.destroy();
    console.log(`✅ [CURSOS] Tópico ${id_topico} eliminado com sucesso`);

    res.json({ message: "Tópico eliminado com sucesso" });
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao eliminar tópico:', error.message);
    res.status(500).json({ 
      message: "Erro ao eliminar tópico",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

module.exports = {
  getAllCursos,
  getCursosByCategoria,
  getTopicoArea,
  createCurso,
  getCursoById,
  getInscricoesCurso,
  updateCurso,
  deleteCurso,
  getCursosSugeridos,
  getTopicosCurso,
  createCurso_Topicos,
  updateCurso_Topicos,
  deleteCurso_Topicos
};