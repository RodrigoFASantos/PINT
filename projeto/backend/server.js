// Carregar variáveis de ambiente
require("dotenv").config();

// Importações principais
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

// Inicializar Express
const app = express();

// Criar servidor HTTP
const server = http.createServer(app);

// Garantir que a variável de ambiente do caminho de uploads está definida
if (!process.env.CAMINHO_PASTA_UPLOADS) {
  process.env.CAMINHO_PASTA_UPLOADS = 'uploads';
  console.log('⚠️ Aviso: CAMINHO_PASTA_UPLOADS não definido. A usar o valor padrão: "uploads"');
}

// Importar utilitários de upload
const uploadUtils = require("./src/middleware/upload");

// Configurar Socket.IO
const io = socketIo(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  path: "/socket.io",
});

// Middleware de autenticação do Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error("Autenticação necessária"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Token inválido"));
  }
});

// Eventos do socket
io.on("connection", (socket) => {
  const userId = socket.user ? socket.user.id_utilizador || socket.user.id : 'anónimo';
  console.log(`🔌 Utilizador conectado: ${userId}`);

  socket.on("joinTopic", (topicoId) => {
    socket.join(`topico_${topicoId}`);
    console.log(`📝 ${userId} entrou no tópico ${topicoId}`);
  });

  socket.on("leaveTopic", (topicoId) => {
    socket.leave(`topico_${topicoId}`);
    console.log(`📝 ${userId} saiu do tópico ${topicoId}`);
  });

  socket.on("joinTema", (temaId) => {
    socket.join(`tema_${temaId}`);
    console.log(`💬 ${userId} entrou no tema ${temaId}`);
  });

  socket.on("leaveTema", (temaId) => {
    socket.leave(`tema_${temaId}`);
    console.log(`💬 ${userId} saiu do tema ${temaId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Utilizador desconectado: ${userId}`);
  });
});

// Middlewares globais
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS Origin:', origin);
    callback(null, true); // Permite todas as origens temporariamente
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Middleware para adicionar io a todas as requisições
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware para registar todas as requisições
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Verificar e criar diretórios essenciais
uploadUtils.ensureBaseDirs();

// Carregar associações da base de dados
require("./src/database/associations");

// Limites para requisições grandes como vídeos e apresentações
app.use(express.json({ limit: '15GB' }));
app.use(express.urlencoded({ extended: true, limit: '15GB' }));
server.timeout = 3600000; // 1 hora

