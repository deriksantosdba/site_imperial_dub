const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Permite receber JSON no body

// Conexão com MongoDB (veremos depois)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Conectado ao MongoDB!"))
  .catch(err => console.error("Erro ao conectar:", err));

// Rota de teste
app.get('/', (req, res) => {
  res.send('API Imperial Music está rodando! 🎵');
});

module.exports = app;