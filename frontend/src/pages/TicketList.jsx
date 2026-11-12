import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Ticket, FilterX } from 'lucide-react';
import api from '../services/api';
import { Card, EmptyState, PageHeader, PriorityBadge, Spinner, StatusBadge, botonPrimario, botonSecundario, campo, fecha } from '../components/ui';

const PRIORIDADES = [
  ['low', 'Baja'],
  ['medium', 'Media'],
  ['high', 'Alta'],
  ['urgent', 'Urgente'],
];

function TicketList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
        const response = await api.get(`/tickets?${params.toString()}`);
        setTickets(response.data);
      } catch (error) {
        console.error('Error al cargar tickets:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setSearchParams(Object.fromEntries(Object.entries(newFilters).filter(([, v]) => v)));
  };

  const limpiar = () => {
    setFilters({ status: '', priority: '' });
    setSearchParams({});
    setBusqueda('');
  };

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase().replace(/^#/, '');
    if (!q) return tickets;
    return tickets.filter((t) =>
      [t.id, t.title, t.category, t.created_by_name, t.assigned_to_name]
        .filter((v) => v !== undefined && v !== null)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [tickets, busqueda]);

  const hayFiltros = busqueda || filters.status || filters.priority;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description="Solicitudes e incidentes reportados a la mesa de ayuda."
        actions={
          <Link to="/tickets/new" className={botonPrimario}>
            <Plus className="h-4 w-4" /> Nuevo ticket
          </Link>
        }
      />

      {/* Pestañas rápidas por estado */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {[['', 'Todos'], ['open', 'Abiertos'], ['in_progress', 'En progreso'], ['resolved', 'Resueltos'], ['closed', 'Cerrados']].map(([valor, texto]) => (
          <button
            key={valor || 'todos'}
            onClick={() => handleFilterChange('status', valor)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              filters.status === valor ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por número, título, solicitante o técnico…"
              className={`${campo} pl-9`}
            />
          </label>
          <select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)} className={`${campo} sm:w-48`} aria-label="Prioridad">
            <option value="">Todas las prioridades</option>
            {PRIORIDADES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>

        {loading ? (
          <Spinner label="Cargando tickets…" />
        ) : visibles.length === 0 ? (
          <EmptyState
            icon={hayFiltros ? FilterX : Ticket}
            title={hayFiltros ? 'Ningún ticket coincide con la búsqueda' : 'Aún no hay tickets'}
            description={hayFiltros ? 'Prueba con otros términos o quita los filtros.' : 'Cuando se reporte una solicitud aparecerá aquí.'}
            action={
              hayFiltros ? (
                <button onClick={limpiar} className={botonSecundario}>Quitar filtros</button>
              ) : (
                <Link to="/tickets/new" className={botonPrimario}><Plus className="h-4 w-4" /> Crear ticket</Link>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="w-16 px-5 py-3 font-medium uppercase">N.º</th>
                    <th className="px-5 py-3 font-medium uppercase">Asunto</th>
                    <th className="px-5 py-3 font-medium uppercase">Estado</th>
                    <th className="px-5 py-3 font-medium uppercase">Prioridad</th>
                    <th className="px-5 py-3 font-medium uppercase">Solicitante</th>
                    <th className="px-5 py-3 font-medium uppercase">Asignado a</th>
                    <th className="px-5 py-3 font-medium uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibles.map((t) => (
                    <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-[13px] font-medium text-gray-400 tabular-nums">#{t.id}</td>
                      <td className="max-w-md px-5 py-3.5">
                        <Link to={`/tickets/${t.id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium text-gray-900 hover:text-brand-600">
                          {t.title}
                        </Link>
                        {t.category && <p className="truncate text-xs capitalize text-gray-500">{t.category}</p>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5"><StatusBadge status={t.status} /></td>
                      <td className="whitespace-nowrap px-5 py-3.5"><PriorityBadge priority={t.priority} /></td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{t.created_by_name || '—'}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{t.assigned_to_name || <span className="text-gray-400">Sin asignar</span>}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-500">{fecha(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
              <span>
                {visibles.length} {visibles.length === 1 ? 'ticket' : 'tickets'}
                {visibles.length !== tickets.length && ` de ${tickets.length}`}
              </span>
              {hayFiltros && (
                <button onClick={limpiar} className="font-medium text-brand-600 hover:text-brand-700">Quitar filtros</button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default TicketList;
