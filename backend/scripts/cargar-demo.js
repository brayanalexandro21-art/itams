// Carga datos de demostración en español: usuarios, activos, tickets con su historial,
// artículos de la base de conocimiento, mantenimientos y notificaciones.
// También traduce los registros de ejemplo que venían en inglés.
//
// Uso:  npm run cargar-demo
// Se conecta a la misma base que el servidor (Turso si está configurado en .env).
// Es seguro ejecutarlo varias veces: si los datos ya existen, no vuelve a cargarlos.
// No modifica ni borra los registros que hayas creado tú.

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../database');

const hace = (dias, horas = 0) => {
  const d = new Date(Date.now() - dias * 86400000 - horas * 3600000);
  return d.toISOString().replace('T', ' ').slice(0, 19);
};
const fechaDias = (dias) => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);

const MARCA = 'laura.gomez@itams.demo';

function traducirEjemplos() {
  const cambios = [
    ["UPDATE tickets SET title = 'El computador no enciende', description = 'Mi computador de escritorio no enciende después del corte de energía de esta mañana.' WHERE title = 'Computer not turning on'"],
    ["UPDATE knowledge_base SET title = 'Cómo restablecer tu contraseña', category = 'Accesos', content = ? WHERE title = 'How to Reset Password'",
      'Paso 1: Abre la página de inicio de sesión de ITAMS.\nPaso 2: Haz clic en «¿Olvidaste tu contraseña?».\nPaso 3: Escribe tu correo corporativo.\nPaso 4: Revisa tu bandeja de entrada y sigue el enlace para crear una contraseña nueva.\n\nSi no recibes el correo en 10 minutos, revisa la carpeta de spam o abre un ticket en la categoría «Accesos y permisos».'],
    ["UPDATE slas SET name = 'SLA estándar', description = 'Tiempos de respuesta y resolución habituales' WHERE name = 'Standard SLA'"],
    ["UPDATE ticket_templates SET name = 'Restablecer contraseña', description = 'El usuario necesita una contraseña nueva', template_title = 'Solicitud de cambio de contraseña', template_description = 'El usuario no recuerda su contraseña y necesita restablecerla.' WHERE name = 'Password Reset'"],
    ["UPDATE assets SET location = 'Oficina Principal', location_id = COALESCE(location_id, 1) WHERE location = 'Office 101'"],
    ["UPDATE users SET name = 'Usuario de prueba' WHERE name = 'Test User'"],
  ];
  let n = 0;
  for (const [sql, ...params] of cambios) n += db.prepare(sql).run(...params).changes;
  return n;
}

