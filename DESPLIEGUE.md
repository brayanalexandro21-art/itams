# Guía de despliegue gratuito de ITAMS

Arquitectura en la nube (todo con planes gratuitos):

| Parte | Servicio | Qué guarda |
|---|---|---|
| Código | **GitHub** | El proyecto (sin claves ni base de datos) |
| App (backend + frontend) | **Render** | Solo ejecuta el código; su disco se borra en cada reinicio |
| Base de datos | **Turso** | Activos, tickets, usuarios… (permanente) |
| Archivos | **Cloudinary** | Fotos de modelos, logos y documentos (permanente) |

> Los datos **no se pierden** cuando Render se reinicia o se duerme, porque no se guardan en Render.

---

## 0. Instalar en tu PC

1. **Node.js 22 LTS**: <https://nodejs.org> (instalador de Windows, opciones por defecto).
2. **Git**: <https://git-scm.com/download/win> (opciones por defecto).

Cierra y vuelve a abrir la terminal, y comprueba:

```bash
node --version
git --version
```

Luego instala las dependencias (el backend cambió de `better-sqlite3` a `libsql`):

```bash
cd backend
npm install
cd ../frontend
npm install
```

---

## 1. Base de datos en Turso

1. Crea una cuenta en <https://turso.tech> (puedes entrar con GitHub).
2. En el panel: **Create Database** → nombre `itams` → la región más cercana (p. ej. `us-east`).
3. Abre la base y copia la **URL** (empieza por `libsql://...`).
4. En **Create Token** genera un token (permiso de lectura y escritura) y cópialo.

## 2. Archivos en Cloudinary

1. Crea una cuenta en <https://cloudinary.com>.
2. En el **Dashboard** copia la **API environment variable**
   (formato `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`).
3. Para poder descargar PDF/ZIP de la sección Documentos:
   **Settings → Security → "Allow delivery of PDF and ZIP files"** → activar.

## 3. Probar en tu PC con la nube

Copia `backend/.env.example` como `backend/.env` y completa:

```
JWT_SECRET=una-clave-larga-y-aleatoria
TURSO_DATABASE_URL=libsql://itams-tuusuario.turso.io
TURSO_AUTH_TOKEN=el-token-de-turso
CLOUDINARY_URL=cloudinary://...
```

### Pasar tus datos actuales a la nube (una sola vez)

```bash
cd backend
npm run migrar-turso
```

Copia todas las tablas de `itams.db` a Turso y sube las imágenes de `uploads/` a Cloudinary
(actualizando sus direcciones en la base). Si lo ejecutas de nuevo, omite las tablas que ya tienen datos.

### Probar

```bash
cd frontend
npm run build
cd ../backend
npm start
```

Abre <http://localhost:3001>: debe decir en la terminal `Base de datos: Turso (nube)`
y mostrar tus activos.

> Si dejas vacías las variables de Turso y Cloudinary, el proyecto vuelve a usar
> `itams.db` y la carpeta `uploads/` locales (modo desarrollo, como antes).

---

## 4. Subir el código a GitHub

1. Crea una cuenta en <https://github.com> y un repositorio **nuevo y vacío** llamado `itams`
   (sin README ni .gitignore).
2. En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "ITAMS listo para despliegue"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/itams.git
git push -u origin main
```

> El `.gitignore` ya excluye `.env`, la base de datos, `uploads/` y `node_modules/`.
> Antes del primer `git push`, revisa con `git status` que **no** aparezca `backend/.env`.

## 5. Publicar en Render

1. Crea una cuenta en <https://render.com> (entra con GitHub).
2. **New → Blueprint** → elige el repositorio `itams`. Render leerá `render.yaml`.
3. Te pedirá los valores de `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` y `CLOUDINARY_URL`
   (los mismos del paso 3). `JWT_SECRET` se genera solo.
4. **Apply**. La primera compilación tarda unos minutos.
5. Tu app queda en `https://itams-xxxx.onrender.com`.

Cada `git push` a `main` vuelve a publicar la app automáticamente.

---

## Limitaciones del plan gratuito

- **Render se duerme** tras ~15 minutos sin visitas; la primera carga tarda 30–60 s.
  Antes de una presentación, abre la página unos minutos antes.
- **Copias de seguridad**: las de la sección *Backup* se guardan en el disco de Render y
  se pierden al reiniciar. Para un respaldo real usa la exportación de Turso
  (panel de Turso o `turso db shell itams .dump > respaldo.sql`).
- **Cloudinary**: máximo 10 MB por archivo en el plan gratuito.
- Los límites de los planes gratuitos cambian con el tiempo: revísalos en cada servicio.

## Primer administrador

Regístrate en la app y luego, en el panel de Turso (**Shell**/editor SQL):

```sql
UPDATE users SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
```
