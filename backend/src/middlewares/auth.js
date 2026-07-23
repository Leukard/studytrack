const { supabase } = require('../config/supabase');

// Middleware que roda antes de rotas protegidas: extrai e valida o token
// do usuário, e disponibiliza os dados dele (req.usuario, req.token) para o resto da requisição
async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // Espera o formato padrão "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  // Pergunta ao Supabase se o token é válido e, se for, quem é o usuário
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }

  // Guarda o usuário e o token cru no req, para uso nos controllers/services seguintes
  req.usuario = data.user;
  req.token = token;
  next();
}

module.exports = verificarToken;