import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import api from '../services/api';

const MAXIMO = 8;
const TIPOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Convierte el valor guardado (lista JSON o arreglo) en un arreglo de URLs.
export const fotosDe = (valor) => {
  if (Array.isArray(valor)) return valor;
  try {
    const arr = JSON.parse(valor || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

// Campo para subir, ver y quitar las fotos propias de un activo.
export default function FotosActivo({ value = [], onChange, compacto = false, vertical = false }) {
  const entrada = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const [ampliada, setAmpliada] = useState(null);

  const subir = async (lista) => {
    setError('');
    const archivos = [...lista].filter((f) => TIPOS.includes(f.type));
    if (!archivos.length) return setError('Solo se admiten imágenes JPG, PNG, GIF o WEBP.');
    const grandes = archivos.filter((f) => f.size > 3 * 1024 * 1024);
    if (grandes.length) return setError('Cada foto debe pesar menos de 3 MB.');
    const espacio = MAXIMO - value.length;
    if (espacio <= 0) return setError(`Puedes agregar hasta ${MAXIMO} fotos.`);
    const datos = new FormData();
    archivos.slice(0, espacio).forEach((f) => datos.append('images', f));
    setSubiendo(true);
    try {
      const r = await api.post('/assets/upload-photos', datos, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange([...value, ...r.data.urls]);
      if (archivos.length > espacio) setError(`Solo se agregaron ${espacio}: el máximo es ${MAXIMO} fotos.`);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudieron subir las fotos.');
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = '';
    }
  };

  const quitar = (url) => onChange(value.filter((u) => u !== url));

  return (
    <div>
      <div className={`grid gap-3 ${vertical ? 'grid-cols-1' : compacto ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {value.map((url, i) => (
          <div key={url} className={`group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${vertical ? 'aspect-[4/3]' : 'aspect-square'}`}>
            <button type="button" onClick={() => setAmpliada(url)} className="h-full w-full" title="Ver en grande">
              <img src={url} alt={`Foto ${i + 1} del activo`} className="h-full w-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => quitar(url)}
              className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-gray-600 shadow-sm hover:bg-red-50 hover:text-red-600"
              aria-label={`Quitar foto ${i + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white">Principal</span>}
          </div>
        ))}

        {value.length < MAXIMO && (
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastrando(false); subir(e.dataTransfer.files); }}
            disabled={subiendo}
            className={`flex ${vertical ? 'h-28' : 'aspect-square'} flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-2 text-center transition-colors ${
              arrastrando ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50/50'
            }`}
          >
            {subiendo ? <Loader2 className="h-6 w-6 animate-spin text-brand-600" /> : <ImagePlus className="h-6 w-6 text-brand-600" strokeWidth={1.8} />}
            <span className="text-xs font-medium text-gray-700">{subiendo ? 'Subiendo…' : 'Agregar fotos'}</span>
            {!subiendo && <span className="text-[10px] text-gray-400">Arrastra o haz clic</span>}
          </button>
        )}
      </div>

      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={(e) => subir(e.target.files)} />
      <p className="mt-2 text-xs text-gray-500">Hasta {MAXIMO} fotos de 3 MB (JPG, PNG o WEBP). La primera es la foto principal.</p>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}

      {ampliada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setAmpliada(null)}>
          <img src={ampliada} alt="Foto ampliada del activo" className="max-h-full max-w-full rounded-lg" />
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-700" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