function cargar() {
  // ---------- Usuarios (sin acceso: contraseña aleatoria que nadie conoce) ----------
  const hash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10);
  const personas = [
    ['Laura Gómez', MARCA, 'technician', 'IT'],
    ['Andrés Ramírez', 'andres.ramirez@itams.demo', 'technician', 'IT'],
    ['Camila Torres', 'camila.torres@itams.demo', 'technician', 'IT'],
    ['Juan Pérez', 'juan.perez@itams.demo', 'user', 'Finance'],
    ['María Rodríguez', 'maria.rodriguez@itams.demo', 'user', 'HR'],
    ['Carlos Martínez', 'carlos.martinez@itams.demo', 'user', 'Sales'],
    ['Diana López', 'diana.lopez@itams.demo', 'user', 'Marketing'],
    ['Felipe Castro', 'felipe.castro@itams.demo', 'user', 'Operations'],
  ];
  const u = {};
  const insUsuario = db.prepare("INSERT INTO users (name, email, password, role, department, preferred_language, created_at) VALUES (?, ?, ?, ?, ?, 'es', ?)");
  personas.forEach(([nombre, correo, rol, area], i) => {
    u[correo.split('.')[0]] = Number(insUsuario.run(nombre, correo, hash, rol, area, hace(60 - i)).lastInsertRowid);
  });
  const admin = db.prepare("SELECT id FROM users WHERE email = 'admin@itams.com'").get()?.id || null;

  // ---------- Activos ----------
  // [nombre, tipo, estado, serie, modelo, fabricante, ubicación, type_id, manufacturer_id, model_id, asignado, compra (días atrás), garantía (días desde hoy), costo COP]
  const ESTADO_ID = { available: 1, in_use: 2, maintenance: 3, retired: 4 };
  const UBIC = { 'Oficina Principal': 1, 'Sala de Servidores': 2, 'Almacén': 3, 'Piso 1 - Recepción': 4, 'Piso 2 - Desarrollo': 5 };
  const activos = [
    ['PC-CONT-001', 'computer', 'in_use', 'MXL2341ABC', 'ProDesk 400 G7', 'HP', 'Oficina Principal', 1, 2, 2, 'juan', 700, 395, 3200000],
    ['PC-CONT-002', 'computer', 'in_use', 'MXL2341ABD', 'ProDesk 400 G7', 'HP', 'Oficina Principal', 1, 2, 2, null, 700, 395, 3200000],
    ['PC-RRHH-001', 'computer', 'in_use', 'S4K8Z1Q2', 'ThinkCentre M70s', 'Lenovo', 'Oficina Principal', 1, 3, 3, 'maria', 420, 675, 3450000],
    ['PC-RECEP-001', 'computer', 'maintenance', 'CN0D7H5X', 'OptiPlex 7090', 'Dell', 'Piso 1 - Recepción', 1, 1, 1, null, 1100, -5, 2900000],
    ['LAP-VENT-001', 'laptop', 'in_use', 'PF3A9KZT', 'ThinkPad T14 Gen 3', 'Lenovo', 'Piso 2 - Desarrollo', 2, 3, null, 'carlos', 300, 795, 5400000],
    ['LAP-VENT-002', 'laptop', 'in_use', 'PF3A9KZU', 'ThinkPad T14 Gen 3', 'Lenovo', 'Piso 2 - Desarrollo', 2, 3, null, 'diana', 300, 795, 5400000],
    ['LAP-TI-001', 'laptop', 'in_use', '5CG2213LMN', 'EliteBook 840 G9', 'HP', 'Piso 2 - Desarrollo', 2, 2, null, 'laura', 250, 845, 6100000],
    ['LAP-TI-002', 'laptop', 'in_use', '5CG2213LMP', 'EliteBook 840 G9', 'HP', 'Piso 2 - Desarrollo', 2, 2, null, 'andres', 250, 845, 6100000],
    ['LAP-OPS-001', 'laptop', 'available', 'JH7Q2W9E', 'Latitude 5440', 'Dell', 'Almacén', 2, 1, null, null, 120, 975, 4800000],
    ['LAP-GER-001', 'laptop', 'retired', 'C02XK1ABJG5H', 'Latitude 5490', 'Dell', 'Almacén', 2, 1, null, null, 1900, -800, 4200000],
    ['SRV-APP-001', 'server', 'in_use', 'J9X4P2L7', 'PowerEdge R650', 'Dell', 'Sala de Servidores', 3, 1, null, null, 540, 60, 38000000],
    ['SRV-BKP-001', 'server', 'in_use', 'MXQ93501RT', 'ProLiant DL380 Gen10', 'HP', 'Sala de Servidores', 3, 2, null, null, 980, 25, 29500000],
    ['IMP-PISO1-001', 'printer', 'in_use', 'VNB3K12345', 'LaserJet Pro M404dn', 'HP', 'Piso 1 - Recepción', 4, 2, null, null, 610, 120, 1350000],
    ['IMP-PISO2-001', 'printer', 'maintenance', 'ZD8F1A0099', 'Xpress M2070', 'Samsung', 'Piso 2 - Desarrollo', 4, 5, null, null, 1300, -365, 980000],
    ['SW-CORE-001', 'network', 'in_use', 'FOC2345X1YZ', 'Catalyst 9200L', 'Cisco', 'Sala de Servidores', 5, 4, null, null, 800, 300, 12500000],
    ['SW-PISO2-001', 'network', 'in_use', 'FOC2345X2AB', 'Catalyst 1000', 'Cisco', 'Piso 2 - Desarrollo', 5, 4, null, null, 800, 300, 4300000],
    ['TEL-VENT-001', 'phone', 'in_use', 'R58N91ABCDE', 'Galaxy A54', 'Samsung', 'Piso 2 - Desarrollo', null, 5, null, 'carlos', 200, 165, 1700000],
    ['PC-DES-003', 'computer', 'available', 'S4K8Z1Q9', 'ThinkCentre M70s', 'Lenovo', 'Almacén', 1, 3, 3, null, 60, 1035, 3450000],
  ];
  const insActivo = db.prepare(`INSERT INTO assets (name, type, status, serial_number, model, manufacturer, location, status_id, location_id, type_id,
    manufacturer_id, model_id, assigned_to, purchase_date, warranty_expiry, purchase_cost, currency_code, inventory_number, network_id, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COP', ?, ?, ?, ?, ?)`);
  const a = {};
  activos.forEach(([nombre, tipo, estado, serie, modelo, fab, ubic, typeId, fabId, modeloId, asignado, compra, garantia, costo], i) => {
    const red = tipo === 'server' || tipo === 'network' ? 3 : tipo === 'laptop' || tipo === 'phone' ? 2 : 1;
    a[nombre] = Number(insActivo.run(nombre, tipo, estado, serie, modelo, fab, ubic, ESTADO_ID[estado], UBIC[ubic], typeId, fabId, modeloId,
      asignado ? u[asignado] : null, fechaDias(-compra), fechaDias(garantia), costo, `INV-2026-${String(i + 10).padStart(3, '0')}`, red,
      estado === 'retired' ? 'Dado de baja por obsolescencia; pendiente de disposición final.' : null, hace(compra > 60 ? 60 : compra), hace(i % 7)).lastInsertRowid);
  });

  // ---------- Tickets con comentarios y tiempo registrado ----------
  // [título, descripción, estado, prioridad, categoría, solicitante, técnico, activo, creado (días atrás), horas hasta resolver, comentarios[[quién, texto]]]
  const tickets = [
    ['La impresora del piso 2 imprime con manchas', 'Todas las hojas salen con una franja gris en el borde izquierdo. Ya cambié el papel y el problema sigue.', 'in_progress', 'medium', 'hardware', 'diana', 'andres', 'IMP-PISO2-001', 3, null,
      [['andres', 'Revisé el equipo: el tambor de imagen está desgastado. Pedí el repuesto al proveedor.'], ['diana', 'Gracias, mientras tanto uso la impresora de recepción.']]],
    ['No puedo acceder a la carpeta compartida de Contabilidad', 'Desde ayer me aparece «Acceso denegado» al abrir \\\\servidor\\contabilidad.', 'resolved', 'high', 'access', 'juan', 'laura', 'PC-CONT-001', 9, 3,
      [['laura', 'Tu usuario había salido del grupo de seguridad por la rotación de contraseñas. Ya lo agregué de nuevo.'], ['juan', 'Confirmado, ya puedo entrar. ¡Gracias!']]],
    ['Solicitud de portátil para nuevo empleado', 'Ingresa un analista a Operaciones el próximo lunes. Necesita portátil con Office y VPN.', 'open', 'medium', 'hardware', 'felipe', null, null, 1, null, []],
    ['Outlook no sincroniza el correo', 'El correo nuevo no aparece en Outlook, pero sí en el navegador.', 'closed', 'medium', 'email', 'maria', 'camila', 'PC-RRHH-001', 21, 5,
      [['camila', 'Se reconstruyó el perfil de Outlook y se reindexó el buzón.'], ['maria', 'Ya funciona perfecto.']]],
    ['El servidor de aplicaciones responde lento', 'Desde las 8:00 el ERP tarda más de 30 segundos en abrir cada pantalla.', 'resolved', 'urgent', 'software', 'carlos', 'andres', 'SRV-APP-001', 6, 2,
      [['andres', 'El disco de logs estaba al 98 %. Liberé espacio y programé la rotación automática de registros.'], ['laura', 'Agrego alerta de monitoreo cuando el disco supere el 85 %.']]],
    ['Instalar Power BI Desktop', 'Necesito Power BI para los informes de ventas del trimestre.', 'resolved', 'low', 'software', 'carlos', 'camila', 'LAP-VENT-001', 14, 20,
      [['camila', 'Instalado desde el portal de software. Reinicia el equipo antes de abrirlo.']]],
    ['Wi-Fi intermitente en la sala de juntas', 'La conexión se cae cada pocos minutos durante las videollamadas.', 'in_progress', 'high', 'network', 'diana', 'laura', 'SW-PISO2-001', 2, null,
      [['laura', 'Detecté interferencia en el canal 6. Mañana reubico el punto de acceso.']]],
    ['Cambio de contraseña del ERP', 'Olvidé mi contraseña del ERP después de las vacaciones.', 'closed', 'low', 'access', 'felipe', 'camila', null, 18, 1,
      [['camila', 'Contraseña restablecida. Te llegó una temporal al correo.']]],
    ['El computador de recepción se reinicia solo', 'Se apaga y reinicia varias veces al día, sobre todo en la tarde.', 'in_progress', 'high', 'hardware', 'maria', 'andres', 'PC-RECEP-001', 4, null,
      [['andres', 'La fuente de poder presenta fallas. El equipo quedó en mantenimiento y se instaló uno de respaldo.']]],
    ['Configurar VPN en el portátil', 'Voy a trabajar desde casa esta semana y necesito acceder a los sistemas internos.', 'resolved', 'medium', 'network', 'diana', 'laura', 'LAP-VENT-002', 11, 4,
      [['laura', 'VPN configurada y probada. Te dejé la guía en la base de conocimiento.']]],
    ['Teclado con teclas dañadas', 'Varias teclas no responden (E, R y la barra espaciadora).', 'closed', 'low', 'hardware', 'juan', 'andres', 'PC-CONT-002', 25, 26,
      [['andres', 'Se reemplazó el teclado por uno nuevo del almacén.']]],
    ['Error al generar la nómina', 'El módulo de nómina muestra «Error 500» al cerrar el periodo.', 'open', 'urgent', 'software', 'maria', 'laura', 'SRV-APP-001', 0, null,
      [['laura', 'Estoy revisando los registros del servidor; te escribo en 30 minutos.']]],
    ['Solicitud de segundo monitor', 'Para conciliaciones me serviría tener dos pantallas.', 'open', 'low', 'hardware', 'juan', null, null, 2, null, []],
    ['Correo sospechoso recibido', 'Recibí un correo que pide verificar mi cuenta bancaria con un enlace extraño.', 'resolved', 'high', 'email', 'carlos', 'camila', null, 7, 1,
      [['camila', 'Es phishing. Se bloqueó el remitente y se envió alerta a toda la empresa. No hagas clic en el enlace.']]],
    ['Copia de seguridad nocturna fallida', 'La copia programada de anoche terminó con error de espacio.', 'resolved', 'high', 'software', 'laura', 'andres', 'SRV-BKP-001', 5, 6,
      [['andres', 'Se depuraron copias antiguas según la política de retención y la copia se ejecutó manualmente con éxito.']]],
  ];
  const insTicket = db.prepare(`INSERT INTO tickets (title, description, status, priority, category, created_by, assigned_to, asset_id, sla_id, source,
    first_response_at, resolved_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'portal', ?, ?, ?, ?)`);
  const insComentario = db.prepare('INSERT INTO ticket_comments (ticket_id, user_id, comment, created_at) VALUES (?, ?, ?, ?)');
  const insTiempo = db.prepare('INSERT INTO time_entries (ticket_id, user_id, description, start_time, end_time, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const sla = db.prepare('SELECT id FROM slas ORDER BY id LIMIT 1').get()?.id || null;
  let comentarios = 0;
  for (const [titulo, desc, estado, prio, cat, quien, tecnico, activo, dias, horasRes, coments] of tickets) {
    const creado = hace(dias, 3);
    const respuesta = tecnico ? hace(dias, 2) : null;
    const resuelto = horasRes ? hace(dias, 3 - horasRes) : null;
    const id = Number(insTicket.run(titulo, desc, estado, prio, cat, u[quien], tecnico ? u[tecnico] : null, activo ? a[activo] : null, sla,
      respuesta, resuelto, creado, resuelto || respuesta || creado).lastInsertRowid);
    coments.forEach(([autor, texto], i) => { insComentario.run(id, u[autor], texto, hace(dias, 2 - i * 0.5)); comentarios++; });
    if (tecnico && horasRes) {
      const minutos = Math.min(horasRes * 60, 25 + (titulo.length % 5) * 20);
      insTiempo.run(id, u[tecnico], 'Diagnóstico y solución', hace(dias, 2), hace(dias, 2 - minutos / 60), minutos, hace(dias, 2));
    }
  }

  // ---------- Base de conocimiento ----------
  const articulos = [
    ['Cómo conectarte a la VPN desde casa', 'Redes',
      '1. Abre la aplicación «Cliente VPN» desde el menú Inicio.\n2. Escribe la dirección vpn.empresa.com.\n3. Inicia sesión con tu usuario y contraseña de red.\n4. Aprueba la notificación en tu celular (verificación en dos pasos).\n5. Cuando el ícono se ponga verde ya puedes abrir las carpetas compartidas y el ERP.\n\nSi la conexión falla, verifica que tu internet funcione y que la fecha y hora del equipo sean correctas.', 'laura', 58, 21],
    ['Qué hacer si la impresora no imprime', 'Hardware',
      '1. Verifica que la impresora esté encendida y sin luces de error.\n2. Revisa que tenga papel y que no haya hojas atascadas.\n3. En Windows abre Configuración > Impresoras y cancela los trabajos pendientes.\n4. Apaga la impresora 30 segundos y vuelve a encenderla.\n5. Si sigue sin imprimir, abre un ticket indicando el código de inventario de la impresora.', 'andres', 41, 15],
    ['Cómo reconocer un correo de phishing', 'Seguridad',
      'Señales de alerta:\n• El remitente no coincide con el dominio de la empresa.\n• Te pide datos personales, bancarios o contraseñas.\n• Tiene errores de ortografía o un tono urgente («tu cuenta será bloqueada»).\n• Los enlaces llevan a direcciones extrañas (pasa el mouse sin hacer clic para verlas).\n\nSi recibes uno, no respondas ni abras adjuntos: reenvíalo a soporte y elimínalo.', 'camila', 73, 30],
    ['Solicitar un equipo nuevo o un reemplazo', 'Procesos',
      'Para pedir un computador, portátil, monitor o periférico:\n1. Crea un ticket en la categoría «Hardware».\n2. Indica el nombre de la persona, su área y la fecha en que lo necesita.\n3. Si es un reemplazo, incluye el código de inventario del equipo actual.\n\nEl equipo de TI asigna un activo disponible del inventario en un plazo de 2 días hábiles.', 'laura', 26, 9],
    ['Liberar espacio en el disco del computador', 'Software',
      '1. Vacía la papelera de reciclaje.\n2. Abre «Liberador de espacio en disco» y marca archivos temporales y de actualización.\n3. Mueve documentos grandes a OneDrive o a la carpeta compartida del área.\n4. Desinstala programas que ya no uses desde Configuración > Aplicaciones.\n\nRecomendación: mantén al menos un 15 % de espacio libre para que el equipo funcione con fluidez.', 'andres', 34, 12],
  ];
  const insArticulo = db.prepare('INSERT INTO knowledge_base (title, content, category, author_id, views, helpful, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  articulos.forEach(([t, cat, contenido, autor, vistas, util], i) => insArticulo.run(t, contenido, cat, u[autor], vistas, util, hace(40 - i * 6), hace(10 - i)));

  // ---------- Mantenimientos ----------
  const insMant = db.prepare(`INSERT INTO asset_maintenance (asset_id, maintenance_type, type, description, maintenance_date, scheduled_date, cost, currency_code,
    performed_by, next_maintenance_date, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'COP', ?, ?, ?, ?, ?)`);
  const mants = [
    ['SRV-APP-001', 'preventive', 'Limpieza interna y actualización de firmware', -30, 180000, 'andres', 60, 'Sin novedades.'],
    ['PC-RECEP-001', 'corrective', 'Cambio de fuente de poder', -3, 260000, 'andres', null, 'Pendiente de llegada del repuesto.'],
    ['IMP-PISO2-001', 'corrective', 'Reemplazo del tambor de imagen', -2, 340000, 'andres', null, 'Repuesto solicitado al proveedor.'],
    ['SW-CORE-001', 'preventive', 'Revisión de puertos y actualización de IOS', -45, 0, 'laura', 7, 'Próxima revisión programada.'],
  ];
  for (const [activo, tipo, desc, dias, costo, quien, prox, notas] of mants) {
    insMant.run(a[activo], tipo, tipo, desc, fechaDias(dias), fechaDias(dias), costo, u[quien], prox ? fechaDias(prox) : null, notas, admin, hace(-dias));
  }

  // ---------- Notificaciones para el administrador ----------
  if (admin) {
    const insNotif = db.prepare('INSERT INTO notifications (user_id, title, message, type, read, link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insNotif.run(admin, 'Ticket urgente sin resolver', 'Error al generar la nómina — asignado a Laura Gómez.', 'warning', 0, '/tickets', hace(0, 1));
    insNotif.run(admin, 'Garantía próxima a vencer', 'La garantía del servidor SRV-BKP-001 vence en 25 días.', 'warning', 0, '/asset-health', hace(1));
    insNotif.run(admin, 'Ticket resuelto', 'Andrés Ramírez resolvió «El servidor de aplicaciones responde lento».', 'success', 1, '/tickets', hace(6));
    insNotif.run(admin, 'Nuevo artículo publicado', 'Camila Torres publicó «Cómo reconocer un correo de phishing».', 'info', 1, '/knowledgebase', hace(8));
  }

  return { usuarios: personas.length, activos: activos.length, tickets: tickets.length, comentarios, articulos: articulos.length, mantenimientos: mants.length };
}

try {
  const traducidos = traducirEjemplos();
  console.log(`Registros de ejemplo traducidos al español: ${traducidos}`);
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(MARCA)) {
    console.log('Los datos de demostración ya estaban cargados; no se agregó nada nuevo.');
  } else {
    const r = cargar();
    console.log('Datos de demostración cargados:');
    for (const [k, v] of Object.entries(r)) console.log(`  ${k}: ${v}`);
  }
  process.exit(0);
} catch (err) {
  console.error('No se pudieron cargar los datos:', err.message);
  process.exit(1);
}
