const html = document.documentElement;
const botaoTema = document.getElementById('toggle-tema');
const iconeTema = document.getElementById('icone-tema');

// Aplica o tema salvo no localStorage assim que a página carrega,
// antes de qualquer clique — evita "flash" do tema errado ao abrir a página
function aplicarTemaSalvo() {
  const temaSalvo = localStorage.getItem('tema');
  if (temaSalvo === 'dark') {
    html.classList.add('dark');
    iconeTema.textContent = '☀️';
  } else {
    html.classList.remove('dark');
    iconeTema.textContent = '🌙';
  }
}

// Alterna a classe 'dark' na tag <html>, que é o gatilho usado pelo Tailwind
// (configurado com darkMode: 'class') para aplicar os estilos dark:
function alternarTema() {
  const escuroAtivo = html.classList.toggle('dark');
  localStorage.setItem('tema', escuroAtivo ? 'dark' : 'light');
  iconeTema.textContent = escuroAtivo ? '☀️' : '🌙';
}

// Aplica a cor de destaque salva (ou o padrão, se nunca foi escolhida) —
// roda em toda página, assim a cor fica consistente em login/dashboard/sala
function aplicarCorSalva() {
  const cor500 = localStorage.getItem('cor-brand-500');
  const cor600 = localStorage.getItem('cor-brand-600');
  if (cor500 && cor600) {
    document.documentElement.style.setProperty('--cor-brand-500', cor500);
    document.documentElement.style.setProperty('--cor-brand-600', cor600);
  }
}
aplicarCorSalva();

document.querySelectorAll('.btn-cor-tema').forEach((btn) => {
  btn.addEventListener('click', () => aplicarCor(btn.dataset.c600));
});

document.querySelectorAll('.input-cor-personalizada').forEach((input) => {
  input.addEventListener('input', () => aplicarCor(input.value));
});

aplicarCorSalva();

// Os botões de cor só existem na página da sala de estudos (dentro do
// painel de configurações) — verificamos antes de tentar usar
document.querySelectorAll('.btn-cor-tema').forEach((btn) => {
  btn.addEventListener('click', () => {
    const c500 = btn.dataset.c500;
    const c600 = btn.dataset.c600;

    document.documentElement.style.setProperty('--cor-brand-500', c500);
    document.documentElement.style.setProperty('--cor-brand-600', c600);
    localStorage.setItem('cor-brand-500', c500);
    localStorage.setItem('cor-brand-600', c600);
  });
});

// Clareia uma cor hexadecimal misturando com branco — usado para gerar a
// variante "500" (mais clara) automaticamente a partir da cor escolhida (600)
function clarearCor(hex, quantidade = 0.25) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const novoR = Math.round(r + (255 - r) * quantidade);
  const novoG = Math.round(g + (255 - g) * quantidade);
  const novoB = Math.round(b + (255 - b) * quantidade);

  return `#${novoR.toString(16).padStart(2, '0')}${novoG.toString(16).padStart(2, '0')}${novoB.toString(16).padStart(2, '0')}`;
}

function aplicarCor(corEscolhida) {
  // Se a cor for clara demais (brilho > 180, numa escala de 0-255), escurece
  // gradualmente até ficar escura o suficiente para o texto branco continuar legível
  let cor600 = corEscolhida;
  let tentativas = 0;
  while (calcularBrilho(cor600) > 180 && tentativas < 10) {
    cor600 = escurecerCor(cor600, 0.15);
    tentativas++;
  }

  const cor500 = clarearCor(cor600);
  document.documentElement.style.setProperty('--cor-brand-500', cor500);
  document.documentElement.style.setProperty('--cor-brand-600', cor600);
  localStorage.setItem('cor-brand-500', cor500);
  localStorage.setItem('cor-brand-600', cor600);
}

// Calcula o brilho percebido de uma cor (0 = preto, 255 = branco) usando
// a fórmula padrão de luminância relativa ponderada por como o olho humano
// percebe cada componente de cor
function calcularBrilho(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Escurece uma cor misturando com preto — usado quando a cor escolhida
// é clara demais para manter legibilidade do texto branco nos botões
function escurecerCor(hex, quantidade) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const novoR = Math.round(r * (1 - quantidade));
  const novoG = Math.round(g * (1 - quantidade));
  const novoB = Math.round(b * (1 - quantidade));

  return `#${novoR.toString(16).padStart(2, '0')}${novoG.toString(16).padStart(2, '0')}${novoB.toString(16).padStart(2, '0')}`;
}

aplicarTemaSalvo();
botaoTema.addEventListener('click', alternarTema);