require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

/**
 * Servidor Express principal da plataforma de formação
 * 
 * Fornece uma API REST completa com funcionalidades de WebSocket
 * para comunicação em tempo real, gestão de uploads e autenticação JWT.
 */

// Configuração base do servidor
const app = express();
const server = http.createServer(app);

// Garantir configuração da pasta de uploads
if (!process.env.CAMINHO_PASTA_UPLOADS) {
  process.env.CAMINHO_PASTA_UPLOADS = 'uploads';
}

// Configuração de uploads e garantir que as pastas existem
const uploadUtils = require("./src/middleware/upload");
uploadUtils.ensureBaseDirs();

/**
 * Configuração do Socket.IO para comunicação em tempo real
 * 
 * Funcionalidades:
 * - Notificações instantâneas
 * - Chat em tempo real
 * - Actualizações automáticas de estado
 * - Notificações de novos conteúdos
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
 * Valida o token JWT antes de permitir ligação
 * 
 * @param {Socket} socket - Instância do socket do cliente
 * @param {Function} next - Callback para continuar ou rejeitar
 */
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) {
    return next(new Error("Autenticação necessária"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Token inválido"));
  }
});

/**
 * Gestão principal de ligações WebSocket
 * 
 * Organiza utilizadores em salas para:
 * - Notificações pessoais (user_${userId})
 * - Discussões de tópicos (topico_${topicoId})
 * - Fóruns temáticos (tema_${temaId})
 */
io.on("connection", (socket) => {
  const userId = socket.user ? socket.user.id_utilizador || socket.user.id : 'anónimo';

  // Adicionar utilizador à sua sala pessoal
  if (userId !== 'anónimo') {
    socket.join(`user_${userId}`);
    socket.emit('connection_success', {
      message: 'Ligado com sucesso ao sistema de notificações',
      userId: userId,
      timestamp: new Date()
    });
  }

  // Gestão de salas de tópicos para discussões
  socket.on("joinTopic", (topicoId) => {
    if (!topicoId) return;
    socket.join(`topico_${topicoId}`);
    socket.emit('topic_joined', {
      topicoId: topicoId,
      message: `Juntaste-te ao tópico ${topicoId}`
    });
  });

  socket.on("leaveTopic", (topicoId) => {
    if (!topicoId) return;
    socket.leave(`topico_${topicoId}`);
    socket.emit('topic_left', {
      topicoId: topicoId,
      message: `Saíste do tópico ${topicoId}`
    });
  });

  // Gestão de salas de temas do fórum
  socket.on("joinTema", (temaId) => {
    if (!temaId) return;
    socket.join(`tema_${temaId}`);
    socket.emit('tema_joined', {
      temaId: temaId,
      message: `Juntaste-te ao tema ${temaId}`
    });
  });

  socket.on("leaveTema", (temaId) => {
    if (!temaId) return;
    socket.leave(`tema_${temaId}`);
    socket.emit('tema_left', {
      temaId: temaId,
      message: `Saíste do tema ${temaId}`
    });
  });

  // Teste de conectividade
  socket.on("ping", () => {
    socket.emit("pong", { 
      message: "Ligação WebSocket activa e funcional",
      userId: userId,
      timestamp: new Date(),
      responseTime: Date.now()
    });
  });

  // Sistema de teste para notificações
  socket.on("test_notification", (data) => {
    socket.emit("nova_notificacao", {
      titulo: "🧪 Teste de Notificação",
      mensagem: "Esta é uma notificação de teste. O sistema está a funcionar correctamente!",
      tipo: "teste",
      data: new Date(),
      isTest: true
    });
  });
});

/**
 * Configuração CORS permissiva
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
 * Disponibilizar instância Socket.IO em todas as rotas
 * Permite que qualquer controlador envie notificações em tempo real
 */
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configuração para ficheiros grandes (uploads de vídeos/documentos)
app.use(express.json({ limit: '15GB' }));
app.use(express.urlencoded({ extended: true, limit: '15GB' }));
server.timeout = 3600000; // Timeout de 1 hora

