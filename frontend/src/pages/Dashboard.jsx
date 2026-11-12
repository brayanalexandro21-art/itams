import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket, Inbox, Clock, UserX, Monitor, CheckCircle2, Wrench, ArrowRight, Plus, BookOpen,
  FileBarChart, Laptop,
} from 'lucide-react';
import api from '../services/api';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge, botonPrimario, botonSecundario, fecha } from '../components/ui';

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

function Kpi({ label, value, icon: Icon, tono, to }) {
  const tonos = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-gray-100 text-gray-600',
  };
  return (
    <Link to={to} className="group rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tonos[tono]}`}>
          <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">{value}</p>
    </Link>
  );
}

function Seccion({ title, to, children }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {to && (
          <Link to={to} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
            Ver todo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

function Dashboard() {
  const [ticketStats, setTicketStats] = useState(null);
  const [assetStats, setAssetStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const usuario = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    (async () => {
      try {
        const [ticketStatsRes, assetStatsRes, ticketsRes, assetsRes] = await Promise.all([
          api.get('/tickets/stats/summary'),
          api.get('/assets/stats/summary'),
          api.get('/tickets'),
          api.get('/assets'),
        ]);
        setTicketStats(ticketStatsRes.data);
        setAssetStats(assetStatsRes.data);
        setRecentTickets(ticketsRes.data.slice(0, 5));
        setRecentAssets(assetsRes.data.slice(0, 5));
      } catch (error) {
        console.error('Error al cargar el panel:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner label="Cargando panel…" />;

  const totalActivos = assetStats?.total || 0;
  const distribucion = [
    { label: 'Disponibles', value: assetStats?.available || 0, color: 'bg-emerald-500' },
    { label: 'En uso', value: assetStats?.in_use || 0, color: 'bg-brand-500' },
    { label: 'Mantenimiento', value: assetStats?.maintenance || 0, color: 'bg-amber-400' },
  ];
  const otros = Math.max(0, totalActivos - distribucion.reduce((s, d) => s + d.value, 0));
  if (otros) distribucion.push({ label: 'Otros', value: otros, color: 'bg-gray-300' });

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${saludo()}${usuario.name ? `, ${usuario.name.split(' ')[0]}` : ''}`}
        description="Este es el resumen de tus activos y solicitudes de soporte."
        actions={
          <Link to="/assets/new" className={botonSecundario}>
            <Plus className="h-4 w-4" /> Registrar activo
          </Link>
        }
      />

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Mesa de ayuda</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Tickets totales" value={ticketStats?.total || 0} icon={Ticket} tono="brand" to="/tickets" />
          <Kpi label="Abiertos" value={ticketStats?.open || 0} icon={Inbox} tono="amber" to="/tickets?status=open" />
          <Kpi label="En progreso" value={ticketStats?.inProgress || 0} icon={Clock} tono="sky" to="/tickets?status=in_progress" />
          <Kpi label="Sin asignar" value={ticketStats?.unassigned || 0} icon={UserX} tono="red" to="/tickets" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Inventario</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Activos totales" value={totalActivos} icon={Monitor} tono="slate" to="/assets" />
          <Kpi label="Disponibles" value={assetStats?.available || 0} icon={CheckCircle2} tono="emerald" to="/assets?status=available" />
          <Kpi label="En uso" value={assetStats?.in_use || 0} icon={Laptop} tono="brand" to="/assets?status=in_use" />
          <Kpi label="En mantenimiento" value={assetStats?.maintenance || 0} icon={Wrench} tono="amber" to="/assets?status=maintenance" />
        </div>

        {totalActivos > 0 && (
          <Card className="mt-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Estado del inventario</p>
              <p className="text-xs text-gray-500">{totalActivos} activos</p>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
              {distribucion.map((d) =>
                d.value ? (
                  <div key={d.label} className={d.color} style={{ width: `${(d.value / totalActivos) * 100}%` }} title={`${d.label}: ${d.value}`} />
                ) : null
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {distribucion.map((d) => (
                <span key={d.label} className="inline-flex items-center gap-2 text-[13px] text-gray-600">
                  <span className={`h-2 w-2 rounded-full ${d.color}`} />
                  {d.label}
                  <span className="font-medium text-gray-900 tabular-nums">{d.value}</span>
                  <span className="text-gray-400 tabular-nums">({Math.round((d.value / totalActivos) * 100)}%)</span>
                </span>
              ))}
            </div>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Seccion title="Tickets recientes" to="/tickets">
          {recentTickets.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="Aún no hay tickets"
              description="Cuando alguien reporte una solicitud aparecerá aquí."
              action={<Link to="/tickets/new" className={botonPrimario}><Plus className="h-4 w-4" /> Crear ticket</Link>}
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentTickets.map((t) => (
                <li key={t.id}>
                  <Link to={`/tickets/${t.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <span className="w-10 shrink-0 text-[13px] font-medium text-gray-400 tabular-nums">#{t.id}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{t.title}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {t.created_by_name || 'Sin autor'} · {fecha(t.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion title="Activos recientes" to="/assets">
          {recentAssets.length === 0 ? (
            <EmptyState
              icon={Monitor}
              title="Aún no hay activos"
              description="Registra tus equipos para llevar su inventario."
              action={<Link to="/assets/new" className={botonPrimario}><Plus className="h-4 w-4" /> Registrar activo</Link>}
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentAssets.map((a) => (
                <li key={a.id}>
                  <Link to={`/assets/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <Monitor className="h-4 w-4 text-gray-500" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{a.name}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {[a.model, a.manufacturer, a.serial_number && `S/N ${a.serial_number}`].filter(Boolean).join(' · ') || a.type}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { to: '/tickets/new', icon: Ticket, titulo: 'Reportar incidente', texto: 'Abre un ticket de soporte' },
            { to: '/assets/new', icon: Monitor, titulo: 'Registrar activo', texto: 'Agrega un equipo al inventario' },
            { to: '/knowledgebase/new', icon: BookOpen, titulo: 'Nuevo artículo', texto: 'Documenta una solución' },
            { to: '/reports', icon: FileBarChart, titulo: 'Ver reportes', texto: 'Indicadores y estadísticas' },
          ].map(({ to, icon: Icon, titulo, texto }) => (
            <Link key={to} to={to} className="group flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{titulo}</p>
                <p className="truncate text-xs text-gray-500">{texto}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
