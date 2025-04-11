const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const app = express();

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
        const rota = require(caminho);
        app.use(prefixo, rota);
        console.log(`✅ Rota carregada: ${prefixo}`);
        return true;
    } catch (error) {
        console.warn(`⚠️ Não foi possível carregar a rota ${prefixo}:`, error.message);
        // Para rotas essenciais, podemos criar uma rota simples que retorna erro 503
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

// Verificar se o arquivo de configuração do banco de dados existe
if (!fs.existsSync("./config/db.js")) {
    console.log("Criar arquivo de configuração do banco de dados...");
    const configDbConteudo = `const { Sequelize } = require("sequelize");
  require("dotenv").config();
  
  const sequelize = new Sequelize(
    process.env.DB_DATABASE, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD, 
    {
      host: process.env.DB_HOST,
      dialect: "postgres", 
      port: process.env.DB_PORT || 5432,
      logging: false,
    }
  );
  
  // Função para testar a conexão com o banco de dados
  const testConnection = async () => {
    try {
      await sequelize.authenticate();
      console.log('Conexão com o banco de dados estabelecida com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao conectar ao banco de dados:', error);
      return false;
    }
  };
  
  // Mantém a compatibilidade com código existente
  // Exportamos o sequelize diretamente como o módulo padrão
  module.exports = sequelize;
  
  // E também exportamos as funções auxiliares como propriedades
  module.exports.testConnection = testConnection;
  module.exports.sequelize = sequelize;`;
  
    fs.writeFileSync("./config/db.js", configDbConteudo);
  }

// Rota raiz para verificar se o servidor está respondendo
app.get("/api", (req, res) => {
    res.json({ message: "API está funcionando!" });
});

// Carregar todas as rotas essenciais
carregarRota("./src/routes/users", "/api/users");
// Removemos a linha abaixo, pois agora as funcionalidades de imagens estão integradas em users.js
// carregarRota("./src/routes/users_imagens", "/api/users/img");

// Servir arquivos estáticos
app.use('/uploads', express.static('uploads'));

// Carregar outras rotas não essenciais
const rotas = [
    { caminho: "./src/routes/areas", prefixo: "/api/areas" },
    { caminho: "./src/routes/avaliacoes", prefixo: "/api/avaliacoes" },
    { caminho: "./src/routes/categorias", prefixo: "/api/categorias" },
    { caminho: "./src/routes/comentarios", prefixo: "/api/comentarios" },
    { caminho: "./src/routes/conteudos", prefixo: "/api/conteudos" },
    { caminho: "./src/routes/cursos", prefixo: "/api/cursos" },
    { caminho: "./src/routes/inscricoes", prefixo: "/api/inscricoes" },
    { caminho: "./src/routes/topicos", prefixo: "/api/topicos" },
    { caminho: "./src/routes/trabalhos", prefixo: "/api/trabalhos" },
    { caminho: "./src/routes/certificados", prefixo: "/api/certificados" },
    { caminho: "./src/routes/notificacoes", prefixo: "/api/notificacoes" },
    { caminho: "./src/routes/quiz", prefixo: "/api/quiz" },
    { caminho: "./src/routes/mailing", prefixo: "/api/mailing" },
    { caminho: "./src/routes/ocorrencias", prefixo: "/api/ocorrencias" },
    { caminho: "./src/routes/tipos_conteudo", prefixo: "/api/tipos-conteudo" }
];

rotas.forEach(rota => {
    carregarRota(rota.caminho, rota.prefixo);
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



// Middleware para listar todas as rotas disponíveis
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log(r.route.path)
    }
});



// Iniciar o servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`
  ===========================================
  🚀 Servidor iniciado com sucesso!
  📡 Porta: ${PORT}
  🌐 URL: http://localhost:${PORT}/api
  ===========================================
  `);
});