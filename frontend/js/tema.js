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

aplicarTemaSalvo();
botaoTema.addEventListener('click', alternarTema);