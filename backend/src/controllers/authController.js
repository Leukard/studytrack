const authService = require('../services/authService');

async function cadastrar(req, res) {
  try {
    const { email, senha } = req.body;
    const resultado = await authService.cadastrar(email, senha);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;
    const resultado = await authService.login(email, senha);
    res.status(200).json(resultado);
  } catch (error) {
    res.status(401).json({ erro: error.message });
  }
}

module.exports = { cadastrar, login };