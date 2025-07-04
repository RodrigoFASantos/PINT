const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const verificarTokenComEmail = require('../../utils/verificarTokenComEmail');
const { 
  getAllUsers, getFormadores, getFormandos, getGestores, createUser, deleteUser, 
  loginUser, perfilUser, updatePerfilUser, changePassword, uploadImagemPerfil, 
  uploadImagemCapa, confirmAccount, resendConfirmation, getUserById 
} = require("../../controllers/users/users_ctrl");
const uploadUtils = require('../../middleware/upload');

/**
 * ROTAS PARA GESTÃO COMPLETA DE UTILIZADORES
 * Inclui autenticação, perfis, uploads e operações administrativas
 * IMPORTANTE: A ordem das rotas é crucial - específicas primeiro, genéricas no final
 */

// =============================================================================
// ROTAS ESPECÍFICAS POR TIPO DE UTILIZADOR
// =============================================================================

// Obter lista completa de formadores do sistema
router.get("/formadores", verificarToken, getFormadores);

// Obter lista completa de formandos/estudantes
router.get("/formandos", verificarToken, getFormandos);

// Obter lista de gestores/administradores
router.get("/gestores", verificarToken, getGestores);

// Obter perfil do utilizador atualmente autenticado
router.get("/perfil", verificarToken, perfilUser);

// =============================================================================
// SISTEMA DE AUTENTICAÇÃO E REGISTO
// =============================================================================

// Registo de novo utilizador no sistema
router.post("/register", createUser);

// Autenticação/login de utilizador existente
router.post("/login", loginUser);

// Atualizar dados do perfil do utilizador autenticado
router.put("/perfil", verificarToken, updatePerfilUser);

// =============================================================================
// GESTÃO DE CONTA E SEGURANÇA
// =============================================================================

// Alterar palavra-passe do utilizador (requer autenticação)
router.put("/change-password", verificarToken, changePassword);

// Confirmar conta através de token enviado por email
router.post("/confirm-account", confirmAccount);

// Reenviar email de confirmação para utilizador
router.post("/resend-confirmation", resendConfirmation);

// =============================================================================
// SISTEMA DE UPLOAD DE IMAGENS DE PERFIL
// =============================================================================

// Upload de imagem de perfil do utilizador
router.post("/img/perfil", 
  verificarTokenComEmail, 
  uploadUtils.ensureUserDir, 
  uploadUtils.uploadTemp.single("imagem"), 
  uploadImagemPerfil
);

// Upload de imagem de capa/banner do perfil
router.post("/img/capa", 
  verificarTokenComEmail, 
  uploadUtils.ensureUserDir, 
  uploadUtils.uploadTemp.single("imagem"), 
  uploadImagemCapa
);

// =============================================================================
// ROTAS ADMINISTRATIVAS (com parâmetros dinâmicos)
// =============================================================================

// Obter dados específicos de utilizador por ID
router.get("/:id", verificarToken, getUserById);

// Atualizar dados de utilizador específico (operação administrativa)
router.put("/:id", verificarToken, updatePerfilUser);

// Eliminar utilizador do sistema (operação administrativa crítica)
router.delete("/:id", verificarToken, deleteUser);

// =============================================================================
// ROTA GENÉRICA (deve ser sempre a última)
// =============================================================================

// Obter lista de todos os utilizadores (visão administrativa)
router.get("/", verificarToken, getAllUsers);

module.exports = router;