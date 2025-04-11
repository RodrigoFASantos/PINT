const express = require("express");
const router = express.Router();
const verificarToken = require('../middleware/auth');
const { getAllUsers, getFormadores, getFormandos, getGestores, createUser, loginUser, perfilUser, updatePerfilUser, changePassword } = require("../controllers/users_ctrl");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuração do upload para imagens de usuários
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/users/");
  },
  filename: (req, file, cb) => {
    // Usar o email do usuário como nome do arquivo (convertendo para slug)
    // Aqui vamos assumir que o email estará disponível em req.user após a autenticação
    const email = req.user && req.user.email 
      ? req.user.email.toLowerCase().replace(/@/g, "-at-").replace(/\./g, "-dot-")
      : Date.now(); // Fallback para timestamp se não houver email

    // Determinar o tipo de imagem (perfil ou capa)
    const tipoImagem = req.body.tipo === "capa" ? "capa" : "perfil";
    
    // Verificar se já existe um arquivo com esse nome e removê-lo
    const filename = `${email}-${tipoImagem}.png`;
    const filePath = path.join("uploads/users/", filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    cb(null, filename);
  }
});

// Filtro para aceitar apenas imagens PNG
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens PNG são permitidas!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

// Rota para debug - verificar se o servidor está a responder
router.get("/", (req, res) => {
  res.status(200).json({ message: "API de users está a funcionar!" });
});

// Rotas existentes
router.get("/users", getAllUsers);
router.get("/formadores", getFormadores);
router.get("/formandos", getFormandos);
router.get("/gestores", getGestores);
router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/perfil", verificarToken, perfilUser);
router.put("/perfil", verificarToken, updatePerfilUser);
router.put("/users/change-password", changePassword);

// Rotas de upload de imagens (anteriormente em users_imagens.js)
router.post("/img/perfil", verificarToken, upload.single("imagem"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhuma imagem enviada" });
    }
    
    // Aqui é atualizado o caminho da imagem na BD
    //  Por exemplo:
    // await User.update(
    //   { foto_perfil: req.file.path },
    //   { where: { id_utilizador: req.user.id_utilizador } }
    // );
    
    res.json({ 
      message: "Imagem de perfil atualizada com sucesso",
      path: req.file.path
    });
  } catch (error) {
    console.error("Erro ao fazer upload de imagem de perfil:", error);
    res.status(500).json({ message: "Erro ao processar imagem" });
  }
});

router.post("/img/capa", verificarToken, upload.single("imagem"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhuma imagem enviada" });
    }
        
    res.json({ 
      message: "Imagem de capa atualizada com sucesso",
      path: req.file.path
    });
  } catch (error) {
    console.error("Erro ao fazer upload de imagem de capa:", error);
    res.status(500).json({ message: "Erro ao processar imagem" });
  }
});

module.exports = router;