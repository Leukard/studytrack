exigirLogin();

const statSequencia = document.getElementById('stat-sequencia');
const listaTemas = document.getElementById('lista-temas');
const estadoVazio = document.getElementById('estado-vazio');
const saudacao = document.getElementById('saudacao');
const statHoras = document.getElementById('stat-horas');
const statMeta = document.getElementById('stat-meta');
const btnLogout = document.getElementById('btn-logout');
const btnNovoTema = document.getElementById('btn-novo-tema');
const btnVazioNovoTema = document.getElementById('btn-vazio-novo-tema');

// Retorna a data (00:00) da segunda-feira da semana atual — semana considerada
// começa na segunda (padrão brasileiro), não no domingo
function obterInicioSemana() {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, ... 6 = sábado
  const diffParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - diffParaSegunda);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

// Soma a duração (em minutos) das sessões que aconteceram a partir de uma data limite
function minutosDesde(sessoes, dataLimite) {
  return sessoes
    .filter(s => new Date(s.data) >= dataLimite)
    .reduce((total, s) => total + s.duracao_minutos, 0);
}

// Calcula dias consecutivos com sessão registrada, contando de hoje para trás.
// Nota: toISOString() usa UTC, então em horários limítrofes do fuso local
// pode haver imprecisão de um dia — aceitável para este projeto.
function calcularSequencia(sessoes) {
  const diasComSessao = new Set(
    sessoes.map(s => new Date(s.data).toISOString().split('T')[0])
  );

  let sequencia = 0;
  let dataAtual = new Date();

  while (diasComSessao.has(dataAtual.toISOString().split('T')[0])) {
    sequencia++;
    dataAtual.setDate(dataAtual.getDate() - 1);
  }

  return sequencia;
}

function definirSaudacao() {
  const hora = new Date().getHours();
  const periodo = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  saudacao.textContent = `${periodo} 👋`;
}

// Monta o card de um tema, incluindo a barra de progresso calculada
// a partir das sessões daquele tema específico
function criarCardTema(tema, sessoesDoTema) {
  const card = document.createElement('div');
  card.className = 'bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow';

  const meta = tema.meta_horas_semana || 0;
  const horasEssaSemana = minutosDesde(sessoesDoTema, obterInicioSemana()) / 60;
  const progresso = meta > 0 ? Math.min(100, (horasEssaSemana / meta) * 100) : 0;

  card.innerHTML = `
    <div class="flex items-start justify-between mb-3">
      <h3 class="font-semibold">${tema.nome}</h3>
      <button data-id="${tema.id}" class="btn-deletar-tema text-slate-400 hover:text-red-500 transition-colors text-sm">✕</button>
    </div>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">${horasEssaSemana.toFixed(1)}h de ${meta}h/semana</p>
    <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3">
      <div class="bg-brand-500 h-2 rounded-full transition-all duration-500" style="width: ${progresso}%"></div>
    </div>
    <button data-id="${tema.id}" data-nome="${tema.nome}" class="btn-registrar-sessao text-sm text-brand-600 dark:text-brand-500 font-medium hover:underline">
      + Registrar sessão
    </button>
  `;

  return card;
}

// Atualiza os três cards de estatísticas gerais no topo do dashboard
function atualizarStats(temas, todasSessoes) {
  const inicioSemana = obterInicioSemana();
  const horasSemana = minutosDesde(todasSessoes, inicioSemana) / 60;

  statHoras.textContent = `${horasSemana.toFixed(1)}h`;

  const sequencia = calcularSequencia(todasSessoes);
  statSequencia.textContent = `🔥 ${sequencia} dia${sequencia === 1 ? '' : 's'}`;

  const metaTotal = temas.reduce((total, t) => total + (t.meta_horas_semana || 0), 0);
  const percentualMeta = metaTotal > 0 ? Math.min(100, Math.round((horasSemana / metaTotal) * 100)) : 0;
  statMeta.textContent = `${percentualMeta}%`;
}

// Busca temas e suas sessões, renderiza os cards e atualiza as estatísticas.
// Chamada sempre que algo muda (criar/deletar tema, registrar sessão), para
// manter a tela sincronizada com o banco.
async function carregarTemas() {
  try {
    const temas = await api.listarTemas();

    // Sem temas cadastrados: mostra o estado vazio em vez da grade de cards
    if (!temas || temas.length === 0) {
      estadoVazio.classList.remove('hidden');
      listaTemas.classList.add('hidden');
      atualizarStats([], []);
      return;
    }

    estadoVazio.classList.add('hidden');
    listaTemas.classList.remove('hidden');
    listaTemas.innerHTML = '';

    // Busca as sessões de todos os temas em paralelo (mais rápido que uma de cada vez)
    const sessoesPorTema = await Promise.all(
      temas.map(t => api.listarSessoesPorTema(t.id))
    );

    // Junta todas as sessões numa lista única, usada pras métricas gerais do topo
    const todasSessoes = sessoesPorTema.flat();

    temas.forEach((tema, i) => {
      listaTemas.appendChild(criarCardTema(tema, sessoesPorTema[i]));
    });

    atualizarStats(temas, todasSessoes);

    // Os listeners abaixo precisam ser religados a cada carregamento, porque
    // os botões são recriados do zero (listaTemas.innerHTML = '' acima os apagou)
    document.querySelectorAll('.btn-deletar-tema').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Tem certeza que quer excluir esse tema? Todas as sessões dele também serão apagadas.')) {
          await api.deletarTema(btn.dataset.id);
          carregarTemas();
        }
      });
    });

    document.querySelectorAll('.btn-registrar-sessao').forEach((btn) => {
      btn.addEventListener('click', () => {
        abrirModalSessao(btn.dataset.id, btn.dataset.nome);
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

// Referências dos elementos dos modais
const modalTema = document.getElementById('modal-tema');
const formTema = document.getElementById('form-tema');
const modalSessao = document.getElementById('modal-sessao');
const formSessao = document.getElementById('form-sessao');
const sessaoTemaNome = document.getElementById('sessao-tema-nome');

// Guarda o id do tema selecionado ao abrir o modal de sessão — o modal é genérico
// e reutilizado para qualquer tema, então precisamos lembrar qual foi clicado
let temaSelecionadoId = null;

function abrirModalTema() {
  formTema.reset();
  modalTema.classList.remove('hidden');
}
function fecharModalTema() {
  modalTema.classList.add('hidden');
}

function abrirModalSessao(temaId, temaNome) {
  temaSelecionadoId = temaId;
  sessaoTemaNome.textContent = `Tema: ${temaNome}`;
  formSessao.reset();
  modalSessao.classList.remove('hidden');
}
function fecharModalSessao() {
  modalSessao.classList.add('hidden');
  temaSelecionadoId = null;
}

btnNovoTema.addEventListener('click', abrirModalTema);
btnVazioNovoTema.addEventListener('click', abrirModalTema);
document.getElementById('btn-cancelar-tema').addEventListener('click', fecharModalTema);
document.getElementById('btn-cancelar-sessao').addEventListener('click', fecharModalSessao);

formTema.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('input-nome-tema').value;
  const meta = document.getElementById('input-meta-tema').value || null;

  try {
    await api.criarTema(nome, meta ? Number(meta) : null);
    fecharModalTema();
    carregarTemas();
  } catch (erro) {
    alert(erro.message);
  }
});

formSessao.addEventListener('submit', async (e) => {
  e.preventDefault();
  const duracao = Number(document.getElementById('input-duracao-sessao').value);
  const anotacao = document.getElementById('input-anotacao-sessao').value;

  try {
    await api.criarSessao(temaSelecionadoId, duracao, anotacao);
    fecharModalSessao();
    carregarTemas();
  } catch (erro) {
    alert(erro.message);
  }
});

definirSaudacao();
carregarTemas();