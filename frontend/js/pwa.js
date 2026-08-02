let promptDeInstalacao = null;

const bannerInstalar = document.getElementById('banner-instalar');
const btnAbrirInstalar = document.getElementById('btn-abrir-instalar');

window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault();
  promptDeInstalacao = evento;
});

// Agora o banner só aparece quando o usuário clica no botão do cabeçalho —
// nada de exibição automática ao carregar a página
btnAbrirInstalar?.addEventListener('click', () => {
  bannerInstalar.classList.toggle('hidden');
});

document.getElementById('btn-fechar-banner')?.addEventListener('click', () => {
  bannerInstalar.classList.add('hidden');
});

document.getElementById('btn-instalar-app')?.addEventListener('click', async () => {
  if (promptDeInstalacao) {
    promptDeInstalacao.prompt();
    await promptDeInstalacao.userChoice;
    promptDeInstalacao = null;
    bannerInstalar.classList.add('hidden');
  } else {
    alert('Para instalar, clique no ícone de instalação (⊕) na barra de endereço do seu navegador.');
  }
});

// Se o app já estiver instalado, esconde o botão do cabeçalho — não faz
// sentido convidar pra instalar de novo
if (window.matchMedia('(display-mode: standalone)').matches) {
  btnAbrirInstalar?.classList.add('hidden');
}