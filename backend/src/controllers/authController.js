const authService = require('../services/authService');

// Recebe email/senha e delega ao service; 400 se falhar (ex: email já cadastrado)
async function cadastrar(req, res) {
  try {
    const { email, senha } = req.body;
    const resultado = await authService.cadastrar(email, senha);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
}

// 401 se falhar (credenciais inválidas), diferente do cadastro
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