// Gráficos del panel en SVG propio (sin librerías): dona, tendencia y barras.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const numero = (n) => n.toLocaleString('es-CO');
const porcentaje = (v, t) => (t ? Math.round((v / t) * 100) : 0);

// ---------- Dona ----------
// datos: [{ clave, label, value, color, to? }]
export function Dona({ datos, total, etiquetaTotal = 'Total' }) {
  const [activo, setActivo] = useState(null);
  const suma = datos.reduce((s, d) => s + d.value, 0);
  const R = 62;
  const GROSOR = 16;
  const C = 2 * Math.PI * R;
  const visibles = datos.filter((d) => d.value > 0);
  const hueco = visibles.length > 1 ? 2.5 : 0; // separación entre segmentos

  let acumulado = 0;
  const segmentos = visibles.map((d) => {
    const largo = (d.value / suma) * C;
    const seg = { ...d, inicio: acumulado, largo: Math.max(largo - hueco, 0.5) };
    acumulado += largo;
    return seg;
  });

  const sel = datos.find((d) => d.clave === activo);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={`${etiquetaTotal}: ${total}`}>
          <circle cx="80" cy="80" r={R} fill="none" stroke="#f1f5f9" strokeWidth={GROSOR} />
          {segmentos.map((s) => (
            <circle
              key={s.clave}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={activo === s.clave ? GROSOR + 4 : GROSOR}
              strokeDasharray={`${s.largo} ${C - s.largo}`}
              strokeDashoffset={-s.inicio}
              opacity={activo && activo !== s.clave ? 0.35 : 1}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setActivo(s.clave)}
              onMouseLeave={() => setActivo(null)}
            >
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">{numero(sel ? sel.value : total)}</span>
          <span className="mt-0.5 max-w-[6.5rem] truncate text-xs text-gray-500">
            {sel ? `${sel.label} · ${porcentaje(sel.value, suma)}%` : etiquetaTotal}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1">
        {datos.map((d) => {
          const fila = (
            <>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="min-w-0 flex-1 truncate text-gray-600">{d.label}</span>
              <span className="font-medium text-gray-900 tabular-nums">{numero(d.value)}</span>
              <span className="w-10 text-right text-xs text-gray-400 tabular-nums">{porcentaje(d.value, suma)}%</span>
            </>
          );
          const clase = `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
            activo === d.clave ? 'bg-gray-50' : ''
          } ${d.to ? 'hover:bg-gray-50' : ''}`;
          return (
            <li key={d.clave} onMouseEnter={() => setActivo(d.value ? d.clave : null)} onMouseLeave={() => setActivo(null)}>
              {d.to ? <Link to={d.to} className={clase}>{fila}</Link> : <div className={clase}>{fila}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------- Ancho del contenedor ----------
function useAncho() {
  const ref = useRef(null);
  const [ancho, setAncho] = useState(0);
  useLayoutEffect(() => {
    if (ref.current) setAncho(ref.current.clientWidth);
  }, []);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho];
}

// Marcas "bonitas" para el eje Y (enteros)
function marcasY(max) {
  if (max <= 4) return [0, 1, 2, 3, 4].filter((v) => v <= Math.max(max, 2) + 1).slice(0, 5);
  const paso = Math.ceil(max / 4);
  return [0, paso, paso * 2, paso * 3, paso * 4];
}

// ---------- Tendencia (área) ----------
// serie: [{ fecha: Date, valor: number }]
export function Tendencia({ serie, alto = 220, unidad = 'tickets', color = '#2557eb' }) {
  const [ref, ancho] = useAncho();
  const [indice, setIndice] = useState(null);
  const M = { arriba: 12, derecha: 12, abajo: 26, izquierda: 30 };

  const { puntos, linea, area, marcas, maxY, x } = useMemo(() => {
    const max = Math.max(...serie.map((p) => p.valor), 0);
    const ticks = marcasY(max);
    const tope = ticks[ticks.length - 1] || 1;
    const w = Math.max(ancho - M.izquierda - M.derecha, 10);
    const h = alto - M.arriba - M.abajo;
    const fx = (i) => M.izquierda + (serie.length > 1 ? (i / (serie.length - 1)) * w : w / 2);
    const fy = (v) => M.arriba + h - (v / tope) * h;
    const pts = serie.map((p, i) => [fx(i), fy(p.valor)]);
    // curva suave (monótona simple)
    const camino = pts.reduce((acc, [px, py], i) => {
      if (i === 0) return `M${px},${py}`;
      const [qx, qy] = pts[i - 1];
      const cx = (qx + px) / 2;
      return `${acc} C${cx},${qy} ${cx},${py} ${px},${py}`;
    }, '');
    const base = M.arriba + h;
    return {
      puntos: pts,
      linea: camino,
      area: pts.length ? `${camino} L${pts[pts.length - 1][0]},${base} L${pts[0][0]},${base} Z` : '',
      marcas: ticks.map((t) => ({ v: t, y: fy(t) })),
      maxY: base,
      x: fx,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serie, ancho, alto]);

  const mover = (e) => {
    if (!serie.length) return;
    const caja = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - caja.left;
    let mejor = 0;
    puntos.forEach(([qx], i) => {
      if (Math.abs(qx - px) < Math.abs(puntos[mejor][0] - px)) mejor = i;
    });
    setIndice(mejor);
  };

  const cadaCuanto = Math.max(1, Math.ceil(serie.length / Math.max(2, Math.floor(ancho / 70))));
  const corto = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '');
  const p = indice !== null ? serie[indice] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height: alto }}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} className="block" onMouseMove={mover} onMouseLeave={() => setIndice(null)} role="img" aria-label={`Tendencia de ${unidad}`}>
          <defs>
            <linearGradient id="relleno-tendencia" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {marcas.map((m) => (
            <g key={m.v}>
              <line x1={M.izquierda} x2={ancho - M.derecha} y1={m.y} y2={m.y} stroke="#eef0f3" strokeDasharray={m.v === 0 ? undefined : '3 4'} />
              <text x={M.izquierda - 8} y={m.y} dy="0.32em" textAnchor="end" className="fill-gray-400 text-[11px] tabular-nums">{m.v}</text>
            </g>
          ))}
          {serie.map((s, i) => {
            const ultimo = i === serie.length - 1;
            // se muestra cada N días y el último, salvo que quede pegado al anterior
            const visible = ultimo ? i % cadaCuanto === 0 || i % cadaCuanto >= cadaCuanto * 0.6 : i % cadaCuanto === 0;
            if (!visible) return null;
            return (
              <text key={i} x={x(i)} y={alto - 6} textAnchor={i === 0 ? 'start' : ultimo ? 'end' : 'middle'} className="fill-gray-400 text-[11px]">
                {corto(s.fecha)}
              </text>
            );
          })}
          <path d={area} fill="url(#relleno-tendencia)" />
          <path d={linea} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {p && (
            <g pointerEvents="none">
              <line x1={puntos[indice][0]} x2={puntos[indice][0]} y1={M.arriba} y2={maxY} stroke="#cbd5e1" strokeDasharray="3 3" />
              <circle cx={puntos[indice][0]} cy={puntos[indice][1]} r="5" fill={color} stroke="#fff" strokeWidth="2" />
            </g>
          )}
          <rect x={M.izquierda} y={0} width={Math.max(ancho - M.izquierda - M.derecha, 0)} height={alto} fill="transparent" />
        </svg>
      )}
      {p && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(puntos[indice][0], 70), ancho - 70),
            top: Math.max(puntos[indice][1] - 64, 0),
          }}
        >
          <p className="font-medium capitalize text-gray-900">
            {p.fecha.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-gray-600">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="font-semibold text-gray-900 tabular-nums">{p.valor}</span> {p.valor === 1 ? unidad.replace(/s$/, '') : unidad}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------- Barras horizontales ----------
// datos: [{ clave, label, value, to? }]
export function BarrasH({ datos, color = '#3b74f6', unidad = '' }) {
  const max = Math.max(...datos.map((d) => d.value), 1);
  const total = datos.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="space-y-1">
      {datos.map((d) => {
        const contenido = (
          <>
            <span className="w-28 shrink-0 truncate text-[13px] text-gray-600">{d.label}</span>
            <span className="relative h-5 flex-1">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[4px] transition-opacity group-hover:opacity-80"
                style={{ width: `${Math.max((d.value / max) * 100, 1.5)}%`, background: color }}
              />
            </span>
            <span className="w-8 text-right text-[13px] font-medium text-gray-900 tabular-nums">{numero(d.value)}</span>
            <span className="w-10 text-right text-xs text-gray-400 tabular-nums">{porcentaje(d.value, total)}%</span>
          </>
        );
        const clase = 'group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50';
        return (
          <li key={d.clave} title={`${d.label}: ${d.value}${unidad ? ` ${unidad}` : ''}`}>
            {d.to ? <Link to={d.to} className={clase}>{contenido}</Link> : <div className={clase}>{contenido}</div>}
          </li>
        );
      })}
    </ul>
  );
}
