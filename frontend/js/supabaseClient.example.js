// Copie este arquivo para supabaseClient.js e preencha com suas credenciais reais.
// supabaseClient.js está no .gitignore e não deve ser commitado.
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);