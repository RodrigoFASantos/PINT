const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Importar todas as rotas
const usersRoutes = require("./src/routes/users");
const userImageRoutes = require('./src/routes/users_imagens');
const areasRoutes = require("./src/routes/areas");
const avaliacoesRoutes = require("./src/routes/avaliacoes");
const categoriasRoutes = require("./src/routes/categorias");
const comentariosRoutes = require("./src/routes/comentarios");
const conteudosRoutes = require("./src/routes/conteudos");
const cursosRoutes = require("./src/routes/cursos");
const inscricoesRoutes = require("./src/routes/inscricoes");
const topicosRoutes = require("./src/routes/topicos");
const trabalhosRoutes = require("./src/routes/trabalhos");



app.use(cors());
app.use(express.json());

// Definir todas as rotas com prefixo /api
app.use("/api/users", usersRoutes);
app.use('/api/users/img', userImageRoutes);
app.use('/uploads', express.static('uploads'));
app.use("/api/areas", areasRoutes);
app.use("/api/avaliacoes", avaliacoesRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/comentarios", comentariosRoutes);
app.use("/api/conteudos", conteudosRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/inscricoes", inscricoesRoutes);
app.use("/api/topicos", topicosRoutes);
app.use("/api/trabalhos", trabalhosRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor aberto na porta ${PORT}`));
