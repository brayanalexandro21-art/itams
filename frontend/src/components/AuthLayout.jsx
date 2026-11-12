// Marco compartido de Iniciar sesión / Crear cuenta
import { Monitor, Ticket, ShieldCheck, BarChart3 } from 'lucide-react';
import Logo from './Logo';

const FUNCIONES = [
  { icon: Monitor, titulo: 'Inventario de activos', texto: 'Equipos, modelos, ubicaciones y ciclo de vida en un solo lugar.' },
  { icon: Ticket, titulo: 'Mesa de ayuda', texto: 'Tickets con prioridades, SLA y seguimiento de cada solicitud.' },
  { icon: BarChart3, titulo: 'Reportes', texto: 'Indicadores y reportes para tomar decisiones con datos.' },
  { icon: ShieldCheck, titulo: 'Seguridad y auditoría', texto: 'Roles, verificación en dos pasos y registro de cambios.' },
];

// Traduce los mensajes de error más comunes del servidor
export function traducirError(mensaje, porDefecto) {
  const m = String(mensaje || '');
  if (/invalid credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/already registered/i.test(m)) return 'Ya existe una cuenta con ese correo.';
  if (/too many/i.test(m)) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (/network error/i.test(m)) return 'No se pudo conectar con el servidor.';
  return m || porDefecto;
}

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Panel de marca */}
      <div className="relative hidden w-[46%] max-w-2xl overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight text-white">ITAMS</p>
            <p className="text-xs text-slate-400">Gestión de activos de TI</p>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
            Controla tu infraestructura tecnológica y el soporte desde una sola plataforma.
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {FUNCIONES.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Icon className="h-4.5 w-4.5 text-brand-300" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{titulo}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} ITAMS · Proyecto SENA</p>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo className="h-9 w-9" />
            <p className="text-lg font-semibold tracking-tight text-gray-900">ITAMS</p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-gray-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
