# ITAMS - IT Asset Management System

Sistema de gestión de activos de TI y mesa de ayuda. **20 fases completadas - 90+ funcionalidades**

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
```

El servidor backend estará corriendo en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

---

## 📋 Funcionalidades por Fase

### ✅ Fase 1 - MVP
- Sistema de autenticación (registro/login)
- CRUD de tickets básico
- Dashboard con estadísticas
- Filtros por estado y prioridad
- Comentarios en tickets
- Roles de usuario (admin, technician, user)

### ✅ Fase 2 - Funcionalidades Core
- Gestión de activos de TI
- Sistema de notificaciones
- Base de conocimiento
- Asignación de tickets y activos

### ✅ Fase 3 - Reportes y Email
- Reportes y estadísticas avanzadas
- Integración con email
- API pública para integraciones

### ✅ Fase 4 - Automatización
- Audit logs
- Gestión de SLA
- Workflows automatizados
- Búsqueda avanzada

### ✅ Fase 5 - Seguridad
- Autenticación de dos factores (2FA)
- Templates de tickets
- Insights de IA
- Sistema de backup

### ✅ Fase 6 - Integraciones
- Integraciones (Slack, Discord, WhatsApp)
- Widgets personalizados
- Multi-idioma
- Encuestas de satisfacción
- Control de tiempo
- Campos personalizados

### ✅ Fase 7 - Comunicación
- Chat en tiempo real
- Gestión de documentos
- Códigos QR/Barcode
- Portal de clientes
- Gamificación
- Calendario

### ✅ Fase 8 - Analytics
- Dashboard avanzado
- Plantillas de email
- Acciones masivas
- Webhooks
- Rate limiting

### ✅ Fase 9 - Móvil
- API móvil optimizada
- PWA (Progressive Web App)
- Exportación PDF
- Permisos RBAC
- Monitoreo de rendimiento

### ✅ Fase 10 - UX
- Búsqueda avanzada con filtros
- Atajos de teclado
- Modo oscuro
- Importación de datos
- Gestión de sesiones
- Documentación de API

### ✅ Fase 11 - Gestión Empresarial
- Gestión de contratos
- Gestión de proveedores
- Órdenes de compra
- Ciclo de vida de activos
- Cumplimiento normativo

### ✅ Fase 12 - Reportes Avanzados
- Multi-moneda
- Lifecycle de activos avanzado
- Recomendaciones KB
- Canales de notificación
- Analytics de API

### ✅ Fase 13 - Personalización
- Widgets personalizados
- Exportación con gráficas
- Analytics de KB
- Branding personalizado
- Preferencias de notificación

### ✅ Fase 14 - Automatización Avanzada
- Versionado de KB
- Onboarding de usuarios
- Depreciación de activos
- Renovación de contratos
- Dashboard en tiempo real

### ✅ Fase 15 - Reportes
- Constructor de reportes
- Grupos de usuarios
- Categorías KB
- Tags de activos
- Dashboard de rate limiting

### ✅ Fase 16 - Exportación
- Exportación avanzada con gráficas
- Widgets personalizados
- Analytics de KB
- Notificaciones avanzadas
- Lifecycle de activos

### ✅ Fase 17 - Seguridad
- Seguridad avanzada
- Versionado de API
- Exportación avanzada
- Analytics de seguridad
- Auditoría mejorada

### ✅ Fase 18 - Operaciones
- Backup avanzado
- Gestión de sesiones
- Rate limiting avanzado
- Logs de auditoría
- Exportación CSV

### ✅ Fase 19 - Analíticas
- Analytics avanzados
- Notificaciones mejoradas
- Workflows avanzados
- Lifecycle de activos
- Escáner de códigos

### ✅ Fase 20 - Final
- Monitor de rendimiento
- Operaciones masivas
- Búsqueda avanzada
- Analytics de KB
- Actividad de usuarios

---

## ☁️ Despliegue en la nube (gratis)

Ver **[DESPLIEGUE.md](DESPLIEGUE.md)**: Render (app) + Turso (base de datos) + Cloudinary (archivos).

## 🗄️ Database

- **Local**: SQLite en `backend/itams.db` (se crea automáticamente).
- **Nube**: Turso, si `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` están definidas.

## 👤 Usuario Admin

```sql
UPDATE users SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
```

## 📁 Estructura del Proyecto

```
ITAMS/
├── backend/
│   ├── routes/ (83 archivos)
│   ├── database.js
│   └── server.js
├── frontend/
│   └── src/pages/ (31 páginas)
├── database/
└── README.md
```

## 🔧 Variables de Entorno

Ver `backend/.env.example`:

```
PORT=3001
JWT_SECRET=tu-clave-secreta
TURSO_DATABASE_URL=      # opcional: base de datos en Turso
TURSO_AUTH_TOKEN=
CLOUDINARY_URL=          # opcional: archivos en Cloudinary
```

## 📊 API Endpoints

- **Auth**: register, login, me
- **Tickets**: CRUD + comments + stats
- **Assets**: CRUD + stats + lifecycle
- **Notifications**: CRUD + preferences
- **Knowledge Base**: CRUD + comments + categories
- **Reports**: avanzados + export
- **Users**: CRUD + roles
- **Workflows**: CRUD + automation
- **Performance**: monitor + analytics

---

*Proyecto ITAMS - 20 fases completadas - 90+ funcionalidades*