// Carrega as variáveis do .env (SUPABASE_URL, SUPABASE_ANON_KEY, etc) para dentro de process.env
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Cliente "genérico", sem usuário associado — usado só para validar tokens (ver middlewares/auth.js)
const supabase = createClient(supabaseUrl, supabaseKey);

// Cria um cliente Supabase vinculado ao token de um usuário específico.
// Necessário porque o RLS do Postgres precisa saber "em nome de quem" cada consulta roda
// (auth.uid() só funciona se o token do usuário for enviado no cabeçalho da requisição).
function clienteComToken(token) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

module.exports = { supabase, clienteComToken };