const temaService = require('../services/temaService');

async function criar(req, res) {
  try {
    const { nome, metaHorasSemana } = req.body;
    const userId = req.usuario.id;
    const token = req.token;

    const tema = await temaService.criar(token, userId, nome, metaHorasSemana);
    res.status(201).json(tema);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

module.exports = { criar };