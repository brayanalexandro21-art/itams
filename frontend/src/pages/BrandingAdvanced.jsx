import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const BrandingAdvanced = () => {
  const [config, setConfig] = useState({
    company_name: 'ITAMS',
    primary_color: '#4f46e5',
    secondary_color: '#7c3aed',
    accent_color: '#06b6d4',
    font_family: 'Inter, system-ui, sans-serif',
    custom_css: '',
    email_footer: '© 2024 ITAMS',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/branding/config');
      setConfig(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      await api.put('/branding/config', config);
      alert('Branding actualizado');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="🎨" />Branding Personalizado</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa</label>
            <input
              type="text"
              value={config.company_name}
              onChange={(e) => setConfig({...config, company_name: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
            <input
              type="color"
              value={config.primary_color}
              onChange={(e) => setConfig({...config, primary_color: e.target.value})}
              className="w-full h-10 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color secundario</label>
            <input
              type="color"
              value={config.secondary_color}
              onChange={(e) => setConfig({...config, secondary_color: e.target.value})}
              className="w-full h-10 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color de acento</label>
            <input
              type="color"
              value={config.accent_color}
              onChange={(e) => setConfig({...config, accent_color: e.target.value})}
              className="w-full h-10 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">CSS personalizado</label>
            <textarea
              value={config.custom_css}
              onChange={(e) => setConfig({...config, custom_css: e.target.value})}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows={6}
              placeholder="/* CSS personalizado */"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={saveConfig}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            onClick={() => setConfig({...config, custom_css: ''})}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Limpiar CSS
          </button>
        </div>

        {/* Vista previa */}
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: config.primary_color + '20' }}>
          <h3 className="font-semibold mb-2">Vista Previa</h3>
          <div className="flex gap-4">
            <button className="px-4 py-2 rounded text-white" style={{ backgroundColor: config.primary_color }}>
              Botón Primario
            </button>
            <button className="px-4 py-2 rounded text-white" style={{ backgroundColor: config.secondary_color }}>
              Botón Secundario
            </button>
            <button className="px-4 py-2 rounded text-white" style={{ backgroundColor: config.accent_color }}>
              Botón Acento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingAdvanced;