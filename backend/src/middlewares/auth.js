const { supabase } = require('../config/supabase');

async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }

  req.usuario = data.user;
  req.token = token;
  next();
}

module.exports = verificarToken;