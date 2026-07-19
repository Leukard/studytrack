const app = require('./src/app');
const { supabase } = require('./src/config/supabase');

const PORT = process.env.PORT || 3333;

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