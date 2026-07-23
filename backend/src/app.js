const express = require('express');
const cors = require('cors');
const app = express();

// Libera requisições de qualquer origem — adequado para desenvolvimento;
// em produção, restringir para o domínio real do frontend (cors({ origin: '...' }))
app.use(cors());
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

// Exporta a aplicação configurada, sem subir o servidor ainda —
// separar isso de server.js facilita testes automatizados no futuro
module.exports = app;