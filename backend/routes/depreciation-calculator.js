const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Calcular depreciación de un activo
router.get('/asset/:id', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Activo no encontrado' });

    const purchaseCost = asset.purchase_cost || asset.value || 0;
    const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date();
    const now = new Date();
    const usefulLifeYears = asset.useful_life_years || 5;
    const residualValue = asset.residual_value || 0;

    const ageYears = (now - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000);
    const ageMonths = ageYears * 12;

    // Straight-line depreciation
    const annualDepreciation = (purchaseCost - residualValue) / usefulLifeYears;
    const monthlyDepreciation = annualDepreciation / 12;
    const accumulatedStraightLine = Math.min(monthlyDepreciation * ageMonths, purchaseCost - residualValue);
    const bookValueStraightLine = Math.max(purchaseCost - accumulatedStraightLine, residualValue);

    // Declining balance
    const rate = 2 / usefulLifeYears;
    let bookValueDeclining = purchaseCost;
    const months = Math.floor(ageMonths);
    for (let i = 0; i < months && bookValueDeclining > residualValue; i++) {
      bookValueDeclining -= bookValueDeclining * rate / 12;
    }
    bookValueDeclining = Math.max(bookValueDeclining, residualValue);

    const depreciationPercent = purchaseCost > 0 ? Math.round((1 - bookValueStraightLine / purchaseCost) * 100) : 0;

    res.json({
      asset_id: asset.id,
      asset_name: asset.name,
      purchase_cost: purchaseCost,
      purchase_date: asset.purchase_date,
      useful_life_years: usefulLifeYears,
      residual_value: residualValue,
      age_years: Math.round(ageYears * 10) / 10,
      methods: {
        straight_line: {
          annual: Math.round(annualDepreciation * 100) / 100,
          accumulated: Math.round(accumulatedStraightLine * 100) / 100,
          book_value: Math.round(bookValueStraightLine * 100) / 100,
        },
        declining_balance: {
          book_value: Math.round(bookValueDeclining * 100) / 100,
        },
      },
      depreciation_percent: depreciationPercent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resumen de depreciación de todos los activos
router.get('/summary', auth, adminOnly, (req, res) => {
  try {
    const assets = db.prepare('SELECT * FROM assets WHERE purchase_cost IS NOT NULL OR value IS NOT NULL').all();

    let totalCost = 0, totalBookValue = 0;
    const byType = {};

    assets.forEach(a => {
      const cost = a.purchase_cost || a.value || 0;
      const purchaseDate = a.purchase_date ? new Date(a.purchase_date) : new Date();
      const ageYears = (new Date() - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000);
      const usefulLife = a.useful_life_years || 5;
      const residual = a.residual_value || 0;
      const annual = (cost - residual) / usefulLife;
      const accumulated = Math.min(annual * ageYears, cost - residual);
      const bookValue = Math.max(cost - accumulated, residual);

      totalCost += cost;
      totalBookValue += bookValue;

      if (!byType[a.type]) byType[a.type] = { cost: 0, book_value: 0, count: 0 };
      byType[a.type].cost += cost;
      byType[a.type].book_value += bookValue;
      byType[a.type].count++;
    });

    res.json({
      total_assets: assets.length,
      total_cost: Math.round(totalCost),
      total_book_value: Math.round(totalBookValue),
      total_depreciation: Math.round(totalCost - totalBookValue),
      by_type: byType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;