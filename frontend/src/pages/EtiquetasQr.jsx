import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckSquare, Printer, QrCode, Search, Square } from 'lucide-react';
import api from '../services/api';
import { CodigoQr, urlActivo } from '../components/QrActivo';
import { Card, EmptyState, PageHeader, Spinner, botonPrimario, botonSecundario, campo, tipoActivo } from '../components/ui';

// Al imprimir solo se muestra la hoja de etiquetas.
const ESTILO_IMPRESION = `
@media print {
  @page { margin: 10mm; }
  body * { visibility: hidden !important; }
  #hoja-etiquetas, #hoja-etiquetas * { visibility: visible !important; }
  #hoja-etiquetas { position: absolute; left: 0; top: 0; width: 100%; }
}`;

function EtiquetasQr() {
  const [params] = useSearchParams();
  const [activos, setActivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [elegidos, setElegidos] = useState(() => new Set((params.get('ids') || '').split(',').filter(Boolean).map(Number)));

  useEffect(() => {
    api.get('/assets')
      .then((r) => {
        setActivos(r.data);
        // Si no llegó ninguna selección, se preparan todos los activos en uso o disponibles
        setElegidos((prev) => (prev.size ? prev : new Set(r.data.filter((a) => a.status !== 'retired').map((a) => a.id))));
      })
      .catch((e) => console.error('Error al cargar activos:', e))
      .finally(() => setCargando(false));
  }, []);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return activos;
    return activos.filter((a) => [a.name, a.inventory_number, a.serial_number, a.location, a.model].some((v) => v && String(v).toLowerCase().includes(q)));
  }, [activos, busqueda]);

  const seleccion = activos.filter((a) => elegidos.has(a.id));
  const alternar = (id) => setElegidos((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const todosVisibles = visibles.length > 0 && visibles.every((a) => elegidos.has(a.id));
  const alternarVisibles = () => setElegidos((prev) => {
    const s = new Set(prev);
    visibles.forEach((a) => (todosVisibles ? s.delete(a.id) : s.add(a.id)));
    return s;
  });

  if (cargando) return <Spinner label="Cargando activos…" />;

  return (
    <div className="space-y-6">
      <style>{ESTILO_IMPRESION}</style>
      <PageHeader
        title="Etiquetas QR"
        description="Imprime etiquetas para pegar en los equipos. Al escanearlas con el celular se abre la ficha del activo."
        actions={
          <button onClick={() => window.print()} disabled={!seleccion.length} className={botonPrimario}>
            <Printer className="h-4 w-4" /> Imprimir {seleccion.length ? `(${seleccion.length})` : ''}
          </button>
        }
      />

      {activos.length === 0 ? (
        <Card><EmptyState icon={QrCode} title="Aún no hay activos" description="Registra equipos para generar sus etiquetas." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="overflow-hidden xl:col-span-1">
            <div className="space-y-3 border-b border-gray-100 p-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar activo…" className={`${campo} pl-9`} />
              </label>
              <button onClick={alternarVisibles} className={`${botonSecundario} w-full`}>
                {todosVisibles ? 'Quitar todos' : 'Elegir todos'}
              </button>
            </div>
            <ul className="max-h-[32rem] divide-y divide-gray-100 overflow-y-auto">
              {visibles.map((a) => {
                const marcado = elegidos.has(a.id);
                return (
                  <li key={a.id}>
                    <button onClick={() => alternar(a.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50">
                      {marcado ? <CheckSquare className="h-4 w-4 shrink-0 text-brand-600" /> : <Square className="h-4 w-4 shrink-0 text-gray-300" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">{a.name}</span>
                        <span className="block truncate text-xs text-gray-500">{[tipoActivo(a.type), a.location].filter(Boolean).join(' · ')}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Vista previa</h2>
              <span className="text-xs text-gray-500">{seleccion.length} {seleccion.length === 1 ? 'etiqueta' : 'etiquetas'}</span>
            </div>
            {seleccion.length === 0 ? (
              <EmptyState icon={QrCode} title="Elige los activos" description="Marca en la lista los equipos que necesitan etiqueta." />
            ) : (
              <div id="hoja-etiquetas" className="grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-4">
                {seleccion.map((a) => (
                  <div key={a.id} className="flex break-inside-avoid flex-col items-center rounded-lg border border-dashed border-gray-300 p-3 text-center">
                    <CodigoQr texto={urlActivo(a.id)} className="h-28 w-28" />
                    <p className="mt-2 w-full truncate text-sm font-semibold text-gray-900">{a.name}</p>
                    <p className="w-full truncate text-[11px] text-gray-500">{a.inventory_number || a.serial_number || `ID ${a.id}`}</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-brand-700">ITAMS · Activos de TI</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default EtiquetasQr;
