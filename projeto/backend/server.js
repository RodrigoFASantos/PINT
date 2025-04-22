const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const app = express();

// Criar servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIo(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  path: '/socket.io'
});

// Middleware para autenticação de socket
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

// Gerenciar conexões Socket.IO
io.on("connection", (socket) => {
  console.log(`Usuário conectado: ${socket.user.id}`);
  
  // Juntar-se a uma sala de tópico específico
  socket.on("joinTopic", (topicoId) => {
    socket.join(`topico_${topicoId}`);
    console.log(`Usuário ${socket.user.id} entrou no tópico ${topicoId}`);
  });
  
  // Sair de uma sala de tópico
  socket.on("leaveTopic", (topicoId) => {
    socket.leave(`topico_${topicoId}`);
    console.log(`Usuário ${socket.user.id} saiu do tópico ${topicoId}`);
  });
  
  // Lidar com desconexão
  socket.on("disconnect", () => {
    console.log(`Usuário desconectado: ${socket.user.id}`);
  });
});

// Middleware para adicionar io ao req em cada requisição
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configuração CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Função para carregar rotas com tratamento de erro
function carregarRota(caminho, prefixo) {
  try {
    console.log(`Tentando carregar rota: ${caminho} -> ${prefixo}`);
    const rota = require(caminho);
    
    // Validar se o módulo exportado é um router do Express
    if (!rota || typeof rota !== 'function' || !rota.stack) {
      console.warn(`⚠️ Módulo em ${caminho} não parece ser um router Express válido`);
      app.use(prefixo, (req, res) => {
        res.status(503).json({
          message: "Serviço temporariamente indisponível",
          details: "Módulo de rota inválido"
        });
      });
      return false;
    }
    
    app.use(prefixo, rota);
    console.log(`✅ Rota carregada: ${prefixo}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Não foi possível carregar a rota ${prefixo}:`, error.message);
    app.use(prefixo, (req, res) => {
      res.status(503).json({
        message: "Serviço temporariamente indisponível",
        details: `Não foi possível carregar o módulo: ${error.message}`
      });
    });
    return false;
  }
}

// Verificar e criar diretórios essenciais
const diretoriosEssenciais = [
  "./uploads",
  "./uploads/cursos",
  "./uploads/users",
  "./uploads/chat", // Adicionar diretório para arquivos do chat
  "./public",
  "./public/fonts",
  "./config"
];

diretoriosEssenciais.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Criar diretório: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Carregar as rotas principais
carregarRota("./src/routes/auth", "/api/auth");
carregarRota("./src/routes/users", "/api/users");

// Servir arquivos estáticos
app.use('/api/uploads', express.static('uploads'));
app.use('/uploads', express.static('uploads'));

// Rotas
const rotas = [
  { caminho: "./src/routes/areas", prefixo: "/api/areas" },
  { caminho: "./src/routes/avaliacoes", prefixo: "/api/avaliacoes" },
  { caminho: "./src/routes/categorias", prefixo: "/api/categorias" },
  { caminho: "./src/routes/comentarios", prefixo: "/api/comentarios" },
  { caminho: "./src/routes/cursos", prefixo: "/api/cursos" },
  { caminho: "./src/routes/inscricoes", prefixo: "/api/inscricoes" },
  // Conteúdos de cursos
  { caminho: "./src/routes/topicos_curso", prefixo: "/api/topicos-curso" },
  { caminho: "./src/routes/pastas_curso", prefixo: "/api/pastas-curso" },
  { caminho: "./src/routes/conteudos_curso", prefixo: "/api/conteudos-curso" },
  // Resto das Rotas
  { caminho: "./src/routes/trabalhos", prefixo: "/api/trabalhos" },
  { caminho: "./src/routes/certificados", prefixo: "/api/certificados" },
  { caminho: "./src/routes/notificacoes", prefixo: "/api/notificacoes" },
  { caminho: "./src/routes/quiz", prefixo: "/api/quiz" },
  { caminho: "./src/routes/mailing", prefixo: "/api/mailing" },
  { caminho: "./src/routes/ocorrencias", prefixo: "/api/ocorrencias" },
  { caminho: "./src/routes/tipos_conteudo", prefixo: "/api/tipos-conteudo" },
  { caminho: "./src/routes/chatRoutes", prefixo: "/api/chat" },
  { caminho: "./src/routes/inscricaoCursoCancelada", prefixo: "/api/inscricoes-canceladas" }
];

rotas.forEach(rota => {
  carregarRota(rota.caminho, rota.prefixo);
});

// Rota raiz para verificar se o servidor está respondendo
app.get("/api", (req, res) => {
  res.json({ message: "API está funcionando!" });
});

// Tentar iniciar agendamentos, se disponível
try {
  const { iniciarAgendamentos } = require("./src/utils/schedulers");
  iniciarAgendamentos();
  console.log("✅ Agendamentos iniciados com sucesso!");
} catch (error) {
  console.warn("⚠️ Não foi possível iniciar agendamentos:", error.message);
}

// Middleware para tratar erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erro interno do servidor", error: err.message });
});

// Iniciar o servidor usando o server HTTP para Socket.IO
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`
===========================================
🚀 Servidor iniciado com sucesso!
📡 Porta: ${PORT}
🌐 URL: http://localhost:${PORT}/api
🔌 Socket.IO ativo
===========================================
  `);
});