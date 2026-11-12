import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SecurityDashboard = () => {
  const [securityScore, setSecurityScore] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scoreRes, logsRes] = await Promise.all([
        api.get('/advanced-security/score'),
        api.get('/audit', { params: { limit: 10 } }),
      ]);
      setSecurityScore(scoreRes.data);
      setAuditLogs(logsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  // El backend devuelve "checks" como objeto de métricas; se convierte a lista de verificaciones
  const rawChecks = securityScore?.checks;
  const c = rawChecks && !Array.isArray(rawChecks) ? rawChecks : {};
  const checksList = Array.isArray(rawChecks) ? rawChecks : rawChecks ? [
    { name: `2FA activado (${c.twoFactorEnabled ?? 0} de ${c.totalUsers ?? 0} usuarios)`, passed: (c.totalUsers ?? 0) > 0 && c.twoFactorEnabled === c.totalUsers },
    { name: `Contraseñas débiles: ${c.weakPasswords ?? 0}`, passed: !c.weakPasswords },
    { name: `Inicios de sesión fallidos recientes: ${c.failedLogins ?? 0}`, passed: (c.failedLogins ?? 0) < 10 },
    { name: `Sesiones activas: ${c.activeSessions ?? 0}`, passed: true },
  ] : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🔒 Dashboard de Seguridad</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Score de Seguridad</h2>
          <div className="text-4xl font-bold text-center">
            {securityScore?.score || 0}/100
          </div>
          <div className={`text-center mt-2 font-medium ${
            securityScore?.score >= 80 ? 'text-green-600' :
            securityScore?.score >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {securityScore?.grade || 'N/A'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Checks de Seguridad</h2>
          <div className="space-y-2">
            {checksList.map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={check.passed ? 'text-green-600' : 'text-red-600'}>
                  {check.passed ? '✓' : '✗'}
                </span>
                <span className="text-sm">{check.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Recomendaciones</h2>
          <div className="space-y-2">
            {securityScore?.recommendations?.map((rec, i) => (
              <div key={i} className={`text-sm p-2 rounded ${
                (rec.severity || rec.priority) === 'high' ? 'bg-red-50 text-red-700' :
                (rec.severity || rec.priority) === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {rec.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Logs de Auditoría Recientes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Fecha</th>
                <th className="text-left py-2">Usuario</th>
                <th className="text-left py-2">Acción</th>
                <th className="text-left py-2">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 10).map((log, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 text-sm">{new Date(log.created_at).toLocaleString('es-CO')}</td>
                  <td className="py-2 text-sm">{log.user_name}</td>
                  <td className="py-2 text-sm">{log.action}</td>
                  <td className="py-2 text-sm text-gray-500">{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;