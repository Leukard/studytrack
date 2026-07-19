const express = require('express');
const router = express.Router();
const temaController = require('../controllers/temaController');
const verificarToken = require('../middlewares/auth');

router.post('/', verificarToken, temaController.criar);

module.exports = router;