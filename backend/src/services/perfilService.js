const { clienteComToken } = require('../config/supabase');

// Busca o perfil do usuário. Se ele nunca definiu um apelido (primeira vez
// usando o app), simplesmente não existe linha ainda — retornamos null
// em vez de erro, e o frontend decide o que mostrar como padrão.
async function buscar(token, userId) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle(); // não dá erro se não encontrar nada (diferente de .single())

  if (error) throw new Error(error.message);
  return data;
}

// "Upsert": cria o perfil se for a primeira vez, ou atualiza se já existir —
// evita ter que checar manualmente "já existe?" antes de decidir insert/update
async function salvar(token, userId, nomeExibicao) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('perfis')
    .upsert({ user_id: userId, nome_exibicao: nomeExibicao, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { buscar, salvar };