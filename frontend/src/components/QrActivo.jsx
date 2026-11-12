import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Dirección que abre el QR: la ficha del activo en esta misma instalación de ITAMS.
export const urlActivo = (id) => `${window.location.origin}/assets/${id}`;

const OPCIONES = { errorCorrectionLevel: 'M', margin: 1, color: { dark: '#0f172a', light: '#ffffff' } };

// Código QR en SVG (nítido en pantalla y al imprimir).
export function CodigoQr({ texto, className = 'h-32 w-32' }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let vivo = true;
    QRCode.toString(texto, { ...OPCIONES, type: 'svg' }).then((s) => vivo && setSvg(s)).catch(() => vivo && setSvg(''));
    return () => { vivo = false; };
  }, [texto]);
  return <div className={`${className} [&>svg]:h-full [&>svg]:w-full`} role="img" aria-label="Código QR" dangerouslySetInnerHTML={{ __html: svg }} />;
}

// Descarga el QR como imagen PNG con el nombre del activo debajo, lista para imprimir.
export async function descargarQr(activo) {
  const qr = await QRCode.toDataURL(urlActivo(activo.id), { ...OPCIONES, width: 600 });
  const img = new Image();
  await new Promise((ok) => { img.onload = ok; img.src = qr; });
  const lienzo = document.createElement('canvas');
  lienzo.width = 600;
  lienzo.height = 720;
  const c = lienzo.getContext('2d');
  c.fillStyle = '#fff';
  c.fillRect(0, 0, lienzo.width, lienzo.height);
  c.drawImage(img, 0, 0, 600, 600);
  c.fillStyle = '#0f172a';
  c.textAlign = 'center';
  c.font = 'bold 40px Inter, Arial, sans-serif';
  c.fillText(activo.name || `Activo ${activo.id}`, 300, 652, 560);
  c.fillStyle = '#475569';
  c.font = '28px Inter, Arial, sans-serif';
  c.fillText(activo.inventory_number || activo.serial_number || `ID ${activo.id}`, 300, 698, 560);
  const enlace = document.createElement('a');
  enlace.href = lienzo.toDataURL('image/png');
  enlace.download = `QR-${(activo.name || activo.id).toString().replace(/[^\w-]+/g, '_')}.png`;
  enlace.click();
}
