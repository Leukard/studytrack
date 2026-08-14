exigirLogin();


let FOCO_MINUTOS = 25;
let PAUSA_MINUTOS = 5;

const secaoSelecaoTema = document.getElementById('secao-selecao-tema');
const secaoTimer = document.getElementById('secao-timer');
const selectTema = document.getElementById('select-tema');
const btnComecar = document.getElementById('btn-comecar');
const labelFase = document.getElementById('label-fase');
const displayTempo = document.getElementById('display-tempo');
const btnIniciarPausar = document.getElementById('btn-iniciar-pausar');
const btnPular = document.getElementById('btn-pular');
const btnEncerrar = document.getElementById('btn-encerrar');
const anelProgresso = document.getElementById('anel-progresso');
const RAIO = 130;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

// Define o tamanho total do traço do anel — precisa ser feito uma vez, via JS,
// porque o valor depende do raio do círculo (não dá pra fixar direto no CSS)
anelProgresso.style.strokeDasharray = CIRCUNFERENCIA;

// --- Variáveis da Rádio ---
const audioRadio = document.getElementById('audio-radio');
const btnPlayRadio = document.getElementById('btn-play-radio');
const selectRadio = document.getElementById('select-radio');
let radioTocando = false;

// Estado do cronômetro
let temaSelecionadoId = null;
let temaSelecionadoNome = null;
let fase = 'foco'; 
let segundosRestantes = FOCO_MINUTOS * 60;
let intervaloId = null;
let rodando = false;
let minutosFocadosAcumulados = 0;
let horarioFimFase = null; // timestamp (ms) de quando a fase atual deve terminar 

// Carrega os temas
async function carregarTemasNoSelect() {
  try {
    const temas = await api.listarTemas();
    temas.forEach((tema) => {
      const option = document.createElement('option');
      option.value = tema.id;
      option.textContent = tema.nome;
      selectTema.appendChild(option);
    });
  } catch (erro) {
    console.error('Erro ao carregar temas:', erro);
  }
}

selectTema.addEventListener('change', () => {
  btnComecar.disabled = !selectTema.value;
});

function formatarTempo(segundos) {
  const min = Math.floor(segundos / 60).toString().padStart(2, '0');
  const seg = (segundos % 60).toString().padStart(2, '0');
  return `${min}:${seg}`;
}

function atualizarDisplay() {
  displayTempo.textContent = formatarTempo(segundosRestantes);
  labelFase.textContent = fase === 'foco' ? 'Foco' : 'Pausa';

  // Calcula quanto falta da fase atual (0 = acabou de começar, 1 = terminou)
  // e ajusta o quanto do anel fica "apagado" via stroke-dashoffset
  const duracaoTotalFase = (fase === 'foco' ? FOCO_MINUTOS : PAUSA_MINUTOS) * 60;
  const fracaoDecorrida = 1 - segundosRestantes / duracaoTotalFase;
  anelProgresso.style.strokeDashoffset = CIRCUNFERENCIA * fracaoDecorrida;

  sincronizarPip();
}

function tick() {
  // Em vez de simplesmente decrementar, recalcula quanto falta de verdade
  // comparando com o relógio do sistema — corrige a imprecisão de abas
  // minimizadas/em segundo plano, onde o navegador atrasa o setInterval
  segundosRestantes = Math.max(0, Math.round((horarioFimFase - Date.now()) / 1000));

  if (segundosRestantes <= 0) {
    if (fase === 'foco') {
      minutosFocadosAcumulados += FOCO_MINUTOS;
    }
    trocarFase();
    return;
  }
  atualizarDisplay();
}


function iniciarOuPausar() {
  if (rodando) {
    clearInterval(intervaloId);
    rodando = false;
    btnIniciarPausar.textContent = 'Continuar';
  } else {
    // Recalcula o horário de término toda vez que inicia/retoma —
    // importante também para quando o usuário pausa e retoma depois
    horarioFimFase = Date.now() + segundosRestantes * 1000;
    intervaloId = setInterval(tick, 1000);
    rodando = true;
    btnIniciarPausar.textContent = 'Pausar';
    salvarEstadoTimer(); // adiciona esta linha
  }
  sincronizarPip();
}
function pular() {
  if (fase === 'foco') {
    const minutosDecorridos = FOCO_MINUTOS - Math.ceil(segundosRestantes / 60);
    minutosFocadosAcumulados += Math.max(0, minutosDecorridos);
  }
  trocarFase();
}

