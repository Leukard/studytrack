// Verifica se chegou uma sessão nova via OAuth (ex: login com Google), que vem
// embutida na URL, não no localStorage. Se encontrar, salva no mesmo formato
// que o resto do app usa, para tudo continuar funcionando de forma consistente.
async function sincronizarSessaoOAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    localStorage.setItem('access_token', data.session.access_token);
    // Limpa o token da URL por segurança/estética, sem recarregar a página
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

sincronizarSessaoOAuth().then(() => {
  exigirLogin();
  definirSaudacao();
  carregarTemas();
});

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

async function definirSaudacao() {
  const hora = new Date().getHours();
  const periodo = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // Prioridade: apelido customizado salvo no perfil > nome do Google/email (token)
  let nome = '';
  try {
    const perfil = await api.buscarPerfil();
    nome = perfil?.nome_exibicao || obterNomeUsuario();
  } catch {
    nome = obterNomeUsuario();
  }

  saudacao.innerHTML = `${nome ? `${periodo}, ${nome}` : periodo} 👋
    <button id="btn-editar-perfil" class="text-slate-400 hover:text-brand-500 transition-colors">
      <i data-lucide="pencil" class="w-4 h-4"></i>
    </button>`;

  lucide.createIcons();
  document.getElementById('btn-editar-perfil').addEventListener('click', abrirModalPerfil);
}

const modalPerfil = document.getElementById('modal-perfil');
const inputNomePerfil = document.getElementById('input-nome-perfil');

function abrirModalPerfil() {
  inputNomePerfil.value = '';
  modalPerfil.classList.remove('hidden');
}

document.getElementById('btn-cancelar-perfil').addEventListener('click', () => {
  modalPerfil.classList.add('hidden');
});

document.getElementById('btn-salvar-perfil').addEventListener('click', async () => {
  const nome = inputNomePerfil.value.trim();
  if (!nome) return;

  await api.salvarPerfil(nome);
  modalPerfil.classList.add('hidden');
  definirSaudacao(); // atualiza a saudação na hora, sem precisar recarregar a página
});



// O token JWT tem 3 partes separadas por ponto; a do meio (índice 1) contém os
// dados do usuário, codificados em base64 — não precisa de chamada extra à API
function obterNomeUsuario() {
  try {
    const token = localStorage.getItem('access_token');
    const payload = JSON.parse(atob(token.split('.')[1]));

    const nomeCompleto = payload.user_metadata?.full_name || payload.user_metadata?.name;
    if (nomeCompleto) return nomeCompleto.split(' ')[0]; // só o primeiro nome

    // Sem nome disponível (login por email/senha sem Google) — usa a parte
    // antes do @ do email como alternativa
    const nomeDoEmail = payload.email?.split('@')[0];
    return nomeDoEmail ? nomeDoEmail.charAt(0).toUpperCase() + nomeDoEmail.slice(1) : '';
  } catch {
    return '';
  }
}

// Monta o card de um tema, incluindo a barra de progresso calculada
// a partir das sessões daquele tema específico
function criarCardTema(tema, sessoesDoTema, indice) {
  const card = document.createElement('div');
  card.className = 'bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-300';
  card.style.animation = `entradaCard 0.4s ease-out ${indice * 0.06}s both`;
  
  const meta = tema.meta_horas_semana || 0;
  const horasEssaSemana = minutosDesde(sessoesDoTema, obterInicioSemana()) / 60;
  const progresso = meta > 0 ? Math.min(100, (horasEssaSemana / meta) * 100) : 0;

 card.innerHTML = `
    <div class="flex items-start justify-between mb-3">
      <h3 class="font-semibold text-base tracking-tight">${tema.nome}</h3>
      <div class="flex gap-2">
        <button data-id="${tema.id}" data-nome="${tema.nome}" data-meta="${meta}" class="btn-editar-tema text-slate-400 hover:text-brand-500 transition-colors p-2 -m-2">
        <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
        <button data-id="${tema.id}" class="btn-deletar-tema text-slate-400 hover:text-red-500 transition-colors p-2 -m-2">
        <i data-lucide="x" class="w-4 h-4"></i>
        </button>
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
  listaTemas.appendChild(criarCardTema(tema, sessoesPorTema[i], i));
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

    lucide.createIcons();

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

  const botao = e.target.querySelector('button[type="submit"]');
  if (botao.disabled) return;
  botao.disabled = true;
  const textoOriginal = botao.textContent;
  botao.textContent = 'Salvando...';

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
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
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
        ${sessao.anotacao ? `<p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 whitespace-pre-line">${sessao.anotacao}</p>` : ''}
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
  listaSessoesConteudo.innerHTML = Array(3).fill(`
  <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 animate-pulse">
    <div class="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/3 mb-2"></div>
    <div class="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3"></div>
  </div>
`).join('');
  modalListaSessoes.classList.remove('hidden');

  try {
    const sessoes = await api.listarSessoesPorTema(temaId);

    if (sessoes.length === 0) {
      listaSessoesConteudo.innerHTML = `
  <div class="text-center py-8">
    <p class="text-3xl mb-2">⏱️</p>
    <p class="text-sm text-slate-400">Nenhuma sessão registrada ainda</p>
  </div>
`;
      return;
    }

    listaSessoesConteudo.innerHTML = sessoes.map(criarLinhaSessao).join('');
    lucide.createIcons();

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

btnNovoTema.addEventListener('click', () => abrirModalTema());
btnVazioNovoTema.addEventListener('click', () => abrirModalTema());
document.getElementById('btn-cancelar-tema').addEventListener('click', fecharModalTema);
document.getElementById('btn-cancelar-sessao').addEventListener('click', fecharModalSessao);
document.getElementById('btn-iniciar-sessao').addEventListener('click', () => {
  window.location.href = 'sala-de-estudos.html';
});

formTema.addEventListener('submit', async (e) => {
  e.preventDefault();

  const botao = document.getElementById('btn-salvar-tema');
  if (botao.disabled) return;
  botao.disabled = true;
  const textoOriginal = botao.textContent;
  botao.textContent = 'Salvando...';

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
  } finally {
    // Aqui usamos finally (diferente do botão do resumo) porque o modal
    // continua na tela após salvar — não há redirecionamento que "resolva sozinho"
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
});

let modoRelatorio = 'semana'; // 'semana' | 'mes'
let offsetRelatorio = 0; // 0 = período atual, -1 = anterior, etc.

const modalRelatorio = document.getElementById('modal-relatorio');
const labelPeriodo = document.getElementById('label-periodo');

// Calcula o início e fim do período selecionado, considerando o offset
// de navegação (quantos períodos atrás/à frente do atual)
function calcularIntervaloRelatorio() {
  const hoje = new Date();

  if (modoRelatorio === 'semana') {
    const inicio = obterInicioSemana(); // função que já existe, reaproveitada
    inicio.setDate(inicio.getDate() + offsetRelatorio * 7);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 7);
    return { inicio, fim };
  } else {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() + offsetRelatorio, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + offsetRelatorio + 1, 1);
    return { inicio, fim };
  }
}

