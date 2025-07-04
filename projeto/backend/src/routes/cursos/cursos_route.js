const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const uploadUtils = require('../../middleware/upload');
const { 
  getAllCursos, getCursosByCategoria, getTopicoArea, createCurso, getCursoById, 
  getInscricoesCurso, updateCurso, deleteCurso, getCursosSugeridos,
  getTopicosCurso, createCurso_Topicos, updateCurso_Topicos, deleteCurso_Topicos
} = require("../../controllers/cursos/cursos_ctrl");

/**
 * Rotas para gestão completa do sistema de cursos
 * 
 * Este módulo define todas as rotas HTTP para operações CRUD de cursos,
 * incluindo upload de imagens, gestão de tópicos e controlo de acesso
 * baseado em perfis de utilizador (administradores, formadores, estudantes).
 * 
 * Funcionalidades principais:
 * - Criação e edição de cursos com upload de imagens
 * - Listagem com filtros avançados e paginação
 * - Sistema de recomendações personalizadas
 * - Gestão de tópicos organizacionais
 * - Controlo de acesso granular por perfil
 * - Integração automática com notificações WebSocket
 */

/**
 * Middleware especializado para tratamento de erros de upload
 * 
 * Intercepta e processa erros específicos do Multer, fornecendo
 * mensagens de erro claras e detalhadas para diferentes tipos
 * de falhas no upload de ficheiros.
 * 
 * @param {Error} err - Erro capturado do middleware anterior
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função para passar para o próximo middleware
 */
const tratarErrosUpload = (err, req, res, next) => {
  console.log('🔍 [UPLOAD] A processar erro de upload:', err.code || err.message);
  
  // === ERROS ESPECÍFICOS DO MULTER ===
  
  // Ficheiro excede o tamanho máximo configurado (15MB)
  if (err.code === 'LIMIT_FILE_SIZE') {
    console.error('❌ [UPLOAD] Ficheiro demasiado grande para o limite definido');
    return res.status(400).json({
      message: 'Ficheiro demasiado grande. O tamanho máximo permitido é 15MB.',
      error: 'LIMIT_FILE_SIZE',
      maxSize: '15MB',
      hint: 'Tenta comprimir a imagem ou usar um formato mais eficiente como WebP.'
    });
  }
  
  // Campo de ficheiro não esperado na requisição
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    console.error('❌ [UPLOAD] Campo de ficheiro inesperado:', err.field);
    return res.status(400).json({
      message: `Campo de ficheiro inesperado: "${err.field}". Apenas o campo "imagem" é aceite.`,
      error: 'LIMIT_UNEXPECTED_FILE',
      field: err.field,
      expectedField: 'imagem'
    });
  }
  
  // Tipo de ficheiro não suportado (configurado no middleware de upload)
  if (err.message && err.message.includes('Tipo de ficheiro não permitido')) {
    console.error('❌ [UPLOAD] Tipo de ficheiro inválido');
    return res.status(400).json({
      message: err.message,
      error: 'INVALID_FILE_TYPE',
      allowedTypes: ['JPEG', 'PNG', 'GIF', 'WebP', 'SVG', 'BMP', 'TIFF'],
      hint: 'Usa uma imagem nos formatos suportados: JPEG, PNG, GIF, WebP, SVG, BMP ou TIFF.'
    });
  }
  
  // Outros erros relacionados com limites do Multer
  if (err.code && err.code.startsWith('LIMIT_')) {
    console.error('❌ [UPLOAD] Erro de limite Multer:', err.code);
    return res.status(400).json({
      message: 'Erro no upload do ficheiro devido a limitações do servidor',
      error: err.code,
      details: err.message
    });
  }
  
  // === ERROS PERSONALIZADOS DO SISTEMA ===
  
  // Erros de validação de ficheiro personalizados
  if (err.message && err.message.includes('formato não suportado')) {
    console.error('❌ [UPLOAD] Formato de ficheiro não suportado');
    return res.status(400).json({
      message: 'Formato de ficheiro não suportado para imagens de curso',
      error: 'UNSUPPORTED_FORMAT',
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP']
    });
  }
  
  // Passar erros não relacionados com upload para o handler seguinte
  console.log('⏭️ [UPLOAD] Erro não relacionado com upload, a passar adiante');
  next(err);
};

// =============================================================================
// OPERAÇÕES PRINCIPAIS DE GESTÃO DE CURSOS
// =============================================================================

/**
 * Criar novo curso com possibilidade de upload de imagem
 * 
 * POST /cursos
 * Acesso: Administradores (1) e Formadores (2)
 * 
 * Esta rota processa a criação completa de um curso:
 * - Aceita dados via multipart/form-data para upload de imagem
 * - Cria estrutura de diretórios no sistema de ficheiros
 * - Processa e armazena imagem de capa
 * - Envia notificações automáticas via WebSocket
 * - Suporta criação de tópicos organizacionais iniciais
 */
router.post("/", 
  verificarToken, 
  autorizar([1, 2]), 
  uploadUtils.uploadCurso.single("imagem"), 
  tratarErrosUpload,
  createCurso
);

/**
 * Listar todos os cursos disponíveis
 * 
 * GET /cursos
 * Acesso: Público (sem autenticação necessária)
 * 
 * Endpoint principal para visualização de cursos com capacidades avançadas:
 * 
 * Query parameters suportados:
 * - page, limit: Controlo de paginação
 * - categoria, area, formador: Filtros por relacionamentos
 * - search: Pesquisa textual no nome do curso
 * - tipo: sincrono/assincrono
 * - estado: planeado/em_curso/terminado
 * - ativo: true/false para cursos ativos/inativos
 * - vagas: número mínimo de vagas disponíveis
 * - topico: filtro por tópico de área específico
 * 
 * Exemplo: GET /cursos?categoria=1&tipo=sincrono&page=2&limit=20
 */
router.get("/", getAllCursos);

/**
 * Obter cursos filtrados por categoria específica
 * 
 * GET /cursos/por-categoria?categorias=1,2,3
 * Acesso: Público
 * 
 * Especializado para associação com formadores e filtros de categoria múltipla.
 * Aceita múltiplas categorias separadas por vírgula para consultas flexíveis.
 * Útil para construir interfaces de seleção baseadas em competências.
 */
router.get("/por-categoria", getCursosByCategoria);

/**
 * Obter sugestões personalizadas de cursos
 * 
 * GET /cursos/sugeridos
 * Acesso: Utilizadores autenticados
 * 
 * Sistema de recomendação inteligente que analisa:
 * - Histórico de inscrições do utilizador
 * - Padrões de interesse por categoria e área
 * - Disponibilidade atual dos cursos
 * 
 * Algoritmo de sugestão:
 * 1. Prioridade: categorias conhecidas em áreas novas
 * 2. Fallback: cursos aleatórios disponíveis
 */
router.get("/sugeridos", verificarToken, getCursosSugeridos);

/**
 * Obter informações de tópico de área específico
 * 
 * GET /cursos/topico-area/:id
 * Acesso: Público
 * 
 * Retorna dados detalhados de um tópico de área para:
 * - Validações em formulários
 * - Construção de hierarquias de navegação
 * - Verificação de existência antes de associações
 */
router.get("/topico-area/:id", getTopicoArea);

/**
 * Obter detalhes completos de um curso específico
 * 
 * GET /cursos/:id
 * Acesso: Público (com verificações de acesso para cursos terminados)
 * 
 * Endpoint principal para visualização de curso individual:
 * - Inclui informações de formador, tópicos e associações
 * - Aplica regras de acesso para cursos terminados
 * - Conta inscrições ativas para mostrar ocupação
 * - Carrega cursos associados para recomendações
 * 
 * Regras de acesso especiais:
 * - Cursos ativos: acesso livre
 * - Cursos terminados: apenas alunos inscritos podem ver detalhes
 */
router.get("/:id", getCursoById);

/**
 * Atualizar dados de curso existente
 * 
 * PUT /cursos/:id
 * Acesso: Administradores (1) e Formadores (2)
 * 
 * Funcionalidades avançadas de edição:
 * - Suporte a upload de nova imagem de capa
 * - Renomeação automática de diretórios se o nome mudou
 * - Detecção inteligente de alterações relevantes
 * - Envio automático de notificações específicas por tipo de alteração
 * - Atualização automática do estado baseado nas datas
 * 
 * Sistema de notificações inteligente:
 * - Alterações gerais (nome, descrição, tipo, etc.)
 * - Alterações específicas de formador
 * - Alterações críticas de cronograma (datas)
 */
router.put("/:id", 
  verificarToken, 
  autorizar([1, 2]), 
  uploadUtils.uploadCurso.single("imagem"), 
  tratarErrosUpload,
  updateCurso
);

