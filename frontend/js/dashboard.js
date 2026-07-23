exigirLogin();

const listaTemas = document.getElementById('lista-temas');
const estadoVazio = document.getElementById('estado-vazio');
const saudacao = document.getElementById('saudacao');
const statHoras = document.getElementById('stat-horas');
const statMeta = document.getElementById('stat-meta');
const btnLogout = document.getElementById('btn-logout');
const btnNovoTema = document.getElementById('btn-novo-tema');
const btnVazioNovoTema = document.getElementById('btn-vazio-novo-tema');

function definirSaudacao() {
  const hora = new Date().getHours();
  const periodo = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  saudacao.textContent = `${periodo} 👋`;
}

function criarCardTema(tema) {
  const card = document.createElement('div');
  card.className = 'bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow';

  const meta = tema.meta_horas_semana || 0;

  card.innerHTML = `
    <div class="flex items-start justify-between mb-3">
      <h3 class="font-semibold">${tema.nome}</h3>
      <button data-id="${tema.id}" class="btn-deletar-tema text-slate-400 hover:text-red-500 transition-colors text-sm">✕</button>
    </div>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Meta: ${meta}h/semana</p>
    <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3">
      <div class="bg-brand-500 h-2 rounded-full" style="width: 0%"></div>
    </div>
    <button data-id="${tema.id}" data-nome="${tema.nome}" class="btn-registrar-sessao text-sm text-brand-600 dark:text-brand-500 font-medium hover:underline">
      + Registrar sessão
    </button>
  `;

  return card;
}

async function carregarTemas() {
  try {
    const temas = await api.listarTemas();

    if (!temas || temas.length === 0) {
      estadoVazio.classList.remove('hidden');
      listaTemas.classList.add('hidden');
      return;
    }

    estadoVazio.classList.add('hidden');
    listaTemas.classList.remove('hidden');
    listaTemas.innerHTML = '';

    temas.forEach((tema) => {
      listaTemas.appendChild(criarCardTema(tema));
    });

    document.querySelectorAll('.btn-deletar-tema').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Tem certeza que quer excluir esse tema? Todas as sessões dele também serão apagadas.')) {
          await api.deletarTema(btn.dataset.id);
          carregarTemas();
        }
      });
    });

  } catch (erro) {
    console.error('Erro ao carregar temas:', erro);
  }
}

btnLogout.addEventListener('click', () => {
  localStorage.removeItem('access_token');
  window.location.href = 'index.html';
});

definirSaudacao();
carregarTemas();