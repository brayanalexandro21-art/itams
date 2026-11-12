import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import AuthLayout, { traducirError } from '../components/AuthLayout';
import { botonPrimario, campo } from '../components/ui';

// Los valores se guardan igual que antes (IT, HR…); solo cambia el texto visible
const DEPARTAMENTOS = [
  ['IT', 'Tecnología (TI)'],
  ['HR', 'Talento humano'],
  ['Finance', 'Finanzas'],
  ['Marketing', 'Mercadeo'],
  ['Operations', 'Operaciones'],
];

function Register({ onLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(traducirError(err.response?.data?.error || err.message, 'No se pudo crear la cuenta.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Regístrate para reportar solicitudes y consultar tus equipos."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre completo</label>
          <input id="name" name="name" type="text" autoComplete="name" value={formData.name} onChange={handleChange} className={campo} required autoFocus />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" value={formData.email} onChange={handleChange} className={campo} required />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="new-password" value={formData.password} onChange={handleChange} className={campo} required minLength={6} />
          <p className="mt-1.5 text-xs text-gray-500">Mínimo 6 caracteres.</p>
        </div>

        <div>
          <label htmlFor="department" className="mb-1.5 block text-sm font-medium text-gray-700">Área</label>
          <select id="department" name="department" value={formData.department} onChange={handleChange} className={campo}>
            <option value="">Selecciona tu área</option>
            {DEPARTAMENTOS.map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} className={`${botonPrimario} w-full py-2.5`}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;