async function encerrar() {
  clearInterval(intervaloId);
  rodando = false;

  if (fase === 'foco') {
    const minutosDecorridos = FOCO_MINUTOS - Math.ceil(segundosRestantes / 60);
    minutosFocadosAcumulados += Math.max(0, minutosDecorridos);
  }

  if (minutosFocadosAcumulados > 0) {
    document.getElementById('resumo-tempo-total').textContent =
      `Você estudou ${formatarDuracao(minutosFocadosAcumulados)} de ${temaSelecionadoNome}`;
    document.getElementById('input-resumo-sessao').value = notasAcumuladas;
    document.getElementById('modal-resumo').classList.remove('hidden');
  } else {
    limparEstadoSalvo();
    window.location.href = 'dashboard.html';
  }
}


// Mostra uma notificação do sistema, mesmo se o usuário estiver em outra aba/janela
function notificarTrocaFase(novaFase) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const titulo = novaFase === 'pausa' ? 'Hora da pausa! ☕' : 'Hora de focar! 🎯';
  const corpo = novaFase === 'pausa'
    ? 'Você completou um ciclo de foco. Descanse um pouco.'
    : 'A pausa acabou. Bora voltar aos estudos.';

  new Notification(titulo, { body: corpo });
}

// Toca um beep curto usando a Web Audio API — não depende de nenhum arquivo de
// áudio externo, é gerado na hora, então sempre funciona
function tocarBeep() {
  const contexto = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  const oscilador = contexto.createOscillator();
  const ganho = contexto.createGain();

  oscilador.frequency.value = 880; // nota musical A5, som de "beep" claro
  ganho.gain.value = 0.3;

  oscilador.connect(ganho).connect(contexto.destination);
  oscilador.start();
  oscilador.stop(contexto.currentTime + 0.15); // toca por 150ms e para sozinho
}

function trocarFase() {
  fase = fase === 'foco' ? 'pausa' : 'foco';
  segundosRestantes = (fase === 'foco' ? FOCO_MINUTOS : PAUSA_MINUTOS) * 60;
  horarioFimFase = Date.now() + segundosRestantes * 1000;
  atualizarDisplay();

  tocarBeep();
  notificarTrocaFase(fase);
  salvarEstadoTimer(); // adiciona esta linha
}

document.getElementById('btn-salvar-resumo').addEventListener('click', async (e) => {
  const botao = e.target;
  if (botao.disabled) return;
  botao.disabled = true;
  botao.textContent = 'Salvando...';

  const campoResumo = document.getElementById('input-resumo-sessao');
  const textoExtra = campoResumo.value.slice(notasAcumuladas.length);
  const anotacao = adicionarLinhaComHorario(notasAcumuladas, textoExtra) || 'Sessão via Pomodoro';

  try {
    await api.criarSessao(temaSelecionadoId, minutosFocadosAcumulados, anotacao);
    limparEstadoSalvo();
    window.location.href = 'dashboard.html';
  } catch (erro) {
    alert('Não foi possível salvar a sessão: ' + erro.message);
    botao.disabled = false;
    botao.textContent = 'Salvar e voltar ao dashboard';
  }
});

// Formata minutos totais em algo como "1h 20min" (mesma lógica usada no dashboard.js)
function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const min = minutos % 60;
  if (horas === 0) return `${min}min`;
  if (min === 0) return `${horas}h`;
  return `${horas}h ${min}min`;
}

btnIniciarPausar.addEventListener('click', iniciarOuPausar);
btnPular.addEventListener('click', pular);
btnEncerrar.addEventListener('click', encerrar);
btnComecar.addEventListener('click', () => {
  // Pede permissão de notificação aqui, dentro de um clique real do usuário —
  // navegadores modernos bloqueiam esse pedido se ele não vier de uma interação direta
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }


  temaSelecionadoId = selectTema.value;
  temaSelecionadoNome = selectTema.options[selectTema.selectedIndex].textContent;

  secaoSelecaoTema.classList.add('hidden');
  secaoTimer.classList.remove('hidden');
  atualizarDisplay();
  notasAcumuladas = '';
  carregarTarefas(); 
  horarioFimFase = Date.now() + segundosRestantes * 1000;
  salvarEstadoTimer(); // adiciona esta linha
});

// Guarda o texto acumulado de anotações — não é um campo de tela, fica só em memória
// até a sessão ser encerrada, quando vira a anotação salva de verdade
let notasAcumuladas = '';

const modalAnotacao = document.getElementById('modal-anotacao');
const inputAnotacaoModal = document.getElementById('input-anotacao-modal');

document.getElementById('btn-abrir-anotacao').addEventListener('click', () => {
  inputAnotacaoModal.value = ''; // sempre abre vazio — só a entrada nova é digitada aqui
  modalAnotacao.classList.remove('hidden');
});

