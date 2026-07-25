exigirLogin();

const FOCO_MINUTOS = 25;
const PAUSA_MINUTOS = 5;

const secaoSelecaoTema = document.getElementById('secao-selecao-tema');
const secaoTimer = document.getElementById('secao-timer');
const selectTema = document.getElementById('select-tema');
const btnComecar = document.getElementById('btn-comecar');
const labelFase = document.getElementById('label-fase');
const displayTempo = document.getElementById('display-tempo');
const btnIniciarPausar = document.getElementById('btn-iniciar-pausar');
const btnPular = document.getElementById('btn-pular');
const btnEncerrar = document.getElementById('btn-encerrar');

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
}

function tick() {
  segundosRestantes--;
  if (segundosRestantes <= 0) {
    if (fase === 'foco') {
      minutosFocadosAcumulados += FOCO_MINUTOS;
    }
    trocarFase();
    return;
  }
  atualizarDisplay();
}

function trocarFase() {
  fase = fase === 'foco' ? 'pausa' : 'foco';
  segundosRestantes = (fase === 'foco' ? FOCO_MINUTOS : PAUSA_MINUTOS) * 60;
  atualizarDisplay();
}

function iniciarOuPausar() {
  if (rodando) {
    clearInterval(intervaloId);
    rodando = false;
    btnIniciarPausar.textContent = 'Continuar';
  } else {
    intervaloId = setInterval(tick, 1000);
    rodando = true;
    btnIniciarPausar.textContent = 'Pausar';
  }
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
    // Mostra quanto tempo foi estudado e pede o resumo antes de salvar
    document.getElementById('resumo-tempo-total').textContent =
      `Você estudou ${formatarDuracao(minutosFocadosAcumulados)} de ${temaSelecionadoNome}`;
    document.getElementById('modal-resumo').classList.remove('hidden');
  } else {
    // Sem tempo estudado (encerrou muito cedo) — não faz sentido pedir resumo
    window.location.href = 'dashboard.html';
  }
}

document.getElementById('btn-salvar-resumo').addEventListener('click', async () => {
  const anotacao = document.getElementById('input-resumo-sessao').value || 'Sessão via Pomodoro';

  try {
    await api.criarSessao(temaSelecionadoId, minutosFocadosAcumulados, anotacao);
  } catch (erro) {
    alert('Não foi possível salvar a sessão: ' + erro.message);
  }

  window.location.href = 'dashboard.html';
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
  temaSelecionadoId = selectTema.value;
  temaSelecionadoNome = selectTema.options[selectTema.selectedIndex].textContent;

  secaoSelecaoTema.classList.add('hidden');
  secaoTimer.classList.remove('hidden');
  atualizarDisplay();
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
  tipoSomAtivo = null;
  document.querySelectorAll('.btn-som-ambiente').forEach((btn) => {
    btn.classList.remove('bg-brand-600', 'text-white', 'border-brand-600');
  });
}

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

  const buffer = criarBufferRuido(audioContext);
  noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  if (tipo === 'branco') {
    noiseSource.connect(ganhoAmbiente).connect(audioContext.destination);
  } else if (tipo === 'chuva') {
    filtroChuva = audioContext.createBiquadFilter();
    filtroChuva.type = 'bandpass';
    filtroChuva.frequency.value = 500;
    filtroChuva.Q.value = 0.5;
    noiseSource.connect(filtroChuva).connect(ganhoAmbiente).connect(audioContext.destination);
  }

  noiseSource.start();
  tipoSomAtivo = tipo;

  document.querySelector(`[data-tipo="${tipo}"]`).classList.add('bg-brand-600', 'text-white', 'border-brand-600');
}

document.querySelectorAll('.btn-som-ambiente').forEach((btn) => {
  btn.addEventListener('click', () => tocarSomAmbiente(btn.dataset.tipo));
});

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

// Inicializa a tela
carregarTemasNoSelect();

// Tenta iniciar o youtube caso a página já inicie com a aba do Youtube visível
setTimeout(tentarCriarPlayerYoutube, 500);