const express = require("express");
const router = express.Router({ mergeParams: true });
const authMiddleware = require("../../middleware/auth");
const { getAllComentarios, createComentario, avaliarComentario, denunciarComentario } = require("../../controllers/chat/comentarios_ctrl");
const { upload } = require("../../middleware/upload"); 

// Rotas para comentários

router.use(authMiddleware);
router.get("/", getAllComentarios);
router.post("/", upload.single('anexo'), createComentario);

// Rota para avaliar comentários (likes/dislikes)
router.post("/:idComentario/avaliar", avaliarComentario);

// Rota para denunciar comentários
router.post("/:idComentario/denunciar", denunciarComentario);

module.exports = router;