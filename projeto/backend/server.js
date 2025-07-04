require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

// Configuração base do servidor Express e HTTP
const app = express();
const server = http.createServer(app);

// Configurar pasta de uploads predefinida se não estiver especificada
if (!process.env.CAMINHO_PASTA_UPLOADS) {
  process.env.CAMINHO_PASTA_UPLOADS = 'uploads';
}

// Garantir que as pastas de upload existem e configurar middleware
const uploadUtils = require("./src/middleware/upload");
uploadUtils.ensureBaseDirs();

/**
 * Configuração do Socket.IO para comunicação em tempo real
 * 
 * Permite envio instantâneo de notificações e chat entre utilizadores.
 * Configurado com CORS permissivo para desenvolvimento.
 */
const io = socketIo(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  path: "/socket.io",
});

/**
 * Middleware de autenticação para ligações WebSocket
 * 
 * Valida o token JWT antes de permitir ligação via socket,
 * garantindo que apenas utilizadores autenticados acedem às notificações.
 */
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) {
    console.warn('⚠️ [WEBSOCKET] Tentativa de ligação sem token de autenticação');
    return next(new Error("Autenticação necessária"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    console.log(`🔑 [WEBSOCKET] Utilizador autenticado: ${decoded.id_utilizador || decoded.id}`);
    next();
  } catch (error) {
    console.error('❌ [WEBSOCKET] Token inválido:', error.message);
    next(new Error("Token inválido"));
  }
});

/**
 * Gestão principal de ligações WebSocket
 * 
 * Quando um utilizador se liga, é automaticamente adicionado à sua sala pessoal
 * para receber notificações. Suporta também salas de tópicos e temas para chat.
 */
io.on("connection", (socket) => {
  const userId = socket.user ? socket.user.id_utilizador || socket.user.id : 'anónimo';
  
  console.log(`✅ [WEBSOCKET] Utilizador ${userId} ligado com sucesso`);

  // Adicionar utilizador à sua sala pessoal para notificações
  if (userId !== 'anónimo') {
    socket.join(`user_${userId}`);
    console.log(`🔔 [WEBSOCKET] Utilizador ${userId} adicionado à sala de notificações pessoais`);
    
    // Confirmar ligação bem-sucedida ao cliente
    socket.emit('connection_success', {
      message: 'Ligado com sucesso ao sistema de notificações',
      userId: userId,
      timestamp: new Date()
    });
  }

  /**
   * Juntar-se a sala de tópico específico para discussões
   * Usado para chat em contexto de cursos ou áreas temáticas
   */
  socket.on("joinTopic", (topicoId) => {
    if (!topicoId) {
      console.warn(`⚠️ [WEBSOCKET] ID de tópico inválido fornecido por ${userId}`);
      return;
    }

    socket.join(`topico_${topicoId}`);
    console.log(`📚 [WEBSOCKET] Utilizador ${userId} juntou-se ao tópico ${topicoId}`);
    
    socket.emit('topic_joined', {
      topicoId: topicoId,
      message: `Juntaste-te ao tópico ${topicoId}`
    });
  });

  /**
   * Sair de sala de tópico
   */
  socket.on("leaveTopic", (topicoId) => {
    if (!topicoId) return;

    socket.leave(`topico_${topicoId}`);
    console.log(`📚 [WEBSOCKET] Utilizador ${userId} saiu do tópico ${topicoId}`);
    
    socket.emit('topic_left', {
      topicoId: topicoId,
      message: `Saíste do tópico ${topicoId}`
    });
  });

  /**
   * Juntar-se a sala de tema do fórum
   * Para discussões gerais em temas específicos do fórum
   */
  socket.on("joinTema", (temaId) => {
    if (!temaId) {
      console.warn(`⚠️ [WEBSOCKET] ID de tema inválido fornecido por ${userId}`);
      return;
    }

    socket.join(`tema_${temaId}`);
    console.log(`💬 [WEBSOCKET] Utilizador ${userId} juntou-se ao tema ${temaId}`);
    
    socket.emit('tema_joined', {
      temaId: temaId,
      message: `Juntaste-te ao tema ${temaId}`
    });
  });

  /**
   * Sair de sala de tema do fórum
   */
  socket.on("leaveTema", (temaId) => {
    if (!temaId) return;

    socket.leave(`tema_${temaId}`);
    console.log(`💬 [WEBSOCKET] Utilizador ${userId} saiu do tema ${temaId}`);
    
    socket.emit('tema_left', {
      temaId: temaId,
      message: `Saíste do tema ${temaId}`
    });
  });

  /**
   * Teste de conectividade WebSocket
   * Permite verificar se a ligação está ativa e funcional
   */
  socket.on("ping", () => {
    const responseTime = Date.now();
    socket.emit("pong", { 
      message: "Ligação WebSocket ativa e funcional",
      userId: userId,
      timestamp: new Date(responseTime),
      responseTime: responseTime
    });
    console.log(`🏓 [WEBSOCKET] Ping/Pong com utilizador ${userId}`);
  });

  /**
   * Teste de notificações personalizado
   * Permite aos clientes testarem a receção de notificações
   */
  socket.on("test_notification", (data) => {
    console.log(`🧪 [WEBSOCKET] Teste de notificação solicitado por ${userId}`);
    
    socket.emit("nova_notificacao", {
      titulo: "🧪 Teste de Notificação",
      mensagem: "Esta é uma notificação de teste. O sistema está a funcionar corretamente!",
      tipo: "teste",
      data: new Date(),
      isTest: true
    });
  });

  /**
   * Gestão de desconexão
   * Limpeza automática quando utilizador sai da aplicação
   */
  socket.on("disconnect", (reason) => {
    console.log(`❌ [WEBSOCKET] Utilizador ${userId} desligado. Motivo: ${reason}`);
  });

  /**
   * Captura de erros do socket para debugging
   */
  socket.on("error", (error) => {
    console.error(`💥 [WEBSOCKET] Erro no socket do utilizador ${userId}:`, error.message);
  });
});

