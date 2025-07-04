const express = require('express');
const router = express.Router();
const { 
  getNotificacoesUtilizador, 
  getNotificacoesNaoLidasContagem, 
  marcarComoLida, 
  marcarTodasComoLidas, 
  adminCriado, 
  formadorAlterado, 
  cursoCriado, 
  dataCursoAlterada,
  cursoAlterado
} = require('../../controllers/notificacoes/notificacoes_ctrl');
const verificarToken = require('../../middleware/auth');

/**
 * Rotas para sistema completo de notificações em tempo real
 * 
 * Define endpoints para gestão de notificações pessoais e criação
 * automática de alertas do sistema. Integra com WebSocket para
 * notificações instantâneas e base de dados para histórico.
 */

// Middleware de autenticação obrigatória para todas as rotas
router.use(verificarToken);

/**
 * Middleware de logging para desenvolvimento
 * Regista informações detalhadas sobre requisições em modo debug
 */
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    const userId = req.user?.id_utilizador;
    const method = req.method;
    const path = req.path;
    const timestamp = new Date().toISOString();
    
    console.log(`🔔 [NOTIF] ${timestamp} - ${method} ${path} - Utilizador: ${userId}`);
    
    // Log do body para endpoints POST
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`📋 [NOTIF] Body da requisição:`, JSON.stringify(req.body, null, 2));
    }
    
    if (req.headers['x-request-id']) {
      console.log(`🆔 [NOTIF] Request ID: ${req.headers['x-request-id']}`);
    }
    
    next();
  });
}

/**
 * Obter histórico completo de notificações do utilizador
 * 
 * GET /notificacoes
 * 
 * Lista todas as notificações dirigidas ao utilizador atual, incluindo
 * notificações lidas e não lidas com dados completos da notificação
 * original e metadados de leitura.
 */
router.get('/', getNotificacoesUtilizador);

/**
 * Obter contagem de notificações não lidas
 * 
 * GET /notificacoes/nao-lidas/contagem
 * 
 * Endpoint otimizado para badges e indicadores visuais.
 * Retorna apenas o número para atualizações frequentes sem
 * sobrecarga de dados.
 */
router.get('/nao-lidas/contagem', getNotificacoesNaoLidasContagem);

/**
 * Marcar notificação específica como lida
 * 
 * PUT /notificacoes/:id_notificacao/lida
 * 
 * Atualiza estado individual de uma notificação e regista
 * timestamp de leitura para auditoria.
 */
router.put('/:id_notificacao/lida', marcarComoLida);

/**
 * Marcar todas as notificações como lidas
 * 
 * PUT /notificacoes/marcar-todas-como-lidas
 * 
 * Operação em lote para limpar todas as notificações
 * pendentes. Muito usado em botões "Marcar todas como lidas".
 */
router.put('/marcar-todas-como-lidas', marcarTodasComoLidas);

/**
 * Notificação automática para criação de novo administrador
 * 
 * POST /notificacoes/admin-criado
 * Body: { id_admin, nome_admin }
 * 
 * Endpoint interno usado quando um novo administrador é criado.
 * Envia alerta de segurança para todos os administradores existentes.
 */
router.post("/admin-criado", adminCriado);

/**
 * Notificação para alteração de formador de curso
 * 
 * POST /notificacoes/formador-alterado
 * Body: { 
 *   id_curso, nome_curso, 
 *   id_formador_antigo, nome_formador_antigo, 
 *   id_formador_novo, nome_formador_novo 
 * }
 * 
 * Usado quando há mudança de formador responsável.
 * Notifica todos os inscritos sobre a alteração.
 */
router.post("/formador-alterado", formadorAlterado);

/**
 * Notificação para criação de novo curso
 * 
 * POST /notificacoes/curso-criado
 * Body: { id_curso, nome_curso, id_categoria, id_area }
 * 
 * Ativado automaticamente quando um curso é criado.
 * Notifica utilizadores relevantes sobre nova oferta formativa.
 */
router.post("/curso-criado", cursoCriado);

/**
 * Notificação para alterações de datas de curso
 * 
 * POST /notificacoes/data-curso-alterada
 * Body: { 
 *   id_curso, nome_curso, 
 *   data_inicio_antiga, data_fim_antiga, 
 *   data_inicio_nova, data_fim_nova 
 * }
 * 
 * Usado quando há alterações no cronograma.
 * Envia avisos críticos para reorganização de agendas.
 */
router.post("/data-curso-alterada", dataCursoAlterada);

/**
 * Notificação para alterações gerais do curso
 * 
 * POST /notificacoes/curso-alterado
 * Body: { id_curso, nome_curso, alteracoes }
 * 
 * Para notificar mudanças em dados como nome, descrição,
 * tipo, duração, etc. Aceita array de alterações.
 */
