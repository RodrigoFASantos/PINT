// Carregar variáveis de ambiente
require("dotenv").config();

// Imports principais
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

// Garantir que a variável de ambiente CAMINHO_PASTA_UPLOADS está definida
if (!process.env.CAMINHO_PASTA_UPLOADS) {
  process.env.CAMINHO_PASTA_UPLOADS = 'uploads';
  console.log('⚠️ CAMINHO_PASTA_UPLOADS não definido. Usando o valor padrão: "uploads"');
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
  const userId = socket.user ? socket.user.id_utilizador || socket.user.id : 'anônimo';
  console.log(`⚡ Utilizador conectado: ${userId}`);

  socket.on("joinTopic", (topicoId) => {
    socket.join(`topico_${topicoId}`);
    console.log(`➕ ${userId} entrou no tópico ${topicoId}`);
  });

  socket.on("leaveTopic", (topicoId) => {
    socket.leave(`topico_${topicoId}`);
    console.log(`➖ ${userId} saiu do tópico ${topicoId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Utilizador desconectado: ${userId}`);
  });
});

// Middlewares globais
app.use(cors({
  origin: true,
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

// Middleware para logar todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Verificar e criar diretórios essenciais
uploadUtils.ensureBaseDirs();

// Carregar associações da base de dados
require("./src/database/associations");


// Limites para requisições grandes
app.use(express.json({ limit: '15GB' }));
app.use(express.urlencoded({ extended: true, limit: '15GB' }));
server.timeout = 3600000; // 1 hora




// Função utilitária para carregar rotas com segurança
function carregarRota(caminho, prefixo) {
  try {
    const rotaPath = path.resolve(caminho);
    
    if (!fs.existsSync(`${rotaPath}.js`)) {
      console.warn(`⚠️ Arquivo não encontrado: ${rotaPath}.js`);
      app.use(prefixo, (req, res) =>
        res.status(503).json({ message: "Serviço temporariamente indisponível", error: "Arquivo de rota não encontrado" })
      );
      return false;
    }
    
    const rota = require(rotaPath);
    
    if (!rota || typeof rota !== "function" || !rota.stack) {
      console.warn(`⚠️ Módulo de rota inválido: ${prefixo}`);
      app.use(prefixo, (req, res) =>
        res.status(503).json({ message: "Serviço temporariamente indisponível", error: "Módulo de rota inválido" })
      );
      return false;
    }
    
    app.use(prefixo, rota);
    console.log(`✅ Rota carregada: ${prefixo} (${rotaPath})`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Erro ao carregar rota ${prefixo}: ${error.message}`);
    app.use(prefixo, (req, res) =>
      res.status(503).json({ message: "Erro ao carregar rota", details: error.message })
    );
    return false;
  }
}

// Carregar rotas
const rotas = [
  // Users
  { caminho: "./src/routes/users/auth_route", prefixo: "/api/auth" },
  { caminho: "./src/routes/users/users_route", prefixo: "/api/users" },
  { caminho: "./src/routes/users/areas_route", prefixo: "/api/areas" },
  { caminho: "./src/routes/users/formadores_route", prefixo: "/api/formadores" },

  // Cursos
  { caminho: "./src/routes/cursos/curso_categorias_route", prefixo: "/api/categorias" },
  { caminho: "./src/routes/cursos/cursos_route", prefixo: "/api/cursos" },
  { caminho: "./src/routes/cursos/curso_topicos_route", prefixo: "/api/topicos-curso" },
  { caminho: "./src/routes/cursos/curso_pastas_route", prefixo: "/api/pastas-curso" },
  { caminho: "./src/routes/cursos/curso_conteudos_route", prefixo: "/api/conteudos-curso" },
  { caminho: "./src/routes/cursos/curso_inscricoes_route", prefixo: "/api/inscricoes" },
  { caminho: "./src/routes/cursos/tipos_conteudo_route", prefixo: "/api/tipos-conteudo" },
  { caminho: "./src/routes/quiz/quiz_route", prefixo: "/api/quiz" },
  { caminho: "./src/routes/trabalhos/trabalhos_route", prefixo: "/api/trabalhos" },
  { caminho: "./src/routes/cursos/associar_cursos_route", prefixo: "/api/associar-cursos" },

  // Chat
  { caminho: "./src/routes/chat/Topico_routes", prefixo: "/api/topicos" },
  { caminho: "./src/routes/ocorrencias/ocorrencias_route", prefixo: "/api/ocorrencias" },
  { caminho: "./src/routes/chat/chat_routes", prefixo: "/api/chat" },
  { caminho: "./src/routes/chat/topico_categoria_route", prefixo: "/api/topicos-categoria" },
  { caminho: "./src/routes/chat/Topicos_Chat_routes", prefixo: "/api/forum" },
  { caminho: "./src/routes/chat/comentarios_routes", prefixo: "/api/comentarios" },

  // Resto das Rotas
  { caminho: "./src/routes/certificados/certificado_routes", prefixo: "/api/certificados" },
  { caminho: "./src/routes/mailing/mailing_route", prefixo: "/api/mailing" },
  { caminho: "./src/routes/avaliacoes/avaliacoes_routes", prefixo: "/api/avaliacoes" },
  { caminho: "./src/routes/notificacoes/notificacoes_route", prefixo: "/api/notificacoes" }
];

// Carregar cada rota
const rotasCarregadas = rotas.filter(({ caminho, prefixo }) => carregarRota(caminho, prefixo));
console.log(`\nRotas carregadas: ${rotasCarregadas.length}/${rotas.length}`);

// Servir ficheiros estáticos
app.use("/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));
app.use("/api/uploads", express.static(path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS)));

// Rota raiz
app.get("/api", (req, res) => {
  res.json({ 
    message: "API está funcionando!",
    version: "1.0.0",
    date: new Date().toISOString()
  });
});

// Iniciar agendamentos, se existirem
try {
  if (fs.existsSync(path.join(__dirname, "src/utils/schedulers.js"))) {
    const { iniciarAgendamentos } = require("./src/utils/schedulers");
    iniciarAgendamentos();
    console.log("✅ Agendamentos iniciados");
  } else {
    console.log("⚠️ Módulo de agendamentos não encontrado");
  }
} catch (error) {
  console.warn(`⚠️ Falha ao iniciar agendamentos: ${error.message}`);
}

// Middleware global de erro
app.use((err, req, res, next) => {
  console.error("❗ Erro interno:", err.stack);
  res.status(500).json({ message: "Erro interno do servidor", error: err.message });
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`
===========================================
🚀 Servidor iniciado com sucesso!
📡 Porta: ${PORT}
🌐 API: http://localhost:${PORT}/api
🔌 Socket.IO ativo
📂 Diretório de uploads: ${process.env.CAMINHO_PASTA_UPLOADS}
===========================================
  `);
});