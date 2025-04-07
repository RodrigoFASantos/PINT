const express = require("express");
const router = express.Router();
const verificarToken = require('../middleware/auth');
const { registerPushSubscription, testPushNotification } = require("../controllers/notificacoes_ctrl");

router.post("/register", verificarToken, registerPushSubscription);
router.post("/test", verificarToken, testPushNotification);

module.exports = router;