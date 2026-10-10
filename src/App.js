// 📁 src/app.js (Configuración de Express)
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ControlLabs API operando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;