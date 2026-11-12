const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

// Get depreciation for single asset
router.get('/asset/:id', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const depreciation = calculateDepreciation(asset);
    const schedule = generateDepreciationSchedule(asset);

    res.json({
      asset,
      depreciation,
      schedule,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get depreciation for all assets
router.get('/all', auth, adminOnly, (req, res) => {
  try {
    const assets = db.prepare(`
      SELECT * FROM assets
      WHERE purchase_date IS NOT NULL AND purchase_cost IS NOT NULL
      ORDER BY purchase_date
    `).all();

    const report = assets.map(asset => ({
      ...asset,
      depreciation: calculateDepreciation(asset),
    }));

    const summary = {
      total_assets: report.length,
      total_purchase_cost: report.reduce((sum, a) => sum + (a.purchase_cost || 0), 0),
      total_current_value: report.reduce((sum, a) => sum + (a.depreciation.currentValue || 0), 0),
      total_depreciation: report.reduce((sum, a) => sum + (a.depreciation.totalDepreciation || 0), 0),
    };

    res.json({ assets: report, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate depreciation with custom parameters
router.post('/calculate', auth, adminOnly, (req, res) => {
  try {
    const {
      purchase_cost,
      purchase_date,
      salvage_value = 0,
      useful_life_years = 5,
      method = 'straight-line',
    } = req.body;

    const result = calculateCustomDepreciation({
      purchase_cost,
      purchase_date,
      salvage_value,
      useful_life_years,
      method,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get depreciation schedule
router.get('/schedule/:id', auth, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const schedule = generateDepreciationSchedule(asset);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get depreciation report
router.get('/report', auth, adminOnly, (req, res) => {
  try {
    const { period, category } = req.query;

    let query = `
      SELECT a.*, 
        CASE 
          WHEN a.purchase_date IS NOT NULL AND a.purchase_cost IS NOT NULL
          THEN ROUND(a.purchase_cost * (1 - (julianday('now') - julianday(a.purchase_date)) / (365.25 * 5)), 2)
          ELSE NULL
        END as current_value
      FROM assets a
      WHERE a.purchase_date IS NOT NULL AND a.purchase_cost IS NOT NULL
    `;

    const params = [];

    if (category) {
      query += ' AND a.category = ?';
      params.push(category);
    }

    query += ' ORDER BY a.purchase_date';

    const assets = db.prepare(query).all(...params);

    // Group by year
    const byYear = {};
    assets.forEach(asset => {
      const year = new Date(asset.purchase_date).getFullYear();
      if (!byYear[year]) {
        byYear[year] = { year, assets: [], total_cost: 0, total_current: 0 };
      }
      byYear[year].assets.push(asset);
      byYear[year].total_cost += asset.purchase_cost || 0;
      byYear[year].total_current += asset.current_value || 0;
    });

    const report = {
      generated_at: new Date().toISOString(),
      total_assets: assets.length,
      total_purchase_cost: assets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0),
      total_current_value: assets.reduce((sum, a) => sum + (a.current_value || 0), 0),
      by_year: Object.values(byYear),
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateDepreciation(asset) {
  if (!asset.purchase_date || !asset.purchase_cost) {
    return {
      currentValue: null,
      totalDepreciation: null,
      depreciationRate: null,
      yearsOld: null,
      method: 'straight-line',
    };
  }

  const purchaseDate = new Date(asset.purchase_date);
  const now = new Date();
  const yearsOld = (now - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000);

  // Straight-line depreciation over 5 years
  const usefulLife = 5;
  const depreciationRate = 1 / usefulLife;
  const currentValue = Math.max(0, asset.purchase_cost * (1 - (yearsOld / usefulLife)));
  const totalDepreciation = asset.purchase_cost - currentValue;

  return {
    currentValue: Math.round(currentValue * 100) / 100,
    totalDepreciation: Math.round(totalDepreciation * 100) / 100,
    depreciationRate: Math.round(depreciationRate * 100),
    yearsOld: Math.round(yearsOld * 10) / 10,
    method: 'straight-line',
    usefulLife,
  };
}

function calculateCustomDepreciation(params) {
  const {
    purchase_cost,
    purchase_date,
    salvage_value,
    useful_life_years,
    method,
  } = params;

  const purchaseDate = new Date(purchase_date);
  const now = new Date();
  const yearsOld = (now - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000);

  let annualDepreciation, currentValue, totalDepreciation;

  switch (method) {
    case 'straight-line':
      annualDepreciation = (purchase_cost - salvage_value) / useful_life_years;
      totalDepreciation = annualDepreciation * Math.min(yearsOld, useful_life_years);
      currentValue = purchase_cost - totalDepreciation;
      break;

    case 'declining-balance':
      const rate = 2 / useful_life_years;
      currentValue = purchase_cost * Math.pow(1 - rate, Math.min(yearsOld, useful_life_years));
      totalDepreciation = purchase_cost - currentValue;
      annualDepreciation = totalDepreciation / Math.min(yearsOld, useful_life_years);
      break;

    case 'sum-of-years':
      const sumYears = (useful_life_years * (useful_life_years + 1)) / 2;
      const remainingYears = useful_life_years - Math.min(yearsOld, useful_life_years);
      currentValue = salvage_value + (purchase_cost - salvage_value) * (remainingYears / sumYears) * useful_life_years;
      totalDepreciation = purchase_cost - currentValue;
      annualDepreciation = totalDepreciation / Math.min(yearsOld, useful_life_years);
      break;

    default:
      throw new Error('Invalid depreciation method');
  }

  return {
    currentValue: Math.max(0, Math.round(currentValue * 100) / 100),
    totalDepreciation: Math.round(totalDepreciation * 100) / 100,
    annualDepreciation: Math.round(annualDepreciation * 100) / 100,
    yearsOld: Math.round(yearsOld * 10) / 10,
    method,
    salvage_value,
    useful_life_years,
  };
}

function generateDepreciationSchedule(asset) {
  if (!asset.purchase_date || !asset.purchase_cost) {
    return [];
  }

  const schedule = [];
  const usefulLife = 5;
  const annualDepreciation = asset.purchase_cost / usefulLife;

  for (let year = 0; year <= usefulLife; year++) {
    const date = new Date(asset.purchase_date);
    date.setFullYear(date.getFullYear() + year);

    const accumulatedDepreciation = Math.min(annualDepreciation * year, asset.purchase_cost);
    const bookValue = asset.purchase_cost - accumulatedDepreciation;

    schedule.push({
      year,
      date: date.toISOString().split('T')[0],
      annualDepreciation: year === 0 ? 0 : annualDepreciation,
      accumulatedDepreciation,
      bookValue: Math.max(0, bookValue),
    });
  }

  return schedule;
}

module.exports = router;
