const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const verificarToken = require('../middlewares/auth');

router.get('/', verificarToken, perfilController.buscar);
router.put('/', verificarToken, perfilController.salvar);

module.exports = router;