const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rotas públicas — não passam pelo middleware verificarToken, já que o usuário
// ainda não tem token nesse momento (é justamente o que essas rotas geram)
router.post('/cadastro', authController.cadastrar);
router.post('/login', authController.login);

module.exports = router;