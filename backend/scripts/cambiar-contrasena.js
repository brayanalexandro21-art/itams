// Cambia la contraseña de un usuario directamente en la base (Turso si está configurado).
// Útil si olvidaste la contraseña del administrador.
//
// Uso (desde la carpeta backend):
//   npm run cambiar-contrasena -- admin@itams.com
// (en PowerShell, si "npm" está bloqueado por la política de scripts, usa npm.cmd)
//
// La contraseña se escribe en la terminal sin mostrarse y se guarda cifrada (bcrypt).

const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Uso: npm run cambiar-contrasena -- correo@ejemplo.com');
  process.exit(1);
}

process.chdir(path.join(__dirname, '..'));
const db = require('../database');

const user = db.prepare('SELECT id, name, email, role FROM users WHERE lower(email) = ?').get(email);
if (!user) {
  console.error(`❌ No existe un usuario con el correo ${email}`);
  console.error('   Usuarios:', db.prepare('SELECT email FROM users').all().map((u) => u.email).join(', '));
  process.exit(1);
}

// Pregunta sin mostrar lo que se escribe
function preguntarOculto(texto) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(texto)) rl.output.write(s);
      else if (s.includes('\n') || s.includes('\r')) rl.output.write('\n');
      else rl.output.write('*');
    };
    rl.question(texto, (r) => {
      rl.close();
      resolve(r);
    });
  });
}

(async () => {
  console.log(`Usuario: ${user.name} <${user.email}> (rol: ${user.role})`);
  const p1 = await preguntarOculto('Nueva contraseña (mínimo 8 caracteres): ');
  if (p1.length < 8) {
    console.error('❌ Muy corta: usa al menos 8 caracteres. No se cambió nada.');
    process.exit(1);
  }
  const p2 = await preguntarOculto('Repítela: ');
  if (p1 !== p2) {
    console.error('❌ No coinciden. No se cambió nada.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(p1, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, user.id);
  console.log(`✅ Contraseña de ${user.email} actualizada. Ya puedes iniciar sesión.`);
  process.exit(0);
})();