router.post("/curso-alterado", cursoAlterado);

/**
 * Middleware de validação para endpoints de criação automática
 * Verifica se requisições POST contêm dados mínimos necessários
 */
router.use((req, res, next) => {
  if (req.method === 'POST' && req.path.startsWith('/')) {
    const { body } = req;
    
    if (!body || Object.keys(body).length === 0) {
      console.warn('⚠️ [NOTIF] Tentativa de criar notificação sem dados no body');
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios em falta para criação de notificação',
        expectedFields: 'Varia por endpoint - consulta documentação',
        receivedData: 'Body vazio'
      });
    }
    
    console.log(`📝 [NOTIF] Criação de notificação solicitada: ${req.path}`);
  }
  
  next();
});

// Rotas de teste e diagnóstico (apenas desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  /**
   * Teste de notificações WebSocket
   * 
   * POST /notificacoes/test/websocket
   * Body: { message, tipo }
   * 
   * Envia notificação de teste via WebSocket para o utilizador atual.
   */
  router.post('/test/websocket', (req, res) => {
    const { message, tipo } = req.body;
    const userId = req.user.id_utilizador;
    
    if (req.io) {
      req.io.to(`user_${userId}`).emit('nova_notificacao', {
        titulo: "🧪 Teste de WebSocket",
        mensagem: message || "Esta é uma notificação de teste do sistema!",
        tipo: tipo || "teste",
        data: new Date(),
        isTest: true
      });
      
      res.json({
        success: true,
        message: "Notificação de teste enviada via WebSocket",
        targetUser: userId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: "WebSocket não disponível para teste",
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Obter estatísticas de notificações (debug)
   * 
   * GET /notificacoes/test/stats
   * 
   * Retorna estatísticas para debugging do sistema.
   */
  router.get('/test/stats', async (req, res) => {
    try {
      const userId = req.user.id_utilizador;
      
      res.json({
        message: "Estatísticas de notificações (dados de exemplo)",
        userId: userId,
        stats: {
          total_notificacoes: "A implementar",
          nao_lidas: "A implementar",
          tipos_frequentes: "A implementar",
          ultima_atividade: new Date().toISOString()
        },
        note: "Esta rota é apenas para desenvolvimento e debug"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro ao obter estatísticas",
        error: error.message
      });
    }
  });

  /**
   * Teste de criação manual de notificação
   * 
   * POST /notificacoes/test/create
   * Body: { titulo, mensagem, tipo }
   * 
   * Simula criação de notificação para teste.
   */
  router.post('/test/create', async (req, res) => {
    try {
      const { titulo, mensagem, tipo } = req.body;
      const userId = req.user.id_utilizador;
      
      if (!titulo || !mensagem) {
        return res.status(400).json({
          success: false,
          message: "Título e mensagem são obrigatórios para teste"
        });
      }
      
      console.log(`🧪 [NOTIF] Teste de criação de notificação para utilizador ${userId}`);
      
      res.json({
        success: true,
        message: "Notificação de teste criada (simulação)",
        data: {
          titulo,
          mensagem,
          tipo: tipo || "teste",
          targetUser: userId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro no teste de criação",
        error: error.message
      });
    }
  });
}

/**
 * Handler de erro específico para rotas de notificações
 * 
 * Captura erros não tratados e fornece respostas consistentes
 * sem expor detalhes internos do sistema.
 */
router.use((err, req, res, next) => {
  console.error('❌ [NOTIF] Erro não tratado em notificações:', err.message);
  console.error('📍 [NOTIF] Stack trace:', err.stack);
  console.error('🌐 [NOTIF] URL:', req.url);
  console.error('👤 [NOTIF] Utilizador:', req.user?.id_utilizador || 'Anónimo');
  
  // Classificar tipos de erro específicos
  let statusCode = 500;
  let message = 'Erro interno no sistema de notificações';
  
  if (err.name === 'UnauthorizedError' || err.message.includes('token')) {
    statusCode = 401;
    message = 'Token de autenticação inválido ou expirado';
  }
  
  if (err.name === 'ValidationError' || err.message.includes('validation')) {
    statusCode = 400;
    message = 'Dados de notificação inválidos';
  }
  
  if (err.message.includes('WebSocket') || err.message.includes('socket')) {
    statusCode = 503;
    message = 'Serviço de notificações em tempo real temporariamente indisponível';
  }
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: isDevelopment ? err.message : undefined,
    stack: isDevelopment ? err.stack : undefined,
    suggestion: 'Contacta o suporte técnico se o problema persistir'
  });
});

module.exports = router;