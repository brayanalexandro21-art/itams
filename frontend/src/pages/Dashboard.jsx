import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket, UserX, Monitor, ArrowRight, Plus, BookOpen, FileBarChart, TrendingUp, Layers,
  ArrowUpRight, ArrowDownRight, BarChart3,
} from 'lucide-react';
import api from '../services/api';
import { Card, EmptyState, PageHeader, Spinner, StatusBadge, botonPrimario, botonSecundario, fecha, tipoActivo } from '../components/ui';
import { BarrasH, Dona, Tendencia } from '../components/Graficos';

// Colores de los gráficos (validados para daltonismo; siempre van con etiqueta y número)
const COLORES = {
  azul: '#2557eb',
  azulClaro: '#3b74f6',
  verde: '#059669',
  ambar: '#f59e0b',
  gris: '#94a3b8',
};

// Las fechas de SQLite vienen como "AAAA-MM-DD HH:MM:SS" en UTC
const fechaLocal = (s) => {
  if (!s) return null;
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${String(s).replace(' ', 'T')}Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

function TarjetaGrafico({ titulo, subtitulo, icono: Icon, extra, className = '', children }) {
  return (
    <Card className={`flex flex-col p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900">{titulo}</h3>
            {subtitulo && <p className="truncate text-xs text-gray-500">{subtitulo}</p>}
          </div>
        </div>
        {extra}
      </div>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </Card>
  );
}

function SinDatos({ texto }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <BarChart3 className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
      <p className="mt-2 text-sm text-gray-500">{texto}</p>
    </div>
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
  const [allTickets, setAllTickets] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
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
        setAllTickets(ticketsRes.data);
        setAllAssets(assetsRes.data);
      } catch (error) {
        console.error('Error al cargar el panel:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner label="Cargando panel…" />;

  const totalTickets = ticketStats?.total || 0;
  const ticketsPorEstado = [
    { clave: 'open', label: 'Abiertos', value: ticketStats?.open || 0, color: COLORES.ambar, to: '/tickets?status=open' },
    { clave: 'in_progress', label: 'En progreso', value: ticketStats?.inProgress || 0, color: COLORES.azul, to: '/tickets?status=in_progress' },
    { clave: 'resolved', label: 'Resueltos', value: ticketStats?.resolved || 0, color: COLORES.verde, to: '/tickets?status=resolved' },
    { clave: 'closed', label: 'Cerrados', value: ticketStats?.closed || 0, color: COLORES.gris, to: '/tickets?status=closed' },
  ];
  const otrosTickets = Math.max(0, totalTickets - ticketsPorEstado.reduce((s, d) => s + d.value, 0));
  if (otrosTickets) ticketsPorEstado.push({ clave: 'otros', label: 'Otros', value: otrosTickets, color: '#cbd5e1' });

  const totalActivos = assetStats?.total || 0;
  const activosPorEstado = [
    { clave: 'available', label: 'Disponibles', value: assetStats?.available || 0, color: COLORES.verde, to: '/assets?status=available' },
    { clave: 'in_use', label: 'En uso', value: assetStats?.in_use || 0, color: COLORES.azul, to: '/assets?status=in_use' },
    { clave: 'maintenance', label: 'En mantenimiento', value: assetStats?.maintenance || 0, color: COLORES.ambar, to: '/assets?status=maintenance' },
  ];
  const otrosActivos = Math.max(0, totalActivos - activosPorEstado.reduce((s, d) => s + d.value, 0));
  if (otrosActivos) activosPorEstado.push({ clave: 'otros', label: 'Retirados y otros', value: otrosActivos, color: COLORES.gris });

  // Tickets creados por día en los últimos 30 días (y los 30 anteriores, para comparar)
  const DIAS = 30;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const claveDia = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const conteo = {};
  let periodoAnterior = 0;
  const inicioAnterior = new Date(hoy);
  inicioAnterior.setDate(hoy.getDate() - DIAS * 2 + 1);
  const inicioActual = new Date(hoy);
  inicioActual.setDate(hoy.getDate() - DIAS + 1);
  allTickets.forEach((t) => {
    const f = fechaLocal(t.created_at);
    if (!f) return;
    if (f >= inicioActual) conteo[claveDia(f)] = (conteo[claveDia(f)] || 0) + 1;
    else if (f >= inicioAnterior) periodoAnterior += 1;
  });
  const serie = Array.from({ length: DIAS }, (_, i) => {
    const d = new Date(inicioActual);
    d.setDate(inicioActual.getDate() + i);
    return { fecha: d, valor: conteo[claveDia(d)] || 0 };
  });
  const periodoActual = serie.reduce((s, p) => s + p.valor, 0);
  const cambio = periodoAnterior ? Math.round(((periodoActual - periodoAnterior) / periodoAnterior) * 100) : null;

  // Activos por tipo
  const porTipo = {};
  allAssets.forEach((a) => {
    const t = (a.type || 'other').toLowerCase();
    porTipo[t] = (porTipo[t] || 0) + 1;
  });
  const activosPorTipo = Object.entries(porTipo)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => ({ clave: t, label: tipoActivo(t) || 'Otro', value: n, to: `/assets?type=${encodeURIComponent(t)}` }));

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TarjetaGrafico
            titulo="Tickets por estado"
            icono={Ticket}
            extra={
              (ticketStats?.unassigned || 0) > 0 && (
                <Link to="/tickets" className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/15 hover:bg-red-100">
                  <UserX className="h-3 w-3" /> {ticketStats.unassigned} sin asignar
                </Link>
              )
            }
          >
            {totalTickets ? <Dona datos={ticketsPorEstado} total={totalTickets} etiquetaTotal="tickets" /> : <SinDatos texto="Aún no hay tickets" />}
          </TarjetaGrafico>

          <TarjetaGrafico
            className="lg:col-span-2"
            titulo="Tickets creados"
            subtitulo="Últimos 30 días"
            icono={TrendingUp}
            extra={
              <div className="text-right">
                <p className="text-2xl font-semibold leading-none tracking-tight text-gray-900 tabular-nums">{periodoActual}</p>
                {cambio !== null ? (
                  <p className={`mt-1 inline-flex items-center gap-0.5 text-xs font-medium ${cambio > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {cambio > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {Math.abs(cambio)}% vs. 30 días previos
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">en el periodo</p>
                )}
              </div>
            }
          >
            <Tendencia serie={serie} unidad="tickets" color={COLORES.azul} />
          </TarjetaGrafico>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Inventario</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TarjetaGrafico titulo="Activos por estado" icono={Monitor}>
            {totalActivos ? <Dona datos={activosPorEstado} total={totalActivos} etiquetaTotal="activos" /> : <SinDatos texto="Aún no hay activos" />}
          </TarjetaGrafico>

          <TarjetaGrafico className="lg:col-span-2" titulo="Activos por tipo" subtitulo={`${totalActivos} equipos registrados`} icono={Layers}>
            {activosPorTipo.length ? <BarrasH datos={activosPorTipo} color={COLORES.azulClaro} unidad="activos" /> : <SinDatos texto="Aún no hay activos" />}
          </TarjetaGrafico>
        </div>
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
