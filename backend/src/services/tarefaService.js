const { clienteComToken } = require('../config/supabase');

// Cria uma tarefa vinculada a um tema. O RLS já garante que só é possível
// criar em um tema que pertence ao usuário do token (mesma lógica de sessões).
async function criar(token, temaId, descricao) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('tarefas')
    .insert([{ tema_id: temaId, descricao }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function listarPorTema(token, temaId) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .eq('tema_id', temaId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// Usado tanto para marcar/desmarcar como concluída quanto para editar a descrição
async function atualizar(token, id, campos) {
  const supabase = clienteComToken(token);
  const { data, error } = await supabase
    .from('tarefas')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function deletar(token, id) {
  const supabase = clienteComToken(token);
  const { error } = await supabase
    .from('tarefas')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

module.exports = { criar, listarPorTema, atualizar, deletar };