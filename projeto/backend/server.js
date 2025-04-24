const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

// Carregar variáveis de ambiente
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

// Carregar associações do banco de dados
require('./src/database/associations');

// Carregar as rotas principais
carregarRota("./src/routes/users/auth_route", "/api/auth");
carregarRota("./src/routes/users/users_route", "/api/users");


// Servir arquivos estáticos
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(`Diretório de uploads configurado: ${path.join(__dirname, 'uploads')}`);

// Rotas
const rotas = [
  { caminho: "./src/routes/users/areas_route", prefixo: "/api/areas" },
  { caminho: "./src/routes/avaliacoes/avaliacoes_routes", prefixo: "/api/avaliacoes" },
  { caminho: "./src/routes/cursos/curso_categorias_route", prefixo: "/api/categorias" },
  { caminho: "./src/routes/chat/comentarios_routes", prefixo: "/api/comentarios" },
  { caminho: "./src/routes/cursos/cursos_route", prefixo: "/api/cursos" },
  { caminho: "./src/routes/cursos/curso_inscricoes_route", prefixo: "/api/inscricoes" },
  // Conteúdos de cursos
  { caminho: "./src/routes/cursos/curso_topicos_route", prefixo: "/api/topicos-curso" },
  { caminho: "./src/routes/cursos/curso_pastas_route", prefixo: "/api/pastas-curso" },
  { caminho: "./src/routes/cursos/curso_conteudos_route", prefixo: "/api/conteudos-curso" },
  // Resto das Rotas
  { caminho: "./src/routes/trabalhos/trabalhos_route", prefixo: "/api/trabalhos" },
  { caminho: "./src/routes/certificados/certificado_routes", prefixo: "/api/certificados" },
  { caminho: "./src/routes/notificacoes/notificacoes_route", prefixo: "/api/notificacoes" },
  { caminho: "./src/routes/quiz/quiz_route", prefixo: "/api/quiz" },
  { caminho: "./src/routes/mailing/mailing_route", prefixo: "/api/mailing" },
  { caminho: "./src/routes/ocorrencias/ocorrencias_route", prefixo: "/api/ocorrencias" },
  { caminho: "./src/routes/cursos/tipos_conteudo_route", prefixo: "/api/tipos-conteudo" },
  { caminho: "./src/routes/chat/chat_routes", prefixo: "/api/chat" },
  { caminho: "./src/routes/cursos/curso_inscricao_cancelada_route", prefixo: "/api/inscricoes-canceladas" },
  { caminho: "./src/routes/users/formadores_route", prefixo: "/api/formadores" }
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