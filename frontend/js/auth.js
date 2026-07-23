// API_URL vem de api.js, carregado antes deste arquivo no HTML

const btnLogin = document.getElementById('btn-login');
const btnCadastro = document.getElementById('btn-cadastro');
const btnEnviar = document.getElementById('btn-enviar');
const form = document.getElementById('form-auth');
const mensagemErro = document.getElementById('mensagem-erro');

let modo = 'login';

// Alterna visualmente entre os modos "login" e "cadastro" no mesmo formulário
function alternarModo(novoModo) {
  modo = novoModo;
  const ehLogin = modo === 'login';

  btnLogin.classList.toggle('bg-white', ehLogin);
  btnLogin.classList.toggle('dark:bg-slate-600', ehLogin);
  btnLogin.classList.toggle('shadow', ehLogin);
  btnLogin.classList.toggle('text-slate-500', !ehLogin);

  btnCadastro.classList.toggle('bg-white', !ehLogin);
  btnCadastro.classList.toggle('dark:bg-slate-600', !ehLogin);
  btnCadastro.classList.toggle('shadow', !ehLogin);
  btnCadastro.classList.toggle('text-slate-500', ehLogin);

  btnEnviar.textContent = ehLogin ? 'Entrar' : 'Criar conta';
  mensagemErro.classList.add('hidden');
}

btnLogin.addEventListener('click', () => alternarModo('login'));
btnCadastro.addEventListener('click', () => alternarModo('cadastro'));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensagemErro.classList.add('hidden');

  const email = document.getElementById('input-email').value;
  const senha = document.getElementById('input-senha').value;
  const rota = modo === 'login' ? '/auth/login' : '/auth/cadastro';

  btnEnviar.disabled = true;
  btnEnviar.textContent = 'Aguarde...';

  try {
    const resposta = await fetch(`${API_URL}${rota}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    const dados = await resposta.json();

    // fetch não lança erro sozinho em respostas 4xx/5xx — precisamos checar resposta.ok manualmente
    if (!resposta.ok) {
      throw new Error(dados.erro || 'Algo deu errado');
    }

    if (modo === 'login') {
      localStorage.setItem('access_token', dados.session.access_token);
      window.location.href = 'dashboard.html';
    } else {
      // Cadastro não gera sessão imediata — Supabase exige confirmação de email primeiro
      mensagemErro.textContent = 'Conta criada! Verifique seu email para confirmar antes de entrar.';
      mensagemErro.classList.remove('text-red-500');
      mensagemErro.classList.add('text-emerald-500');
      mensagemErro.classList.remove('hidden');
      alternarModo('login');
    }
  } catch (erro) {
    mensagemErro.textContent = erro.message;
    mensagemErro.classList.remove('hidden');
  } finally {
    // Roda em qualquer caso (sucesso ou erro), evitando o botão travado em "Aguarde..."
    btnEnviar.disabled = false;
    btnEnviar.textContent = modo === 'login' ? 'Entrar' : 'Criar conta';
  }
});