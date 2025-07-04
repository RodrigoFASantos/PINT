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

// Importar controlador de notificações para envio automático
const notificacaoController = require('../notificacoes/notificacoes_ctrl');

/**
 * Controlador completo para gestão do sistema de cursos
 * 
 * Este módulo centraliza todas as operações relacionadas com cursos na plataforma:
 * - Criação, edição e eliminação de cursos
 * - Consulta e listagem com filtros avançados
 * - Gestão de tópicos organizacionais
 * - Sistema integrado de notificações via WebSocket
 * 
 * Suporta dois tipos de cursos:
 * - Síncronos: com formador definido e vagas limitadas
 * - Assíncronos: para autoestudo, sem formador nem limite de vagas
 */

// =============================================================================
// LISTAGEM E CONSULTA DE CURSOS
// =============================================================================

/**
 * Obtém lista paginada de cursos com filtros avançados
 * 
 * Esta função serve a página principal de cursos com capacidades de pesquisa
 * e filtro. Suporta paginação para grandes volumes de dados e múltiplos
 * critérios de filtro simultaneamente.
 * 
 * Filtros disponíveis:
 * - categoria: ID da categoria específica
 * - area: ID da área de formação
 * - formador: ID do formador responsável
 * - search: pesquisa textual no nome do curso
 * - tipo: sincrono ou assincrono
 * - estado: planeado, em_curso, terminado
 * - ativo: boolean para cursos ativos/inativos
 * - vagas: número mínimo de vagas disponíveis
 * - topico: ID do tópico de área
 * 
 * @param {Object} req - Requisição Express com query parameters para filtros
 * @param {Object} res - Resposta Express com lista paginada de cursos
 */
const getAllCursos = async (req, res) => {
  try {
    console.log('📚 [CURSOS] A processar listagem de cursos');
    
    // Extrair parâmetros de paginação com valores padrão sensatos
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Extrair todos os parâmetros de filtro da query string
    const { categoria, area, formador, search, tipo, estado, ativo, vagas, topico } = req.query;

    console.log('🔍 [CURSOS] Filtros aplicados:', { categoria, area, formador, search, tipo, estado, ativo, vagas, topico });

    // Construir objeto de condições WHERE de forma dinâmica
    const where = {};

    // Aplicar filtros numéricos se fornecidos
    if (categoria) {
      where.id_categoria = parseInt(categoria, 10);
    }
    if (area) {
      where.id_area = parseInt(area, 10);
    }
    if (formador) {
      where.id_formador = parseInt(formador, 10);
    }
    if (topico) {
      where.id_topico_area = parseInt(topico, 10);
    }

    // Filtro de pesquisa textual insensível a maiúsculas/minúsculas
    if (search) {
      where.nome = { [Op.iLike]: `%${search}%` };
    }

    // Filtros de texto e estado
    if (tipo) {
      where.tipo = tipo;
    }
    if (estado) {
      where.estado = estado;
    }

    // Filtro boolean para estado ativo/inativo
    if (ativo !== undefined) {
      where.ativo = ativo === 'false' ? false : true;
    }

    // Filtro de vagas mínimas (útil para procurar cursos com lugares)
    if (vagas) {
      where.vagas = { [Op.gte]: parseInt(vagas, 10) };
    }

    // Definir modelos relacionados a incluir na consulta
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

    // Adicionar Topico_Area se o modelo estiver disponível
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

    // Executar consulta principal com contagem total para paginação
    const { count, rows } = await Curso.findAndCountAll({
      where,
      offset,
      limit,
      order: [['data_inicio', 'DESC']], // Mostrar cursos mais recentes primeiro
      include: includeModels
    });

    // Fallback para debugging: se não há resultados, tentar consulta básica
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
 * Obtém cursos filtrados por categorias específicas
 * 
 * Função especializada para listar cursos que pertencem a uma ou mais
 * categorias específicas. Muito utilizada em integrações com sistemas
 * de gestão de formadores e para construir listagens temáticas.
 * 
 * @param {Object} req - Requisição com IDs de categorias separados por vírgula
 * @param {Object} res - Resposta Express com cursos das categorias
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

    // Converter string "1,2,3" para array de inteiros [1, 2, 3]
    const categoriaIds = categorias.split(',').map(id => parseInt(id.trim()));
    console.log(`🏷️ [CURSOS] A filtrar por categorias:`, categoriaIds);

    const { count, rows } = await Curso.findAndCountAll({
      where: {
        id_categoria: { [Op.in]: categoriaIds }
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
      order: [['nome', 'ASC']] // Ordenar alfabeticamente para facilitar navegação
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
 * Obtém detalhes completos de um curso específico
 * 
 * Função principal para visualização de curso individual. Carrega todas
 * as informações relacionadas e aplica regras de negócio específicas:
 * - Verifica se o curso já terminou
 * - Para cursos terminados, apenas alunos inscritos podem ver detalhes
 * - Conta inscrições ativas para mostrar ocupação
 * - Carrega cursos associados para recomendações
 * 
 * @param {Object} req - Requisição com ID do curso nos parâmetros
 * @param {Object} res - Resposta Express com detalhes completos do curso
 */
const getCursoById = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id_utilizador;

    console.log(`📖 [CURSOS] A carregar detalhes do curso ${id} para utilizador ${userId || 'anónimo'}`);

    // Buscar curso com todas as relações necessárias para vista completa
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

    // Preparar objeto de resposta com dados base do curso
    const cursoComDetalhes = curso.toJSON();

    // Verificar se o curso já terminou comparando datas
    const dataAtual = new Date();
    const dataFimCurso = new Date(curso.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;

    cursoComDetalhes.terminado = cursoTerminado;

    // Aplicar regras de acesso para cursos terminados
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

    // Contar inscrições ativas para cursos síncronos (mostrar ocupação)
    try {
      if (curso.tipo === 'sincrono' && curso.vagas) {
        let whereInscricoes = { id_curso: id };

        // Tentar determinar o campo correto para estado das inscrições
        try {
          const inscricaoAmostra = await Inscricao_Curso.findOne({ where: { id_curso: id } });
          if (inscricaoAmostra) {
            if ('ativo' in inscricaoAmostra.dataValues) {
              whereInscricoes.ativo = true;
            } else if ('status' in inscricaoAmostra.dataValues) {
              whereInscricoes.status = 'ativo';
            } else if ('estado' in inscricaoAmostra.dataValues) {
              whereInscricoes.estado = 'inscrito';
            }
          }
        } catch (e) {
          console.warn('⚠️ [CURSOS] Não foi possível determinar campo de estado das inscrições');
        }

        const inscricoesAtivas = await Inscricao_Curso.count({ where: whereInscricoes });
        cursoComDetalhes.inscricoesAtivas = inscricoesAtivas;
        console.log(`👥 [CURSOS] ${inscricoesAtivas} inscrições ativas encontradas`);
      }
    } catch (inscricoesError) {
      console.warn('⚠️ [CURSOS] Erro ao contar inscrições:', inscricoesError.message);
      cursoComDetalhes.inscricoesAtivas = 0;
    }

    // Carregar cursos associados para sugestões e navegação relacionada
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
 * 
 * Função auxiliar utilizada principalmente em formulários para validar
 * e obter informações sobre tópicos de área disponíveis.
 * 
 * @param {Object} req - Requisição com ID do tópico nos parâmetros
 * @param {Object} res - Resposta Express com dados do tópico
 */
const getTopicoArea = async (req, res) => {
  try {
    const id = req.params.id;
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
 * Cria novo curso no sistema
 * 
 * Função principal para criação de cursos. Executa o fluxo completo:
 * 1. Validação rigorosa de todos os campos obrigatórios
 * 2. Verificação de unicidade do nome do curso
 * 3. Criação da estrutura de diretórios no sistema de ficheiros
 * 4. Processamento e armazenamento de imagem de capa
 * 5. Criação do registo na base de dados dentro de transação
 * 6. Auto-inscrição do formador (para cursos síncronos)
 * 7. Envio de notificações automáticas via WebSocket
 * 
 * @param {Object} req - Requisição Express com dados do curso e ficheiro opcional
 * @param {Object} res - Resposta Express com confirmação e ID do curso criado
 */
const createCurso = async (req, res) => {
  try {
    console.log('🆕 [CURSOS] A iniciar criação de novo curso');
    console.log('📋 [CURSOS] Dados recebidos:', req.body);
    
    const {
      nome, descricao, tipo, vagas, duracao, data_inicio, data_fim,
      id_formador, id_area, id_categoria, topicos, id_topico_categoria
    } = req.body;

    // === VALIDAÇÕES OBRIGATÓRIAS ===
    if (!nome || !tipo || !data_inicio || !data_fim || !id_area || !id_categoria || !duracao) {
      console.warn('⚠️ [CURSOS] Campos obrigatórios em falta na requisição');
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    if (!id_topico_categoria) {
      console.warn('⚠️ [CURSOS] Tópico não selecionado');
      return res.status(400).json({ message: "É necessário selecionar um tópico para o curso!" });
    }

    // Validações específicas para cursos síncronos (requerem formador e vagas)
    if (tipo === 'sincrono') {
      if (!id_formador) {
        console.warn('⚠️ [CURSOS] Formador obrigatório para curso síncrono');
        return res.status(400).json({ message: "É obrigatório selecionar um formador para cursos síncronos!" });
      }
      if (!vagas || parseInt(vagas, 10) <= 0) {
        console.warn('⚠️ [CURSOS] Vagas obrigatórias para curso síncrono');
        return res.status(400).json({ message: "É necessário definir um número válido de vagas para cursos síncronos!" });
      }
    }

    // Verificar se já existe um curso com o mesmo nome
    const cursoExistente = await Curso.findOne({ where: { nome } });
    if (cursoExistente) {
      console.warn('⚠️ [CURSOS] Tentativa de criar curso com nome duplicado:', nome);
      return res.status(400).json({
        message: "Já existe um curso com este nome. Por favor, escolhe um nome diferente.",
        error: "NOME_DUPLICADO"
      });
    }

    // === CRIAÇÃO DA ESTRUTURA DE DIRETÓRIOS ===
    const cursoSlug = uploadUtils.normalizarNome(nome);
    const cursoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug);
    uploadUtils.ensureDir(cursoDir);
    const dirPath = `uploads/cursos/${cursoSlug}`;

    console.log(`📁 [CURSOS] Diretório criado: ${dirPath}`);

    // Processar imagem de capa se foi enviada
    let imagemPath = null;
    if (req.file) {
      imagemPath = `${dirPath}/capa.png`;
      console.log(`🖼️ [CURSOS] Imagem de capa processada: ${imagemPath}`);
    }

    // === TRANSAÇÃO PARA GARANTIR CONSISTÊNCIA ===
    const t = await sequelize.transaction();

    try {
      // Determinar número de vagas baseado no tipo do curso
      let vagasFinais = null;
      if (tipo === 'sincrono') {
        vagasFinais = parseInt(vagas, 10);
      }
      // Cursos assíncronos não têm limite de vagas

      // Preparar dados para criação do curso
      const dadosCurso = {
        nome,
        descricao,
        tipo,
        vagas: vagasFinais,
        data_inicio,
        data_fim,
        id_formador: tipo === 'sincrono' ? id_formador : null,
        id_area,
        id_categoria,
        id_topico_area: id_topico_categoria,
        imagem_path: imagemPath,
        dir_path: dirPath,
        duracao: parseInt(duracao, 10),
        ativo: true
      };

      // Criar o curso principal na base de dados
      const novoCurso = await Curso.create(dadosCurso, { transaction: t });
      console.log(`✅ [CURSOS] Curso criado com ID ${novoCurso.id_curso}`);

      // Criar tópicos organizacionais adicionais se fornecidos
      if (topicos && Array.isArray(topicos) && topicos.length > 0) {
        console.log(`📝 [CURSOS] A criar ${topicos.length} tópicos organizacionais adicionais`);
        
        for (let i = 0; i < topicos.length; i++) {
          await Curso_Topicos.create({
            nome: topicos[i].nome,
            id_curso: novoCurso.id_curso,
            ordem: i + 1,
            ativo: true
          }, { transaction: t });
        }
      }

      // Confirmar toda a transação
      await t.commit();
      console.log('✅ [CURSOS] Transação de criação confirmada com sucesso');

      // === PÓS-PROCESSAMENTO (FORA DA TRANSAÇÃO) ===

      // Auto-inscrever formador em cursos síncronos
      if (tipo === "sincrono" && id_formador) {
        try {
          await Inscricao_Curso.create({
            id_utilizador: id_formador,
            id_curso: novoCurso.id_curso,
            data_inscricao: new Date(),
            estado: "inscrito"
          });
          console.log('👨‍🏫 [CURSOS] Formador auto-inscrito no curso com sucesso');
        } catch (enrollError) {
          console.warn('⚠️ [CURSOS] Erro na auto-inscrição do formador (não crítico):', enrollError.message);
        }
      }

      // === ENVIO DE NOTIFICAÇÕES VIA WEBSOCKET ===
      try {
        console.log('📢 [CURSOS] A processar notificações sobre novo curso...');
        
        // Verificar se WebSocket está disponível
        if (!req.io) {
          console.warn('⚠️ [CURSOS] WebSocket não disponível - notificações podem falhar');
        }

        // Chamar função de notificação corrigida
        const resultadoNotificacao = await notificacaoController.notificarNovoCurso(novoCurso, req.io);
        
        if (resultadoNotificacao) {
          console.log(`✅ [CURSOS] ${resultadoNotificacao.associacoes.length} notificações de novo curso enviadas`);
        } else {
          console.log('ℹ️ [CURSOS] Nenhuma notificação enviada (sem destinatários válidos)');
        }
      } catch (notificationError) {
        console.warn('⚠️ [CURSOS] Erro ao enviar notificações (não crítico):', notificationError.message);
        // Continuar execução mesmo com falha nas notificações
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
      // Reverter transação em caso de qualquer erro
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
 * Atualiza curso existente
 * 
 * Função complexa para edição de cursos que gere múltiplos aspetos:
 * 1. Validação de permissões e dados
 * 2. Detecção automática de alterações relevantes
 * 3. Renomeação de diretórios se o nome mudou
 * 4. Gestão de nova imagem de capa
 * 5. Atualização automática do estado baseado nas datas
 * 6. Envio de notificações específicas por tipo de alteração
 * 
 * Sistema de notificações inteligente:
 * - Alterações gerais (nome, descrição, etc.)
 * - Alterações específicas de formador
 * - Alterações de cronograma (datas)
 * 
 * @param {Object} req - Requisição Express com dados atualizados
 * @param {Object} res - Resposta Express com confirmação e detalhes das alterações
 */
const updateCurso = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`📝 [CURSOS] A iniciar atualização do curso ${id}`);
    console.log('📋 [CURSOS] Dados recebidos para atualização:', req.body);
    
    const { 
      nome, descricao, tipo, vagas, duracao, data_inicio, data_fim, 
      id_formador, id_area, id_categoria, id_topico_area, ativo 
    } = req.body;

    // Carregar dados atuais do curso com todas as relações necessárias
    const cursoAtual = await Curso.findByPk(id, {
      include: [
        { model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] },
        { model: Area, as: 'area', attributes: ['nome'] },
        { model: Categoria, as: 'categoria', attributes: ['nome'] },
        { model: Topico_Area, as: 'Topico_Area', attributes: ['titulo'] }
      ]
    });

    if (!cursoAtual) {
      console.warn(`⚠️ [CURSOS] Curso ${id} não encontrado para atualização`);
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    console.log(`📖 [CURSOS] A atualizar curso: ${cursoAtual.nome}`);

    // === VALIDAÇÕES ESPECÍFICAS ===
    if (tipo === 'sincrono' && !id_formador) {
      console.warn('⚠️ [CURSOS] Formador obrigatório para curso síncrono');
      return res.status(400).json({ message: "É obrigatório selecionar um formador para cursos síncronos!" });
    }

    // === GESTÃO DE DIRETÓRIOS E RENOMEAÇÃO ===
    const nomeAtual = cursoAtual.nome;
    const novoNome = nome || nomeAtual;
    const nomeMudou = novoNome !== nomeAtual;

    console.log(`📂 [CURSOS] Verificação de mudança de nome: ${nomeMudou} (${nomeAtual} → ${novoNome})`);

    // Preparar caminhos de diretórios
    const cursoSlugAtual = uploadUtils.normalizarNome(nomeAtual);
    const novoCursoSlug = uploadUtils.normalizarNome(novoNome);
    
    const pastaAtual = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAtual);
    const novaPasta = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', novoCursoSlug);
    
    const dirPathAtual = cursoAtual.dir_path || `uploads/cursos/${cursoSlugAtual}`;
    let novoDirPath = `uploads/cursos/${novoCursoSlug}`;

    // Executar renomeação de diretório se necessário
    let pastaRenomeada = false;
    if (nomeMudou && fs.existsSync(pastaAtual)) {
      try {
        // Verificar se o destino já existe para evitar conflitos
        if (fs.existsSync(novaPasta)) {
          let contador = 1;
          let novaPastaUnica = `${novaPasta}_${contador}`;
          while (fs.existsSync(novaPastaUnica)) {
            contador++;
            novaPastaUnica = `${novaPasta}_${contador}`;
          }
          fs.renameSync(pastaAtual, novaPastaUnica);
          
          const slugUnico = `${novoCursoSlug}_${contador}`;
          novoDirPath = `uploads/cursos/${slugUnico}`;
          console.log(`📁 [CURSOS] Pasta renomeada com sufixo único: ${slugUnico}`);
        } else {
          fs.renameSync(pastaAtual, novaPasta);
          console.log(`📁 [CURSOS] Pasta renomeada: ${pastaAtual} → ${novaPasta}`);
        }
        
        pastaRenomeada = true;
      } catch (renameError) {
        console.warn('⚠️ [CURSOS] Erro ao renomear pasta (continuando):', renameError.message);
        pastaRenomeada = false;
      }
    }

    // === PROCESSAMENTO DE IMAGEM ===
    let novaImagemPath = cursoAtual.imagem_path;
    
    if (req.file) {
      // Nova imagem enviada
      novaImagemPath = `${novoDirPath}/capa.png`;
      console.log(`🖼️ [CURSOS] Nova imagem de capa processada: ${novaImagemPath}`);
    } else if (nomeMudou && cursoAtual.imagem_path) {
      // Apenas atualizar caminho da imagem existente
      novaImagemPath = `${novoDirPath}/capa.png`;
      console.log(`🖼️ [CURSOS] Caminho de imagem atualizado: ${novaImagemPath}`);
    }

    // === DETECÇÃO INTELIGENTE DE ALTERAÇÕES ===
    const alteracoes = [];

    console.log('🔍 [CURSOS] A analisar alterações para sistema de notificações...');

    // Verificar cada campo relevante para alterações
    if (nome && nome !== cursoAtual.nome) {
      alteracoes.push({
        campo: 'nome',
        valor_antigo: cursoAtual.nome,
        valor_novo: nome
      });
    }

    if (descricao && descricao !== cursoAtual.descricao) {
      alteracoes.push({
        campo: 'descricao',
        valor_antigo: cursoAtual.descricao || 'Sem descrição',
        valor_novo: descricao
      });
    }

    if (tipo && tipo !== cursoAtual.tipo) {
      alteracoes.push({
        campo: 'tipo',
        valor_antigo: cursoAtual.tipo,
        valor_novo: tipo
      });
    }

    if (duracao !== undefined && parseInt(duracao, 10) !== cursoAtual.duracao) {
      alteracoes.push({
        campo: 'duracao',
        valor_antigo: `${cursoAtual.duracao} horas`,
        valor_novo: `${duracao} horas`
      });
    }

    // Verificar alterações de vagas (apenas para cursos síncronos)
    if (tipo === 'sincrono' && vagas !== undefined) {
      const novasVagas = parseInt(vagas, 10);
      if (novasVagas !== cursoAtual.vagas) {
        alteracoes.push({
          campo: 'vagas',
          valor_antigo: cursoAtual.vagas ? `${cursoAtual.vagas} vagas` : 'Sem limite',
          valor_novo: `${novasVagas} vagas`
        });
      }
    }

    // Verificar alterações em campos relacionados (com nomes amigáveis)
    if (id_area && parseInt(id_area) !== cursoAtual.id_area) {
      const novaArea = await Area.findByPk(id_area);
      alteracoes.push({
        campo: 'id_area',
        valor_antigo: cursoAtual.area ? cursoAtual.area.nome : 'Área anterior',
        valor_novo: novaArea ? novaArea.nome : 'Nova área'
      });
    }

    if (id_categoria && parseInt(id_categoria) !== cursoAtual.id_categoria) {
      const novaCategoria = await Categoria.findByPk(id_categoria);
      alteracoes.push({
        campo: 'id_categoria',
        valor_antigo: cursoAtual.categoria ? cursoAtual.categoria.nome : 'Categoria anterior',
        valor_novo: novaCategoria ? novaCategoria.nome : 'Nova categoria'
      });
    }

    if (id_topico_area && parseInt(id_topico_area) !== cursoAtual.id_topico_area) {
      const novoTopico = await Topico_Area.findByPk(id_topico_area);
      alteracoes.push({
        campo: 'id_topico_area',
        valor_antigo: cursoAtual.Topico_Area ? cursoAtual.Topico_Area.titulo : 'Tópico anterior',
        valor_novo: novoTopico ? novoTopico.titulo : 'Novo tópico'
      });
    }

    console.log(`📊 [CURSOS] ${alteracoes.length} alterações detetadas:`, alteracoes.map(a => a.campo));

    // Guardar dados relevantes para notificações específicas
    const dataInicioAntiga = cursoAtual.data_inicio;
    const dataFimAntiga = cursoAtual.data_fim;
    const formadorAntigo = cursoAtual.formador ? {
      id_utilizador: cursoAtual.formador.id_utilizador,
      nome: cursoAtual.formador.nome
    } : null;

    // === CÁLCULO AUTOMÁTICO DO ESTADO DO CURSO ===
    let novoEstado = cursoAtual.estado;
    if (data_inicio || data_fim) {
      const dataAtual = new Date();
      const novaDataInicio = data_inicio ? new Date(data_inicio) : new Date(cursoAtual.data_inicio);
      const novaDataFim = data_fim ? new Date(data_fim) : new Date(cursoAtual.data_fim);
      
      if (novaDataFim < dataAtual) {
        novoEstado = 'terminado';
      } else if (novaDataInicio <= dataAtual) {
        novoEstado = 'em_curso';
      } else {
        novoEstado = 'planeado';
      }
      
      console.log(`📅 [CURSOS] Estado calculado automaticamente: ${novoEstado}`);
    }

    // Determinar vagas finais baseado no tipo
    let vagasFinais = cursoAtual.vagas;
    if (tipo === 'sincrono' && vagas !== undefined) {
      vagasFinais = parseInt(vagas, 10);
    } else if (tipo === 'assincrono') {
      vagasFinais = null; // Cursos assíncronos não têm limite
    }

    // === ATUALIZAÇÃO NA BASE DE DADOS ===
    await cursoAtual.update({
      nome: novoNome,
      descricao: descricao || cursoAtual.descricao,
      tipo: tipo || cursoAtual.tipo,
      vagas: vagasFinais,
      data_inicio: data_inicio || cursoAtual.data_inicio,
      data_fim: data_fim || cursoAtual.data_fim,
      id_formador: tipo === 'sincrono' ? 
        (id_formador !== undefined ? id_formador : cursoAtual.id_formador) : 
        null,
      id_area: id_area || cursoAtual.id_area,
      id_categoria: id_categoria || cursoAtual.id_categoria,
      id_topico_area: id_topico_area || cursoAtual.id_topico_area,
      duracao: duracao !== undefined ? parseInt(duracao, 10) : cursoAtual.duracao,
      ativo: ativo !== undefined ? ativo : cursoAtual.ativo,
      estado: novoEstado,
      imagem_path: novaImagemPath,
      dir_path: novoDirPath
    });

    console.log('✅ [CURSOS] Curso atualizado na base de dados com sucesso');

    // Recarregar curso com dados atualizados para notificações
    const cursoAtualizado = await Curso.findByPk(id, {
      include: [{ model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] }]
    });

    // === SISTEMA DE NOTIFICAÇÕES INTELIGENTE ===
    
    console.log('📢 [CURSOS] A processar notificações de alterações...');
    
    let notificacoesEnviadas = 0;

    // 1. Notificar alterações gerais (nome, descrição, tipo, etc.)
    if (alteracoes.length > 0) {
      try {
        console.log('📤 [CURSOS] A enviar notificações de alterações gerais...');
        const resultado = await notificacaoController.notificarCursoAlterado(cursoAtualizado, alteracoes, req.io);
        if (resultado) {
          notificacoesEnviadas += resultado.associacoes.length;
          console.log(`✅ [CURSOS] ${resultado.associacoes.length} notificações de alterações gerais enviadas`);
        }
      } catch (notificationError) {
        console.warn('⚠️ [CURSOS] Erro ao enviar notificações de alterações gerais:', notificationError.message);
      }
    }

    // 2. Notificar alteração específica de formador
    const formadorAntualId = formadorAntigo?.id_utilizador;
    const novoFormadorId = cursoAtualizado.id_formador;
    
    if (novoFormadorId !== formadorAntualId) {
      try {
        console.log('👨‍🏫 [CURSOS] A enviar notificações específicas de alteração de formador...');
        const resultado = await notificacaoController.notificarFormadorAlterado(
          cursoAtualizado,
          formadorAntigo,
          cursoAtualizado.formador,
          req.io
        );
        if (resultado) {
          console.log(`✅ [CURSOS] ${resultado.associacoes.length} notificações de formador enviadas`);
        }
      } catch (notificationError) {
        console.warn('⚠️ [CURSOS] Erro ao enviar notificações de formador:', notificationError.message);
      }
    }

    // 3. Notificar alterações críticas de cronograma
    const dataInicioAlterada = data_inicio &&
      new Date(data_inicio).getTime() !== new Date(dataInicioAntiga).getTime();
    const dataFimAlterada = data_fim &&
      new Date(data_fim).getTime() !== new Date(dataFimAntiga).getTime();

    if (dataInicioAlterada || dataFimAlterada) {
      try {
        console.log('📅 [CURSOS] A enviar notificações críticas de alteração de cronograma...');
        const resultado = await notificacaoController.notificarDataCursoAlterada(
          cursoAtualizado,
          dataInicioAntiga,
          dataFimAntiga,
          req.io
        );
        if (resultado) {
          console.log(`✅ [CURSOS] ${resultado.associacoes.length} notificações de cronograma enviadas`);
        }
      } catch (notificationError) {
        console.warn('⚠️ [CURSOS] Erro ao enviar notificações de cronograma:', notificationError.message);
      }
    }

    console.log(`🎉 [CURSOS] Atualização de curso finalizada. Total de notificações: ${notificacoesEnviadas}`);

    return res.status(200).json({
      message: "Curso atualizado com sucesso",
      curso: cursoAtualizado,
      imagemAtualizada: !!req.file,
      pastaRenomeada: pastaRenomeada,
      nomeMudou: nomeMudou,
      alteracoesNotificadas: alteracoes.length,
      alteracoes: alteracoes
    });

  } catch (error) {
    console.error('❌ [CURSOS] Erro geral ao atualizar curso:', error.message);
    return res.status(500).json({
      message: "Erro ao atualizar curso",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Associa formador a um curso específico
 * 
 * Função auxiliar para alterar o formador responsável por um curso.
 * Inclui validações de competências e notificações automáticas.
 * 
 * @param {Object} req - Requisição com IDs do curso e formador
 * @param {Object} res - Resposta Express com confirmação
 */
const associarFormadorCurso = async (req, res) => {
  try {
    const { id_curso, id_formador } = req.body;

    if (!id_curso || !id_formador) {
      console.warn('⚠️ [CURSOS] Dados insuficientes para associação de formador');
      return res.status(400).json({ message: "É necessário fornecer o ID do curso e do formador" });
    }

    console.log(`👨‍🏫 [CURSOS] A associar formador ${id_formador} ao curso ${id_curso}`);

    // Verificar se o curso existe
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      console.warn(`⚠️ [CURSOS] Curso ${id_curso} não encontrado`);
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar se o utilizador é realmente um formador
    const formador = await User.findByPk(id_formador);
    if (!formador || formador.id_cargo !== 2) {
      console.warn(`⚠️ [CURSOS] Utilizador ${id_formador} não é formador válido`);
      return res.status(400).json({ message: "O utilizador especificado não é um formador" });
    }

    // Verificar competências do formador na categoria do curso
    const categoriaDoFormador = await sequelize.query(
      `SELECT COUNT(*) as count FROM formador_categoria 
       WHERE id_formador = :id_formador AND id_categoria = :id_categoria`,
      {
        replacements: { id_formador, id_categoria: curso.id_categoria },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (categoriaDoFormador[0].count === '0') {
      console.warn(`⚠️ [CURSOS] Formador sem competências na categoria ${curso.id_categoria}`);
      return res.status(400).json({
        message: "O formador não está associado à categoria deste curso",
        categoriaId: curso.id_categoria
      });
    }

    // Guardar dados do formador anterior para notificação
    const formadorAntigo = curso.id_formador ?
      await User.findByPk(curso.id_formador, { attributes: ['id_utilizador', 'nome'] }) : null;

    // Atualizar formador do curso
    curso.id_formador = id_formador;
    await curso.save();

    console.log(`✅ [CURSOS] Formador associado com sucesso`);

    // Recarregar curso para notificações
    const cursoAtualizado = await Curso.findByPk(id_curso, {
      include: [{ model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] }]
    });

    // Enviar notificação de alteração de formador
    try {
      console.log('📢 [CURSOS] A enviar notificações de alteração de formador...');
      await notificacaoController.notificarFormadorAlterado(
        cursoAtualizado,
        formadorAntigo,
        formador,
        req.io
      );
      console.log('✅ [CURSOS] Notificações de alteração de formador enviadas');
    } catch (notificationError) {
      console.warn('⚠️ [CURSOS] Erro ao enviar notificações (não crítico):', notificationError.message);
    }

    res.json({
      message: "Formador associado ao curso com sucesso",
      curso: {
        id_curso: curso.id_curso,
        nome: curso.nome,
        id_formador: curso.id_formador
      }
    });
  } catch (error) {
    console.error('❌ [CURSOS] Erro ao associar formador:', error.message);
    res.status(500).json({ 
      message: "Erro ao associar formador ao curso", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

// =============================================================================
// OPERAÇÕES DE ELIMINAÇÃO
// =============================================================================

/**
 * Elimina curso e toda a estrutura associada
 * 
 * Operação irreversível que remove completamente:
 * - Registo do curso na base de dados
 * - Todas as inscrições relacionadas
 * - Estrutura de tópicos e conteúdos
 * - Associações com outros cursos
 * - Diretório completo no sistema de ficheiros
 * 
 * Restrita apenas a administradores por motivos de segurança.
 * 
 * @param {Object} req - Requisição com ID do curso nos parâmetros
 * @param {Object} res - Resposta Express com estatísticas da eliminação
 */
const deleteCurso = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ [CURSOS] A iniciar eliminação completa do curso ${id}`);

    // Verificação rigorosa de permissões (apenas administradores)
    if (req.user.id_cargo !== 1) {
      console.warn(`⚠️ [CURSOS] Utilizador ${req.user.id_utilizador} sem permissão para eliminar cursos`);
      return res.status(403).json({
        message: "Não tens permissão para eliminar cursos"
      });
    }

    // Verificar se o curso existe antes de tentar eliminar
    const curso = await Curso.findByPk(id);

    if (!curso) {
      console.warn(`⚠️ [CURSOS] Curso ${id} não encontrado para eliminação`);
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    console.log(`🔍 [CURSOS] A eliminar curso: ${curso.nome}`);

    // Preparar caminhos para eliminação de diretórios
    const cursoSlug = uploadUtils.normalizarNome(curso.nome);
    const cursoDir = curso.dir_path || `uploads/cursos/${cursoSlug}`;
    const cursoDirAbs = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug);

    try {
      // === ELIMINAÇÃO SISTEMÁTICA DE DEPENDÊNCIAS ===

      // 1. Eliminar associações bidirecionais com outros cursos
      const numAssociacaoRemovidas = await AssociarCursos.destroy({
        where: {
          [Op.or]: [
            { id_curso_origem: id },
            { id_curso_destino: id }
          ]
        }
      });
      console.log(`🔗 [CURSOS] ${numAssociacaoRemovidas} associações removidas`);

      // 2. Eliminar todas as inscrições no curso
      const numInscricoesRemovidas = await Inscricao_Curso.destroy({
        where: { id_curso: id }
      });
      console.log(`👥 [CURSOS] ${numInscricoesRemovidas} inscrições removidas`);

      // 3. Eliminar estrutura hierárquica de conteúdos
      
      // Primeiro, encontrar todos os tópicos do curso
      const topicos = await Curso_Topicos.findAll({
        where: { id_curso: id }
      });

      const topicoIds = topicos.map(topico => topico.id_topico);
      console.log(`📝 [CURSOS] ${topicoIds.length} tópicos encontrados para eliminação`);

      if (topicoIds.length > 0) {
        // Encontrar pastas dentro dos tópicos
        const pastas = await PastaCurso.findAll({
          where: { id_topico: { [Op.in]: topicoIds } }
        });

        const pastaIds = pastas.map(pasta => pasta.id_pasta);
        console.log(`📁 [CURSOS] ${pastaIds.length} pastas encontradas`);

        // Eliminar conteúdos das pastas
        if (pastaIds.length > 0) {
          const numConteudosRemovidos = await ConteudoCurso.destroy({
            where: { id_pasta: { [Op.in]: pastaIds } }
          });
          console.log(`📄 [CURSOS] ${numConteudosRemovidos} conteúdos de pastas removidos`);
        }

        // Eliminar as pastas
        const numPastasRemovidas = await PastaCurso.destroy({
          where: { id_topico: { [Op.in]: topicoIds } }
        });
        console.log(`📁 [CURSOS] ${numPastasRemovidas} pastas removidas`);

        // Eliminar os tópicos
        const numTopicosRemovidos = await Curso_Topicos.destroy({
          where: { id_curso: id }
        });
        console.log(`📝 [CURSOS] ${numTopicosRemovidos} tópicos removidos`);
      }

      // 4. Eliminar conteúdos diretos do curso (não organizados em pastas)
      const numConteudosDirectosRemovidos = await ConteudoCurso.destroy({
        where: { id_curso: id }
      });
      console.log(`📄 [CURSOS] ${numConteudosDirectosRemovidos} conteúdos diretos removidos`);

      // 5. Eliminar o registo principal do curso
      await curso.destroy();
      console.log(`✅ [CURSOS] Registo do curso eliminado da base de dados`);

      // === ELIMINAÇÃO DO DIRETÓRIO FÍSICO ===
      if (fs.existsSync(cursoDirAbs)) {
        console.log(`📁 [CURSOS] A remover diretório físico: ${cursoDirAbs}`);
        
        /**
         * Remove diretório e todo o conteúdo de forma recursiva
         * Função interna para garantir eliminação completa
         */
        const removerDiretorioRecursivo = (dir) => {
          if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((ficheiro) => {
              const caminhoCompleto = path.join(dir, ficheiro);
              if (fs.lstatSync(caminhoCompleto).isDirectory()) {
                // Chamada recursiva para subdiretórios
                removerDiretorioRecursivo(caminhoCompleto);
              } else {
                // Eliminar ficheiro individual
                fs.unlinkSync(caminhoCompleto);
              }
            });
            // Eliminar o diretório vazio
            fs.rmdirSync(dir);
          }
        };

        removerDiretorioRecursivo(cursoDirAbs);
        console.log(`✅ [CURSOS] Diretório físico removido com sucesso`);
      } else {
        console.log(`ℹ️ [CURSOS] Diretório físico não encontrado: ${cursoDirAbs}`);
      }

      console.log('🎉 [CURSOS] Eliminação completa do curso concluída com sucesso');

      return res.json({
        message: "Curso eliminado com sucesso!",
        estatisticas: {
          inscricoesRemovidas: numInscricoesRemovidas,
          associacoesRemovidas: numAssociacaoRemovidas,
          topicosRemovidos: topicoIds.length,
          diretorioRemovido: fs.existsSync(cursoDirAbs) ? false : true
        }
      });

    } catch (error) {
      console.error('❌ [CURSOS] Erro ao eliminar dependências do curso:', error.message);
      return res.status(500).json({
        message: "Erro ao eliminar dependências do curso",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }
  } catch (error) {
    console.error('❌ [CURSOS] Erro geral ao eliminar curso:', error.message);
    return res.status(500).json({
      message: "Erro no servidor ao eliminar curso.",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

// =============================================================================
// FUNCIONALIDADES AUXILIARES E RECOMENDAÇÕES
// =============================================================================

/**
 * Gera sugestões personalizadas de cursos para o utilizador
 * 
 * Sistema de recomendação inteligente que analisa:
 * 1. Histórico de inscrições do utilizador
 * 2. Categorias e áreas de interesse demonstrado
 * 3. Disponibilidade atual dos cursos
 * 
 * Algoritmo de sugestão:
 * - Primeira tentativa: cursos de categorias conhecidas em áreas novas
 * - Fallback: cursos aleatórios disponíveis
 * 
 * @param {Object} req - Requisição Express com utilizador autenticado
 * @param {Object} res - Resposta Express com lista de cursos sugeridos
 */
const getCursosSugeridos = async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;
    console.log(`🎯 [CURSOS] A gerar sugestões personalizadas para utilizador ${id_utilizador}`);

    // Analisar histórico de inscrições do utilizador
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_utilizador }
    });

    const cursosInscritosIds = inscricoes.map(i => i.id_curso);
    console.log(`📊 [CURSOS] ${cursosInscritosIds.length} cursos no histórico do utilizador`);

    let cursosSugeridos = [];

    if (inscricoes.length > 0) {
      // === ANÁLISE DE PREFERÊNCIAS BASEADA NO HISTÓRICO ===
      
      // Buscar dados dos cursos onde o utilizador se inscreveu
      const cursosInscritos = await Curso.findAll({
        where: { id_curso: cursosInscritosIds }
      });

      // Extrair padrões de interesse
      const categoriasInscrito = [...new Set(cursosInscritos.map(c => c.id_categoria))];
      const areasInscrito = [...new Set(cursosInscritos.map(c => c.id_area))];

      console.log(`🏷️ [CURSOS] Categorias de interesse identificadas: ${categoriasInscrito.join(', ')}`);
      console.log(`🌍 [CURSOS] Áreas já exploradas: ${areasInscrito.join(', ')}`);

      // === SUGESTÃO INTELIGENTE: EXPANDIR HORIZONTES ===
      // Sugerir cursos de categorias conhecidas mas em áreas ainda não exploradas
      cursosSugeridos = await Curso.findAll({
        where: {
          id_categoria: categoriasInscrito, // Categorias familiares
          id_area: { [Op.notIn]: areasInscrito }, // Áreas novas
          id_curso: { [Op.notIn]: cursosInscritosIds }, // Não já inscritos
          [Op.or]: [
            { tipo: 'assincrono' }, // Sempre disponíveis
            { tipo: 'sincrono', vagas: { [Op.gt]: 0 } } // Com vagas disponíveis
          ],
          ativo: true
        },
        limit: 10,
        order: sequelize.literal('RANDOM()') // Variedade nas sugestões
      });

      console.log(`💡 [CURSOS] ${cursosSugeridos.length} sugestões baseadas em preferências geradas`);
    }

    // === FALLBACK: SUGESTÕES ALEATÓRIAS ===
    if (cursosSugeridos.length === 0) {
      console.log('🎲 [CURSOS] A gerar sugestões aleatórias (sem histórico ou preferências insuficientes)');
      
      cursosSugeridos = await Curso.findAll({
        where: {
          id_curso: { [Op.notIn]: cursosInscritosIds },
          [Op.or]: [
            { tipo: 'assincrono' },
            { tipo: 'sincrono', vagas: { [Op.gt]: 0 } }
          ],
          ativo: true
        },
        limit: 10,
        order: sequelize.literal('RANDOM()')
      });

      console.log(`🎲 [CURSOS] ${cursosSugeridos.length} sugestões aleatórias geradas`);
    }

    console.log(`✅ [CURSOS] Sistema de recomendação concluído`);
    return res.json(cursosSugeridos);
  } catch (error) {
    console.error('❌ [CURSOS] Erro no sistema de recomendação:', error.message);
    res.status(500).json({ 
      message: "Erro no servidor ao procurar cursos sugeridos.",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Lista inscrições ativas de um curso específico
 * 
 * Função de gestão para formadores e administradores visualizarem
 * a lista de alunos inscritos num curso. Inclui dados de contacto
 * básicos para comunicação.
 * 
 * @param {Object} req - Requisição com ID do curso nos parâmetros
 * @param {Object} res - Resposta Express com lista de inscritos
 */
const getInscricoesCurso = async (req, res) => {
  try {
    const id_curso = req.params.id;
    console.log(`👥 [CURSOS] A carregar lista de inscrições do curso ${id_curso}`);

    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso },
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ['id_utilizador', 'nome', 'email', 'telefone'],
          required: true // INNER JOIN para garantir dados do utilizador
        }
      ]
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
 * Obtém estrutura de tópicos de um curso
 * 
 * Lista todos os tópicos organizacionais de um curso ordenados
 * por sequência pedagógica. Usado para construir a navegação
 * e estrutura de conteúdos do curso.
 * 
 * @param {Object} req - Requisição com ID do curso nos parâmetros
 * @param {Object} res - Resposta Express com lista de tópicos
 */
const getTopicosCurso = async (req, res) => {
  try {
    const id_curso = req.params.id;
    console.log(`📝 [CURSOS] A carregar tópicos organizacionais do curso ${id_curso}`);

    const topicos = await Curso_Topicos.findAll({
      where: { id_curso, ativo: true },
      order: [['ordem', 'ASC']] // Ordenação pedagógica
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
 * 
 * Adiciona nova secção temática à estrutura do curso.
 * A ordem pode ser especificada ou calculada automaticamente.
 * 
 * @param {Object} req - Requisição com dados do novo tópico
 * @param {Object} res - Resposta Express com tópico criado
 */
const createCurso_Topicos = async (req, res) => {
  try {
    const id_curso = req.params.id;
    const { nome, ordem } = req.body;

    if (!nome) {
      console.warn('⚠️ [CURSOS] Nome do tópico é obrigatório');
      return res.status(400).json({ message: "Nome do tópico é obrigatório" });
    }

    console.log(`📝 [CURSOS] A criar tópico organizacional "${nome}" para curso ${id_curso}`);

    // Verificar se o curso existe
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      console.warn(`⚠️ [CURSOS] Curso ${id_curso} não encontrado`);
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Calcular ordem automática se não especificada
    const ultimaOrdem = await Curso_Topicos.max('ordem', {
      where: { id_curso }
    }) || 0;

    const ordemFinal = ordem || ultimaOrdem + 1;

    // Criar o tópico organizacional
    const novoTopico = await Curso_Topicos.create({
      nome,
      id_curso,
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
 * Atualiza tópico organizacional existente
 * 
 * Permite modificar nome, ordem ou estado de ativação.
 * Suporta reordenação da estrutura pedagógica.
 * 
 * @param {Object} req - Requisição com dados atualizados
 * @param {Object} res - Resposta Express com tópico atualizado
 */
const updateCurso_Topicos = async (req, res) => {
  try {
    const id_topico = req.params.id;
    const { nome, ordem, ativo } = req.body;

    console.log(`📝 [CURSOS] A atualizar tópico organizacional ${id_topico}`);

    // Verificar se o tópico existe
    const topico = await Curso_Topicos.findByPk(id_topico);
    if (!topico) {
      console.warn(`⚠️ [CURSOS] Tópico ${id_topico} não encontrado`);
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    // Atualizar apenas campos fornecidos
    await topico.update({
      nome: nome !== undefined ? nome : topico.nome,
      ordem: ordem !== undefined ? ordem : topico.ordem,
      ativo: ativo !== undefined ? ativo : topico.ativo
    });

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
 * 
 * Remove tópico do curso. Se tiver dependências (pastas/conteúdos),
 * desativa em vez de eliminar para preservar integridade referencial.
 * 
 * @param {Object} req - Requisição com ID do tópico nos parâmetros
 * @param {Object} res - Resposta Express com resultado da operação
 */
const deleteCurso_Topicos = async (req, res) => {
  try {
    const id_topico = req.params.id;
    console.log(`🗑️ [CURSOS] A tentar eliminar tópico organizacional ${id_topico}`);

    // Verificar se o tópico existe
    const topico = await Curso_Topicos.findByPk(id_topico);
    if (!topico) {
      console.warn(`⚠️ [CURSOS] Tópico ${id_topico} não encontrado`);
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    // Verificar dependências (pastas associadas)
    const pastas = await PastaCurso.findAll({
      where: { id_topico }
    });

    if (pastas.length > 0) {
      // Desativar em vez de eliminar para preservar integridade
      await topico.update({ ativo: false });
      console.log(`⚠️ [CURSOS] Tópico ${id_topico} desativado (tem ${pastas.length} pastas associadas)`);
      
      return res.json({
        message: "Tópico desativado com sucesso. Não foi possível eliminar pois possui pastas associadas.",
        desativado: true
      });
    }

    // Eliminação segura se não há dependências
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
  // Operações principais de gestão de cursos
  getAllCursos,
  getCursosByCategoria,
  getTopicoArea,
  createCurso,
  getCursoById,
  getInscricoesCurso,
  updateCurso,
  deleteCurso,
  
  // Funcionalidades auxiliares
  getCursosSugeridos,
  associarFormadorCurso,
  
  // Gestão de tópicos organizacionais
  getTopicosCurso,
  createCurso_Topicos,
  updateCurso_Topicos,
  deleteCurso_Topicos
};