/**
 * Carregamento dinâmico e seguro de rotas
 * 
 * Funcionalidades:
 * - Verificação de existência de ficheiros
 * - Validação de rotas funcionais
 * - Criação de fallbacks para serviços indisponíveis
 * - Limpeza de cache para hot-reload
 * 
 * @param {string} caminho - Caminho para o ficheiro da rota
 * @param {string} prefixo - Prefixo URL da rota na API
 * @returns {boolean} - True se a rota foi carregada com sucesso
 */
function carregarRota(caminho, prefixo) {
  try {
    const rotaPath = path.resolve(caminho);

    // Verificar existência do ficheiro
    if (!fs.existsSync(`${rotaPath}.js`)) {
      // Criar rota de fallback
      app.use(prefixo, (req, res) =>
        res.status(503).json({ 
          message: "Serviço temporariamente indisponível",
          service: prefixo 
        })
      );
      return false;
    }

    // Limpar cache para hot-reload
    delete require.cache[require.resolve(rotaPath)];
    const rota = require(rotaPath);
    
    // Validar se é uma rota válida
    if (!rota || typeof rota !== "function") {
      app.use(prefixo, (req, res) =>
        res.status(503).json({ 
          message: "Rota mal configurada",
          service: prefixo 
        })
      );
      return false;
    }

    // Registar rota funcional
    app.use(prefixo, rota);
    return true;
    
  } catch (error) {
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
 * Organizadas por área de responsabilidade
 */
const rotas = [
  // Painel de controlo e estatísticas
  { caminho: "./src/routes/dashboard/dashboard_route", prefixo: "/api/dashboard" },

  // Sistema de autenticação e utilizadores
  { caminho: "./src/routes/users/auth_route", prefixo: "/api/auth" },
  { caminho: "./src/routes/users/users_route", prefixo: "/api/users" },
  { caminho: "./src/routes/users/areas_route", prefixo: "/api/areas" },
  { caminho: "./src/routes/users/formadores_route", prefixo: "/api/formadores" },
  { caminho: "./src/routes/users/presencas_route", prefixo: "/api/presencas" },
  { caminho: "./src/routes/users/Percurso_Formandos_routes", prefixo: "/api/percurso-formandos" },

  // Sistema de cursos
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

  // Chat, fóruns e comunicação
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

// Carregar associações da base de dados
require("./src/database/associations");

// Processar carregamento de todas as rotas
const rotasCarregadas = rotas.filter(({ caminho, prefixo }) => carregarRota(caminho, prefixo));

// Servir ficheiros estáticos de uploads
app.use("/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));
app.use("/api/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));

/**
 * Rota principal da API com informações de estado
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
 * Diagnóstico do sistema WebSocket
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

// Inicialização de agendamentos automáticos
try {
  const schedPath = path.join(__dirname, "src/utils/schedulers.js");
  if (fs.existsSync(schedPath)) {
    const { iniciarAgendamentos } = require(schedPath);
    iniciarAgendamentos();
  }
} catch (error) {
  // Agendamentos falhados são opcionais
}

/**
 * Servir aplicação React compilada em produção
 */
const clienteBuildPath = path.join(__dirname, "../front/build");

if (fs.existsSync(clienteBuildPath)) {
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
  // Fallback quando não há frontend compilado
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
 */
app.use((err, req, res, next) => {
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
  res.status(404).json({
    message: "Rota não encontrada",
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: "Verifica a documentação da API em /api"
  });
});

/**
 * Inicialização do servidor HTTP com Socket.IO
 */
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  // Servidor iniciado
});

/**
 * Gestão graceful de shutdown
 */
process.on('SIGTERM', () => {
  server.close(() => {
    io.close(() => {
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});

// Capturar erros críticos
process.on('uncaughtException', (error) => {
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
});