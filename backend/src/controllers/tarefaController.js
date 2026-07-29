const tarefaService = require('../services/tarefaService');

async function criar(req, res) {
  try {
    const { temaId, descricao } = req.body;
    const tarefa = await tarefaService.criar(req.token, temaId, descricao);
    res.status(201).json(tarefa);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function listarPorTema(req, res) {
  try {
    const tarefas = await tarefaService.listarPorTema(req.token, req.params.temaId);
    res.status(200).json(tarefas);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function atualizar(req, res) {
  try {
    // req.body pode conter { descricao } e/ou { concluida }, dependendo da ação
    const tarefa = await tarefaService.atualizar(req.token, req.params.id, req.body);
    res.status(200).json(tarefa);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function deletar(req, res) {
  try {
    await tarefaService.deletar(req.token, req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

module.exports = { criar, listarPorTema, atualizar, deletar };