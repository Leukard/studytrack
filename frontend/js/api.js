const API_URL = 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('access_token');
}

// Protege páginas que exigem login — redireciona para a tela de login se não houver token
function exigirLogin() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

// Wrapper central para todas as chamadas autenticadas à API.
// Cuida de: anexar o token, tratar token expirado/inválido (401), tratar
// respostas sem corpo (204, ex: delete) e lançar erro de forma consistente.
async function requisicaoAutenticada(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...opcoes.headers,
    },
  });

  // Token inválido/expirado — desloga e manda de volta pro login
  if (resposta.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = 'index.html';
    return;
  }

  if (resposta.status === 204) return null;

  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || 'Algo deu errado');

  return dados;
}

// Interface pública usada pelas páginas — esconde os detalhes de fetch/headers,
// deixando o código de cada página focado no "o quê", não no "como"
const api = {
  listarTemas: () => requisicaoAutenticada('/temas'),
  criarTema: (nome, metaHorasSemana) =>
    requisicaoAutenticada('/temas', {
      method: 'POST',
      body: JSON.stringify({ nome, metaHorasSemana }),
    }),
  atualizarTema: (id, nome, metaHorasSemana) =>
    requisicaoAutenticada(`/temas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nome, metaHorasSemana }),
    }),
  deletarTema: (id) =>
    requisicaoAutenticada(`/temas/${id}`, { method: 'DELETE' }),

  listarSessoesPorTema: (temaId) =>
    requisicaoAutenticada(`/sessoes/tema/${temaId}`),
  criarSessao: (temaId, duracaoMinutos, anotacao) =>
    requisicaoAutenticada('/sessoes', {
      method: 'POST',
      body: JSON.stringify({ temaId, duracaoMinutos, anotacao }),
    }),
};