document.getElementById('btn-cancelar-anotacao').addEventListener('click', () => {
  modalAnotacao.classList.add('hidden');
});


function adicionarLinhaComHorario(base, textoNovo) {
  const texto = textoNovo.trim();
  if (!texto) return base;

  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const novaLinha = `[${agora}] ${texto}`;
  return base ? `${base}\n${novaLinha}` : novaLinha;
}

document.getElementById('btn-salvar-anotacao').addEventListener('click', () => {
  notasAcumuladas = adicionarLinhaComHorario(notasAcumuladas, inputAnotacaoModal.value);
  modalAnotacao.classList.add('hidden');
});

// --- Controle de Abas de Áudio ---
document.querySelectorAll('.btn-aba-audio').forEach((btn) => {
  btn.addEventListener('click', () => {
    const abaEscolhida = btn.dataset.aba;

    if (audioRadio && radioTocando) {
      audioRadio.pause();
      if(btnPlayRadio) btnPlayRadio.textContent = '▶';
      radioTocando = false;
    }
    if (player && typeof player.pauseVideo === 'function') {
      player.pauseVideo();
    }
    if (noiseSource) {
      pararSomAmbiente();
    }

    document.querySelectorAll('.aba-audio').forEach((secao) => secao.classList.add('hidden'));
    document.getElementById(`aba-${abaEscolhida}`).classList.remove('hidden');

    document.querySelectorAll('.btn-aba-audio').forEach((b) => {
      b.classList.remove('bg-white', 'dark:bg-slate-600', 'shadow');
    });
    btn.classList.add('bg-white', 'dark:bg-slate-600', 'shadow');

    // A MÁGICA AQUI: Tenta iniciar o YouTube apenas quando a aba ficar visível!
    if (typeof tentarCriarPlayerYoutube === 'function') {
      setTimeout(tentarCriarPlayerYoutube, 150);
    }
  });
});

// Define aba inicial padrão
const abaPadrao = document.querySelector('[data-aba="radio"]');
if (abaPadrao) abaPadrao.classList.add('bg-white', 'dark:bg-slate-600', 'shadow');

// ==========================================
// YOUTUBE API E CONTROLES (Com Filtro Blindado de ID)
// ==========================================
const tagScriptYoutube = document.createElement('script');
tagScriptYoutube.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(tagScriptYoutube);

let player = null;
let videoEscondido = false;
let apiYoutubePronta = false;

const selectMusica = document.getElementById('select-musica');
const inputVolume = document.getElementById('input-volume');
const btnToggleVideo = document.getElementById('btn-toggle-video');
const videoWrapper = document.getElementById('video-wrapper');
const inputLinkMusica = document.getElementById('input-link-musica');
const btnCarregarMusica = document.getElementById('btn-carregar-musica');
const divPlayerOriginal = document.getElementById('player-youtube');

// --- Função Super Limpadora de IDs ---
// Ela pega qualquer coisa (link longo, link curto, ID puro ou erro) e tenta extrair os 11 caracteres.
function extrairId(texto) {
  if (!texto) return null;
  const textoLimpo = texto.trim();
  
  // Se o texto já tiver exatamente 11 caracteres e não tiver barras (já é um ID puro)
  if (textoLimpo.length === 11 && !textoLimpo.includes('/')) return textoLimpo;
  
  // Se for um link, corta e pega só o ID
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = textoLimpo.match(regex);
  
  return match ? match[1] : null;
}

window.onYouTubeIframeAPIReady = function() {
  apiYoutubePronta = true;
  tentarCriarPlayerYoutube();
};

function tentarCriarPlayerYoutube() {
  if (apiYoutubePronta && !player && divPlayerOriginal && divPlayerOriginal.offsetParent !== null) {
    
    // Passa o valor do select pela função limpadora antes de mandar pro YouTube
    let idParaTocar = 'jfKfPfyJRdk'; // Lofi Girl (Padrão e seguro)
    
    if (selectMusica && selectMusica.value) {
      const idDoMenu = extrairId(selectMusica.value);
      if (idDoMenu) {
        idParaTocar = idDoMenu;
      }
    }

    player = new YT.Player('player-youtube', {
      videoId: idParaTocar,
      playerVars: { autoplay: 0 },
      events: {
        onReady: (e) => {
          if (inputVolume) e.target.setVolume(Number(inputVolume.value));
        }
      }
    });
  }
}

// 1. Trocar música pelo menu
if (selectMusica) {
  selectMusica.addEventListener('change', () => {
    if (player && typeof player.loadVideoById === 'function') {
      const novoId = extrairId(selectMusica.value);
      
      if (novoId) {
        player.loadVideoById(novoId);
      }
      // Limpa o campo do link colado para não confundir
      if (inputLinkMusica) inputLinkMusica.value = '';
    }
  });
}

