import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, ChevronDown, ChevronRight, LogOut, Menu, Plus, Search, X } from 'lucide-react';
import api from '../services/api';
import { NAV_GROUPS, findNav } from './navigation';
import Logo from './Logo';

const ROLES = { admin: 'Administrador', technician: 'Técnico', agent: 'Agente', user: 'Usuario' };

function iniciales(nombre = '') {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
}

function NavItem({ item, onNavigate, nested }) {
  const Icon = item.icon;
  const location = useLocation();
  // Activo si es la ruta más específica que coincide (evita marcar /tickets y /tickets/new a la vez)
  const activo = findNav(location.pathname)?.item.path === item.path;
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 rounded-md px-3 ${nested ? 'py-1.5' : 'py-2'} text-[13px] font-medium transition-colors ${
        activo ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
      }`}
    >
      {activo && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-400" />}
      <Icon className={`h-4 w-4 shrink-0 ${activo ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'}`} strokeWidth={1.8} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function Sidebar({ user, onNavigate }) {
  const location = useLocation();
  const [filtro, setFiltro] = useState('');
  const grupos = NAV_GROUPS.filter((g) => !g.admin || user.role === 'admin');
  const actual = findNav(location.pathname);
  const [abiertos, setAbiertos] = useState(() => new Set(actual ? [actual.group.id] : []));

  // Al navegar, abre el grupo de la página actual
  useEffect(() => {
    if (actual) setAbiertos((s) => (s.has(actual.group.id) ? s : new Set(s).add(actual.group.id)));
  }, [actual?.group.id]);

  // Búsqueda sin distinguir mayúsculas ni tildes ("auditoria" encuentra "Auditoría")
  const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const texto = normalizar(filtro.trim());
  const resultados = useMemo(() => {
    if (!texto) return null;
    return grupos.flatMap((g) =>
      g.items.filter((i) => normalizar(`${i.label} ${g.label}`).includes(texto)).map((i) => ({ ...i, grupo: g.label }))
    );
  }, [texto, user.role]);

  const alternar = (id) =>
    setAbiertos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5 border-b border-white/5">
        <Logo className="h-8 w-8" />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-white">ITAMS</p>
          <p className="text-[11px] text-slate-400">Gestión de activos de TI</p>
        </div>
      </div>

      <div className="px-3 pt-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar módulo…"
            className="w-full rounded-md border border-white/10 !bg-white/5 py-1.5 pl-8 pr-7 text-[13px] text-slate-200 placeholder:text-slate-500 focus:!border-brand-400"
          />
          {filtro && (
            <button onClick={() => setFiltro('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" aria-label="Limpiar búsqueda">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [scrollbar-color:rgb(255_255_255/0.12)_transparent]">
        {resultados ? (
          resultados.length ? (
            <div className="space-y-0.5">
              {resultados.map((i) => (
                <div key={i.path}>
                  <NavItem item={i} onNavigate={() => { setFiltro(''); onNavigate?.(); }} />
                  <p className="-mt-1 mb-1 pl-10 text-[11px] text-slate-500">{i.grupo}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-3 text-[13px] text-slate-500">Sin resultados para “{filtro}”.</p>
          )
        ) : (
          grupos.map((g) =>
            !g.icon ? (
              <div key={g.id} className="space-y-0.5">
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.label}</p>
                {g.items.map((i) => (
                  <NavItem key={i.path} item={i} onNavigate={onNavigate} />
                ))}
              </div>
            ) : (
              <div key={g.id}>
                <button
                  onClick={() => alternar(g.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                    actual?.group.id === g.id ? 'text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                  aria-expanded={abiertos.has(g.id)}
                >
                  <g.icon className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.8} />
                  <span className="flex-1 text-left">{g.label}</span>
                  {abiertos.has(g.id) ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                </button>
                {abiertos.has(g.id) && (
                  <div className="ml-5 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                    {g.items.map((i) => (
                      <NavItem key={i.path} item={i} onNavigate={onNavigate} nested />
                    ))}
                  </div>
                )}
              </div>
            )
          )
        )}
      </nav>

      <div className="shrink-0 border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {iniciales(user.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium text-slate-100">{user.name}</p>
            <p className="text-[11px] text-slate-400">{ROLES[user.role] || user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserMenu({ user, onLogout }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const cerrar = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-gray-100 transition-colors"
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {iniciales(user.name)}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-[13px] font-medium text-gray-900">{user.name}</span>
          <span className="block text-[11px] text-gray-500">{ROLES[user.role] || user.role}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-gray-400 md:block" />
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 mt-2 w-60 overflow-hidden rounded-lg bg-white shadow-lg z-30">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
          <button
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4 text-gray-400" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function Layout({ user, onLogout }) {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuMovil, setMenuMovil] = useState(false);
  const actual = findNav(location.pathname);

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('Error al consultar notificaciones:', error);
      }
    };
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  // Título de la pestaña del navegador según la página
  useEffect(() => {
    document.title = actual ? `${actual.item.label} · ITAMS` : 'ITAMS · Gestión de activos de TI';
  }, [actual?.item.path]);

  // Cierra el menú móvil al cambiar de página
  useEffect(() => setMenuMovil(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menú lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 lg:block">
        <Sidebar user={user} />
      </aside>

      {/* Menú lateral (móvil) */}
      {menuMovil && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMenuMovil(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <Sidebar user={user} onNavigate={() => setMenuMovil(false)} />
          </aside>
          <button
            onClick={() => setMenuMovil(false)}
            className="absolute right-4 top-4 rounded-md p-2 text-white/80 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setMenuMovil(true)}
              className="-ml-1 rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav aria-label="Ruta de navegación" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
              {actual && actual.group.id !== 'principal' && (
                <>
                  <span className="hidden truncate text-gray-500 sm:inline">{actual.group.label}</span>
                  <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-gray-300 sm:inline" />
                </>
              )}
              <span className="truncate font-semibold text-gray-900">{actual?.item.label || 'ITAMS'}</span>
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/tickets/new"
                className="hidden items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-[13px] font-medium text-white shadow-sm hover:bg-brand-700 transition-colors sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Nuevo ticket
              </Link>
              <Link
                to="/notifications"
                className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label={`Notificaciones${unreadCount ? ` (${unreadCount} sin leer)` : ''}`}
              >
                <Bell className="h-5 w-5" strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />
              <UserMenu user={user} onLogout={onLogout} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
