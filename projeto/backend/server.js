require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

/**
 * Configuração e inicialização do servidor Express
 * 
 * Este servidor fornece uma API REST completa para a plataforma de formação,
 * incluindo funcionalidades de WebSocket para comunicação em tempo real,
 * gestão de uploads de ficheiros e autenticação baseada em JWT.
 */

// Banner de inicialização
console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
console.log("║                    🚀 PLATAFORMA DE FORMAÇÃO - SERVER STARTUP                ║");
console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
console.log("");

// Informações do ambiente
console.log("📋 CONFIGURAÇÃO DO SERVIDOR:");
console.log(`   • Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`   • Porta: ${process.env.PORT || 4000}`);
console.log(`   • Host: ${process.env.HOST || '0.0.0.0'}`);
console.log(`   • Pasta de uploads: ${process.env.CAMINHO_PASTA_UPLOADS || 'uploads'}`);
console.log(`   • JWT configurado: ${process.env.JWT_SECRET ? '✅' : '❌'}`);
console.log(`   • Base de dados configurada: ${(process.env.DB_HOST || process.env.DATABASE_URL) ? '✅' : '❌'}`);
console.log(`   • Email configurado: ${(process.env.EMAIL_USER && process.env.EMAIL_PASS) ? '✅' : '❌'}`);
console.log("");

// Configuração base do servidor Express e HTTP
const app = express();
const server = http.createServer(app);

// Garantir configuração da pasta de uploads
if (!process.env.CAMINHO_PASTA_UPLOADS) {
  process.env.CAMINHO_PASTA_UPLOADS = 'uploads';
}

// Configuração de middleware para uploads e garantir que as pastas existem
console.log("📁 A configurar middleware de uploads...");
const uploadUtils = require("./src/middleware/upload");
uploadUtils.ensureBaseDirs();
console.log("✅ Middleware de uploads configurado");
console.log("");

/**
 * Configuração do Socket.IO para comunicação em tempo real
 * 
 * Funcionalidades suportadas:
 * - Notificações instantâneas para utilizadores
 * - Chat em tempo real para discussões de cursos
 * - Atualizações automáticas de estado de inscrições
 * - Notificações de novos conteúdos e avaliações
 */
console.log("🔌 A configurar WebSocket (Socket.IO)...");
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
 * Valida o token JWT antes de permitir ligação via socket
 * 
 * @param {Socket} socket - Instância do socket do cliente
 * @param {Function} next - Callback para continuar ou rejeitar a ligação
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
 * Organiza utilizadores em salas específicas para:
 * - Notificações pessoais (user_${userId})
 * - Discussões de tópicos (topico_${topicoId})
 * - Fóruns temáticos (tema_${temaId})
 */
io.on("connection", (socket) => {
  const userId = socket.user ? socket.user.id_utilizador || socket.user.id : 'anónimo';

  // Adicionar utilizador à sua sala pessoal para notificações dirigidas
  if (userId !== 'anónimo') {
    socket.join(`user_${userId}`);
    socket.emit('connection_success', {
      message: 'Ligado com sucesso ao sistema de notificações',
      userId: userId,
      timestamp: new Date()
    });
  }

  // Gestão de salas de tópicos para discussões de cursos
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

  // Gestão de salas de temas do fórum geral
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

  // Teste de conectividade e diagnóstico
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

  // Gestão automática de desconexão (limpeza automática de salas)
  socket.on("disconnect", (reason) => {
    // Socket.IO limpa automaticamente as salas na desconexão
  });

  socket.on("error", (error) => {
    // Log apenas essencial para diagnóstico
  });
});

console.log("✅ WebSocket configurado com autenticação JWT");
console.log("");

/**
 * Configuração CORS permissiva para desenvolvimento
 * Em produção, deve ser restringida a domínios específicos
 */
console.log("🌐 A configurar CORS...");
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
 * Permite que qualquer controlador envie notificações em tempo real
 */
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configuração para suporte a ficheiros grandes (uploads de vídeos/documentos)
app.use(express.json({ limit: '15GB' }));
app.use(express.urlencoded({ extended: true, limit: '15GB' }));
server.timeout = 3600000; // Timeout de 1 hora para uploads grandes

console.log("✅ CORS e middleware configurados");
console.log("✅ Suporte para uploads grandes ativado (até 15GB)");
console.log("");

/**
 * Carregamento dinâmico e seguro de rotas
 * 
 * Funcionalidades de segurança:
 * - Verificação de existência de ficheiros
 * - Validação de rotas funcionais
 * - Criação de fallbacks para serviços indisponíveis
 * - Limpeza de cache para hot-reload em desenvolvimento
 * 
 * @param {string} caminho - Caminho para o ficheiro da rota
 * @param {string} prefixo - Prefixo URL da rota na API
 * @returns {object} - Resultado do carregamento com detalhes
 */
function carregarRota(caminho, prefixo) {
  try {
    const rotaPath = path.resolve(caminho);

    // Verificar existência do ficheiro da rota
    if (!fs.existsSync(`${rotaPath}.js`)) {
      console.log(`❌ Rota não encontrada: ${prefixo} (${caminho}.js)`);
      // Criar rota de fallback para serviço indisponível
      app.use(prefixo, (req, res) =>
        res.status(503).json({ 
          message: "Serviço temporariamente indisponível",
          service: prefixo 
        })
      );
      return { sucesso: false, erro: "Ficheiro não encontrado" };
    }

    // Limpar cache para permitir hot-reload em desenvolvimento
    delete require.cache[require.resolve(rotaPath)];
    const rota = require(rotaPath);
    
    // Validar se é uma rota válida do Express
    if (!rota || typeof rota !== "function") {
      console.log(`❌ Rota mal configurada: ${prefixo} (não é uma função válida)`);
      app.use(prefixo, (req, res) =>
        res.status(503).json({ 
          message: "Rota mal configurada",
          service: prefixo 
        })
      );
      return { sucesso: false, erro: "Rota inválida" };
    }

    // Registar rota funcional no Express
    app.use(prefixo, rota);
    console.log(`✅ Rota carregada: ${prefixo}`);
    return { sucesso: true };
    
  } catch (error) {
    console.log(`❌ Erro ao carregar rota: ${prefixo} - ${error.message}`);
    app.use(prefixo, (req, res) =>
      res.status(503).json({ 
        message: "Erro ao carregar rota",
        service: prefixo,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Definição de todas as rotas do sistema
 * Organizadas por área de responsabilidade e funcionalidade
 */
const rotas = [
  // Painel de controlo e estatísticas administrativas
  { caminho: "./src/routes/dashboard/dashboard_route", prefixo: "/api/dashboard" },

  // Sistema de autenticação e gestão de utilizadores
  { caminho: "./src/routes/users/auth_route", prefixo: "/api/auth" },
  { caminho: "./src/routes/users/users_route", prefixo: "/api/users" },
  { caminho: "./src/routes/users/areas_route", prefixo: "/api/areas-utilizador" },
  { caminho: "./src/routes/users/formadores_route", prefixo: "/api/formadores" },
  { caminho: "./src/routes/users/presencas_route", prefixo: "/api/presencas" },
  { caminho: "./src/routes/users/Percurso_Formandos_routes", prefixo: "/api/percurso-formandos" },

  // Sistema de cursos com notificações em tempo real
  { caminho: "./src/routes/cursos/curso_categorias_route", prefixo: "/api/categorias" },
  { caminho: "./src/routes/areas/areas_route", prefixo: "/api/areas" },
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

  // Serviços especializados e integrações
  { caminho: "./src/routes/certificados/certificado_routes", prefixo: "/api/certificados" },
  { caminho: "./src/routes/mailing/mailing_route", prefixo: "/api/mailing" },
  { caminho: "./src/routes/notificacoes/notificacoes_route", prefixo: "/api/notificacoes" },
];

// Carregar associações da base de dados antes de inicializar rotas
console.log("🔗 A carregar associações da base de dados...");
try {
  require("./src/database/associations");
  console.log("✅ Associações da base de dados carregadas com sucesso");
} catch (error) {
  console.log(`❌ Erro ao carregar associações: ${error.message}`);
}
console.log("");

// Processar carregamento de todas as rotas do sistema
console.log("🛣️  A CARREGAR ROTAS DO SISTEMA:");
console.log("─".repeat(80));

const resultadosRotas = rotas.map(({ caminho, prefixo }) => ({
  prefixo,
  resultado: carregarRota(caminho, prefixo)
}));

const rotasCarregadas = resultadosRotas.filter(r => r.resultado.sucesso);
const rotasFalhadas = resultadosRotas.filter(r => !r.resultado.sucesso);

console.log("");
console.log("📊 RESUMO DO CARREGAMENTO DE ROTAS:");
console.log(`   • Total de rotas: ${rotas.length}`);
console.log(`   • Carregadas com sucesso: ${rotasCarregadas.length}`);
console.log(`   • Falhadas: ${rotasFalhadas.length}`);
console.log(`   • Taxa de sucesso: ${((rotasCarregadas.length / rotas.length) * 100).toFixed(1)}%`);

if (rotasFalhadas.length > 0) {
  console.log("");
  console.log("⚠️  ROTAS COM PROBLEMAS:");
  rotasFalhadas.forEach(({ prefixo, resultado }) => {
    console.log(`   • ${prefixo}: ${resultado.erro}`);
  });
}

console.log("");

// Configuração de ficheiros estáticos
console.log("📁 A configurar servir de ficheiros estáticos...");
console.log(`   • Pasta de uploads: /${process.env.CAMINHO_PASTA_UPLOADS}`);
console.log(`   • API uploads: /api/uploads`);

// Servir ficheiros estáticos de uploads (imagens, documentos, vídeos)
app.use("/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));
app.use("/api/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));

console.log("✅ Ficheiros estáticos configurados");
console.log("");

/**
 * Rota principal da API com informações de estado e diagnóstico
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
 * Diagnóstico do sistema WebSocket
 * Fornece estatísticas de ligações e salas activas
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
 * Permite verificar se as notificações chegam aos utilizadores
 */
app.post("/api/test/websocket/send", (req, res) => {
  const { userId, message } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "userId é obrigatório" });
  }
  
  const testMessage = message || "Esta é uma notificação de teste do sistema!";
  
  // Enviar notificação de teste para o utilizador específico
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
console.log("⏰ A verificar agendamentos automáticos...");
try {
  const schedPath = path.join(__dirname, "src/utils/schedulers.js");
  if (fs.existsSync(schedPath)) {
    const { iniciarAgendamentos } = require(schedPath);
    iniciarAgendamentos();
    console.log("✅ Agendamentos automáticos iniciados");
  } else {
    console.log("ℹ️  Ficheiro de agendamentos não encontrado - a continuar sem agendamentos");
  }
} catch (error) {
  console.log(`❌ Erro ao iniciar agendamentos: ${error.message}`);
}
console.log("");

/**
 * Servir aplicação React compilada em produção
 * Suporte completo para Single Page Application com client-side routing
 */
const clienteBuildPath = path.join(__dirname, "../front/build");

console.log("🌐 A verificar frontend React...");
if (fs.existsSync(clienteBuildPath)) {
  console.log(`✅ Frontend encontrado em: ${clienteBuildPath}`);
  console.log("🔧 A configurar routing SPA...");
  
  app.use(express.static(clienteBuildPath));

  // Rota catch-all para SPA routing - todas as rotas não-API servem o React
  app.get("*", (req, res) => {
    // Excluir rotas da API e uploads do SPA routing
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return res.status(404).json({ 
        message: "Endpoint não encontrado",
        path: req.path,
        method: req.method
      });
    }
    
    res.sendFile(path.join(clienteBuildPath, "index.html"));
  });
  
  console.log("✅ Frontend React configurado com SPA routing");
} else {
  console.log("⚠️  Frontend React não encontrado - apenas API disponível");
  console.log(`   Procurado em: ${clienteBuildPath}`);
  
  // Rota de fallback quando não há frontend compilado
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
console.log("");

/**
 * Middleware global de tratamento de erros
 * Captura todos os erros não tratados e fornece respostas consistentes
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
 * Fornece informações úteis sobre o erro de rota
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

console.log("🚀 A INICIAR SERVIDOR...");
console.log("─".repeat(80));

server.listen(PORT, HOST, () => {
  const currentTime = new Date().toLocaleString('pt-PT', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                          ✅ SERVIDOR INICIADO COM SUCESSO                    ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("🌐 INFORMAÇÕES DE ACESSO:");
  console.log(`   • URL Local: http://localhost:${PORT}`);
  console.log(`   • URL Rede: http://${HOST}:${PORT}`);
  console.log(`   • API Docs: http://localhost:${PORT}/api`);
  console.log(`   • WebSocket: ws://localhost:${PORT}/socket.io`);
  console.log("");
  console.log("📊 ESTATÍSTICAS:");
  console.log(`   • Rotas carregadas: ${rotasCarregadas.length}/${rotas.length}`);
  console.log(`   • WebSocket ativo: ✅`);
  console.log(`   • Frontend React: ${fs.existsSync(clienteBuildPath) ? '✅' : '❌'}`);
  console.log(`   • Uploads configurados: ✅`);
  console.log("");
  console.log("🕐 INICIADO EM:", currentTime);
  console.log("");
  console.log("🔧 ENDPOINTS ÚTEIS:");
  console.log("   • GET  /api                    - Informações da API");
  console.log("   • GET  /api/debug/env          - Diagnóstico do ambiente");
  console.log("   • GET  /api/test/websocket     - Teste do WebSocket");
  console.log("   • POST /api/test/websocket/send - Enviar notificação teste");
  console.log("");
  console.log("💡 NOTA: O servidor está pronto para aceitar ligações!");
  console.log("═".repeat(80));
});

/**
 * Gestão graceful de shutdown
 * Garante encerramento limpo de ligações WebSocket e HTTP
 */
process.on('SIGTERM', () => {
  console.log('\n🛑 Sinal SIGTERM recebido. A encerrar servidor graciosamente...');
  server.close(() => {
    console.log('📡 Servidor HTTP encerrado');
    io.close(() => {
      console.log('🔌 Ligações WebSocket encerradas');
      console.log('✅ Shutdown completo');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Sinal SIGINT recebido (Ctrl+C). A encerrar servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

// Capturar erros críticos para evitar crashes inesperados
process.on('uncaughtException', (error) => {
  console.log('💥 Erro crítico não capturado:', error.message);
  console.log('🔄 A reiniciar servidor...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('⚠️  Promise rejeitada não tratada:', reason);
  console.log('🔄 A reiniciar servidor...');
  process.exit(1);
});