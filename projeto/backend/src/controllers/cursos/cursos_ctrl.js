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

// Importa controlador de notificações para envio automático
let notificacaoController;
try {
  notificacaoController = require('../notificacoes/notificacoes_ctrl');
} catch (error) {
  console.warn('⚠️ [CURSOS] Controlador de notificações não encontrado:', error.message);
  notificacaoController = null;
}

/**
 * Controlador completo para gestão do sistema de cursos
 * Oferece funcionalidades de listagem, criação, edição e eliminação de cursos
 * Inclui sistema avançado de filtros e recomendações personalizadas
 */

// =============================================================================
// LISTAGEM E CONSULTA DE CURSOS
// =============================================================================

/**
 * Busca e devolve lista paginada de cursos com filtros avançados
 * Suporta pesquisa textual, filtros por categoria, área, formador, tipo e estado
 * Implementa paginação eficiente e consultas otimizadas com JOIN's
 */
const getAllCursos = async (req, res) => {
  try {
    console.log('📚 [CURSOS] A processar listagem de cursos');
    
    // Extrai parâmetros de paginação com valores padrão sensatos
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Extrai todos os parâmetros de filtro da query string
    const { categoria, area, formador, search, tipo, estado, ativo, vagas, topico } = req.query;

    console.log('🔍 [CURSOS] Filtros aplicados:', { categoria, area, formador, search, tipo, estado, ativo, vagas, topico });

    // Constroi objeto de condições WHERE de forma dinâmica
    const where = {};

    // Aplica filtros numéricos se fornecidos e válidos
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

    // Filtro de pesquisa textual insensível a maiúsculas/minúsculas
    if (search && search.trim()) {
      where.nome = { [Op.iLike]: `%${search.trim()}%` };
    }

    // Filtros de texto e estado com validação
    if (tipo && ['sincrono', 'assincrono'].includes(tipo)) {
      where.tipo = tipo;
    }
    if (estado && ['planeado', 'em_curso', 'terminado', 'cancelado'].includes(estado)) {
      where.estado = estado;
    }

    // Filtro boolean para estado ativo/inativo
    if (ativo !== undefined) {
      where.ativo = ativo === 'false' ? false : true;
    }

    // Filtro de vagas mínimas (útil para procurar cursos com lugares disponíveis)
    if (vagas && !isNaN(parseInt(vagas))) {
      where.vagas = { [Op.gte]: parseInt(vagas, 10) };
    }

    // Define modelos relacionados a incluir na consulta para dados completos
    const includeModels = [
      {
        model: User,
        as: "formador",
        attributes: ['id_utilizador', 'nome', 'email'],
        required: false // LEFT JOIN para incluir cursos sem formador
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

    // Adiciona Topico_Area se o modelo estiver disponível na base de dados
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

    // Executa consulta principal com contagem total para paginação
    const { count, rows } = await Curso.findAndCountAll({
      where,
      offset,
      limit,
      order: [['data_inicio', 'DESC']], // Mostra cursos mais recentes primeiro
      include: includeModels
    });

    // Fallback para debugging: se não há resultados, tenta consulta básica
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

/**
 * Filtra cursos por categorias específicas
 * Aceita múltiplas categorias como string separada por vírgulas
 * Útil para páginas temáticas ou secções específicas da aplicação
 */
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

    // Converte string "1,2,3" para array de inteiros [1, 2, 3] e valida
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
        ativo: true // Só mostra cursos ativos
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
      order: [['nome', 'ASC']] // Ordena alfabeticamente para facilitar navegação
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

/**
 * Busca detalhes completos de um curso específico
 * Inclui informações sobre acesso, inscrições, cursos associados e validações de permissões
 * Esta função é crucial para a página de detalhes do curso
 */
const getCursoById = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id_utilizador || req.utilizador?.id_utilizador;

    // Valida se o ID do curso é um número válido
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "ID de curso inválido" });
    }

    console.log(`📖 [CURSOS] A carregar detalhes do curso ${id} para utilizador ${userId || 'anónimo'}`);

    // Busca curso com todas as relações necessárias para vista completa
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

    // Prepara objeto de resposta com dados base do curso
    const cursoComDetalhes = curso.toJSON();

    // Verifica se o curso já terminou comparando datas
    const dataAtual = new Date();
    const dataFimCurso = new Date(curso.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;

    cursoComDetalhes.terminado = cursoTerminado;

    // Aplica regras de acesso para cursos terminados baseadas no tipo e inscrição
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

    // Conta inscrições ativas para cursos síncronos (mostra ocupação atual)
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

    // Carrega cursos associados para sugestões e navegação relacionada
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
    res.json(cursoComDetalhes);
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao carregar curso:', error.message);
    res.status(500).json({ 
      message: "Erro ao procurar curso", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Busca tópico de área específico por identificador
 * Utilizado para obter detalhes de um tópico específico
 */
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

// =============================================================================
// CRIAÇÃO E EDIÇÃO DE CURSOS
// =============================================================================

/**
 * Cria novo curso no sistema com validações completas
 * Gere criação de diretórios, processamento de imagens e notificações automáticas
 * Implementa transações para garantir consistência dos dados
 */
const createCurso = async (req, res) => {
  try {
    console.log('🆕 [CURSOS] A iniciar criação de novo curso');
    console.log('📋 [CURSOS] Dados recebidos:', req.body);
    
    const {
      nome, descricao, tipo, vagas, duracao, data_inicio, data_fim,
      id_formador, id_area, id_categoria, topicos, id_topico_categoria
    } = req.body;

    // Validações obrigatórias dos campos principais
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

    // Validação das datas
    const dataInicioObj = new Date(data_inicio);
    const dataFimObj = new Date(data_fim);
    if (dataFimObj <= dataInicioObj) {
      return res.status(400).json({ message: "Data de fim deve ser posterior à data de início!" });
    }

    if (!id_topico_categoria || isNaN(parseInt(id_topico_categoria))) {
      console.warn('⚠️ [CURSOS] Tópico não selecionado');
      return res.status(400).json({ message: "É necessário selecionar um tópico para o curso!" });
    }

    // Validações específicas para cursos síncronos (requerem formador e vagas)
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

    // Verifica se já existe um curso com o mesmo nome (case-insensitive)
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

    // Criação da estrutura de diretórios para o curso
    const cursoSlug = uploadUtils.normalizarNome(nome.trim());
    const cursoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug);
    uploadUtils.ensureDir(cursoDir);
    const dirPath = `uploads/cursos/${cursoSlug}`;

    console.log(`📁 [CURSOS] Diretório criado: ${dirPath}`);

    // Processa imagem de capa se foi enviada
    let imagemPath = null;
    if (req.file) {
      imagemPath = `${dirPath}/capa.png`;
      console.log(`🖼️ [CURSOS] Imagem de capa processada: ${imagemPath}`);
    }

    // Transação para garantir consistência dos dados
    const t = await sequelize.transaction();

    try {
      // Determina número de vagas baseado no tipo do curso
      let vagasFinais = null;
      if (tipo === 'sincrono') {
        vagasFinais = parseInt(vagas, 10);
      }
      // Cursos assíncronos não têm limite de vagas

      // Prepara dados para criação do curso
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
        id_topico_area: parseInt(id_topico_categoria),
        imagem_path: imagemPath,
        dir_path: dirPath,
        duracao: parseInt(duracao, 10),
        ativo: true,
        estado: 'planeado' // Estado inicial padrão
      };

      // Cria o curso principal na base de dados
      const novoCurso = await Curso.create(dadosCurso, { transaction: t });
      console.log(`✅ [CURSOS] Curso criado com ID ${novoCurso.id_curso}`);

      // Cria tópicos organizacionais adicionais se fornecidos
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

      // Confirma toda a transação
      await t.commit();
      console.log('✅ [CURSOS] Transação de criação confirmada com sucesso');

      // Pós-processamento (fora da transação para não bloquear resposta)

      // Auto-inscreve formador em cursos síncronos
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

      // Envio de notificações via WebSocket (assíncrono)
      try {
        console.log('📢 [CURSOS] A processar notificações sobre novo curso...');
        
        // Verifica se WebSocket está disponível
        if (!req.io) {
          console.warn('⚠️ [CURSOS] WebSocket não disponível - notificações podem falhar');
        }

        // Chama função de notificação se disponível
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
        // Continua execução mesmo com falha nas notificações
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
      // Reverte transação em caso de qualquer erro
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

/**
 * Gera sugestões personalizadas de cursos para o utilizador
 * Analisa histórico de inscrições e preferências para recomendações inteligentes
 * Utiliza algoritmo baseado em padrões de interesse e disponibilidade
 */
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

    // Verifica conexão com base de dados
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
      // Analisa histórico de inscrições do utilizador
      const inscricoes = await Inscricao_Curso.findAll({
        where: { id_utilizador },
        attributes: ['id_curso']
      });

      const cursosInscritosIds = inscricoes.map(i => i.id_curso);
      console.log(`📊 [CURSOS] ${cursosInscritosIds.length} cursos no histórico do utilizador`);

      if (inscricoes.length > 0) {
        // Análise de preferências baseada no histórico
        
        // Busca dados dos cursos onde o utilizador se inscreveu
        const cursosInscritos = await Curso.findAll({
          where: { id_curso: cursosInscritosIds },
          attributes: ['id_categoria', 'id_area']
        });

        // Extrai padrões de interesse do utilizador
        const categoriasInscrito = [...new Set(cursosInscritos.map(c => c.id_categoria).filter(id => id))];
        const areasInscrito = [...new Set(cursosInscritos.map(c => c.id_area).filter(id => id))];

        console.log(`🏷️ [CURSOS] Categorias de interesse identificadas: ${categoriasInscrito.join(', ')}`);
        console.log(`🌍 [CURSOS] Áreas já exploradas: ${areasInscrito.join(', ')}`);

        // Estratégia de sugestão inteligente: expandir horizontes
        if (categoriasInscrito.length > 0 && areasInscrito.length > 0) {
          // Sugere cursos de categorias conhecidas mas em áreas ainda não exploradas
          const whereConditions = {
            id_categoria: { [Op.in]: categoriasInscrito }, // Categorias familiares
            id_area: { [Op.notIn]: areasInscrito }, // Áreas novas para explorar
            id_curso: { [Op.notIn]: cursosInscritosIds }, // Não já inscritos
            ativo: true
          };

          // Adiciona condições para disponibilidade e vagas
          const orConditions = [
            { tipo: 'assincrono' } // Sempre disponíveis
          ];

          // Para cursos síncronos, verifica se há vagas disponíveis
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

      // Fallback: sugestões gerais se não há suficientes sugestões personalizadas
      if (cursosSugeridos.length < 5) {
        console.log('🎲 [CURSOS] A gerar sugestões complementares...');
        
        const whereConditions = {
          ativo: true
        };

        // Exclui cursos já inscritos se houver histórico
        if (cursosInscritosIds.length > 0) {
          whereConditions.id_curso = { [Op.notIn]: cursosInscritosIds };
        }

        // Adiciona condições de disponibilidade
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

        // Combina sugestões evitando duplicatas
        const idsExistentes = new Set(cursosSugeridos.map(c => c.id_curso));
        const novasSugestoes = sugestoesFallback.filter(curso => !idsExistentes.has(curso.id_curso));
        
        cursosSugeridos = [...cursosSugeridos, ...novasSugestoes];

        console.log(`🎲 [CURSOS] ${novasSugestoes.length} sugestões complementares adicionadas`);
      }

      // Limita a 10 sugestões finais para performance
      cursosSugeridos = cursosSugeridos.slice(0, 10);

    } catch (queryError) {
      console.error('❌ [CURSOS] Erro nas consultas de sugestão:', queryError.message);
      
      // Fallback absoluto: cursos mais recentes disponíveis
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

/**
 * Atualiza dados de um curso existente
 * Verifica permissões antes de permitir alterações
 * Só administradores ou formadores do curso podem editar
 */
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

    // Verifica permissões (admin ou formador do curso)
    if (userRole !== 1 && curso.id_formador !== userId) {
      return res.status(403).json({ message: "Não tens permissão para editar este curso" });
    }

    const {
      nome, descricao, tipo, vagas, duracao, data_inicio, data_fim,
      id_formador, id_area, id_categoria, id_topico_categoria, ativo, estado
    } = req.body;

    // Prepara dados para atualização apenas com campos fornecidos
    const dadosAtualizacao = {};

    if (nome !== undefined && nome.trim()) dadosAtualizacao.nome = nome.trim();
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao?.trim() || null;
    if (tipo !== undefined && ['sincrono', 'assincrono'].includes(tipo)) dadosAtualizacao.tipo = tipo;
    if (vagas !== undefined && !isNaN(parseInt(vagas))) dadosAtualizacao.vagas = parseInt(vagas);
    if (duracao !== undefined && !isNaN(parseInt(duracao))) dadosAtualizacao.duracao = parseInt(duracao);
    if (data_inicio !== undefined) dadosAtualizacao.data_inicio = new Date(data_inicio);
    if (data_fim !== undefined) dadosAtualizacao.data_fim = new Date(data_fim);
    if (id_formador !== undefined && !isNaN(parseInt(id_formador))) dadosAtualizacao.id_formador = parseInt(id_formador);
    if (id_area !== undefined && !isNaN(parseInt(id_area))) dadosAtualizacao.id_area = parseInt(id_area);
    if (id_categoria !== undefined && !isNaN(parseInt(id_categoria))) dadosAtualizacao.id_categoria = parseInt(id_categoria);
    if (id_topico_categoria !== undefined && !isNaN(parseInt(id_topico_categoria))) dadosAtualizacao.id_topico_area = parseInt(id_topico_categoria);
    if (ativo !== undefined) dadosAtualizacao.ativo = ativo;
    if (estado !== undefined && ['planeado', 'em_curso', 'terminado', 'cancelado'].includes(estado)) dadosAtualizacao.estado = estado;

    // Validação das datas se ambas foram fornecidas
    if (dadosAtualizacao.data_inicio && dadosAtualizacao.data_fim) {
      if (dadosAtualizacao.data_fim <= dadosAtualizacao.data_inicio) {
        return res.status(400).json({ message: "Data de fim deve ser posterior à data de início!" });
      }
    }

    // Processa nova imagem se foi enviada
    if (req.file) {
      const cursoSlug = uploadUtils.normalizarNome(dadosAtualizacao.nome || curso.nome);
      const dirPath = `uploads/cursos/${cursoSlug}`;
      const imagemPath = `${dirPath}/capa.png`;
      dadosAtualizacao.imagem_path = imagemPath;
      console.log(`🖼️ [CURSOS] Nova imagem processada: ${imagemPath}`);
    }

    // Atualiza curso na base de dados
    await curso.update(dadosAtualizacao);

    console.log(`✅ [CURSOS] Curso ${id} atualizado com sucesso`);
    res.json({
      message: "Curso atualizado com sucesso",
      curso: curso
    });

  } catch (error) {
    console.error('❌ [CURSOS] Erro ao atualizar curso:', error.message);
    res.status(500).json({ 
      message: "Erro ao atualizar curso",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Elimina curso e toda a estrutura associada
 * Remove inscrições, tópicos e outros dados relacionados usando transação
 * Só administradores podem eliminar cursos
 */
const deleteCurso = async (req, res) => {
  try {
    const id = req.params.id;
    const userRole = req.user?.id_cargo || req.utilizador?.id_cargo;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "ID de curso inválido" });
    }

    // Só administradores podem eliminar cursos
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
      // Elimina inscrições associadas
      await Inscricao_Curso.destroy({
        where: { id_curso: id },
        transaction: t
      });

      // Elimina tópicos organizacionais
      await Curso_Topicos.destroy({
        where: { id_curso: id },
        transaction: t
      });

      // Elimina associações com outros cursos
      await AssociarCursos.destroy({
        where: {
          [Op.or]: [
            { id_curso_origem: id },
            { id_curso_destino: id }
          ]
        },
        transaction: t
      });

      // Elimina o curso principal
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

/**
 * Lista todas as inscrições ativas de um curso específico
 * Inclui dados básicos dos utilizadores inscritos
 */
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

// =============================================================================
// GESTÃO DE TÓPICOS ORGANIZACIONAIS
// =============================================================================

/**
 * Busca estrutura de tópicos organizacionais de um curso
 * Utilizado para organizar conteúdo dentro do curso
 */
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

/**
 * Cria novo tópico organizacional para um curso
 * Determina automaticamente a ordem se não especificada
 */
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

    // Determina ordem automática se não especificada
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

/**
 * Atualiza dados de um tópico organizacional existente
 * Permite alterar nome, ordem e estado ativo
 */
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

/**
 * Elimina tópico organizacional
 * Desativa se tem pastas associadas, elimina completamente se não tem
 * Esta abordagem preserva a integridade dos dados
 */
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

    // Verifica se tem pastas associadas antes de eliminar
    const pastas = await PastaCurso.findAll({
      where: { id_topico: parseInt(id_topico) }
    });

    if (pastas.length > 0) {
      // Desativa em vez de eliminar se tem conteúdo associado
      await topico.update({ ativo: false });
      console.log(`⚠️ [CURSOS] Tópico ${id_topico} desativado (tem ${pastas.length} pastas associadas)`);
      
      return res.json({
        message: "Tópico desativado com sucesso. Não foi possível eliminar pois possui pastas associadas.",
        desativado: true
      });
    }

    // Elimina completamente se não tem conteúdo
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

// Exporta todas as funções públicas do controlador
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