// Monitorização periódica de ligações ativas
setInterval(() => {
  const connectedSockets = io.engine.clientsCount;
  if (connectedSockets > 0) {
    console.log(`📊 [WEBSOCKET] ${connectedSockets} ligações WebSocket ativas`);
  }
}, 300000); // A cada 5 minutos

/**
 * Configuração CORS permissiva para desenvolvimento
 * Em produção deve ser restringida a domínios específicos
 */
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

/**
 * Middleware crítico: disponibilizar instância Socket.IO em todas as rotas
 * 
 * Permite que qualquer controlador envie notificações em tempo real
 * através de req.io. Essencial para o funcionamento das notificações.
 */
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configuração para suporte a ficheiros grandes (até 15GB)
app.use(express.json({ limit: '15GB' }));
app.use(express.urlencoded({ extended: true, limit: '15GB' }));
server.timeout = 3600000; // Timeout de 1 hora para uploads grandes

/**
 * Carregamento dinâmico e seguro de rotas
 * 
 * Carrega cada rota com tratamento de erros e fallbacks para
 * serviços indisponíveis.
 */
function carregarRota(caminho, prefixo) {
  try {
    const rotaPath = path.resolve(caminho);

    // Verificar se o ficheiro da rota existe
    if (!fs.existsSync(`${rotaPath}.js`)) {
      console.error(`❌ [ROTAS] Ficheiro não encontrado: ${rotaPath}.js`);
      
      // Criar rota de fallback
      app.use(prefixo, (req, res) =>
        res.status(503).json({ 
          message: "Serviço temporariamente indisponível",
          service: prefixo 
        })
      );
      return false;
    }

    // Limpar cache para permitir hot-reload em desenvolvimento
    delete require.cache[require.resolve(rotaPath)];
    const rota = require(rotaPath);
    
    // Validar se é uma rota válida do Express
    if (!rota || typeof rota !== "function" || !rota.stack) {
      console.error(`❌ [ROTAS] Rota mal formada: ${prefixo}`);
      
      app.use(prefixo, (req, res) =>
        res.status(503).json({ 
          message: "Rota mal configurada",
          service: prefixo 
        })
      );
      return false;
    }

    // Registar rota funcional no Express
    app.use(prefixo, rota);
    console.log(`✅ [ROTAS] Rota carregada com sucesso: ${prefixo}`);
    return true;
    
  } catch (error) {
    console.error(`💥 [ROTAS] Erro ao carregar ${prefixo}:`, error.message);
    
    app.use(prefixo, (req, res) =>
      res.status(503).json({ 
        message: "Erro ao carregar rota",
        service: prefixo,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
    return false;
  }
}

/**
 * Definição de todas as rotas do sistema
 * Cada entrada representa um módulo funcional da aplicação
 */
const rotas = [
  // Painel de controlo e estatísticas
  { caminho: "./src/routes/dashboard/dashboard_route", prefixo: "/api/dashboard" },

  // Gestão de utilizadores e autenticação
  { caminho: "./src/routes/users/auth_route", prefixo: "/api/auth" },
  { caminho: "./src/routes/users/users_route", prefixo: "/api/users" },
  { caminho: "./src/routes/users/areas_route", prefixo: "/api/areas" },
  { caminho: "./src/routes/users/formadores_route", prefixo: "/api/formadores" },
  { caminho: "./src/routes/users/presencas_route", prefixo: "/api/presencas" },
  { caminho: "./src/routes/users/Percurso_Formandos_routes", prefixo: "/api/percurso-formandos" },

  // Sistema de cursos com notificações
  { caminho: "./src/routes/cursos/curso_categorias_route", prefixo: "/api/categorias" },
  { caminho: "./src/routes/cursos/cursos_route", prefixo: "/api/cursos" },
  { caminho: "./src/routes/cursos/associar_cursos_route", prefixo: "/api/associar-cursos" },
  { caminho: "./src/routes/cursos/curso_topicos_route", prefixo: "/api/topicos-curso" },
  { caminho: "./src/routes/cursos/curso_pastas_route", prefixo: "/api/pastas-curso" },
  { caminho: "./src/routes/cursos/curso_conteudos_route", prefixo: "/api/conteudos-curso" },
  { caminho: "./src/routes/cursos/curso_inscricoes_route", prefixo: "/api/inscricoes" },
  { caminho: "./src/routes/cursos/tipos_conteudo_route", prefixo: "/api/tipos-conteudo" },
  { caminho: "./src/routes/quiz/quiz_route", prefixo: "/api/quiz" },

  // Sistema de trabalhos e avaliações
  { caminho: "./src/routes/trabalhos/trabalhos_route", prefixo: "/api/trabalhos" },
  { caminho: "./src/routes/avaliacoes/submissoes_route", prefixo: "/api/avaliacoes/submissoes" },
  { caminho: "./src/routes/avaliacoes/avaliar_submissoes_routes", prefixo: "/api/avaliar" },
  { caminho: "./src/routes/avaliacoes/avaliacoes_routes", prefixo: "/api/avaliacoes" },

  // Chat, fóruns e comunicação em tempo real
  { caminho: "./src/routes/ocorrencias/ocorrencias_route", prefixo: "/api/ocorrencias" },
  { caminho: "./src/routes/chat/chat_routes", prefixo: "/api/chat" },
  { caminho: "./src/routes/chat/Topico_area_routes", prefixo: "/api/topicos-area" },
  { caminho: "./src/routes/chat/Topicos_Chat_routes", prefixo: "/api/forum" },
  { caminho: "./src/routes/chat/Forum_Tema_routes", prefixo: "/api/forum-tema" },
  { caminho: "./src/routes/chat/comentarios_routes", prefixo: "/api/comentarios" },
  { caminho: "./src/routes/chat/denuncias_routes", prefixo: "/api/denuncias" },

  // Serviços especializados
  { caminho: "./src/routes/certificados/certificado_routes", prefixo: "/api/certificados" },
  { caminho: "./src/routes/mailing/mailing_route", prefixo: "/api/mailing" },
  { caminho: "./src/routes/notificacoes/notificacoes_route", prefixo: "/api/notificacoes" },
];

// Carregar associações da base de dados antes de inicializar rotas
require("./src/database/associations");

// Carregar todas as rotas e gerar relatório de sucessos
const rotasCarregadas = rotas.filter(({ caminho, prefixo }) => carregarRota(caminho, prefixo));
console.log(`📊 [ROTAS] Estatísticas: ${rotasCarregadas.length}/${rotas.length} rotas carregadas com sucesso`);

// Servir ficheiros estáticos (uploads)
app.use("/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));
app.use("/api/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));

console.log(`📁 [FICHEIROS] Servindo uploads de: ${path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)}`);

/**
 * Rota principal da API com informações de estado
 * Fornece diagnóstico sobre a saúde do sistema
 */
app.get("/api", (req, res) => {
  const uptimeSeconds = process.uptime();
  const uptimeFormatted = `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${Math.floor(uptimeSeconds % 60)}s`;
  
  res.json({
    message: "🚀 API da Plataforma de Formação está a funcionar!",
    version: "1.0.0",
    status: "operational",
    timestamp: new Date().toISOString(),
    uptime: uptimeFormatted,
    rotas_carregadas: rotasCarregadas.length,
    total_rotas: rotas.length,
    taxa_sucesso_rotas: `${((rotasCarregadas.length / rotas.length) * 100).toFixed(1)}%`,
    websocket_ativo: true,
    websocket_ligacoes: io.engine.clientsCount,
    upload_dir: process.env.CAMINHO_PASTA_UPLOADS,
    node_env: process.env.NODE_ENV || 'development'
  });
});

/**
 * Rota de diagnóstico das variáveis de ambiente
 * Útil para verificar configuração em diferentes ambientes
 */
app.get("/api/debug/env", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 'não definida',
    JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
    DB_CONFIG_EXISTS: !!(process.env.DB_HOST || process.env.DATABASE_URL),
    EMAIL_CONFIG_EXISTS: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    CAMINHO_PASTA_UPLOADS: process.env.CAMINHO_PASTA_UPLOADS,
    FRONTEND_URL: process.env.FRONTEND_URL || 'não definida',
    WEBSOCKET_READY: true,
    WEBSOCKET_CORS_CONFIGURED: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * Teste do sistema WebSocket
 * Verifica se o sistema de notificações está operacional
 */
app.get("/api/test/websocket", (req, res) => {
  const connectionsCount = io.engine.clientsCount;
  const rooms = Array.from(io.sockets.adapter.rooms.keys());
  const userRooms = rooms.filter(room => room.startsWith('user_'));
  const topicRooms = rooms.filter(room => room.startsWith('topico_'));
  const themeRooms = rooms.filter(room => room.startsWith('tema_'));
  
  res.json({
    message: "🔌 Sistema WebSocket está operacional",
    status: "active",
    conexoes_ativas: connectionsCount,
    estatisticas_salas: {
      total: rooms.length,
      utilizadores: userRooms.length,
      topicos: topicRooms.length,
      temas: themeRooms.length
    },
    timestamp: new Date().toISOString(),
    test_endpoint: "/api/test/websocket/send"
  });
});

/**
 * Endpoint para testar envio de notificações WebSocket
 * Permite aos administradores testarem o sistema
 */
app.post("/api/test/websocket/send", (req, res) => {
  const { userId, message } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "userId é obrigatório" });
  }
  
  const testMessage = message || "Esta é uma notificação de teste do sistema!";
  
  // Enviar notificação de teste
  io.to(`user_${userId}`).emit('nova_notificacao', {
    titulo: "🧪 Teste de Notificação",
    mensagem: testMessage,
    tipo: "teste",
    data: new Date(),
    isTest: true
  });
  
  res.json({
    message: `Notificação de teste enviada para utilizador ${userId}`,
    timestamp: new Date().toISOString()
  });
});

// Inicialização de agendamentos automáticos (se disponível)
try {
  const schedPath = path.join(__dirname, "src/utils/schedulers.js");
  if (fs.existsSync(schedPath)) {
    const { iniciarAgendamentos } = require(schedPath);
    iniciarAgendamentos();
    console.log("⏰ [SCHEDULER] Agendamentos automáticos iniciados com sucesso");
  } else {
    console.log("ℹ️ [SCHEDULER] Ficheiro de agendamentos não encontrado - funcionalidade opcional");
  }
} catch (error) {
  console.warn(`⚠️ [SCHEDULER] Falha ao iniciar agendamentos: ${error.message}`);
}

/**
 * Servir aplicação React compilada (produção)
 * Suporte para Single Page Application com client-side routing
 */
const clienteBuildPath = path.join(__dirname, "../front/build");

if (fs.existsSync(clienteBuildPath)) {
  console.log(`⚛️ [FRONTEND] Frontend React disponível em: ${clienteBuildPath}`);
  app.use(express.static(clienteBuildPath));

  // Rota catch-all para SPA routing
  app.get("*", (req, res) => {
    // Excluir rotas da API do SPA routing
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return res.status(404).json({ 
        message: "Endpoint não encontrado",
        path: req.path,
        method: req.method
      });
    }
    
    res.sendFile(path.join(clienteBuildPath, "index.html"));
  });
} else {
  console.warn(`⚠️ [FRONTEND] Build do React não encontrada em: ${clienteBuildPath}`);
  console.log(`ℹ️ [FRONTEND] A correr apenas API. Para servir frontend, executa: npm run build`);
  
  // Rota de fallback quando não há frontend
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return res.status(404).json({ message: "Endpoint não encontrado" });
    }
    
    res.json({
      message: "🚀 API da Plataforma de Formação",
      info: "Frontend não disponível. Acede à documentação da API em /api",
      endpoints: [
        "/api - Informações da API",
        "/api/debug/env - Diagnóstico do ambiente",
        "/api/test/websocket - Teste do WebSocket"
      ]
    });
  });
}

