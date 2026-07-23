const { clienteComToken } = require('../config/supabase');

// Cria um tema associado ao usuário autenticado.
// user_id é passado explicitamente (não confiamos em dado vindo do frontend para isso);
// o RLS também garante, no banco, que só é possível inserir com o próprio user_id.
async function criar(token, userId, nome, metaHorasSemana) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('temas')
    .insert([{ user_id: userId, nome, meta_horas_semana: metaHorasSemana }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Lista os temas do usuário autenticado.
// Não filtramos por user_id manualmente aqui — o RLS já garante que só voltam
// os temas do dono do token usado no cliente.
async function listar(token, userId) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('temas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

async function buscarPorId(token, id) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('temas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function atualizar(token, id, nome, metaHorasSemana) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('temas')
    .update({ nome, meta_horas_semana: metaHorasSemana })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function deletar(token, id) {
  const supabase = clienteComToken(token);
  const { error } = await supabase
    .from('temas')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

module.exports = { criar, listar, buscarPorId, atualizar, deletar };