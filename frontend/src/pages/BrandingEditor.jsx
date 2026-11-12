import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const BrandingEditor = () => {
  const [config, setConfig] = useState({
    company_name: 'ITAMS', logo_url: '', primary_color: '#4f46e5', secondary_color: '#7c3aed',
    accent_color: '#06b6d4', bg_color: '#ffffff', text_color: '#1f2937',
    font_family: 'Inter, system-ui, sans-serif', border_radius: '8px', sidebar_style: 'dark', custom_css: ''
  });
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/branding-editor'),
      api.get('/branding-editor/presets')
    ]).then(([configRes, presetsRes]) => {
      setConfig(configRes.data);
      setPresets(presetsRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const saveConfig = async () => {
    try {
      await api.put('/branding-editor', config);
      alert('Branding guardado');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const applyPreset = (preset) => {
    setConfig({
      ...config,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
      bg_color: preset.bg,
      text_color: preset.text,
    });
  };

  const ColorInput = ({ label, value, onChange }) => (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-400 font-mono">{value}</div>
      </div>
    </div>
  );

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="🎨" />Editor de Branding</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Config */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Identidad</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa</label>
                <input type="text" value={config.company_name} onChange={(e) => setConfig({...config, company_name: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del logo</label>
                <input type="text" value={config.logo_url} onChange={(e) => setConfig({...config, logo_url: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="https://..." />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Colores</h2>
            <div className="grid grid-cols-2 gap-4">
              <ColorInput label="Primario" value={config.primary_color} onChange={(v) => setConfig({...config, primary_color: v})} />
              <ColorInput label="Secundario" value={config.secondary_color} onChange={(v) => setConfig({...config, secondary_color: v})} />
              <ColorInput label="Acento" value={config.accent_color} onChange={(v) => setConfig({...config, accent_color: v})} />
              <ColorInput label="Fondo" value={config.bg_color} onChange={(v) => setConfig({...config, bg_color: v})} />
              <ColorInput label="Texto" value={config.text_color} onChange={(v) => setConfig({...config, text_color: v})} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Tipografía y Estilo</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuente</label>
                <select value={config.font_family} onChange={(e) => setConfig({...config, font_family: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="'Segoe UI', sans-serif">Segoe UI</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                <select value={config.border_radius} onChange={(e) => setConfig({...config, border_radius: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="0px">Cuadrado</option>
                  <option value="4px">Pequeño</option>
                  <option value="8px">Mediano</option>
                  <option value="12px">Grande</option>
                  <option value="9999px">Circular</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estilo Sidebar</label>
                <select value={config.sidebar_style} onChange={(e) => setConfig({...config, sidebar_style: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="dark">Oscuro</option>
                  <option value="light">Claro</option>
                  <option value="transparent">Transparente</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">CSS Personalizado</h2>
            <textarea value={config.custom_css} onChange={(e) => setConfig({...config, custom_css: e.target.value})} className="w-full border rounded px-3 py-2 font-mono text-sm h-32" placeholder="/* CSS adicional */" />
          </div>

          <button onClick={saveConfig} className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 font-medium">Guardar Branding</button>
        </div>

        {/* Preview + Presets */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Vista Previa</h2>
            <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: config.bg_color, color: config.text_color, borderRadius: config.border_radius }}>
              <div className="p-3 text-white text-sm font-medium" style={{ backgroundColor: config.primary_color, borderRadius: `${config.border_radius} ${config.border_radius} 0 0` }}>
                {config.company_name}
              </div>
              <div className="p-4">
                <div className="h-3 rounded mb-2" style={{ backgroundColor: config.secondary_color, width: '60%', borderRadius: config.border_radius }} />
                <div className="h-2 rounded mb-3" style={{ backgroundColor: config.accent_color, opacity: 0.3, borderRadius: config.border_radius }} />
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-white text-xs rounded" style={{ backgroundColor: config.primary_color, borderRadius: config.border_radius }}>Primario</button>
                  <button className="px-3 py-1 text-white text-xs rounded" style={{ backgroundColor: config.secondary_color, borderRadius: config.border_radius }}>Secundario</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Presets</h2>
            <div className="space-y-2">
              {presets.map((p, i) => (
                <button key={i} onClick={() => applyPreset(p)} className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-50 text-left">
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: p.primary }}></div>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: p.secondary }}></div>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: p.accent }}></div>
                  </div>
                  <span className="text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingEditor;