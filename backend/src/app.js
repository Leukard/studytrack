const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'StudyTrack API rodando' });
});

module.exports = app;

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);
const temaRoutes = require('./routes/temaRoutes');
app.use('/temas', temaRoutes);
const sessaoRoutes = require('./routes/sessaoRoutes');
app.use('/sessoes', sessaoRoutes);