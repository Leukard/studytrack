const app = require('./src/app');
const { supabase } = require('./src/config/supabase');

const PORT = process.env.PORT || 3333;

// Testa a conexão com o Supabase ao subir o servidor.
// PGRST205 (tabela não encontrada) é esperado aqui — não é erro de conexão,
// é só o Supabase confirmando que a query rodou mas a tabela '_test' não existe de propósito.
async function testarConexao() {
  const { error } = await supabase.from('_test').select('*').limit(1);
  if (error && error.code !== 'PGRST205') {
    console.error('Erro ao conectar no Supabase:', error.message);
  } else {
    console.log('Conexão com Supabase OK');
  }
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  testarConexao();
});