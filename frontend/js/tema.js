const html = document.documentElement;
const botaoTema = document.getElementById('toggle-tema');
const iconeTema = document.getElementById('icone-tema');

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

function alternarTema() {
  const escuroAtivo = html.classList.toggle('dark');
  localStorage.setItem('tema', escuroAtivo ? 'dark' : 'light');
  iconeTema.textContent = escuroAtivo ? '☀️' : '🌙';
}

aplicarTemaSalvo();
botaoTema.addEventListener('click', alternarTema);