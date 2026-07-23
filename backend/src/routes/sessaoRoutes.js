const express = require('express');
const router = express.Router();
const sessaoController = require('../controllers/sessaoController');
const verificarToken = require('../middlewares/auth');

// /tema/:temaId (em vez de query string) deixa explícito que a listagem é sempre por tema
router.post('/', verificarToken, sessaoController.criar);
router.get('/tema/:temaId', verificarToken, sessaoController.listarPorTema);
router.put('/:id', verificarToken, sessaoController.atualizar);
router.delete('/:id', verificarToken, sessaoController.deletar);

module.exports = router;