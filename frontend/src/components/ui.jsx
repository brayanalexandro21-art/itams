// Componentes de interfaz reutilizables de ITAMS
import { Loader2 } from 'lucide-react';

// Estados y prioridades: etiqueta en español + estilo
const ESTADOS = {
  open: ['Abierto', 'bg-amber-50 text-amber-700 ring-amber-600/20'],
  in_progress: ['En progreso', 'bg-brand-50 text-brand-700 ring-brand-600/20'],
  pending: ['Pendiente', 'bg-amber-50 text-amber-700 ring-amber-600/20'],
  resolved: ['Resuelto', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'],
  closed: ['Cerrado', 'bg-gray-100 text-gray-600 ring-gray-500/20'],
  available: ['Disponible', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'],
  in_use: ['En uso', 'bg-brand-50 text-brand-700 ring-brand-600/20'],
  maintenance: ['Mantenimiento', 'bg-amber-50 text-amber-700 ring-amber-600/20'],
  retired: ['Retirado', 'bg-gray-100 text-gray-600 ring-gray-500/20'],
  active: ['Activo', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'],
  inactive: ['Inactivo', 'bg-gray-100 text-gray-600 ring-gray-500/20'],
};

const PRIORIDADES = {
  low: ['Baja', 'bg-gray-400'],
  medium: ['Media', 'bg-amber-400'],
  high: ['Alta', 'bg-orange-500'],
  urgent: ['Urgente', 'bg-red-600'],
  critical: ['Crítica', 'bg-red-600'],
};

export const etiquetaEstado = (s) => ESTADOS[s]?.[0] || (s ? s.replace(/_/g, ' ') : '—');
export const etiquetaPrioridad = (p) => PRIORIDADES[p]?.[0] || p || '—';

export function StatusBadge({ status }) {
  const [label, clase] = ESTADOS[status] || [etiquetaEstado(status), 'bg-gray-100 text-gray-600 ring-gray-500/20'];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${clase}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const [label, punto] = PRIORIDADES[priority] || [priority || '—', 'bg-gray-300'];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 whitespace-nowrap">
      <span className={`h-2 w-2 rounded-full ${punto}`} />
      {label}
    </span>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className = '', children }) {
  return <div className={`rounded-xl bg-white shadow-sm ${className}`}>{children}</div>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export const botonPrimario =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-60 transition-colors';
export const botonSecundario =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors';
export const campo =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400';

export const fecha = (d) =>
  d ? new Date(String(d).replace(' ', 'T') + (String(d).includes('Z') || String(d).includes('T') ? '' : 'Z')).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
