const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');

// Obtener monedas disponibles
router.get('/currencies', auth, (req, res) => {
  try {
    const currencies = [
      { code: 'USD', name: 'Dólar Americano', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
      { code: 'JPY', name: 'Yen Japonés', symbol: '¥' },
      { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
      { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
      { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
      { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
    ];
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener tasas de cambio
router.get('/exchange-rates', auth, (req, res) => {
  try {
    // Tasas de cambio simuladas (en producción usar API externa)
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.50,
      MXN: 17.15,
      COP: 3950,
      ARS: 350,
      CLP: 880,
    };
    res.json({ base: 'USD', rates, updated_at: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convertir moneda
router.post('/convert', auth, (req, res) => {
  try {
    const { amount, from_currency, to_currency } = req.body;
    
    const rates = { USD: 1, EUR: 0.92, GBP: 0.79, MXN: 17.15, COP: 3950 };
    
    const usdAmount = amount / (rates[from_currency] || 1);
    const convertedAmount = usdAmount * (rates[to_currency] || 1);

    res.json({
      original_amount: amount,
      from_currency,
      to_currency,
      converted_amount: Math.round(convertedAmount * 100) / 100,
      rate: (rates[to_currency] || 1) / (rates[from_currency] || 1),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;