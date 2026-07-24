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
const modalListaSessoes = document.getElementById('modal-lista-sessoes');
const tituloListaSessoes = document.getElementById('titulo-lista-sessoes');
const listaSessoesConteudo = document.getElementById('lista-sessoes-conteudo');

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
      <div class="flex gap-2">
        <button data-id="${tema.id}" data-nome="${tema.nome}" data-meta="${meta}" class="btn-editar-tema text-slate-400 hover:text-brand-500 transition-colors text-sm">✎</button>
        <button data-id="${tema.id}" class="btn-deletar-tema text-slate-400 hover:text-red-500 transition-colors text-sm">✕</button>
      </div>
    </div>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">${horasEssaSemana.toFixed(1)}h de ${meta}h/semana</p>
    <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3">
      <div class="bg-brand-500 h-2 rounded-full transition-all duration-500" style="width: ${progresso}%"></div>
    </div>
    <div class="flex gap-3 mt-1">
      <button data-id="${tema.id}" data-nome="${tema.nome}" class="btn-registrar-sessao text-sm text-brand-600 dark:text-brand-500 font-medium hover:underline">
        + Registrar sessão
      </button>
      <button data-id="${tema.id}" data-nome="${tema.nome}" class="btn-ver-sessoes text-sm text-slate-500 dark:text-slate-400 font-medium hover:underline">
        Ver sessões
      </button>
    </div>
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

    document.querySelectorAll('.btn-editar-tema').forEach((btn) => {
      btn.addEventListener('click', () => {
        abrirModalTema({
          id: btn.dataset.id,
          nome: btn.dataset.nome,
          meta: btn.dataset.meta,
        });
      });
    });

    document.querySelectorAll('.btn-ver-sessoes').forEach((btn) => {
      btn.addEventListener('click', () => {
        abrirModalListaSessoes(btn.dataset.id, btn.dataset.nome);
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
const tituloModalTema = document.getElementById('titulo-modal-tema');
const btnSalvarTema = document.getElementById('btn-salvar-tema');
const modalSessao = document.getElementById('modal-sessao');
const formSessao = document.getElementById('form-sessao');
const sessaoTemaNome = document.getElementById('sessao-tema-nome');

// Guarda o id do tema selecionado ao abrir o modal de sessão — o modal é genérico
// e reutilizado para qualquer tema, então precisamos lembrar qual foi clicado
let temaSelecionadoId = null;
let temaEmEdicaoId = null; // null = criando um tema novo; com valor = editando esse id

// Abre o modal em modo criação (campos vazios) ou edição (campos pré-preenchidos)
function abrirModalTema(tema = null) {
  formTema.reset();
  if (tema) {
    temaEmEdicaoId = tema.id;
    tituloModalTema.textContent = 'Editar tema';
    btnSalvarTema.textContent = 'Salvar alterações';
    document.getElementById('input-nome-tema').value = tema.nome;
    document.getElementById('input-meta-tema').value = tema.meta || '';
  } else {
    temaEmEdicaoId = null;
    tituloModalTema.textContent = 'Novo tema de estudo';
    btnSalvarTema.textContent = 'Criar';
  }
  modalTema.classList.remove('hidden');
}
function fecharModalTema() {
  modalTema.classList.add('hidden');
  temaEmEdicaoId = null;
}

let sessaoEmEdicaoId = null; // mesma lógica do temaEmEdicaoId

function abrirModalSessao(temaId, temaNome, sessao = null) {
  temaSelecionadoId = temaId;
  sessaoTemaNome.textContent = `Tema: ${temaNome}`;
  formSessao.reset();

  if (sessao) {
    sessaoEmEdicaoId = sessao.id;
    document.getElementById('input-duracao-sessao').value = sessao.duracao;
    document.getElementById('input-anotacao-sessao').value = sessao.anotacao;
  } else {
    sessaoEmEdicaoId = null;
  }

  modalSessao.classList.remove('hidden');
}

formSessao.addEventListener('submit', async (e) => {
  e.preventDefault();
  const duracao = Number(document.getElementById('input-duracao-sessao').value);
  const anotacao = document.getElementById('input-anotacao-sessao').value;

  try {
    if (sessaoEmEdicaoId) {
      await api.atualizarSessao(sessaoEmEdicaoId, duracao, anotacao);
    } else {
      await api.criarSessao(temaSelecionadoId, duracao, anotacao);
    }
    fecharModalSessao();
    carregarTemas();
  } catch (erro) {
    alert(erro.message);
  }
});

function fecharModalSessao() {
  modalSessao.classList.add('hidden');
  temaSelecionadoId = null;
}

// Formata minutos totais em algo como "1h 20min" (mais legível que só "80min")
function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const min = minutos % 60;
  if (horas === 0) return `${min}min`;
  if (min === 0) return `${horas}h`;
  return `${horas}h ${min}min`;
}

// Monta o HTML de uma linha de sessão dentro do modal de listagem
function criarLinhaSessao(sessao) {
  const data = new Date(sessao.data).toLocaleDateString('pt-BR');
  return `
    <div class="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
      <div>
        <p class="text-sm font-medium">${formatarDuracao(sessao.duracao_minutos)} — ${data}</p>
        ${sessao.anotacao ? `<p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">${sessao.anotacao}</p>` : ''}
      </div>
      <div class="flex gap-2 shrink-0 ml-2">
        <button data-id="${sessao.id}" data-duracao="${sessao.duracao_minutos}" data-anotacao="${sessao.anotacao || ''}" class="btn-editar-sessao text-slate-400 hover:text-brand-500 text-sm">✎</button>
        <button data-id="${sessao.id}" class="btn-deletar-sessao text-slate-400 hover:text-red-500 text-sm">✕</button>
      </div>
    </div>
  `;
}

// Abre o modal de listagem, buscando as sessões do tema na hora (dados sempre atualizados)
async function abrirModalListaSessoes(temaId, temaNome) {
  temaSelecionadoId = temaId;
  tituloListaSessoes.textContent = `Sessões — ${temaNome}`;
  listaSessoesConteudo.innerHTML = '<p class="text-sm text-slate-400">Carregando...</p>';
  modalListaSessoes.classList.remove('hidden');

  try {
    const sessoes = await api.listarSessoesPorTema(temaId);

    if (sessoes.length === 0) {
      listaSessoesConteudo.innerHTML = '<p class="text-sm text-slate-400 text-center py-6">Nenhuma sessão registrada ainda</p>';
      return;
    }

    listaSessoesConteudo.innerHTML = sessoes.map(criarLinhaSessao).join('');

    document.querySelectorAll('.btn-deletar-sessao').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (confirm('Excluir essa sessão?')) {
          await api.deletarSessao(btn.dataset.id);
          abrirModalListaSessoes(temaId, temaNome);
          carregarTemas();
        }
      });
    });

    document.querySelectorAll('.btn-editar-sessao').forEach((btn) => {
      btn.addEventListener('click', () => {
        modalListaSessoes.classList.add('hidden');
        abrirModalSessao(temaId, temaNome, {
          id: btn.dataset.id,
          duracao: btn.dataset.duracao,
          anotacao: btn.dataset.anotacao,
        });
      });
    });

  } catch (erro) {
    listaSessoesConteudo.innerHTML = `<p class="text-sm text-red-500">${erro.message}</p>`;
  }
}

document.getElementById('btn-fechar-lista-sessoes').addEventListener('click', () => {
  modalListaSessoes.classList.add('hidden');
});

btnNovoTema.addEventListener('click', abrirModalTema);
btnVazioNovoTema.addEventListener('click', abrirModalTema);
document.getElementById('btn-cancelar-tema').addEventListener('click', fecharModalTema);
document.getElementById('btn-cancelar-sessao').addEventListener('click', fecharModalSessao);

formTema.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('input-nome-tema').value;
  const meta = document.getElementById('input-meta-tema').value || null;
  const metaNumero = meta ? Number(meta) : null;

  try {
    if (temaEmEdicaoId) {
      await api.atualizarTema(temaEmEdicaoId, nome, metaNumero);
    } else {
      await api.criarTema(nome, metaNumero);
    }
    fecharModalTema();
    carregarTemas();
  } catch (erro) {
    alert(erro.message);
  }
});

definirSaudacao();
carregarTemas();