// 2. Trocar música colando o link
if (btnCarregarMusica && inputLinkMusica) {
  btnCarregarMusica.addEventListener('click', () => {
    const novoId = extrairId(inputLinkMusica.value);

    if (novoId) {
      if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById(novoId);
        inputLinkMusica.value = ''; 
      }
    } else {
      alert('Link do YouTube inválido. Por favor, cole a URL completa do vídeo.');
    }
  });
}

// 3. Esconder/Mostrar vídeo
if (btnToggleVideo) {
  btnToggleVideo.addEventListener('click', () => {
    videoEscondido = !videoEscondido;
    if (videoEscondido) {
      videoWrapper.classList.remove('max-h-96', 'opacity-100');
      videoWrapper.classList.add('max-h-0', 'opacity-0');
      btnToggleVideo.textContent = '🎵 Mostrar vídeo';
    } else {
      videoWrapper.classList.remove('max-h-0', 'opacity-0');
      videoWrapper.classList.add('max-h-96', 'opacity-100');
      btnToggleVideo.textContent = '🎵 Esconder vídeo (música continua)';
    }
  });
}

// ==========================================
// SONS AMBIENTES GERADOS (WEB AUDIO API)
// ==========================================
let audioContext = null;
let noiseSource = null;
let filtroChuva = null;
let ganhoAmbiente = null; 
let tipoSomAtivo = null;

function criarBufferRuido(contexto) {
  const duracaoSegundos = 2;
  const tamanho = contexto.sampleRate * duracaoSegundos;
  const buffer = contexto.createBuffer(1, tamanho, contexto.sampleRate);
  const dados = buffer.getChannelData(0);
  for (let i = 0; i < tamanho; i++) {
    dados[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function pararSomAmbiente() {
  if (noiseSource) {
    noiseSource.stop();
    noiseSource = null;
  }
  if (osciladorLfo) {
    osciladorLfo.stop();
    osciladorLfo = null;
  }
  tipoSomAtivo = null;
  document.querySelectorAll('.btn-som-ambiente').forEach((btn) => {
    btn.classList.remove('bg-brand-600', 'text-white', 'border-brand-600');
  });
}

let osciladorLfo = null; // referência ao LFO das ondas, para parar corretamente

function tocarSomAmbiente(tipo) {
  if (tipoSomAtivo === tipo) {
    pararSomAmbiente();
    return;
  }

  pararSomAmbiente();

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  ganhoAmbiente = audioContext.createGain();
  ganhoAmbiente.gain.value = Number(inputVolume.value) / 100;

  let buffer;
  if (tipo === 'rosa') {
    buffer = criarBufferRuidoRosa(audioContext);
  } else {
    buffer = criarBufferRuido(audioContext); // branco, chuva e ondas partem do branco
  }

  noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  if (tipo === 'branco' || tipo === 'rosa') {
    noiseSource.connect(ganhoAmbiente).connect(audioContext.destination);
  } else if (tipo === 'chuva') {
    // Filtro mais largo e grave (lowpass) em vez do bandpass estreito anterior —
    // resolve o "chiado"/som metálico que o filtro antigo causava
    filtroChuva = audioContext.createBiquadFilter();
    filtroChuva.type = 'lowpass';
    filtroChuva.frequency.value = 2500;
    filtroChuva.Q.value = 0.5;
    noiseSource.connect(filtroChuva).connect(ganhoAmbiente).connect(audioContext.destination);
  } else if (tipo === 'ondas') {
    const filtroOndas = audioContext.createBiquadFilter();
    filtroOndas.type = 'lowpass';
    filtroOndas.frequency.value = 600;
    noiseSource.connect(filtroOndas).connect(ganhoAmbiente).connect(audioContext.destination);
    osciladorLfo = criarOscilOndas(audioContext, ganhoAmbiente);
  }

  noiseSource.start();
  tipoSomAtivo = tipo;

  document.querySelector(`[data-tipo="${tipo}"]`).classList.add('bg-brand-600', 'text-white', 'border-brand-600');
}

document.querySelectorAll('.btn-som-ambiente').forEach((btn) => {
  btn.addEventListener('click', () => tocarSomAmbiente(btn.dataset.tipo));
});

// Ruído rosa: mesma ideia do ruído branco, mas atenuando gradualmente as
// frequências mais agudas — soa mais suave, menos "áspero" ao ouvido
function criarBufferRuidoRosa(contexto) {
  const duracaoSegundos = 2;
  const tamanho = contexto.sampleRate * duracaoSegundos;
  const buffer = contexto.createBuffer(1, tamanho, contexto.sampleRate);
  const dados = buffer.getChannelData(0);

  // Algoritmo de Paul Kellet: filtra o ruído branco em camadas,
  // aproximando o espectro característico do ruído rosa
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < tamanho; i++) {
    const branco = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + branco * 0.0555179;
    b1 = 0.99332 * b1 + branco * 0.0750759;
    b2 = 0.96900 * b2 + branco * 0.1538520;
    b3 = 0.86650 * b3 + branco * 0.3104856;
    b4 = 0.55000 * b4 + branco * 0.5329522;
    b5 = -0.7616 * b5 - branco * 0.0168980;
    dados[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + branco * 0.5362) * 0.11;
    b6 = branco * 0.115926;
  }

  return buffer;
}

// Simula ondas: ruído filtrado grave, com o volume "respirando" lentamente
// (LFO controlando o ganho) para imitar o vaivém natural das ondas
function criarOscilOndas(contexto, ganhoDestino) {
  const lfo = contexto.createOscillator();
  const ganhoLfo = contexto.createGain();

  lfo.frequency.value = 0.15; // um ciclo completo a cada ~6.5 segundos
  ganhoLfo.gain.value = 0.3; // o quanto o volume varia (30% pra cima/baixo)

  lfo.connect(ganhoLfo);
  ganhoLfo.connect(ganhoDestino.gain); // modula o próprio ganho principal
  lfo.start();

  return lfo; // guardamos a referência pra poder parar depois
}


// ==========================================
// CONTROLES DE VOLUME COMPARTILHADOS E RÁDIO
// ==========================================
inputVolume.addEventListener('input', () => {
  const valor = Number(inputVolume.value);

  if (player && typeof player.setVolume === 'function') {
    player.setVolume(valor);
  }
  if (ganhoAmbiente) {
    ganhoAmbiente.gain.value = valor / 100;
  }
  if (audioRadio) {
    audioRadio.volume = valor / 100; 
  }
});

// Lógica de Play/Pause da Rádio
if (btnPlayRadio && audioRadio) {
  btnPlayRadio.addEventListener('click', () => {
    if (radioTocando) {
      audioRadio.pause();
      btnPlayRadio.textContent = '▶';
      radioTocando = false;
    } else {
      if (player && typeof player.pauseVideo === 'function') player.pauseVideo();
      if (noiseSource) pararSomAmbiente();

      audioRadio.volume = Number(inputVolume.value) / 100;
      audioRadio.play();
      btnPlayRadio.textContent = '⏸';
      radioTocando = true;
    }
  });
}

// Troca de Estação da Rádio
if (selectRadio && audioRadio) {
  selectRadio.addEventListener('change', () => {
    audioRadio.src = selectRadio.value;
    if (radioTocando) {
      audioRadio.play();
    }
  });
}

const painelConfiguracoes = document.getElementById('painel-configuracoes');
const painelConteudo = document.getElementById('painel-conteudo');
const valorFoco = document.getElementById('valor-foco');
const valorPausa = document.getElementById('valor-pausa');

function abrirPainelConfiguracoes() {
  painelConfiguracoes.classList.remove('hidden');
  // Pequeno atraso antes de tirar o translate — garante que a transição CSS
  // seja percebida (senão o painel "salta" direto pra posição final, sem animação)
  requestAnimationFrame(() => painelConteudo.classList.remove('translate-x-full'));
}

function fecharPainelConfiguracoes() {
  painelConteudo.classList.add('translate-x-full');
  setTimeout(() => painelConfiguracoes.classList.add('hidden'), 300);
}

document.getElementById('btn-configuracoes').addEventListener('click', abrirPainelConfiguracoes);
document.getElementById('btn-fechar-configuracoes').addEventListener('click', fecharPainelConfiguracoes);
document.getElementById('overlay-configuracoes').addEventListener('click', fecharPainelConfiguracoes);

// Ajusta as durações dentro de limites razoáveis (1 a 60min pro foco, 1 a 30min pra pausa)
document.querySelectorAll('.btn-ajustar-tempo').forEach((btn) => {
  btn.addEventListener('click', () => {
    const campo = btn.dataset.campo;
    const delta = Number(btn.dataset.delta);

    if (campo === 'foco') {
      FOCO_MINUTOS = Math.min(60, Math.max(5, FOCO_MINUTOS + delta));
      valorFoco.textContent = `${FOCO_MINUTOS} min`;
    } else {
      PAUSA_MINUTOS = Math.min(30, Math.max(1, PAUSA_MINUTOS + delta));
      valorPausa.textContent = `${PAUSA_MINUTOS} min`;
    }

    // Se o cronômetro ainda não começou a rodar, reflete a mudança na tela na hora
    if (!rodando && fase === campo) {
      segundosRestantes = (campo === 'foco' ? FOCO_MINUTOS : PAUSA_MINUTOS) * 60;
      atualizarDisplay();
    }
  });
});

const painelAudio = document.getElementById('painel-audio');
const painelAudioConteudo = document.getElementById('painel-audio-conteudo');

function abrirPainelAudio() {
  painelAudio.classList.remove('hidden');
  requestAnimationFrame(() => painelAudioConteudo.classList.remove('translate-x-full'));
}

function fecharPainelAudio() {
  painelAudioConteudo.classList.add('translate-x-full');
  setTimeout(() => painelAudio.classList.add('hidden'), 300);
}

document.getElementById('btn-audio').addEventListener('click', abrirPainelAudio);
document.getElementById('btn-fechar-audio').addEventListener('click', fecharPainelAudio);
document.getElementById('overlay-audio').addEventListener('click', fecharPainelAudio);

const listaTarefas = document.getElementById('lista-tarefas');
const formNovaTarefa = document.getElementById('form-nova-tarefa');
const inputNovaTarefa = document.getElementById('input-nova-tarefa');

// Monta o HTML de uma linha de tarefa, com checkbox e botão de excluir
function criarLinhaTarefa(tarefa) {
  const div = document.createElement('div');
  div.className = 'flex items-center gap-2 group';
  div.innerHTML = `
    <input type="checkbox" data-id="${tarefa.id}" ${tarefa.concluida ? 'checked' : ''}
      class="checkbox-tarefa w-4 h-4 rounded accent-brand-600 cursor-pointer" />
    <span class="flex-1 text-sm ${tarefa.concluida ? 'line-through text-slate-400' : ''}">${tarefa.descricao}</span>
    <button data-id="${tarefa.id}" class="btn-deletar-tarefa opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-xs">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;
  return div;
}

// Busca e renderiza as tarefas do tema selecionado — chamada quando a sessão começa
async function carregarTarefas() {
  try {
    const tarefas = await api.listarTarefasPorTema(temaSelecionadoId);
    listaTarefas.innerHTML = '';
    tarefas.forEach((tarefa) => listaTarefas.appendChild(criarLinhaTarefa(tarefa)));
    lucide.createIcons();
    ligarEventosTarefas();
  } catch (erro) {
    console.error('Erro ao carregar tarefas:', erro);
  }
}

// Liga os checkboxes e botões de excluir — precisa ser re-executado a cada
// renderização, já que os elementos são recriados do zero toda vez
function ligarEventosTarefas() {
  document.querySelectorAll('.checkbox-tarefa').forEach((chk) => {
    chk.addEventListener('change', async () => {
      await api.atualizarTarefa(chk.dataset.id, { concluida: chk.checked });
      carregarTarefas();
    });
  });

  document.querySelectorAll('.btn-deletar-tarefa').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api.deletarTarefa(btn.dataset.id);
      carregarTarefas();
    });
  });
}

formNovaTarefa.addEventListener('submit', async (e) => {
  e.preventDefault();
  const descricao = inputNovaTarefa.value.trim();
  if (!descricao) return;

  await api.criarTarefa(temaSelecionadoId, descricao);
  inputNovaTarefa.value = '';
  carregarTarefas();
});

const CHAVE_ESTADO = 'pomodoro_estado_ativo';

// Salva tudo que é necessário para reconstruir o cronômetro do zero,
// mesmo que a página seja completamente recarregada
function salvarEstadoTimer() {
  if (!temaSelecionadoId) return; // não há sessão ativa, nada a salvar

  localStorage.setItem(CHAVE_ESTADO, JSON.stringify({
    temaSelecionadoId,
    temaSelecionadoNome,
    fase,
    rodando,
    horarioFimFase,
    segundosRestantesPausado: rodando ? null : segundosRestantes,
    minutosFocadosAcumulados,
    notasAcumuladas,
    focoMinutos: FOCO_MINUTOS,
    pausaMinutos: PAUSA_MINUTOS,
  }));
}

function limparEstadoSalvo() {
  localStorage.removeItem(CHAVE_ESTADO);
}

// Ao carregar a página, verifica se havia uma sessão em andamento e a
// reconstrói — sempre recalculando o tempo restante pelo relógio real,
// nunca confiando em quanto tempo "parece" ter passado
function restaurarEstadoSalvo() {
  const salvo = localStorage.getItem(CHAVE_ESTADO);
  if (!salvo) return false;

  const estado = JSON.parse(salvo);

  temaSelecionadoId = estado.temaSelecionadoId;
  temaSelecionadoNome = estado.temaSelecionadoNome;
  fase = estado.fase;
  rodando = estado.rodando;
  minutosFocadosAcumulados = estado.minutosFocadosAcumulados;
  notasAcumuladas = estado.notasAcumuladas || '';
  FOCO_MINUTOS = estado.focoMinutos;
  PAUSA_MINUTOS = estado.pausaMinutos;
  horarioFimFase = estado.horarioFimFase;

  if (rodando) {
    // Processa quantas fases já deveriam ter passado enquanto o app
    // estava fechado/suspenso (normalmente 0, mas cobre o caso de o
    // usuário ter ficado bastante tempo fora)
    while (Date.now() >= horarioFimFase) {
      if (fase === 'foco') minutosFocadosAcumulados += FOCO_MINUTOS;
      fase = fase === 'foco' ? 'pausa' : 'foco';
      const duracao = (fase === 'foco' ? FOCO_MINUTOS : PAUSA_MINUTOS) * 60;
      horarioFimFase += duracao * 1000;
    }
    segundosRestantes = Math.round((horarioFimFase - Date.now()) / 1000);
  } else {
    segundosRestantes = estado.segundosRestantesPausado;
  }

  secaoSelecaoTema.classList.add('hidden');
  secaoTimer.classList.remove('hidden');
  atualizarDisplay();
  carregarTarefas();

  if (rodando) {
    intervaloId = setInterval(tick, 1000);
    btnIniciarPausar.textContent = 'Pausar';
  } else {
    btnIniciarPausar.textContent = 'Continuar';
  }

  return true;
}

// Dispara sempre que a aba/app volta a ficar visível (ex: trocou de app no
// celular e voltou) — recalcula na hora, sem esperar até 1 segundo pelo
// próximo tick natural do setInterval
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && rodando) {
    tick();
  }
});

// Inicializa a tela: tenta restaurar uma sessão salva; se não houver
// nenhuma, carrega a lista de temas normalmente para começar do zero
if (!restaurarEstadoSalvo()) {
  carregarTemasNoSelect();
}

// Aplica um gradiente CSS como fundo da tela do cronômetro, ou remove
// (fundo padrão) se o valor for 'none'
function aplicarFundo(valor) {
  const body = document.body;
  if (valor === 'none' || !valor) {
    body.style.backgroundImage = '';
  } else if (valor.startsWith('linear-gradient')) {
    body.style.backgroundImage = valor;
  } else {
    // URL de imagem (usado depois, no upload de foto própria)
    body.style.backgroundImage = `url('${valor}')`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
  }
  localStorage.setItem('fundo-sala-estudos', valor);
}

// Restaura o fundo salvo ao carregar a página
const fundoSalvo = localStorage.getItem('fundo-sala-estudos');
if (fundoSalvo) aplicarFundo(fundoSalvo);

document.querySelectorAll('.btn-fundo').forEach((btn) => {
  btn.addEventListener('click', () => aplicarFundo(btn.dataset.fundo));
});

// Extrai o ID do usuário direto do token (mesma técnica usada no dashboard.js
// para pegar o nome) — evita precisar de uma chamada extra à API só pra isso
function obterUserId() {
  try {
    const token = localStorage.getItem('access_token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch {
    return null;
  }
}

// Cliente autenticado criado uma única vez, reaproveitado em cada upload —
// evita acumular múltiplas instâncias do GoTrueClient na mesma página
const tokenParaUpload = localStorage.getItem('access_token');
const clienteAutenticado = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${tokenParaUpload}` } },
});