function formatarLabelPeriodo(inicio, fim) {
  if (modoRelatorio === 'semana') {
    const opcoes = { day: '2-digit', month: '2-digit' };
    const fimReal = new Date(fim);
    fimReal.setDate(fimReal.getDate() - 1);
    return `${inicio.toLocaleDateString('pt-BR', opcoes)} - ${fimReal.toLocaleDateString('pt-BR', opcoes)}`;
  }
  return inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// Para o modo "mês", a meta semanal precisa ser escalada proporcionalmente
// aos dias do período (uma meta de 5h/semana vira ~21h num mês de 30 dias)
function escalarMeta(metaSemanal, diasNoPeriodo) {
  return metaSemanal * (diasNoPeriodo / 7);
}

async function carregarRelatorio() {
  const { inicio, fim } = calcularIntervaloRelatorio();
  labelPeriodo.textContent = formatarLabelPeriodo(inicio, fim);

  const temas = await api.listarTemas();
  const sessoesPorTema = await Promise.all(temas.map((t) => api.listarSessoesPorTema(t.id)));

  const diasNoPeriodo = Math.round((fim - inicio) / (1000 * 60 * 60 * 24));
  let horasTotais = 0;
  let sessoesTotais = 0;

  const container = document.getElementById('relatorio-temas');
  container.innerHTML = '';

  temas.forEach((tema, i) => {
    // Filtra só as sessões que caem dentro do período selecionado
    const sessoesNoPeriodo = sessoesPorTema[i].filter((s) => {
      const data = new Date(s.data);
      return data >= inicio && data < fim;
    });

    const minutos = sessoesNoPeriodo.reduce((total, s) => total + s.duracao_minutos, 0);
    const horas = minutos / 60;
    horasTotais += horas;
    sessoesTotais += sessoesNoPeriodo.length;

    const meta = tema.meta_horas_semana ? escalarMeta(tema.meta_horas_semana, diasNoPeriodo) : 0;
    const progresso = meta > 0 ? Math.min(100, (horas / meta) * 100) : 0;

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium">${tema.nome}</span>
        <span class="text-xs text-slate-500 dark:text-slate-400">${horas.toFixed(1)}h${meta > 0 ? ` de ${meta.toFixed(1)}h` : ''}</span>
      </div>
      <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
        <div class="bg-brand-500 h-2 rounded-full transition-all duration-500" style="width: ${progresso}%"></div>
      </div>
    `;
    container.appendChild(div);
  });

  document.getElementById('relatorio-horas-total').textContent = `${horasTotais.toFixed(1)}h`;
  document.getElementById('relatorio-sessoes-total').textContent = sessoesTotais;

  document.getElementById('relatorio-horas-total').textContent = `${horasTotais.toFixed(1)}h`;
  document.getElementById('relatorio-sessoes-total').textContent = sessoesTotais;

  // Sequência calculada com base em TODAS as sessões (não só do período
  // selecionado) — sequência é sempre "até hoje", faz sentido mostrar
  // o valor real atual, mesmo se você estiver navegando por um mês passado
  const todasSessoes = sessoesPorTema.flat();
  document.getElementById('relatorio-sequencia').textContent = `🔥 ${calcularSequencia(todasSessoes)}`;

  // Monta a lista detalhada: uma linha por sessão do período, mais recente primeiro
  const detalhamento = [];
  temas.forEach((tema, i) => {
    sessoesPorTema[i].forEach((s) => {
      const data = new Date(s.data);
      if (data >= inicio && data < fim) {
        detalhamento.push({ data, nomeTema: tema.nome, minutos: s.duracao_minutos });
      }
    });
  });
  detalhamento.sort((a, b) => b.data - a.data);

  const containerDetalhe = document.getElementById('relatorio-detalhamento');
  if (detalhamento.length === 0) {
    containerDetalhe.innerHTML = '<p class="text-slate-400 text-center py-4">Nenhuma sessão nesse período</p>';
  } else {
    containerDetalhe.innerHTML = detalhamento.map((item) => `
      <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
        <div>
          <span class="text-slate-400">${item.data.toLocaleDateString('pt-BR')}</span>
          <span class="ml-2">${item.nomeTema}</span>
        </div>
        <span class="font-medium">${formatarDuracao(item.minutos)}</span>
      </div>
    `).join('');
  }
}


function abrirModalRelatorio() {
  modalRelatorio.classList.remove('hidden');
  carregarRelatorio();
}

document.getElementById('btn-relatorio').addEventListener('click', abrirModalRelatorio);
document.getElementById('btn-fechar-relatorio').addEventListener('click', () => {
  modalRelatorio.classList.add('hidden');
});

document.querySelectorAll('.btn-modo-relatorio').forEach((btn) => {
  btn.addEventListener('click', () => {
    modoRelatorio = btn.dataset.modo;
    offsetRelatorio = 0; // volta pro período atual ao trocar semana/mês
    document.querySelectorAll('.btn-modo-relatorio').forEach((b) => b.classList.remove('bg-white', 'dark:bg-slate-600', 'shadow'));
    btn.classList.add('bg-white', 'dark:bg-slate-600', 'shadow');
    carregarRelatorio();
  });
});

document.getElementById('btn-periodo-anterior').addEventListener('click', () => {
  offsetRelatorio--;
  carregarRelatorio();
});

document.getElementById('btn-periodo-proximo').addEventListener('click', () => {
  offsetRelatorio++;
  carregarRelatorio();
});

// Marca "Semana" como ativo por padrão
document.querySelector('[data-modo="semana"]').classList.add('bg-white', 'dark:bg-slate-600', 'shadow');

const painelCor = document.getElementById('painel-cor');
const painelCorConteudo = document.getElementById('painel-cor-conteudo');

document.getElementById('btn-cor-dashboard').addEventListener('click', () => {
  painelCor.classList.remove('hidden');
  requestAnimationFrame(() => painelCorConteudo.classList.remove('translate-x-full'));
});
document.getElementById('btn-fechar-cor').addEventListener('click', () => {
  painelCorConteudo.classList.add('translate-x-full');
  setTimeout(() => painelCor.classList.add('hidden'), 300);
});
document.getElementById('overlay-cor').addEventListener('click', () => {
  document.getElementById('btn-fechar-cor').click();
});

// Cada passo aponta pra um elemento da tela (via seletor CSS) e o texto
// explicativo mostrado ao lado dele
const passosTour = [
  { seletor: '#btn-novo-tema', titulo: 'Crie seus temas', texto: 'Cadastre o que você quer estudar — cada tema pode ter sua própria meta de horas semanais.' },
  { seletor: '#btn-iniciar-sessao', titulo: 'Sala de Estudos', texto: 'Inicie uma sessão com cronômetro Pomodoro, música de fundo e lista de tarefas.' },
  { seletor: '#secao-stats', titulo: 'Acompanhe seu progresso', texto: 'Horas da semana, sequência de dias e % da meta atingida — tudo calculado automaticamente.' },
  { seletor: '#btn-relatorio', titulo: 'Relatórios', texto: 'Veja um detalhamento semanal ou mensal de tudo que você estudou.' },
  { seletor: '#btn-cor-dashboard', titulo: 'Deixe do seu jeito', texto: 'Personalize a cor de destaque do app aqui.' },
];
let passoAtualTour = 0;

function removerDestaqueAnterior() {
  document.querySelectorAll('.tour-highlight').forEach((el) => el.classList.remove('tour-highlight'));
}

function posicionarTooltipTour(elemento, tooltip) {
  const retangulo = elemento.getBoundingClientRect();
  const alturaTooltip = tooltip.offsetHeight;
  const larguraTooltip = tooltip.offsetWidth;

  let topo = retangulo.bottom + 12;
  let esquerda = retangulo.left;

  // Mantém o tooltip dentro da tela, ajustando se estiver perto da borda
  if (esquerda + larguraTooltip > window.innerWidth - 16) {
    esquerda = window.innerWidth - larguraTooltip - 16;
  }
  if (topo + alturaTooltip > window.innerHeight - 16) {
    topo = retangulo.top - alturaTooltip - 12; // mostra acima, se não couber embaixo
  }

  tooltip.style.top = `${topo}px`;
  tooltip.style.left = `${Math.max(16, esquerda)}px`;
}

function mostrarPassoTour() {
  removerDestaqueAnterior();

  if (passoAtualTour >= passosTour.length) {
    encerrarTour();
    return;
  }

  const passo = passosTour[passoAtualTour];
  const elemento = document.querySelector(passo.seletor);

  // Se o elemento não existir por algum motivo, pula pro próximo passo
  // em vez de travar o tour
  if (!elemento) {
    passoAtualTour++;
    mostrarPassoTour();
    return;
  }

  elemento.classList.add('tour-highlight');
  elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const tooltip = document.getElementById('tour-tooltip');
  tooltip.querySelector('.tour-progresso').textContent = `${passoAtualTour + 1} de ${passosTour.length}`;
  tooltip.querySelector('.tour-titulo').textContent = passo.titulo;
  tooltip.querySelector('.tour-texto').textContent = passo.texto;
  document.getElementById('btn-tour-proximo').textContent = passoAtualTour === passosTour.length - 1 ? 'Concluir' : 'Próximo';
  tooltip.classList.remove('hidden');

  // Espera o navegador terminar o scroll suave antes de posicionar o
  // tooltip, senão ele calcularia a posição errada (baseada no scroll antigo)
  setTimeout(() => posicionarTooltipTour(elemento, tooltip), 300);
}

function iniciarTour() {
  passoAtualTour = 0;
  mostrarPassoTour();
}

function encerrarTour() {
  removerDestaqueAnterior();
  document.getElementById('tour-tooltip').classList.add('hidden');
  localStorage.setItem('onboarding-completo', 'true');
}

document.getElementById('btn-tour-proximo').addEventListener('click', () => {
  passoAtualTour++;
  mostrarPassoTour();
});
document.getElementById('btn-tour-pular').addEventListener('click', encerrarTour);
document.getElementById('btn-refazer-tour').addEventListener('click', iniciarTour);

// Inicia automaticamente só na primeira vez que a pessoa usa o app —
// o pequeno atraso garante que a página (incluindo os temas carregados) já
// renderizou antes do tour começar a apontar para os elementos
if (!localStorage.getItem('onboarding-completo')) {
  setTimeout(iniciarTour, 800);
}
