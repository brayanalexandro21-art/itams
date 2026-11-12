import React, { useState, useEffect } from 'react';
import api from '../services/api';

const I18nManager = () => {
  const [languages, setLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState('es');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/i18n-manager').then(r => setLanguages(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedLang) {
      api.get(`/i18n-manager/${selectedLang}`).then(r => setTranslations(r.data)).catch(console.error);
    }
  }, [selectedLang]);

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🌍 Gestor de Idiomas (i18n)</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {languages.map(lang => (
          <div
            key={lang.code}
            onClick={() => setSelectedLang(lang.code)}
            className={`bg-white rounded-lg shadow p-6 cursor-pointer text-center transition-all ${selectedLang === lang.code ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
          >
            <div className="text-4xl mb-2">{lang.flag}</div>
            <div className="font-semibold">{lang.native}</div>
            <div className="text-sm text-gray-500">{lang.name}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Traducciones — {languages.find(l => l.code === selectedLang)?.native || selectedLang}
          </h2>
          <span className="text-sm text-gray-500">{Object.keys(translations).length} claves</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clave</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Traducción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(translations).map(([key, value]) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-mono text-gray-600">{key}</td>
                  <td className="px-6 py-3 text-sm">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Las traducciones se cargan dinámicamente desde el backend. Para agregar un nuevo idioma, crear una nueva entrada en el archivo <code>i18n-manager.js</code> del backend.
          </p>
        </div>
      </div>
    </div>
  );
};

export default I18nManager;