/**
 * Eliminar curso do sistema
 * 
 * DELETE /cursos/:id
 * Acesso: Apenas Administradores (1)
 * 
 * Operação irreversível e destrutiva que remove:
 * - Registo do curso na base de dados
 * - Todas as inscrições relacionadas
 * - Estrutura completa de tópicos e conteúdos
 * - Associações com outros cursos
 * - Diretório completo no sistema de ficheiros
 * 
 * Processo de eliminação hierárquica:
 * 1. Associações com outros cursos
 * 2. Inscrições de utilizadores
 * 3. Conteúdos de pastas
 * 4. Pastas de tópicos
 * 5. Tópicos organizacionais
 * 6. Registo principal do curso
 * 7. Diretório físico e todos os ficheiros
 */
router.delete("/:id", verificarToken, autorizar([1]), deleteCurso);

/**
 * Obter lista de inscrições ativas num curso
 * 
 * GET /cursos/:id/inscricoes
 * Acesso: Utilizadores autenticados
 * 
 * Lista utilizadores inscritos para fins de:
 * - Gestão pedagógica por formadores
 * - Acompanhamento por administradores
 * - Comunicação e contacto direto
 * 
 * Inclui dados básicos de contacto dos inscritos.
 */
router.get("/:id/inscricoes", verificarToken, getInscricoesCurso);

// =============================================================================
// GESTÃO DE TÓPICOS E ESTRUTURA ORGANIZACIONAL DO CURSO
// =============================================================================

/**
 * Obter estrutura completa de tópicos de um curso
 * 
 * GET /cursos/:id/topicos
 * Acesso: Público
 * 
 * Lista todos os tópicos organizacionais ordenados por sequência pedagógica.
 * Apenas tópicos ativos são retornados para construir a navegação do curso.
 * 
 * Utilizado para:
 * - Construção da estrutura de navegação
 * - Organização de conteúdos por tema
 * - Sequência pedagógica de aprendizagem
 */
router.get("/:id/topicos", getTopicosCurso);

/**
 * Criar novo tópico para organização do conteúdo
 * 
 * POST /cursos/:id/topicos
 * Acesso: Administradores (1), Formadores (2) e Estudantes (3)
 * 
 * Adiciona nova secção temática à estrutura do curso:
 * - Ordenação automática ou manual via parâmetro 'ordem'
 * - Ativação automática para utilização imediata
 * - Validação de existência do curso pai
 * 
 * Útil para:
 * - Organizar materiais didáticos por tema
 * - Criar sequência lógica de aprendizagem
 * - Estruturação hierárquica de conteúdos
 */
router.post("/:id/topicos", 
  verificarToken, 
  autorizar([1, 2, 3]), 
  createCurso_Topicos
);

/**
 * Atualizar tópico existente
 * 
 * PUT /cursos/topicos/:id
 * Acesso: Administradores (1), Formadores (2) e Estudantes (3)
 * 
 * Permite modificar:
 * - Nome do tópico para melhor identificação
 * - Ordem na sequência pedagógica
 * - Estado de ativação (ativo/inativo)
 * 
 * Suporta reordenação da estrutura sem afetar conteúdos associados.
 */
router.put("/topicos/:id", 
  verificarToken, 
  autorizar([1, 2, 3]), 
  updateCurso_Topicos
);

/**
 * Eliminar tópico específico
 * 
 * DELETE /cursos/topicos/:id
 * Acesso: Administradores (1), Formadores (2) e Estudantes (3)
 * 
 * Comportamento inteligente baseado em dependências:
 * - Se tiver conteúdos associados: desativa em vez de eliminar
 * - Se não tiver dependências: elimina permanentemente
 * 
 * Esta abordagem preserva a integridade referencial e evita
 * perda acidental de dados importantes.
 */
router.delete("/topicos/:id", 
  verificarToken, 
  autorizar([1, 2, 3]), 
  deleteCurso_Topicos
);

// =============================================================================
// MIDDLEWARES DE DEBUGGING E MONITORIZAÇÃO
// =============================================================================

/**
 * Middleware de logging para debug das rotas em desenvolvimento
 * 
 * Em ambiente de desenvolvimento, regista informações detalhadas
 * sobre cada requisição para facilitar debugging e monitorização.
 */
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    const userId = req.user?.id_utilizador || 'Anónimo';
    const method = req.method;
    const path = req.path;
    const timestamp = new Date().toISOString();
    
    console.log(`🔍 [CURSOS] ${timestamp} - ${method} ${path} - Utilizador: ${userId}`);
    
    // Log de parâmetros relevantes para debugging
    if (Object.keys(req.query).length > 0) {
      console.log(`📋 [CURSOS] Query params:`, req.query);
    }
    
    if (req.file) {
      console.log(`📎 [CURSOS] Ficheiro enviado: ${req.file.originalname} (${req.file.size} bytes)`);
    }
    
    next();
  });
}

