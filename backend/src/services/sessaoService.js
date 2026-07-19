const { clienteComToken } = require('../config/supabase');

async function criar(token, temaId, duracaoMinutos, anotacao) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('sessoes')
    .insert([{ tema_id: temaId, duracao_minutos: duracaoMinutos, anotacao }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function listarPorTema(token, temaId) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('sessoes')
    .select('*')
    .eq('tema_id', temaId)
    .order('data', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

async function atualizar(token, id, duracaoMinutos, anotacao) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('sessoes')
    .update({ duracao_minutos: duracaoMinutos, anotacao })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function deletar(token, id) {
  const supabase = clienteComToken(token);
  const { error } = await supabase
    .from('sessoes')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

module.exports = { criar, listarPorTema, atualizar, deletar };