/**
 * Middleware global de tratamento de erros
 * Captura erros não tratados e fornece respostas consistentes
 */
app.use((err, req, res, next) => {
  console.error("💥 [ERROR] Erro interno do servidor:", err.message);
  console.error("📍 [ERROR] Stack trace:", err.stack);
  console.error("🌐 [ERROR] URL:", req.url);
  console.error("📝 [ERROR] Método:", req.method);
  
  res.status(500).json({ 
    message: "Erro interno do servidor",
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * Handler para rotas não encontradas (404)
 */
app.use((req, res) => {
  console.warn(`⚠️ [404] Rota não encontrada: ${req.method} ${req.url}`);
  
  res.status(404).json({
    message: "Rota não encontrada",
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: "Verifica a documentação da API em /api"
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`
🚀===========================================
   🎯 Servidor iniciado com sucesso!
   🔢 Porta: ${PORT}
   🏠 Host: ${HOST}
   🌐 API: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api
   🔌 WebSocket: ATIVO (Socket.IO)
   🔔 Notificações: TEMPO REAL
   📁 Uploads: ${process.env.CAMINHO_PASTA_UPLOADS}
   📊 Rotas: ${rotasCarregadas.length}/${rotas.length} (${((rotasCarregadas.length / rotas.length) * 100).toFixed(1)}%)
   🌍 Ambiente: ${process.env.NODE_ENV || 'development'}
🚀===========================================
  `);

  // Mostrar IPs disponíveis para ligação
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log('\n🌐 IPs disponíveis para ligação:');
  console.log(`🏠 Local: http://localhost:${PORT}`);
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const addresses = networkInterfaces[interfaceName];
    addresses.forEach((address) => {
      if (address.family === 'IPv4' && !address.internal) {
        console.log(`🌍 Rede (${interfaceName}): http://${address.address}:${PORT}`);
      }
    });
  });
  
  // Informações de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🛠️ Informações de desenvolvimento:');
    console.log(`📡 WebSocket: ws://localhost:${PORT}/socket.io`);
    console.log(`🧪 Teste WebSocket: http://localhost:${PORT}/api/test/websocket`);
    console.log(`🔧 Debug ambiente: http://localhost:${PORT}/api/debug/env`);
  }
  
  console.log('\n🚀===========================================\n');
});

/**
 * Gestão graceful de shutdown
 * Garante encerramento limpo de ligações WebSocket
 */
process.on('SIGTERM', () => {
  console.log('🛑 [SHUTDOWN] SIGTERM recebido, a iniciar shutdown graceful...');
  
  server.close(() => {
    console.log('✅ [SHUTDOWN] Servidor HTTP fechado.');
    
    io.close(() => {
      console.log('✅ [SHUTDOWN] WebSocket fechado.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 [SHUTDOWN] SIGINT recebido (Ctrl+C), a encerrar servidor...');
  
  server.close(() => {
    console.log('✅ [SHUTDOWN] Servidor encerrado com sucesso.');
    process.exit(0);
  });
});

// Capturar erros não tratados para evitar crashes
process.on('uncaughtException', (error) => {
  console.error('💥 [FATAL] Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [FATAL] Promise rejeitada não tratada:', reason);
  console.error('🔍 [FATAL] Promise:', promise);
  process.exit(1);
});