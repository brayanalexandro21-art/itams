import { useState, useEffect } from 'react';
import api from '../services/api';

function TwoFactorAuth() {
  const [status, setStatus] = useState({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/2fa/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    try {
      const response = await api.post('/2fa/enable');
      setSetupData(response.data);
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'No se pudo iniciar la configuración de 2FA' });
    }
  };

  const handleVerify = async () => {
    try {
      await api.post('/2fa/verify', { code: verifyCode });
      setStatus({ enabled: true });
      setSetupData(null);
      setVerifyCode('');
      setMessage({ type: 'success', text: '¡Verificación en dos pasos activada!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Código inválido. Inténtalo de nuevo.' });
    }
  };

  const handleDisable = async () => {
    try {
      await api.post('/2fa/disable', { code: disableCode });
      setStatus({ enabled: false });
      setDisableCode('');
      setMessage({ type: 'success', text: 'Verificación en dos pasos desactivada.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Código inválido. Inténtalo de nuevo.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Verificación en dos pasos</h2>

      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Estado de 2FA</h3>
            <p className="text-sm text-gray-500 mt-1">
              {status.enabled
                ? 'La verificación en dos pasos está activada'
                : 'La verificación en dos pasos está desactivada'}
            </p>
          </div>
          <div className={`w-16 h-8 rounded-full flex items-center ${status.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${status.enabled ? 'translate-x-8' : 'translate-x-1'}`} />
          </div>
        </div>
      </div>

      {/* Setup 2FA */}
      {!status.enabled && !setupData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-800 mb-4">Activar la verificación en dos pasos</h3>
          <p className="text-sm text-gray-600 mb-4">
            Agrega una capa extra de seguridad: al iniciar sesión se pedirá un código
            de tu aplicación de autenticación.
          </p>
          <button
            onClick={handleEnable}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Activar 2FA
          </button>
        </div>
      )}

      {/* QR Code and Verification */}
      {setupData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-800 mb-4">Configura tu aplicación de autenticación</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                1. Escanea este código QR con tu aplicación (Google Authenticator, Authy, etc.)
              </p>
              <div className="bg-white p-4 rounded inline-block">
                {/* QR Code placeholder - in production, use a QR code library */}
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  Código QR<br/>
                  <span className="text-xs break-all">{setupData.secret}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                2. O escribe manualmente esta clave secreta:
              </p>
              <code className="block bg-white p-2 rounded font-mono text-sm break-all">
                {setupData.secret}
              </code>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                3. Guarda estos códigos de respaldo (cada uno sirve una sola vez):
              </p>
              <div className="grid grid-cols-2 gap-2">
                {setupData.backupCodes.map((code, i) => (
                  <code key={i} className="bg-white p-2 rounded text-sm font-mono">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                4. Escribe el código de 6 dígitos de tu aplicación:
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="000000"
                  maxLength={6}
                />
                <button
                  onClick={handleVerify}
                  disabled={verifyCode.length !== 6}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Verificar
                </button>
              </div>
            </div>

            <button
              onClick={() => setSetupData(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancelar configuración
            </button>
          </div>
        </div>
      )}

      {/* Disable 2FA */}
      {status.enabled && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-800 mb-4">Desactivar la verificación en dos pasos</h3>
          <p className="text-sm text-gray-600 mb-4">
            Para desactivarla, escribe el código actual de tu aplicación de autenticación.
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Código para desactivar"
              maxLength={6}
            />
            <button
              onClick={handleDisable}
              disabled={disableCode.length !== 6}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Desactivar 2FA
            </button>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">¿Qué es la verificación en dos pasos?</h4>
        <p className="text-sm text-blue-700">
          Añade seguridad pidiendo tu contraseña y además un código de verificación
          de tu celular al iniciar sesión. Aunque alguien conozca tu contraseña, no podrá
          entrar a tu cuenta sin tu celular.
        </p>
      </div>
    </div>
  );
}

export default TwoFactorAuth;
