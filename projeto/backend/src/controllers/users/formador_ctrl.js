const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sendRegistrationEmail } = require("../../utils/emailService");
const { User, Curso, Categoria, Area, Inscricao_Curso } = require('../../database/associations');
const User_Pendente = require('../../database/models/User_Pendente');
const FormadorCategoria = require("../../database/models/Formador_Categoria");
const FormadorArea = require("../../database/models/Formador_Area");
const FormadorAssociacoesPendentes = require("../../database/models/Formador_Associacoes_Pendentes");

/**
 * CONTROLADORES PARA GESTÃO COMPLETA DE FORMADORES
 * 
 * Este módulo centraliza todas as operações relacionadas com utilizadores que possuem
 * cargo de formador (id_cargo = 2). Inclui operações de registo, consulta, gestão de
 * especializações (categorias e áreas) e administração de cursos ministrados.
 * 
 * As funções estão organizadas em grupos funcionais para facilitar manutenção:
 * - Listagem e consulta de formadores
 * - Registo e gestão de contas de formador
 * - Gestão de especializações (categorias/áreas de conhecimento)
 */

// =============================================================================
// LISTAGEM E CONSULTA DE FORMADORES
// =============================================================================

/**
 * Obtém lista paginada de todos os formadores registados no sistema
 * 
 * Retorna formadores ativos (id_cargo = 2) com paginação configurável.
 * Inclui gestão robusta de erros para evitar falhas na API.
 * 
 * @param {Object} req - Objeto de requisição do Express
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Lista paginada de formadores com metadados de paginação
 */
const getAllFormadores = async (req, res) => {
  try {
    console.log(`🔍 [BACKEND] getAllFormadores - Iniciando busca de formadores`);
    
    // Extrai e valida parâmetros de paginação da query string
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    console.log(`📊 [BACKEND] Parâmetros de paginação: page=${page}, limit=${limit}, offset=${offset}`);

    let formadores = [];
    let includeOptions = [];

    try {
      // Tenta incluir categorias e áreas se as associações estiverem definidas
      includeOptions = [
        {
          model: Categoria,
          as: "categorias_formador",
          through: { attributes: [] },
          required: false
        },
        {
          model: Area,
          as: "areas_formador", 
          through: { attributes: [] },
          required: false
        }
      ];

      console.log(`🔗 [BACKEND] Tentando buscar formadores com associações`);

      formadores = await User.findAll({
        where: { id_cargo: 2 },
        include: includeOptions,
        limit,
        offset,
        order: [['nome', 'ASC']]
      });

      console.log(`✅ [BACKEND] Formadores encontrados com associações: ${formadores.length}`);

    } catch (includeError) {
      console.warn(`⚠️ [BACKEND] Erro nas associações, usando fallback:`, includeError.message);
      
      // Fallback: buscar apenas dados básicos se as associações falharem
      formadores = await User.findAll({
        where: { id_cargo: 2 },
        limit,
        offset,
        order: [['nome', 'ASC']]
      });

      console.log(`🔄 [BACKEND] Formadores encontrados (sem associações): ${formadores.length}`);
    }

    // Conta o total de formadores para calcular o número de páginas
    const count = await User.count({
      where: { id_cargo: 2 }
    });

    console.log(`📊 [BACKEND] Total de formadores no sistema: ${count}`);

    const totalPages = Math.max(1, Math.ceil(count / limit));
    const currentPage = Math.min(page, totalPages);

    const response = {
      formadores: formadores || [],
      totalItems: count,
      totalPages,
      currentPage,
      itemsPerPage: limit
    };

    console.log(`✅ [BACKEND] Resposta enviada:`, {
      totalFormadores: response.formadores.length,
      totalItems: response.totalItems,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });

    return res.json(response);

  } catch (error) {
    console.error("❌ [BACKEND] Erro ao listar formadores:", error);
    return res.status(500).json({ 
      message: "Erro interno do servidor ao carregar formadores", 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Obtém dados detalhados de um formador específico pelo seu ID
 * 
 * Retorna informação completa sobre um formador incluindo especializações
 * e lista de cursos que ministra. Inclui validações de existência e cargo.
 * 
 * @param {Object} req - Objeto de requisição (deve conter req.params.id)
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Dados completos do formador
 */
const getFormadorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 [BACKEND] getFormadorById - Buscando formador ID: ${id}`);

    // Valida se o ID é um número válido
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID inválido fornecido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    let utilizador = null;
    
    try {
      console.log(`🔗 [BACKEND] Tentando buscar utilizador com associações`);
      
      // Procura o utilizador com tentativa de incluir associações
      utilizador = await User.findByPk(id, {
        include: [
          {
            model: Categoria,
            as: "categorias_formador",
            through: { attributes: [] },
            required: false
          },
          {
            model: Area,
            as: "areas_formador",
            through: { attributes: [] },
            required: false
          }
        ]
      });

      console.log(`✅ [BACKEND] Utilizador encontrado com associações:`, {
        encontrado: !!utilizador,
        id: utilizador?.id_utilizador,
        nome: utilizador?.nome,
        cargo: utilizador?.id_cargo,
        categorias: utilizador?.categorias_formador?.length || 0,
        areas: utilizador?.areas_formador?.length || 0
      });

    } catch (includeError) {
      console.warn(`⚠️ [BACKEND] Erro nas associações, usando fallback:`, includeError.message);
      
      // Fallback sem associações em caso de erro
      utilizador = await User.findByPk(id);
      
      console.log(`🔄 [BACKEND] Utilizador encontrado (sem associações):`, {
        encontrado: !!utilizador,
        id: utilizador?.id_utilizador,
        nome: utilizador?.nome,
        cargo: utilizador?.id_cargo
      });
    }

    if (!utilizador) {
      console.error(`❌ [BACKEND] Utilizador não encontrado com ID: ${id}`);
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Verifica se o utilizador é realmente um formador
    if (utilizador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Utilizador não é formador. Cargo: ${utilizador.id_cargo} (esperado: 2)`);
      return res.status(404).json({ message: "Utilizador encontrado não é um formador" });
    }

    console.log(`📚 [BACKEND] Buscando cursos ministrados pelo formador ${id}`);

    // Procura cursos ministrados pelo formador de forma independente
    let cursos = [];
    try {
      // LOGS DETALHADOS PARA DEBUG DOS CURSOS
      console.log(`🔍 [BACKEND] Consultando tabela Curso com condição: id_formador = ${id}`);
      
      // Primeiro, vamos ver que campos existem na tabela Curso
      const primeiroQualquerCurso = await Curso.findOne();
      if (primeiroQualquerCurso) {
        console.log(`📋 [BACKEND] Campos disponíveis na tabela Curso:`, Object.keys(primeiroQualquerCurso.dataValues));
      } else {
        console.log(`📋 [BACKEND] Nenhum curso encontrado na base de dados`);
      }

      // Agora vamos procurar cursos especificamente para este formador
      cursos = await Curso.findAll({
        where: { id_formador: id },
        order: [['created_at', 'DESC']]
      });

      console.log(`📚 [BACKEND] Cursos encontrados: ${cursos.length}`);

      if (cursos.length > 0) {
        console.log(`📚 [BACKEND] Primeiros cursos encontrados:`, cursos.slice(0, 3).map(curso => ({
          id: curso.id_curso,
          nome: curso.nome,
          id_formador: curso.id_formador,
          categoria: curso.categoria,
          area: curso.area,
          estado: curso.estado
        })));
      } else {
        console.log(`📚 [BACKEND] Nenhum curso encontrado para formador ${id}`);
        
        // Debug adicional: vamos ver se existem cursos na BD e quais são os id_formador
        const todosCursos = await Curso.findAll({
          attributes: ['id_curso', 'nome', 'id_formador'],
          limit: 10
        });
        
        console.log(`🔍 [BACKEND] Alguns cursos na BD (para debug):`, todosCursos.map(c => ({
          id: c.id_curso,
          nome: c.nome,
          formador: c.id_formador
        })));

        // Vamos ver se há formadores diferentes
        const formadoresUnicos = await Curso.findAll({
          attributes: ['id_formador'],
          group: ['id_formador']
        });
        
        console.log(`👥 [BACKEND] IDs de formadores que têm cursos:`, formadoresUnicos.map(f => f.id_formador));
      }

    } catch (cursosError) {
      console.error(`❌ [BACKEND] Erro ao buscar cursos:`, cursosError);
      cursos = [];
    }

    // Combina dados do utilizador com cursos ministrados
    const formadorCompleto = {
      ...utilizador.toJSON(),
      cursos_ministrados: cursos,
      total_cursos: cursos.length
    };

    console.log(`✅ [BACKEND] Resposta do formador preparada:`, {
      id: formadorCompleto.id_utilizador,
      nome: formadorCompleto.nome,
      email: formadorCompleto.email,
      cargo: formadorCompleto.id_cargo,
      totalCursos: formadorCompleto.total_cursos,
      temCategorias: !!(formadorCompleto.categorias_formador?.length),
      temAreas: !!(formadorCompleto.areas_formador?.length)
    });

    return res.json(formadorCompleto);

  } catch (error) {
    console.error("❌ [BACKEND] Erro ao procurar formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao procurar formador", 
      error: error.message 
    });
  }
};

/**
 * Obtém perfil completo do formador autenticado
 * 
 * Retorna dados detalhados do formador atual incluindo especializações,
 * cursos em que está inscrito e cursos que ministra. Esta função fornece
 * uma visão completa do formador para utilização em dashboards pessoais.
 * 
 * @param {Object} req - Objeto de requisição (deve conter req.user)
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Perfil completo do formador autenticado
 */
const getFormadorProfile = async (req, res) => {
  try {
    const userId = req.user.id_utilizador;
    
    console.log(`🔍 [BACKEND] getFormadorProfile - Perfil do formador ID: ${userId}`);

    // Verifica se o utilizador existe e é formador
    const user = await User.findByPk(userId);
    if (!user) {
      console.error(`❌ [BACKEND] Utilizador não encontrado: ${userId}`);
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    if (user.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Utilizador não é formador. Cargo: ${user.id_cargo}`);
      return res.status(400).json({ message: "Este utilizador não é um formador" });
    }

    console.log(`✅ [BACKEND] Utilizador validado como formador: ${user.nome}`);

    // Procura dados detalhados do formador com associações
    let formador = null;
    try {
      console.log(`🔗 [BACKEND] Buscando dados detalhados com associações`);
      
      formador = await User.findByPk(userId, {
        include: [
          {
            model: Categoria,
            as: "categorias_formador",
            through: { attributes: [] },
            include: [
              {
                model: Area,
                as: "areas",
                required: false
              }
            ]
          },
          {
            model: Area,
            as: "areas_formador",
            through: { attributes: [] },
            include: [
              {
                model: Categoria,
                as: "categoriaParent",
                attributes: ["id_categoria", "nome"]
              }
            ]
          }
        ]
      });

      console.log(`✅ [BACKEND] Dados detalhados obtidos com sucesso`);

    } catch (includeError) {
      console.warn(`⚠️ [BACKEND] Erro nas associações:`, includeError.message);
      // Utiliza dados básicos se as associações falharem
      formador = user;
    }

    // Procura cursos em que o formador está inscrito como aluno
    let inscricoes = [];
    try {
      console.log(`📚 [BACKEND] Buscando inscrições do formador`);
      
      inscricoes = await Inscricao_Curso.findAll({
        where: {
          id_utilizador: userId,
          estado: 'inscrito'
        },
        include: [
          {
            model: Curso,
            as: "curso",
            include: [
              {
                model: Categoria,
                as: "categoria",
                attributes: ['nome']
              },
              {
                model: Area,
                as: "area", 
                attributes: ['nome']
              }
            ]
          }
        ]
      });

      console.log(`📚 [BACKEND] Inscrições encontradas: ${inscricoes.length}`);

    } catch (inscError) {
      console.error(`❌ [BACKEND] Erro ao buscar inscrições:`, inscError);
      inscricoes = [];
    }

    // Procura cursos ministrados pelo formador - CORRIGIDO COM LOGS
    let cursosMinistrados = [];
    try {
      console.log(`🎓 [BACKEND] Buscando cursos ministrados pelo formador ${userId}`);
      
      cursosMinistrados = await Curso.findAll({
        where: { id_formador: userId },
        include: [
          {
            model: Categoria,
            as: "categoria",
            attributes: ['nome']
          },
          {
            model: Area,
            as: "area",
            attributes: ['nome']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      console.log(`🎓 [BACKEND] Cursos ministrados encontrados: ${cursosMinistrados.length}`);

      if (cursosMinistrados.length > 0) {
        console.log(`🎓 [BACKEND] Primeiros cursos ministrados:`, cursosMinistrados.slice(0, 3).map(curso => ({
          id: curso.id_curso,
          nome: curso.nome,
          categoria: curso.categoria?.nome,
          area: curso.area?.nome
        })));
      } else {
        // Debug se não encontrou cursos
        console.log(`🔍 [BACKEND] Debug - Verificando se existem cursos com id_formador = ${userId}`);
        
        const cursosDebug = await Curso.findAll({
          where: { id_formador: userId },
          attributes: ['id_curso', 'nome', 'id_formador']
        });
        
        console.log(`🔍 [BACKEND] Cursos debug encontrados:`, cursosDebug);
      }

    } catch (cursosError) {
      console.error(`❌ [BACKEND] Erro ao buscar cursos ministrados:`, cursosError);
      cursosMinistrados = [];
    }

    // Organiza categorias e áreas numa estrutura hierárquica
    const categoriasComAreas = {};

    // Processa categorias do formador se disponíveis
    if (formador.categorias_formador && Array.isArray(formador.categorias_formador)) {
      console.log(`📂 [BACKEND] Processando ${formador.categorias_formador.length} categorias`);
      
      formador.categorias_formador.forEach(categoria => {
        if (!categoriasComAreas[categoria.id_categoria]) {
          categoriasComAreas[categoria.id_categoria] = {
            id: categoria.id_categoria,
            nome: categoria.nome,
            areas: []
          };
        }
      });
    }

    // Associa áreas às respetivas categorias se disponíveis
    if (formador.areas_formador && Array.isArray(formador.areas_formador)) {
      console.log(`📋 [BACKEND] Processando ${formador.areas_formador.length} áreas`);
      
      formador.areas_formador.forEach(area => {
        if (area.categoriaParent && categoriasComAreas[area.categoriaParent.id_categoria]) {
          categoriasComAreas[area.categoriaParent.id_categoria].areas.push({
            id: area.id_area,
            nome: area.nome
          });
        }
      });
    }

    const categoriasFormatadas = Object.values(categoriasComAreas);

    // Formata dados dos cursos em que está inscrito
    const cursosInscritos = inscricoes.map(inscricao => ({
      id: inscricao.id_inscricao,
      cursoId: inscricao.curso?.id_curso,
      nome: inscricao.curso?.nome || "Nome não disponível",
      categoria: inscricao.curso?.categoria?.nome || "N/A",
      area: inscricao.curso?.area?.nome || "N/A",
      dataInicio: inscricao.curso?.data_inicio,
      dataFim: inscricao.curso?.data_fim,
      tipo: inscricao.curso?.tipo,
      dataInscricao: inscricao.data_inscricao
    }));

    // Formata dados dos cursos ministrados - CORRIGIDO
    const cursosMinistradosFormatados = cursosMinistrados.map(curso => ({
      id: curso.id_curso, // Campo principal utilizado pelo frontend
      nome: curso.nome,
      categoria: curso.categoria?.nome || "N/A",
      area: curso.area?.nome || "N/A", 
      dataInicio: curso.data_inicio,
      dataFim: curso.data_fim,
      tipo: curso.tipo,
      vagas: curso.vagas,
      status: curso.status
    }));

    const response = {
      dadosPessoais: {
        id: formador.id_utilizador,
        nome: formador.nome,
        email: formador.email,
        telefone: formador.telefone,
        foto_perfil: formador.foto_perfil
      },
      categorias: categoriasFormatadas,
      cursosInscritos: cursosInscritos,
      cursosMinistrados: cursosMinistradosFormatados, // Lista corrigida
      estatisticas: {
        totalCategoriasEspecializacao: categoriasFormatadas.length,
        totalCursosInscritos: cursosInscritos.length,
        totalCursosMinistrados: cursosMinistradosFormatados.length
      }
    };

    console.log(`✅ [BACKEND] Perfil preparado:`, {
      formadorId: response.dadosPessoais.id,
      nome: response.dadosPessoais.nome,
      categorias: response.estatisticas.totalCategoriasEspecializacao,
      cursosInscritos: response.estatisticas.totalCursosInscritos,
      cursosMinistrados: response.estatisticas.totalCursosMinistrados
    });

    return res.json(response);
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao procurar perfil do formador:", error);
    return res.status(500).json({
      message: "Erro interno ao carregar perfil do formador",
      error: error.message
    });
  }
};

/**
 * Obtém lista de cursos ministrados por um formador específico
 * 
 * Retorna todos os cursos onde o formador especificado é o responsável,
 * ordenados por data de criação mais recente primeiro.
 * 
 * @param {Object} req - Objeto de requisição (deve conter req.params.id)
 * @param {Object} res - Objeto de resposta do Express  
 * @returns {Array} Lista de cursos ministrados pelo formador
 */
const getCursosFormador = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 [BACKEND] getCursosFormador - Buscando cursos do formador ID: ${id}`);

    // Valida ID do formador
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID inválido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    // Verifica se o utilizador existe e é formador
    const utilizador = await User.findByPk(id);
    if (!utilizador) {
      console.error(`❌ [BACKEND] Utilizador não encontrado: ${id}`);
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }
    
    if (utilizador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Utilizador não é formador. Cargo: ${utilizador.id_cargo}`);
      return res.status(404).json({ message: "Utilizador não é um formador" });
    }

    console.log(`✅ [BACKEND] Formador validado: ${utilizador.nome}`);

    // Procura cursos ministrados pelo formador
    let cursos = [];
    try {
      console.log(`📚 [BACKEND] Consultando cursos com id_formador = ${id}`);

      // Debug dos campos da tabela Curso
      const exemploEstrutura = await Curso.findOne();
      if (exemploEstrutura) {
        console.log(`📋 [BACKEND] Estrutura da tabela Curso:`, Object.keys(exemploEstrutura.dataValues));
      }

      cursos = await Curso.findAll({
        where: { id_formador: id },
        include: [
          {
            model: Categoria,
            as: "categoria",
            attributes: ['nome']
          },
          {
            model: Area,
            as: "area",
            attributes: ['nome']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      console.log(`📚 [BACKEND] Cursos encontrados: ${cursos.length}`);

      if (cursos.length === 0) {
        // Debug adicional quando não encontra cursos
        console.log(`🔍 [BACKEND] Nenhum curso encontrado. Fazendo debug...`);
        
        // Verificar todos os cursos na BD
        const todosCursos = await Curso.findAll({
          attributes: ['id_curso', 'nome', 'id_formador'],
          limit: 10
        });
        
        console.log(`🔍 [BACKEND] Amostra de cursos na BD:`, todosCursos.map(c => ({
          id: c.id_curso,
          nome: c.nome,
          formador_id: c.id_formador,
          tipo_formador_id: typeof c.id_formador
        })));

        // Verificar se há outros formadores com cursos
        const consultaFormadores = await Curso.findAll({
          attributes: ['id_formador'],
          group: ['id_formador'],
          raw: true
        });
        
        console.log(`👥 [BACKEND] Formadores com cursos na BD:`, consultaFormadores.map(f => ({
          id: f.id_formador,
          tipo: typeof f.id_formador
        })));

        // Verificar se o problema é de tipo de dados
        const cursosComFiltroString = await Curso.findAll({
          where: { id_formador: id.toString() },
          limit: 5
        });
        
        console.log(`🔍 [BACKEND] Tentativa com string: ${cursosComFiltroString.length} cursos encontrados`);

        const cursosComFiltroNumero = await Curso.findAll({
          where: { id_formador: parseInt(id) },
          limit: 5
        });
        
        console.log(`🔍 [BACKEND] Tentativa com número: ${cursosComFiltroNumero.length} cursos encontrados`);
      } else {
        console.log(`📚 [BACKEND] Cursos encontrados:`, cursos.map(c => ({
          id: c.id_curso,
          nome: c.nome,
          categoria: c.categoria?.nome,
          area: c.area?.nome
        })));
      }

    } catch (cursosError) {
      console.error(`❌ [BACKEND] Erro ao buscar cursos:`, cursosError);
      cursos = [];
    }

    const response = {
      formador: {
        id: utilizador.id_utilizador,
        nome: utilizador.nome
      },
      cursos: cursos,
      totalCursos: cursos.length
    };

    console.log(`✅ [BACKEND] Resposta preparada:`, {
      formadorId: response.formador.id,
      formadorNome: response.formador.nome,
      totalCursos: response.totalCursos
    });

    return res.json(response);
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao procurar cursos do formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao carregar cursos do formador", 
      error: error.message 
    });
  }
};

// =============================================================================
// REGISTO E GESTÃO DE FORMADORES
// =============================================================================

/**
 * Regista novo formador no sistema com estado pendente
 * 
 * Cria registo pendente para novo formador que requer confirmação por email.
 * Inclui validações rigorosas e gestão de associações temporárias com
 * categorias e áreas que serão processadas após confirmação.
 * 
 * @param {Object} req - Objeto de requisição com dados do formador
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Confirmação de registo pendente
 */
const registerFormador = async (req, res) => {
  try {
    const {
      nome, email, password, idade, telefone, morada, codigo_postal,
      categorias, areas, curso
    } = req.body;
    
    const senha_temporaria = password;

    console.log(`📝 [BACKEND] registerFormador - Registando novo formador: ${nome} (${email})`);

    // Validação rigorosa de campos obrigatórios
    const camposObrigatorios = ['nome', 'email', 'password', 'idade', 'telefone', 'morada', 'codigo_postal'];
    const camposFaltantes = camposObrigatorios.filter(campo => !req.body[campo]);
    
    if (camposFaltantes.length > 0) {
      console.error(`❌ [BACKEND] Campos obrigatórios em falta:`, camposFaltantes);
      return res.status(400).json({
        message: "Dados incompletos para registar formador",
        campos_faltantes: camposFaltantes,
        campos_necessarios: camposObrigatorios
      });
    }

    // Validações de formato e limites
    if (idade < 18 || idade > 100) {
      console.error(`❌ [BACKEND] Idade inválida: ${idade}`);
      return res.status(400).json({ message: "Idade deve estar entre 18 e 100 anos" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(`❌ [BACKEND] Email inválido: ${email}`);
      return res.status(400).json({ message: "Formato de email inválido" });
    }

    // Verifica se o email já está em uso
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.error(`❌ [BACKEND] Email já em uso: ${email}`);
      return res.status(400).json({ 
        message: "Este email já está registado. Por favor, usa outro email ou faz login." 
      });
    }

    // Verifica se há registo pendente com este email
    const pendingUser = await User_Pendente.findOne({ where: { email } });
    if (pendingUser) {
      // Remove registo expirado automaticamente
      if (new Date() > new Date(pendingUser.expires_at)) {
        await pendingUser.destroy();
        console.log(`🗑️ [BACKEND] Registo pendente expirado removido: ${email}`);
      } else {
        console.error(`❌ [BACKEND] Registo pendente já existe: ${email}`);
        return res.status(400).json({
          message: "Já existe um registo pendente com este email. Verifica a caixa de entrada para ativar a conta."
        });
      }
    }

    // Gera hash seguro da senha
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Gera token de confirmação com expiração de 24 horas
    const token = jwt.sign(
      { email, nome, timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    // Cria registo pendente de formador
    const novoPendente = await User_Pendente.create({
      id_cargo: 2,
      nome: nome.trim(),
      idade: parseInt(idade),
      email: email.toLowerCase().trim(),
      telefone: telefone.trim(),
      morada: morada.trim(),
      codigo_postal: codigo_postal.trim(),
      password: senha_temporaria,
      token,
      expires_at
    });

    console.log(`✅ [BACKEND] Formador pendente criado: ID ${novoPendente.id}`);

    // Guarda associações pendentes se fornecidas
    if (categorias?.length > 0 || areas?.length > 0 || curso) {
      try {
        await FormadorAssociacoesPendentes.create({
          id_pendente: novoPendente.id,
          categorias: Array.isArray(categorias) ? categorias : [],
          areas: Array.isArray(areas) ? areas : [],
          cursos: curso ? [curso] : []
        });
        
        console.log(`🔗 [BACKEND] Associações pendentes criadas`);
      } catch (assocError) {
        console.warn(`⚠️ [BACKEND] Erro ao criar associações pendentes:`, assocError.message);
        // Continua mesmo se as associações falharem
      }
    }

    // Prepara dados para email de confirmação
    const userForEmail = {
      id: novoPendente.id,
      nome: novoPendente.nome,
      email: novoPendente.email,
      idade: novoPendente.idade,
      telefone: novoPendente.telefone,
      morada: novoPendente.morada,
      codigo_postal: novoPendente.codigo_postal,
      cargo_descricao: 'Formador',
      senha_temporaria: senha_temporaria,
      token: token
    };

    // Envia email de confirmação
    try {
      await sendRegistrationEmail(userForEmail);
      
      console.log(`📧 [BACKEND] Email de confirmação enviado para: ${email}`);
      
      return res.status(201).json({
        message: "Formador registado com sucesso! Um email de confirmação foi enviado.",
        pendingId: novoPendente.id,
        email: novoPendente.email
      });
      
    } catch (emailError) {
      console.error("❌ [BACKEND] Erro ao enviar email:", emailError);
      
      return res.status(201).json({
        message: "Formador registado, mas houve um problema ao enviar o email de confirmação.",
        pendingId: novoPendente.id,
        warning: "Usa a opção 'Reenviar confirmação' no ecrã de login",
        email: novoPendente.email
      });
    }

  } catch (error) {
    console.error("❌ [BACKEND] Erro ao registar formador:", error);
    return res.status(500).json({ 
      message: "Erro interno do servidor ao registar formador", 
      error: error.message 
    });
  }
};

/**
 * Atualiza dados de um formador existente
 * 
 * Permite modificação de informações pessoais do formador preservando
 * as associações com categorias e áreas. Inclui validações de formato.
 * 
 * @param {Object} req - Objeto de requisição com novos dados
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Dados atualizados do formador
 */
const updateFormador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, foto_perfil, telefone, data_nascimento, biografia } = req.body;

    console.log(`📝 [BACKEND] updateFormador - Atualizando formador ID: ${id}`);

    // Valida ID
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID inválido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    // Verifica se o utilizador existe e é formador
    const utilizador = await User.findByPk(id);
    if (!utilizador) {
      console.error(`❌ [BACKEND] Formador não encontrado: ${id}`);
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    if (utilizador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Utilizador não é formador. Cargo: ${utilizador.id_cargo}`);
      return res.status(400).json({ message: "Este utilizador não é um formador" });
    }

    // Validações opcionais para campos fornecidos
    const dadosParaAtualizar = {};

    if (nome) {
      if (nome.trim().length < 2) {
        return res.status(400).json({ message: "Nome deve ter pelo menos 2 caracteres" });
      }
      dadosParaAtualizar.nome = nome.trim();
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Formato de email inválido" });
      }
      
      // Verifica se email já está em uso por outro utilizador
      const emailExists = await User.findOne({ 
        where: { 
          email: email.toLowerCase().trim(),
          id_utilizador: { [Op.ne]: id }
        } 
      });
      
      if (emailExists) {
        return res.status(400).json({ message: "Este email já está em uso" });
      }
      
      dadosParaAtualizar.email = email.toLowerCase().trim();
    }

    if (foto_perfil) dadosParaAtualizar.foto_perfil = foto_perfil;
    if (telefone) dadosParaAtualizar.telefone = telefone.trim();
    if (data_nascimento) dadosParaAtualizar.data_nascimento = data_nascimento;
    if (biografia) dadosParaAtualizar.biografia = biografia.trim();

    // Atualiza apenas campos fornecidos
    await utilizador.update(dadosParaAtualizar);

    console.log(`✅ [BACKEND] Formador atualizado: ${utilizador.nome}`);

    return res.json({
      message: "Formador atualizado com sucesso",
      formador: utilizador
    });
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao atualizar formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao atualizar formador", 
      error: error.message 
    });
  }
};

/**
 * Remove estatuto de formador de um utilizador
 * 
 * Altera o cargo para formando (id_cargo = 3) e remove todas as associações
 * com categorias e áreas. Só permite remoção se não existirem cursos ativos.
 * 
 * @param {Object} req - Objeto de requisição (deve conter req.params.id)
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Confirmação de remoção de estatuto
 */
const deleteFormador = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ [BACKEND] deleteFormador - Removendo estatuto de formador ID: ${id}`);

    // Valida ID
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID inválido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    // Verifica se o utilizador existe e é formador
    const utilizador = await User.findByPk(id);
    if (!utilizador) {
      console.error(`❌ [BACKEND] Formador não encontrado: ${id}`);
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    if (utilizador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Utilizador não é formador. Cargo: ${utilizador.id_cargo}`);
      return res.status(400).json({ message: "Este utilizador não é um formador" });
    }

    // Verifica se há cursos associados que impedem a remoção
    const cursos = await Curso.findAll({
      where: { id_formador: id }
    });

    if (cursos.length > 0) {
      console.error(`❌ [BACKEND] Formador tem cursos associados: ${cursos.length}`);
      return res.status(400).json({
        message: "Não é possível remover este formador pois existem cursos associados",
        cursos_associados: cursos.length,
        detalhes: "Remove ou transfere os cursos antes de alterar o estatuto"
      });
    }

    // Remove associações com categorias e áreas
    try {
      const categoriasRemovidas = await FormadorCategoria.destroy({
        where: { id_formador: id }
      });

      const areasRemovidas = await FormadorArea.destroy({
        where: { id_formador: id }
      });
      
      console.log(`🔗 [BACKEND] Associações removidas: ${categoriasRemovidas} categorias, ${areasRemovidas} áreas`);
      
    } catch (associationError) {
      console.warn(`⚠️ [BACKEND] Erro ao remover associações:`, associationError.message);
      // Continua mesmo se a remoção das associações falhar
    }

    // Altera cargo para formando
    await utilizador.update({ id_cargo: 3 });

    console.log(`✅ [BACKEND] Estatuto de formador removido: ${utilizador.nome}`);

    return res.json({
      message: "Estatuto de formador removido com sucesso",
      utilizador: {
        id: utilizador.id_utilizador,
        nome: utilizador.nome,
        email: utilizador.email,
        cargo_anterior: "Formador",
        cargo_atual: "Formando"
      }
    });
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao remover estatuto de formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao alterar estatuto do formador", 
      error: error.message 
    });
  }
};

// =============================================================================
// GESTÃO DE CATEGORIAS E ÁREAS DE ESPECIALIZAÇÃO
// =============================================================================

/**
 * Obtém categorias associadas a um formador
 * 
 * Lista todas as categorias de conhecimento em que o formador
 * tem competências reconhecidas ou certificadas.
 * 
 * @param {Object} req - Objeto de requisição (deve conter req.params.id)
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Array} Lista de categorias do formador
 */
const getCategoriasFormador = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 [BACKEND] getCategoriasFormador - Formador ID: ${id}`);

    // Valida ID do formador
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID inválido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    // Verifica se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Formador não encontrado ou cargo inválido`);
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Obtém categorias associadas através da tabela de ligação
    let categorias = [];
    try {
      categorias = await Categoria.findAll({
        include: [
          {
            model: User,
            as: "formadores",
            where: { id_utilizador: id },
            through: { attributes: [] },
            attributes: []
          }
        ]
      });

      console.log(`✅ [BACKEND] Categorias encontradas (com associações): ${categorias.length}`);

    } catch (includeError) {
      console.warn(`⚠️ [BACKEND] Erro nas associações, usando fallback:`, includeError.message);
      
      // Fallback: buscar através da tabela de ligação diretamente
      const associacoes = await FormadorCategoria.findAll({
        where: { id_formador: id }
      });
      
      const categoriaIds = associacoes.map(assoc => assoc.id_categoria);
      if (categoriaIds.length > 0) {
        categorias = await Categoria.findAll({
          where: { id_categoria: { [Op.in]: categoriaIds } }
        });
      }

      console.log(`🔄 [BACKEND] Categorias encontradas (fallback): ${categorias.length}`);
    }

    return res.json({
      formador: {
        id: formador.id_utilizador,
        nome: formador.nome
      },
      categorias: categorias,
      totalCategorias: categorias.length
    });
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao procurar categorias do formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao carregar categorias do formador", 
      error: error.message 
    });
  }
};

/**
 * Obtém áreas de especialização de um formador
 * 
 * Lista todas as áreas específicas de conhecimento onde o formador
 * tem competências certificadas, incluindo a categoria pai de cada área.
 * 
 * @param {Object} req - Objeto de requisição (deve conter req.params.id)
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Array} Lista de áreas com categorias pai
 */
const getAreasFormador = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 [BACKEND] getAreasFormador - Formador ID: ${id}`);

    // Valida ID do formador
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID inválido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    // Verifica se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Formador não encontrado ou cargo inválido`);
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Obtém áreas com categoria pai
    let areas = [];
    try {
      areas = await Area.findAll({
        include: [
          {
            model: User,
            as: "formadores",
            where: { id_utilizador: id },
            through: { attributes: [] },
            attributes: []
          },
          {
            model: Categoria,
            as: "categoriaParent"
          }
        ]
      });

      console.log(`✅ [BACKEND] Áreas encontradas (com associações): ${areas.length}`);

    } catch (includeError) {
      console.warn(`⚠️ [BACKEND] Erro nas associações, usando fallback:`, includeError.message);
      
      // Fallback: buscar através da tabela de ligação diretamente
      const associacoes = await FormadorArea.findAll({
        where: { id_formador: id }
      });
      
      const areaIds = associacoes.map(assoc => assoc.id_area);
      if (areaIds.length > 0) {
        areas = await Area.findAll({
          where: { id_area: { [Op.in]: areaIds } },
          include: [
            {
              model: Categoria,
              as: "categoriaParent"
            }
          ]
        });
      }

      console.log(`🔄 [BACKEND] Áreas encontradas (fallback): ${areas.length}`);
    }

    return res.json({
      formador: {
        id: formador.id_utilizador,
        nome: formador.nome
      },
      areas: areas,
      totalAreas: areas.length
    });
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao procurar áreas do formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao carregar áreas do formador", 
      error: error.message 
    });
  }
};

/**
 * Adiciona categorias de especialização a um formador
 * 
 * Associa novas categorias de conhecimento ao formador após validar
 * a existência das categorias e evitar duplicações.
 * 
 * @param {Object} req - Objeto de requisição com lista de categorias
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Categorias adicionadas e estado atual
 */
const addCategoriasFormador = async (req, res) => {
  try {
    const { id } = req.params;
    const { categorias } = req.body;

    console.log(`➕ [BACKEND] addCategoriasFormador - Formador ID: ${id}, Categorias: ${categorias}`);

    // Validações de entrada
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID inválido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      console.error(`❌ [BACKEND] Lista de categorias inválida`);
      return res.status(400).json({ 
        message: "É necessário fornecer uma lista válida de IDs de categorias" 
      });
    }

    // Verifica se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Formador não encontrado`);
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Verifica se todas as categorias existem
    const categoriasEncontradas = await Categoria.findAll({
      where: {
        id_categoria: {
          [Op.in]: categorias.filter(cat => !isNaN(parseInt(cat)))
        }
      }
    });

    if (categoriasEncontradas.length !== categorias.length) {
      const idsEncontrados = categoriasEncontradas.map(c => c.id_categoria);
      const idsNaoEncontrados = categorias.filter(cat => !idsEncontrados.includes(parseInt(cat)));
      
      console.error(`❌ [BACKEND] Categorias inválidas:`, idsNaoEncontrados);
      
      return res.status(400).json({
        message: "Uma ou mais categorias não existem",
        categorias_invalidas: idsNaoEncontrados,
        categorias_validas: idsEncontrados
      });
    }

    // Cria associações formador-categoria evitando duplicações
    const associacoes = [];
    const dataAtual = new Date();

    for (const categoriaId of categorias) {
      // Verifica se a associação já existe
      const associacaoExistente = await FormadorCategoria.findOne({
        where: {
          id_formador: id,
          id_categoria: categoriaId
        }
      });

      if (!associacaoExistente) {
        const novaAssociacao = await FormadorCategoria.create({
          id_formador: id,
          id_categoria: categoriaId,
          data_associacao: dataAtual
        });
        associacoes.push(novaAssociacao);
      }
    }

    console.log(`✅ [BACKEND] ${associacoes.length} novas associações criadas`);

    // Obtém lista atualizada de categorias do formador
    let categoriasAtualizadas = [];
    try {
      categoriasAtualizadas = await Categoria.findAll({
        include: [
          {
            model: User,
            as: "formadores",
            where: { id_utilizador: id },
            through: { attributes: [] },
            attributes: []
          }
        ]
      });
    } catch (includeError) {
      // Fallback sem associações
      const todasAssociacoes = await FormadorCategoria.findAll({
        where: { id_formador: id }
      });
      
      const todosIds = todasAssociacoes.map(assoc => assoc.id_categoria);
      if (todosIds.length > 0) {
        categoriasAtualizadas = await Categoria.findAll({
          where: { id_categoria: { [Op.in]: todosIds } }
        });
      }
    }

    return res.status(201).json({
      message: `${associacoes.length} nova(s) categoria(s) adicionada(s) ao formador`,
      categorias_adicionadas: associacoes.length,
      total_categorias_atual: categoriasAtualizadas.length,
      categorias: categoriasAtualizadas
    });
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao adicionar categorias ao formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao adicionar categorias", 
      error: error.message 
    });
  }
};

/**
 * Remove categoria de especialização de um formador
 * 
 * Remove a associação entre formador e uma categoria específica,
 * mantendo outras especializações intactas.
 * 
 * @param {Object} req - Objeto de requisição com IDs do formador e categoria
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Confirmação de remoção
 */
const removeFormadorCategoria = async (req, res) => {
  try {
    const { id, categoriaId } = req.params;

    console.log(`🗑️ [BACKEND] removeFormadorCategoria - Formador: ${id}, Categoria: ${categoriaId}`);

    // Validações de entrada
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID de formador inválido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    if (!categoriaId || isNaN(parseInt(categoriaId))) {
      console.error(`❌ [BACKEND] ID de categoria inválido: ${categoriaId}`);
      return res.status(400).json({ message: "ID de categoria inválido" });
    }

    // Verifica se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Formador não encontrado`);
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Verifica se a categoria existe
    const categoria = await Categoria.findByPk(categoriaId);
    if (!categoria) {
      console.error(`❌ [BACKEND] Categoria não encontrada: ${categoriaId}`);
      return res.status(404).json({ message: "Categoria não encontrada" });
    }

    // Remove associação
    const deletedRows = await FormadorCategoria.destroy({
      where: {
        id_formador: id,
        id_categoria: categoriaId
      }
    });

    if (deletedRows === 0) {
      console.error(`❌ [BACKEND] Associação não encontrada`);
      return res.status(404).json({ 
        message: "Associação entre formador e categoria não encontrada" 
      });
    }

    console.log(`✅ [BACKEND] Categoria removida com sucesso`);

    return res.json({
      message: "Categoria removida do formador com sucesso",
      formador: formador.nome,
      categoria_removida: categoria.nome
    });
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao remover categoria do formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao remover categoria", 
      error: error.message 
    });
  }
};

/**
 * Adiciona áreas de especialização a um formador
 * 
 * Associa novas áreas específicas ao formador e adiciona automaticamente
 * as categorias pai se ainda não estiverem associadas.
 * 
 * @param {Object} req - Objeto de requisição com lista de áreas
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Áreas adicionadas e estado atual
 */
const addAreasFormador = async (req, res) => {
  try {
    const { id } = req.params;
    const { areas } = req.body;

    console.log(`➕ [BACKEND] addAreasFormador - Formador ID: ${id}, Áreas: ${areas}`);

    // Validações de entrada
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID inválido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    if (!areas || !Array.isArray(areas) || areas.length === 0) {
      console.error(`❌ [BACKEND] Lista de áreas inválida`);
      return res.status(400).json({ 
        message: "É necessário fornecer uma lista válida de IDs de áreas" 
      });
    }

    // Verifica se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Formador não encontrado`);
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Verifica se todas as áreas existem
    const areasEncontradas = await Area.findAll({
      where: {
        id_area: {
          [Op.in]: areas.filter(area => !isNaN(parseInt(area)))
        }
      }
    });

    if (areasEncontradas.length !== areas.length) {
      const idsEncontrados = areasEncontradas.map(a => a.id_area);
      const idsNaoEncontrados = areas.filter(area => !idsEncontrados.includes(parseInt(area)));
      
      console.error(`❌ [BACKEND] Áreas inválidas:`, idsNaoEncontrados);
      
      return res.status(400).json({
        message: "Uma ou mais áreas não existem",
        areas_invalidas: idsNaoEncontrados,
        areas_validas: idsEncontrados
      });
    }

    // Cria associações formador-área evitando duplicações
    const associacoes = [];
    const dataAtual = new Date();

    for (const areaId of areas) {
      // Verifica se a associação já existe
      const associacaoExistente = await FormadorArea.findOne({
        where: {
          id_formador: id,
          id_area: areaId
        }
      });

      if (!associacaoExistente) {
        const novaAssociacao = await FormadorArea.create({
          id_formador: id,
          id_area: areaId,
          data_associacao: dataAtual
        });
        associacoes.push(novaAssociacao);

        // Adiciona automaticamente a categoria da área
        const area = areasEncontradas.find(a => a.id_area === parseInt(areaId));
        if (area && area.id_categoria) {
          await FormadorCategoria.findOrCreate({
            where: {
              id_formador: id,
              id_categoria: area.id_categoria
            },
            defaults: {
              data_associacao: dataAtual
            }
          });
        }
      }
    }

    console.log(`✅ [BACKEND] ${associacoes.length} novas associações de área criadas`);

    // Obtém lista atualizada de áreas do formador
    let areasAtualizadas = [];
    try {
      areasAtualizadas = await Area.findAll({
        include: [
          {
            model: User,
            as: "formadores",
            where: { id_utilizador: id },
            through: { attributes: [] },
            attributes: []
          },
          {
            model: Categoria,
            as: "categoriaParent"
          }
        ]
      });
    } catch (includeError) {
      // Fallback sem associações
      const todasAssociacoes = await FormadorArea.findAll({
        where: { id_formador: id }
      });
      
      const todosIds = todasAssociacoes.map(assoc => assoc.id_area);
      if (todosIds.length > 0) {
        areasAtualizadas = await Area.findAll({
          where: { id_area: { [Op.in]: todosIds } },
          include: [
            {
              model: Categoria,
              as: "categoriaParent"
            }
          ]
        });
      }
    }

    return res.status(201).json({
      message: `${associacoes.length} nova(s) área(s) adicionada(s) ao formador`,
      areas_adicionadas: associacoes.length,
      total_areas_atual: areasAtualizadas.length,
      areas: areasAtualizadas
    });
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao adicionar áreas ao formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao adicionar áreas", 
      error: error.message 
    });
  }
};

/**
 * Remove área de especialização de um formador
 * 
 * Remove a associação entre formador e uma área específica,
 * preservando outras especializações do mesmo formador.
 * 
 * @param {Object} req - Objeto de requisição com IDs do formador e área
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Confirmação de remoção
 */
const removeFormadorArea = async (req, res) => {
  try {
    const { id, areaId } = req.params;

    console.log(`🗑️ [BACKEND] removeFormadorArea - Formador: ${id}, Área: ${areaId}`);

    // Validações de entrada
    if (!id || isNaN(parseInt(id))) {
      console.error(`❌ [BACKEND] ID de formador inválido: ${id}`);
      return res.status(400).json({ message: "ID de formador inválido" });
    }

    if (!areaId || isNaN(parseInt(areaId))) {
      console.error(`❌ [BACKEND] ID de área inválido: ${areaId}`);
      return res.status(400).json({ message: "ID de área inválido" });
    }

    // Verifica se o formador existe
    const formador = await User.findByPk(id);
    if (!formador || formador.id_cargo !== 2) {
      console.error(`❌ [BACKEND] Formador não encontrado`);
      return res.status(404).json({ message: "Formador não encontrado" });
    }

    // Verifica se a área existe
    const area = await Area.findByPk(areaId);
    if (!area) {
      console.error(`❌ [BACKEND] Área não encontrada: ${areaId}`);
      return res.status(404).json({ message: "Área não encontrada" });
    }

    // Remove associação
    const deletedRows = await FormadorArea.destroy({
      where: {
        id_formador: id,
        id_area: areaId
      }
    });

    if (deletedRows === 0) {
      console.error(`❌ [BACKEND] Associação não encontrada`);
      return res.status(404).json({ 
        message: "Associação entre formador e área não encontrada" 
      });
    }

    console.log(`✅ [BACKEND] Área removida com sucesso`);

    return res.json({
      message: "Área removida do formador com sucesso",
      formador: formador.nome,
      area_removida: area.nome
    });
    
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao remover área do formador:", error);
    return res.status(500).json({ 
      message: "Erro interno ao remover área", 
      error: error.message 
    });
  }
};

// Exporta todas as funções do controlador para utilização nas rotas
module.exports = {
  getAllFormadores,
  getFormadorById,
  getCursosFormador,
  registerFormador,
  updateFormador,
  deleteFormador,
  getCategoriasFormador,
  addCategoriasFormador,
  removeFormadorCategoria,
  getAreasFormador,
  addAreasFormador,
  removeFormadorArea,
  getFormadorProfile
};