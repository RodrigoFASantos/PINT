const express = require('express');
const router = express.Router();
const {
    getPercursoFormandos
} = require('../../controllers/users/Percurso_Formandos_ctrl');
const authenticateToken = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');

router.get('/admin/percurso-formandos', authenticateToken, isAdmin, getPercursoFormandos);

module.exports = router;