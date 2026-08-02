const perfilService = require('../services/perfilService');

async function buscar(req, res) {
  try {
    const perfil = await perfilService.buscar(req.token, req.usuario.id);
    res.status(200).json(perfil); // pode vir null, e está tudo bem
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function salvar(req, res) {
  try {
    const { nomeExibicao } = req.body;
    const perfil = await perfilService.salvar(req.token, req.usuario.id, nomeExibicao);
    res.status(200).json(perfil);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

module.exports = { buscar, salvar };