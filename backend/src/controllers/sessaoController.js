const sessaoService = require('../services/sessaoService');

async function criar(req, res) {
  try {
    const { temaId, duracaoMinutos, anotacao } = req.body;
    const sessao = await sessaoService.criar(req.token, temaId, duracaoMinutos, anotacao);
    res.status(201).json(sessao);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function listarPorTema(req, res) {
  try {
    const sessoes = await sessaoService.listarPorTema(req.token, req.params.temaId);
    res.status(200).json(sessoes);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function atualizar(req, res) {
  try {
    const { duracaoMinutos, anotacao } = req.body;
    const sessao = await sessaoService.atualizar(req.token, req.params.id, duracaoMinutos, anotacao);
    res.status(200).json(sessao);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function deletar(req, res) {
  try {
    await sessaoService.deletar(req.token, req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

module.exports = { criar, listarPorTema, atualizar, deletar };