import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Monitor, Laptop, Printer, Smartphone, Server, Network, Disc3, Package, FilterX } from 'lucide-react';
import api from '../services/api';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge, botonPrimario, botonSecundario, campo } from '../components/ui';

const TIPOS = {
  computer: ['Computador', Monitor],
  laptop: ['Portátil', Laptop],
  printer: ['Impresora', Printer],
  phone: ['Teléfono', Smartphone],
  server: ['Servidor', Server],
  network: ['Red', Network],
  software: ['Software', Disc3],
  other: ['Otro', Package],
};

const ESTADOS = [
  ['available', 'Disponible'],
  ['in_use', 'En uso'],
  ['maintenance', 'Mantenimiento'],
  ['retired', 'Retirado'],
];

const CATEGORIAS = [
  ['hardware', 'Hardware'],
  ['software', 'Software'],
  ['peripheral', 'Periféricos'],
  ['license', 'Licencias'],
];

function AssetList() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
        const response = await api.get(`/assets?${params.toString()}`);
        setAssets(response.data);
      } catch (error) {
        console.error('Error al cargar activos:', error);
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
    setFilters({ type: '', status: '', category: '' });
    setSearchParams({});
    setBusqueda('');
  };

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) =>
      [a.name, a.serial_number, a.model, a.manufacturer, a.location, a.assigned_to_name, a.inventory_number]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [assets, busqueda]);

  const hayFiltros = busqueda || filters.type || filters.status || filters.category;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activos de TI"
        description="Inventario de equipos, su estado, ubicación y responsable."
        actions={
          <Link to="/assets/new" className={botonPrimario}>
            <Plus className="h-4 w-4" /> Registrar activo
          </Link>
        }
      />

      <Card className="overflow-hidden">
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, serie, modelo, ubicación o responsable…"
              className={`${campo} pl-9`}
            />
          </label>
          <div className="grid grid-cols-3 gap-2 lg:flex">
            <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className={`${campo} lg:w-40`} aria-label="Tipo">
              <option value="">Todos los tipos</option>
              {Object.entries(TIPOS).filter(([k]) => k !== 'other').map(([k, [t]]) => <option key={k} value={k}>{t}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={`${campo} lg:w-40`} aria-label="Estado">
              <option value="">Todos los estados</option>
              {ESTADOS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className={`${campo} lg:w-44`} aria-label="Categoría">
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <Spinner label="Cargando activos…" />
        ) : visibles.length === 0 ? (
          <EmptyState
            icon={hayFiltros ? FilterX : Monitor}
            title={hayFiltros ? 'Ningún activo coincide con la búsqueda' : 'Aún no hay activos registrados'}
            description={hayFiltros ? 'Prueba con otros términos o quita los filtros.' : 'Registra tu primer equipo para empezar el inventario.'}
            action={
              hayFiltros ? (
                <button onClick={limpiar} className={botonSecundario}>Quitar filtros</button>
              ) : (
                <Link to="/assets/new" className={botonPrimario}><Plus className="h-4 w-4" /> Registrar activo</Link>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium uppercase">Activo</th>
                    <th className="px-5 py-3 font-medium uppercase">Serie</th>
                    <th className="px-5 py-3 font-medium uppercase">Ubicación</th>
                    <th className="px-5 py-3 font-medium uppercase">Responsable</th>
                    <th className="px-5 py-3 font-medium uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibles.map((a) => {
                    const [tipo, Icon] = TIPOS[a.type] || [a.type || 'Otro', Package];
                    return (
                      <tr key={a.id} onClick={() => navigate(`/assets/${a.id}`)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                              <Icon className="h-4 w-4 text-gray-500" strokeWidth={1.8} />
                            </span>
                            <div className="min-w-0">
                              <Link to={`/assets/${a.id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium text-gray-900 hover:text-brand-600">
                                {a.name}
                              </Link>
                              <p className="truncate text-xs text-gray-500">{[tipo, a.model].filter(Boolean).join(' · ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-gray-600">{a.serial_number || '—'}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{a.location || '—'}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{a.assigned_to_name || <span className="text-gray-400">Sin asignar</span>}</td>
                        <td className="whitespace-nowrap px-5 py-3.5"><StatusBadge status={a.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
              <span>
                {visibles.length} {visibles.length === 1 ? 'activo' : 'activos'}
                {visibles.length !== assets.length && ` de ${assets.length}`}
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

export default AssetList;