// Função utilitária para carregar rotas com segurança
function carregarRota(caminho, prefixo) {
  console.log(`\n🔧 A carregar rota: ${prefixo}`);
  console.log(`📁 Caminho: ${caminho}`);
  
  try {
    const rotaPath = path.resolve(caminho);
    console.log(`🔍 Caminho resolvido: ${rotaPath}`);
    console.log(`📄 Ficheiro esperado: ${rotaPath}.js`);

    if (!fs.existsSync(`${rotaPath}.js`)) {
      console.error(`❌ Ficheiro não encontrado: ${rotaPath}.js`);
      app.use(prefixo, (req, res) =>
        res.status(503).json({ message: "Serviço temporariamente indisponível", error: "Ficheiro de rota não encontrado" })
      );
      return false;
    }
    console.log(`✅ Ficheiro existe: ${rotaPath}.js`);

    console.log(`⏳ A fazer require do ficheiro...`);
    // Limpar cache para garantir carregamento fresco
    delete require.cache[require.resolve(rotaPath)];
    const rota = require(rotaPath);
    console.log(`✅ Require executado com sucesso`);
    
    console.log(`🔍 A verificar rota carregada:`);
    console.log(`🏷️ Tipo da rota: ${typeof rota}`);
    console.log(`🔧 É função: ${typeof rota === "function"}`);
    console.log(`❓ É null: ${rota === null}`);
    console.log(`❓ É undefined: ${rota === undefined}`);
    console.log(`📚 Tem stack: ${!!rota.stack}`);
    
    if (rota && rota.stack) {
      console.log(`📊 Stack length: ${rota.stack.length}`);
      console.log(`📋 Stack é array: ${Array.isArray(rota.stack)}`);
    }

    if (!rota) {
      console.error(`❌ Rota é null/undefined para ${prefixo}`);
      app.use(prefixo, (req, res) =>
        res.status(503).json({ message: "Serviço temporariamente indisponível", error: "Rota é null" })
      );
      return false;
    }

    if (typeof rota !== "function") {
      console.error(`❌ Rota não é função para ${prefixo}`);
      console.error(`🏷️ Tipo actual: ${typeof rota}`);
      app.use(prefixo, (req, res) =>
        res.status(503).json({ message: "Serviço temporariamente indisponível", error: "Rota não é função" })
      );
      return false;
    }

    if (!rota.stack) {
      console.error(`❌ Rota não tem stack para ${prefixo}`);
      app.use(prefixo, (req, res) =>
        res.status(503).json({ message: "Serviço temporariamente indisponível", error: "Rota sem stack" })
      );
      return false;
    }

    console.log(`🔧 A registar rota no Express: app.use('${prefixo}', rota)`);
    
    // Testar antes de registar
    if (typeof app.use !== 'function') {
      console.error(`❌ app.use não é função!`);
      return false;
    }
    
    app.use(prefixo, rota);
    console.log(`✅ Rota registada com sucesso: ${prefixo} (${rotaPath})`);
    console.log(`🏁 Fim do carregamento: ${prefixo}\n`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro ao carregar rota: ${prefixo}`);
    console.error(`💬 Mensagem: ${error.message}`);
    console.error(`📋 Stack: ${error.stack}`);
    console.error(`🏷️ Nome do erro: ${error.name}`);
    console.error(`🏁 Fim do erro: ${prefixo}\n`);
    
    app.use(prefixo, (req, res) =>
      res.status(503).json({ message: "Erro ao carregar rota", details: error.message })
    );
    return false;
  }
}

// Lista de rotas a carregar - Dashboard em primeiro lugar
const rotas = [
  // Dashboard - primeira rota para depuração
  { caminho: "./src/routes/dashboard/dashboard_route", prefixo: "/api/dashboard" },

  // Utilizadores
  { caminho: "./src/routes/users/auth_route", prefixo: "/api/auth" },
  { caminho: "./src/routes/users/users_route", prefixo: "/api/users" },
  { caminho: "./src/routes/users/areas_route", prefixo: "/api/areas" },
  { caminho: "./src/routes/users/formadores_route", prefixo: "/api/formadores" },
  { caminho: "./src/routes/users/presencas_route", prefixo: "/api/presencas" },
  { caminho: "./src/routes/users/Percurso_Formandos_routes", prefixo: "/api/percurso-formandos" },

  // Cursos
  { caminho: "./src/routes/cursos/curso_categorias_route", prefixo: "/api/categorias" },
  { caminho: "./src/routes/cursos/cursos_route", prefixo: "/api/cursos" },
  { caminho: "./src/routes/cursos/associar_cursos_route", prefixo: "/api/associar-cursos" },
  { caminho: "./src/routes/cursos/curso_topicos_route", prefixo: "/api/topicos-curso" },
  { caminho: "./src/routes/cursos/curso_pastas_route", prefixo: "/api/pastas-curso" },
  { caminho: "./src/routes/cursos/curso_conteudos_route", prefixo: "/api/conteudos-curso" },
  { caminho: "./src/routes/cursos/curso_inscricoes_route", prefixo: "/api/inscricoes" },
  { caminho: "./src/routes/cursos/tipos_conteudo_route", prefixo: "/api/tipos-conteudo" },
  { caminho: "./src/routes/quiz/quiz_route", prefixo: "/api/quiz" },

  // Mantém trabalhos genéricos, se ainda precisares
  { caminho: "./src/routes/trabalhos/trabalhos_route", prefixo: "/api/trabalhos" },

  // Avaliação
  { caminho: "./src/routes/avaliacoes/submissoes_route", prefixo: "/api/avaliacoes/submissoes" },
  { caminho: "./src/routes/avaliacoes/avaliar_submissoes_routes", prefixo: "/api/avaliar" },

  // Módulo geral de avaliações se existir
  { caminho: "./src/routes/avaliacoes/avaliacoes_routes", prefixo: "/api/avaliacoes" },

  // Chat e fóruns
  { caminho: "./src/routes/ocorrencias/ocorrencias_route", prefixo: "/api/ocorrencias" },
  { caminho: "./src/routes/chat/chat_routes", prefixo: "/api/chat" },
  { caminho: "./src/routes/chat/Topico_area_routes", prefixo: "/api/topicos-area" },
  { caminho: "./src/routes/chat/Topicos_Chat_routes", prefixo: "/api/forum" },
  { caminho: "./src/routes/chat/Forum_Tema_routes", prefixo: "/api/forum-tema" },
  { caminho: "./src/routes/chat/comentarios_routes", prefixo: "/api/comentarios" },
  { caminho: "./src/routes/chat/denuncias_routes", prefixo: "/api/denuncias" },

  // Outros
  { caminho: "./src/routes/certificados/certificado_routes", prefixo: "/api/certificados" },
  { caminho: "./src/routes/mailing/mailing_route", prefixo: "/api/mailing" },
  { caminho: "./src/routes/notificacoes/notificacoes_route", prefixo: "/api/notificacoes" },
];

// Carregar cada rota e contar as válidas
const rotasCarregadas = rotas.filter(({ caminho, prefixo }) => carregarRota(caminho, prefixo));
console.log(`\n📊 Resumo de carregamento:`);
console.log(`✅ Rotas carregadas: ${rotasCarregadas.length}/${rotas.length}`);
console.log(`❌ Rotas falhadas: ${rotas.length - rotasCarregadas.length}`);

// Verificar especificamente se o dashboard foi carregado
const dashboardCarregado = rotasCarregadas.some(rota => rota.prefixo === "/api/dashboard");
if (dashboardCarregado) {
  console.log(`📊 Dashboard: Carregado com sucesso!`);
} else {
  console.error(`❌ Dashboard: Falha no carregamento!`);
}

// Servir ficheiros estáticos de upload
app.use("/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));
app.use("/api/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));

// Rota raiz da API
app.get("/api", (req, res) => {
  res.json({
    message: "API está a funcionar!",
    version: "1.0.0",
    date: new Date().toISOString(),
    rotas_carregadas: rotasCarregadas.length,
    total_rotas: rotas.length,
    dashboard_ativo: dashboardCarregado
  });
});

// Rota de teste específica para o dashboard
app.get("/api/dashboard/teste-direto", (req, res) => {
  console.log('🧪 [DEBUG] Rota de teste direto do dashboard chamada');
  res.json({ 
    message: "Dashboard a funcionar através da rota direta!",
    timestamp: new Date().toISOString() 
  });
});

// Iniciar agendamentos, se existirem
try {
  const schedPath = path.join(__dirname, "src/utils/schedulers.js");
  if (fs.existsSync(schedPath)) {
    const { iniciarAgendamentos } = require(schedPath);
    iniciarAgendamentos();
    console.log("⏰ Agendamentos iniciados");
  } else {
    console.log("⏰ Módulo de agendamentos não encontrado");
  }
} catch (error) {
  console.warn(`⚠️ Falha ao iniciar agendamentos: ${error.message}`);
}

// Middleware global de erro 
app.use((err, req, res, next) => {
  console.error("💥 Erro interno:", err.stack);
  res.status(500).json({ message: "Erro interno do servidor", error: err.message });
});

// Apenas para depuração - remover depois
app.get("/api/debug/env", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
    JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    DB_CONFIG_EXISTS: !!process.env.DB_HOST || !!process.env.DATABASE_URL,
    CAMINHO_PASTA_UPLOADS: process.env.CAMINHO_PASTA_UPLOADS
  });
});

// Bloco para servir o React em produção

// Caminho para a pasta onde está a build do React
const clienteBuildPath = path.join(__dirname, "../front/build");

// Se a pasta existir, servir todos os ficheiros estáticos dela
if (fs.existsSync(clienteBuildPath)) {
  console.log(`⚛️ Servidor estático do React em: ${clienteBuildPath}`);
  app.use(express.static(clienteBuildPath));

  // Rotas "catch-all": se não for chamado de API nem de arquivos de upload,
  // então devolve o index.html do React para que o React Router trate a rota do lado do cliente.
  app.get("*", (req, res) => {
    // Se a requisição já começar com "/api" ou "/uploads", deixa passar para as rotas anteriores
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return res.status(404).json({ message: "Rota não encontrada" });
    }
    res.sendFile(path.join(clienteBuildPath, "index.html"));
  });
} else {
  console.warn(`⚠️ Não encontrou pasta de build do React em ${clienteBuildPath}. Lembra-te de executar 'npm run build' dentro de front.`);
}

// Iniciar servidor
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // Importante: Aceitar conexões de qualquer IP
server.listen(PORT, HOST, () => {
  console.log(`
🚀===========================================
   🎯 Servidor iniciado com sucesso!
   🔢 Porta: ${PORT}
   🌐 API: http://localhost:${PORT}/api
   🔌 Socket.IO ativo
   📁 Diretório de uploads: ${process.env.CAMINHO_PASTA_UPLOADS}
   📊 Dashboard: ${dashboardCarregado ? '✅ ATIVO' : '❌ INATIVO'}
🚀===========================================
  `);

  // Mostrar IPs disponíveis
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log('\n🌐 IPs disponíveis para acesso:');
  console.log('🏠 Local: http://localhost:' + PORT + '/api');
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const addresses = networkInterfaces[interfaceName];
    addresses.forEach((address) => {
      if (address.family === 'IPv4' && !address.internal) {
        console.log(`🌍 Rede (${interfaceName}): http://${address.address}:${PORT}/api`);
      }
    });
  });
  console.log('🚀===========================================\n');

  if (dashboardCarregado) {
    console.log(`
🧪 Testa o Dashboard:
   📊 http://localhost:${PORT}/api/dashboard/teste
   📈 http://localhost:${PORT}/api/dashboard/estatisticas
    `);
  }
});