import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { IconoTitulo } from '../components/Icono';

const PasswordPolicy = () => {
  const [policy, setPolicy] = useState({ min_length: 8, require_uppercase: true, require_lowercase: true, require_numbers: true, require_special: false, max_age_days: 90, prevent_reuse: 5 });
  const [testPassword, setTestPassword] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/password-policy').then(r => setPolicy(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const savePolicy = async () => {
    try {
      await api.put('/password-policy', policy);
      alert('Política guardada');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const validatePassword = async () => {
    try {
      const response = await api.post('/password-policy/validate', { password: testPassword });
      setTestResult(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm">{label}</span>
      <div onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}>
        <div className={`w-5 h-5 bg-white rounded-full transform transition-transform mt-0.5 ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </div>
    </label>
  );

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="🔑" />Política de Contraseñas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Configuración</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitud mínima</label>
              <input type="number" value={policy.min_length} onChange={(e) => setPolicy({...policy, min_length: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2" min={4} max={32} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Días máximos de validez</label>
              <input type="number" value={policy.max_age_days} onChange={(e) => setPolicy({...policy, max_age_days: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseñas anteriores a bloquear</label>
              <input type="number" value={policy.prevent_reuse} onChange={(e) => setPolicy({...policy, prevent_reuse: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2" min={0} max={20} />
            </div>
            <Toggle label="Requiere mayúsculas (A-Z)" checked={policy.require_uppercase} onChange={(v) => setPolicy({...policy, require_uppercase: v})} />
            <Toggle label="Requiere minúsculas (a-z)" checked={policy.require_lowercase} onChange={(v) => setPolicy({...policy, require_lowercase: v})} />
            <Toggle label="Requiere números (0-9)" checked={policy.require_numbers} onChange={(v) => setPolicy({...policy, require_numbers: v})} />
            <Toggle label="Requiere caracteres especiales (!@#$%)" checked={policy.require_special} onChange={(v) => setPolicy({...policy, require_special: v})} />
          </div>
          <button onClick={savePolicy} className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Guardar Política</button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Probar Contraseña</h2>
          <div className="mb-4">
            <input type="text" value={testPassword} onChange={(e) => setTestPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && validatePassword()} placeholder="Escribe una contraseña para probar" className="w-full border rounded px-3 py-2" />
            <button onClick={validatePassword} className="mt-2 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">Validar</button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {testResult.valid ? (
                <p className="text-green-800 font-medium">✓ Contraseña válida</p>
              ) : (
                <div>
                  <p className="text-red-800 font-medium mb-2">✗ Contraseña inválida:</p>
                  <ul className="list-disc list-inside text-red-700 text-sm">
                    {testResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <h3 className="font-medium mb-2">Resumen de la política actual:</h3>
            <ul className="space-y-1">
              <li>• Mínimo {policy.min_length} caracteres</li>
              {policy.require_uppercase && <li>• Requiere mayúsculas</li>}
              {policy.require_lowercase && <li>• Requiere minúsculas</li>}
              {policy.require_numbers && <li>• Requiere números</li>}
              {policy.require_special && <li>• Requiere caracteres especiales</li>}
              {policy.max_age_days > 0 && <li>• Expira cada {policy.max_age_days} días</li>}
              {policy.prevent_reuse > 0 && <li>• Bloquea {policy.prevent_reuse} contraseñas anteriores</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordPolicy;