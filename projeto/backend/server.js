const express = require("express");
const cors = require("cors");
require("dotenv").config();

const usersRoutes = require("./src/routes/users");

const app = express();
app.use(cors());
app.use(express.json());

// Definir rotas
app.use("/api", usersRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor aberto na porta ${PORT}`));
