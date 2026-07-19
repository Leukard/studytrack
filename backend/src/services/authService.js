const { supabase } = require('../config/supabase');

async function cadastrar(email, senha) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
  });
  if (error) throw new Error(error.message);
  return data;
}

async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) throw new Error(error.message);
  return data;
}

module.exports = { cadastrar, login };