document.getElementById('input-upload-fundo').addEventListener('change', async (evento) => {
  const arquivo = evento.target.files[0];
  if (!arquivo) return;

  if (arquivo.size > 5 * 1024 * 1024) {
    alert('A imagem deve ter no máximo 5MB.');
    return;
  }

  const userId = obterUserId();
  const extensao = arquivo.name.split('.').pop();
  const caminho = `${userId}/fundo.${extensao}`;

  try {
    const { error } = await clienteAutenticado.storage
  .from('fundos')
  .upload(caminho, arquivo, { upsert: true });

    if (error) throw error;

    const { data } = clienteAutenticado.storage.from('fundos').getPublicUrl(caminho);
// Adiciona um parâmetro com o timestamp atual — isso muda a URL "tecnicamente"
// (do ponto de vista do navegador), forçando ele a buscar a versão nova
// em vez de usar a imagem antiga que tinha em cache
aplicarFundo(`${data.publicUrl}?t=${Date.now()}`);
  } catch (erro) {
    alert('Não foi possível enviar a imagem: ' + erro.message);
  }
});


let janelaPip = null;
let displayTempoPip = null;
let labelFasePip = null;
let btnIniciarPausarPip = null;
let anelProgressoPip = null;

async function abrirModoPip() {
  if (!('documentPictureInPicture' in window)) {
    alert('Janela flutuante não é suportada nesse navegador. Funciona no Chrome ou Edge (versões recentes).');
    return;
  }

  janelaPip = await documentPictureInPicture.requestWindow({ width: 260, height: 300 });

  // Monta o HTML da mini-janela primeiro — o Tailwind, carregado a seguir,
  // vai escanear esse conteúdo e gerar só as classes CSS necessárias
  janelaPip.document.head.innerHTML = `
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; font-family: 'Inter', sans-serif; }
      :root {
        --cor-brand-500: ${getComputedStyle(document.documentElement).getPropertyValue('--cor-brand-500')};
        --cor-brand-600: ${getComputedStyle(document.documentElement).getPropertyValue('--cor-brand-600')};
      }
    </style>
  `;
 janelaPip.document.body.innerHTML = `
  <div class="bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center h-screen gap-2 px-4">
    <div class="relative w-48 h-48">
      <svg class="transform -rotate-90 w-full h-full" viewBox="0 0 300 300">
        <circle cx="150" cy="150" r="130" stroke-width="14" fill="none" class="text-slate-200 dark:text-slate-700" stroke="currentColor" />
        <circle id="pip-anel-progresso" cx="150" cy="150" r="130" stroke-width="14" fill="none"
          stroke-linecap="round" class="text-brand-600 dark:text-brand-500" stroke="currentColor"
          style="transition: stroke-dashoffset 1s linear;" />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <p id="pip-label-fase" class="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1"></p>
        <p id="pip-display-tempo" class="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white"></p>
      </div>
    </div>
    <button id="pip-btn-iniciar" class="px-5 py-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all active:scale-95"></button>
  </div>
`;

  janelaPip.document.documentElement.classList.toggle('dark', document.documentElement.classList.contains('dark'));

  // Carrega o Tailwind DENTRO da janela PiP — ele vai escanear o conteúdo
  // que já colocamos acima e gerar as classes CSS necessárias sozinho
  const scriptTailwind = janelaPip.document.createElement('script');
  scriptTailwind.src = 'https://cdn.tailwindcss.com';
  scriptTailwind.onload = () => {
    janelaPip.tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: { brand: { 500: 'var(--cor-brand-500)', 600: 'var(--cor-brand-600)' } },
        },
      },
    };
  };
  janelaPip.document.head.appendChild(scriptTailwind);

 displayTempoPip = janelaPip.document.getElementById('pip-display-tempo');
