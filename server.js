const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Trabalho da Sistema de notas')));

// Servir index como raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Trabalho da Sistema de notas', 'telaInicial.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 