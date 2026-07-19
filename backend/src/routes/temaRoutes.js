const express = require('express');
const router = express.Router();
const temaController = require('../controllers/temaController');
const verificarToken = require('../middlewares/auth');

router.post('/', verificarToken, temaController.criar);
router.get('/', verificarToken, temaController.listar);
router.get('/:id', verificarToken, temaController.buscarPorId);
router.put('/:id', verificarToken, temaController.atualizar);
router.delete('/:id', verificarToken, temaController.deletar);

module.exports = router;