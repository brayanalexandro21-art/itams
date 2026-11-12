import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const MultiCurrency = () => {
  const [currencies, setCurrencies] = useState([]);
  const [rates, setRates] = useState(null);
  const [conversion, setConversion] = useState({ amount: 100, from: 'USD', to: 'EUR' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [currenciesRes, ratesRes] = await Promise.all([
        api.get('/multi-currency/currencies'),
        api.get('/multi-currency/exchange-rates'),
      ]);
      setCurrencies(currenciesRes.data);
      setRates(ratesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = async () => {
    try {
      const response = await api.post('/multi-currency/convert', conversion);
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="💱" />Multi-Moneda</h1>

      {/* Convertidor */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Convertidor de Monedas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              value={conversion.amount}
              onChange={(e) => setConversion({...conversion, amount: parseFloat(e.target.value)})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
            <select
              value={conversion.from}
              onChange={(e) => setConversion({...conversion, from: e.target.value})}
              className="w-full border rounded px-3 py-2"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">A</label>
            <select
              value={conversion.to}
              onChange={(e) => setConversion({...conversion, to: e.target.value})}
              className="w-full border rounded px-3 py-2"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={convertCurrency}
          className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Convertir
        </button>

        {result && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-lg font-semibold text-green-800">
              {result.converted_amount} {result.to_currency}
            </p>
            <p className="text-sm text-green-600">
              Tasa: 1 {result.from_currency} = {result.rate.toFixed(4)} {result.to_currency}
            </p>
          </div>
        )}
      </div>

      {/* Tasas de cambio */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Tasas de Cambio (Base: USD)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(rates?.rates || {}).map(([code, rate]) => (
            <div key={code} className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">{code}</div>
              <div className="text-lg">{rate}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Última actualización: {rates?.updated_at ? new Date(rates.updated_at).toLocaleString('es-CO') : 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default MultiCurrency;