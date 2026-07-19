const { clienteComToken } = require('../config/supabase');

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

module.exports = { criar };