labelFasePip = janelaPip.document.getElementById('pip-label-fase');
btnIniciarPausarPip = janelaPip.document.getElementById('pip-btn-iniciar');
anelProgressoPip = janelaPip.document.getElementById('pip-anel-progresso');
anelProgressoPip.style.strokeDasharray = CIRCUNFERENCIA; // mesmo raio/circunferência do anel principal

  sincronizarPip();
  btnIniciarPausarPip.addEventListener('click', iniciarOuPausar);

  janelaPip.addEventListener('pagehide', () => {
    janelaPip = null;
    displayTempoPip = null;
    labelFasePip = null;
    btnIniciarPausarPip = null;
  });
}

// Atualiza a mini-janela, se ela estiver aberta — chamada sempre que o
// cronômetro principal também é atualizado, mantendo os dois em sincronia
function sincronizarPip() {
  if (!janelaPip) return;
  displayTempoPip.textContent = formatarTempo(segundosRestantes);
  labelFasePip.textContent = fase === 'foco' ? 'Foco' : 'Pausa';
  btnIniciarPausarPip.textContent = rodando ? 'Pausar' : (segundosRestantes < (fase === 'foco' ? FOCO_MINUTOS : PAUSA_MINUTOS) * 60 ? 'Continuar' : 'Iniciar');

  // Mesmo cálculo de progresso usado no anel principal, reaplicado aqui
  const duracaoTotalFase = (fase === 'foco' ? FOCO_MINUTOS : PAUSA_MINUTOS) * 60;
  const fracaoDecorrida = 1 - segundosRestantes / duracaoTotalFase;
  anelProgressoPip.style.strokeDashoffset = CIRCUNFERENCIA * fracaoDecorrida;
}

document.getElementById('btn-pip').addEventListener('click', abrirModoPip);


// Tenta iniciar o youtube caso a página já inicie com a aba do Youtube visível
setTimeout(tentarCriarPlayerYoutube, 500);

lucide.createIcons();