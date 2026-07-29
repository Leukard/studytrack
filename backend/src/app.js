const express = require('express');
const cors = require('cors');
const app = express();

// Libera requisições de qualquer origem — adequado para desenvolvimento;
// em produção, restringir para o domínio real do frontend (cors({ origin: '...' }))
// Em produção, restringe pro domínio real do frontend (via variável de ambiente).
// Em desenvolvimento, libera geral se a variável não estiver definida.
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'StudyTrack API rodando' });
});

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const temaRoutes = require('./routes/temaRoutes');
app.use('/temas', temaRoutes);

const sessaoRoutes = require('./routes/sessaoRoutes');
app.use('/sessoes', sessaoRoutes);

const tarefaRoutes = require('./routes/tarefaRoutes');
app.use('/tarefas', tarefaRoutes);

// Exporta a aplicação configurada, sem subir o servidor ainda —
// separar isso de server.js facilita testes automatizados no futuro
module.exports = app;