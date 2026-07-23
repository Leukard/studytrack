const API_URL = 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('access_token');
}

function exigirLogin() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

async function requisicaoAutenticada(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...opcoes.headers,
    },
  });

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