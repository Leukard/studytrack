const express = require('express');
const router = express.Router();
const tarefaController = require('../controllers/tarefaController');
const verificarToken = require('../middlewares/auth');

router.post('/', verificarToken, tarefaController.criar);
router.get('/tema/:temaId', verificarToken, tarefaController.listarPorTema);
router.put('/:id', verificarToken, tarefaController.atualizar);
router.delete('/:id', verificarToken, tarefaController.deletar);

module.exports = router;