// =============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS ESPECÍFICO PARA CURSOS
// =============================================================================

/**
 * Aplicar middleware de tratamento de erros de upload
 * 
 * Garante que todos os erros de upload são capturados e processados
 * adequadamente antes de chegarem ao handler global de erros.
 */
router.use(tratarErrosUpload);

/**
 * Handler de erro específico para operações de cursos
 * 
 * Captura erros não tratados nas operações de curso e fornece
 * respostas consistentes e informativas sem expor detalhes
 * internos sensíveis em produção.
 */
router.use((err, req, res, next) => {
  console.error('❌ [CURSOS] Erro não tratado na rota de cursos:', err.message);
  console.error('📍 [CURSOS] Stack trace:', err.stack);
  console.error('🌐 [CURSOS] URL:', req.url);
  console.error('👤 [CURSOS] Utilizador:', req.user?.id_utilizador || 'Anónimo');
  
  // Classificar tipo de erro para resposta apropriada
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  
  // Erros de validação
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Dados inválidos fornecidos';
  }
  
  // Erros de autorização
  if (err.name === 'UnauthorizedError' || err.message.includes('authorization')) {
    statusCode = 401;
    message = 'Acesso não autorizado';
  }
  
  // Erros de base de dados
  if (err.name && err.name.startsWith('Sequelize')) {
    statusCode = 500;
    message = 'Erro na base de dados';
  }
  
  res.status(statusCode).json({
    message: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// =============================================================================
// MIDDLEWARE DE VALIDAÇÃO DE PARÂMETROS
// =============================================================================

/**
 * Middleware para validar IDs numéricos nos parâmetros
 * 
 * Valida que parâmetros de ID são números válidos antes de
 * passarem para os controladores, evitando erros desnecessários.
 */
router.param('id', (req, res, next, id) => {
  // Verificar se o ID é um número válido
  if (!/^\d+$/.test(id)) {
    console.warn(`⚠️ [CURSOS] ID inválido fornecido: ${id}`);
    return res.status(400).json({
      message: 'ID do curso deve ser um número válido',
      providedId: id,
      expected: 'número inteiro positivo'
    });
  }
  
  // Converter para número e validar range
  const numericId = parseInt(id, 10);
  if (numericId < 1 || numericId > 2147483647) {
    console.warn(`⚠️ [CURSOS] ID fora do range válido: ${numericId}`);
    return res.status(400).json({
      message: 'ID do curso fora do range válido',
      providedId: numericId,
      validRange: '1 - 2147483647'
    });
  }
  
  // ID válido, continuar processamento
  next();
});

// =============================================================================
// ROTAS DE TESTE E DIAGNÓSTICO (APENAS DESENVOLVIMENTO)
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  /**
   * Rota de teste para verificar funcionalidade de upload
   * 
   * POST /cursos/test/upload
   * Apenas disponível em desenvolvimento
   */
  router.post("/test/upload", 
    verificarToken,
    uploadUtils.uploadCurso.single("imagem"),
    tratarErrosUpload,
    (req, res) => {
      res.json({
        message: "Upload de teste bem-sucedido",
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path
        } : null,
        timestamp: new Date().toISOString()
      });
    }
  );

  /**
   * Rota de teste para notificações WebSocket
   * 
   * POST /cursos/test/notification
   * Apenas disponível em desenvolvimento
   */
  router.post("/test/notification", verificarToken, (req, res) => {
    const { userId, message } = req.body;
    
    if (req.io) {
      req.io.to(`user_${userId || req.user.id_utilizador}`).emit('nova_notificacao', {
        titulo: "🧪 Teste de Notificação",
        mensagem: message || "Esta é uma notificação de teste do sistema de cursos!",
        tipo: "teste",
        data: new Date(),
        isTest: true
      });
      
      res.json({
        message: "Notificação de teste enviada",
        targetUser: userId || req.user.id_utilizador,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        message: "WebSocket não disponível",
        timestamp: new Date().toISOString()
      });
    }
  });
}

module.exports = router;