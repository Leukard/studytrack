const { supabase } = require('../config/supabase');

// Cria um novo usuário no Supabase Auth (envia email de confirmação por padrão)
async function cadastrar(email, senha) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
  });
  if (error) throw new Error(error.message);
  return data;
}

// Autentica um usuário existente e retorna a sessão (access_token + refresh_token)
async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) throw new Error(error.message);
  return data;
}

module.exports = { cadastrar, login };