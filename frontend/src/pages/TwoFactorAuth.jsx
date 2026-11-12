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
      setMessage({ type: 'error', text: 'Failed to initiate 2FA setup' });
    }
  };

  const handleVerify = async () => {
    try {
      await api.post('/2fa/verify', { code: verifyCode });
      setStatus({ enabled: true });
      setSetupData(null);
      setVerifyCode('');
      setMessage({ type: 'success', text: '2FA enabled successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid code. Please try again.' });
    }
  };

  const handleDisable = async () => {
    try {
      await api.post('/2fa/disable', { code: disableCode });
      setStatus({ enabled: false });
      setDisableCode('');
      setMessage({ type: 'success', text: '2FA disabled successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid code. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Two-Factor Authentication</h2>

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
            <h3 className="font-medium text-gray-800">2FA Status</h3>
            <p className="text-sm text-gray-500 mt-1">
              {status.enabled
                ? 'Two-factor authentication is enabled'
                : 'Two-factor authentication is disabled'}
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
          <h3 className="font-medium text-gray-800 mb-4">Enable Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add an extra layer of security to your account by requiring a verification code
            from your authenticator app when signing in.
          </p>
          <button
            onClick={handleEnable}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Enable 2FA
          </button>
        </div>
      )}

      {/* QR Code and Verification */}
      {setupData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-800 mb-4">Setup Authenticator App</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="bg-white p-4 rounded inline-block">
                {/* QR Code placeholder - in production, use a QR code library */}
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  QR Code<br/>
                  <span className="text-xs break-all">{setupData.secret}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                2. Or manually enter this secret key:
              </p>
              <code className="block bg-white p-2 rounded font-mono text-sm break-all">
                {setupData.secret}
              </code>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                3. Save these backup codes (each can be used once):
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
                4. Enter the 6-digit code from your authenticator app:
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
                  Verify
                </button>
              </div>
            </div>

            <button
              onClick={() => setSetupData(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel setup
            </button>
          </div>
        </div>
      )}

      {/* Disable 2FA */}
      {status.enabled && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-800 mb-4">Disable Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600 mb-4">
            To disable 2FA, enter the current code from your authenticator app.
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter code to disable"
              maxLength={6}
            />
            <button
              onClick={handleDisable}
              disabled={disableCode.length !== 6}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">What is Two-Factor Authentication?</h4>
        <p className="text-sm text-blue-700">
          2FA adds an extra layer of security by requiring both your password and a verification
          code from your phone when signing in. Even if someone gets your password, they won't
          be able to access your account without your phone.
        </p>
      </div>
    </div>
  );
}

export default TwoFactorAuth;
