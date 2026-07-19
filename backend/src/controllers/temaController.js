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

async function listar(req, res) {
  try {
    const temas = await temaService.listar(req.token, req.usuario.id);
    res.status(200).json(temas);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const tema = await temaService.buscarPorId(req.token, req.params.id);
    res.status(200).json(tema);
  } catch (error) {
    res.status(404).json({ erro: error.message });
  }
}

async function atualizar(req, res) {
  try {
    const { nome, metaHorasSemana } = req.body;
    const tema = await temaService.atualizar(req.token, req.params.id, nome, metaHorasSemana);
    res.status(200).json(tema);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function deletar(req, res) {
  try {
    await temaService.deletar(req.token, req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

module.exports = { criar, listar, buscarPorId, atualizar, deletar };