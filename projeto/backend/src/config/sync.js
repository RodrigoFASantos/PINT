const sequelize = require("../config/db");

// Models
const User = require("../database/models/User");
const Cargo = require("../database/models/Cargo");
const Categoria = require("../database/models/Categoria");
const Area = require("../database/models/Area");
const Curso = require("../database/models/Curso");
const Conteudo = require("../database/models/Conteudo");
const Inscricao_Curso = require("../database/models/Inscricao_Curso");
const Topico_Categoria = require("../database/models/Topico_Categoria");
const Comentario_Topico = require("../database/models/Comentario_Topico");
const Trabalho_Entregue = require("../database/models/Trabalho_Entregue");
const Avaliacao = require("../database/models/Avaliacao");

(async () => {
  try {
    await sequelize.sync({ alter: true }); // Atualiza a estrutura sem perder dados
    console.log("Base de dados sincronizada!");
    process.exit();
  } catch (error) {
    console.error("Erro ao sincronizar base de dados:", error);
    process.exit(1);
  }
})();
