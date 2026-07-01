# Guía paso a paso — Configurar el envío de correos (Gmail, gratis)

El backend ya está listo para enviar invitaciones por correo con **nodemailer + Gmail**. Solo falta darle una credencial. Es gratis y sirve para enviar a cualquier bandeja real (límite ~500 correos/día, más que suficiente para 2-3 personas).

> Necesitas una cuenta de Gmail. Recomiendo una cuenta dedicada (ej. `gymtracker.tuequipo@gmail.com`) para no mezclar con tu correo personal, pero puedes usar el tuyo.

---

## Paso 1 — Activar la Verificación en 2 pasos (obligatorio)

Las "contraseñas de aplicación" de Google **solo existen si tienes activada la verificación en 2 pasos**.

1. Entra a **https://myaccount.google.com/security**
2. En la sección **"Cómo inicias sesión en Google"**, busca **"Verificación en 2 pasos"**.
3. Si dice *Desactivada*, actívala (te pedirá tu teléfono). Sigue los pasos hasta que quede **Activada**.

## Paso 2 — Generar la "Contraseña de aplicación"

1. Ve directamente a **https://myaccount.google.com/apppasswords**
   (o busca "Contraseñas de aplicaciones" en la barra de búsqueda de tu cuenta Google).
2. En **"Nombre de la app"** escribe algo como `Gym Tracker` y pulsa **Crear**.
3. Google te mostrará una contraseña de **16 letras** en 4 bloques, por ejemplo:
   ```
   abcd efgh ijkl mnop
   ```
4. **Cópiala** (esa es la única vez que se muestra). Al ponerla en el archivo, va **sin espacios**: `abcdefghijklmnop`.

## Paso 3 — Ponerla en el archivo `.env` del backend

1. Abre el archivo: `C:/Users/Sistemas/Desktop/gym-tracker/server/.env`
2. Llena estas líneas (deja las demás como están):
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=tucorreo@gmail.com
   SMTP_PASS=abcdefghijklmnop
   MAIL_FROM=tucorreo@gmail.com
   ```
   - `SMTP_USER` y `MAIL_FROM` = la dirección de Gmail que usaste.
   - `SMTP_PASS` = la contraseña de aplicación de 16 caracteres **sin espacios** (NO tu contraseña normal de Gmail).
3. Guarda el archivo.

## Paso 4 — Reiniciar el backend

Detén el servidor si está corriendo y vuelve a levantarlo:
```bash
cd C:/Users/Sistemas/Desktop/gym-tracker/server
npm run dev
```

## Paso 5 — Probar

1. Entra a la app como admin → **Invitaciones**.
2. Envía una invitación a un correo tuyo de prueba.
3. Revisa la bandeja (y la carpeta de **Spam** la primera vez). Debe llegar el correo con el link de invitación.
   - En el panel admin, la invitación mostrará `emailSent: true` cuando el envío fue exitoso.

---

## Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| `Invalid login` / `535 auth failed` | La `SMTP_PASS` no es la de aplicación, o tiene espacios. Regenérala y pégala sin espacios. |
| No aparece "Contraseñas de aplicaciones" | Falta activar la Verificación en 2 pasos (Paso 1). |
| El correo llega a Spam | Normal la primera vez con Gmail. Márcalo como "No es spam". Para uso serio, considera un dominio propio (fuera de alcance ahora). |
| `emailSent: false` en el panel | El envío falló o el SMTP está vacío; usa el **link de respaldo** que aparece en la invitación mientras lo resuelves. |

> **Nota de seguridad:** el archivo `.env` NO se sube a git (está en `.gitignore`). No compartas la contraseña de aplicación; si se filtra, revócala en https://myaccount.google.com/apppasswords y genera otra.

## Alternativa (si no quieres usar Gmail)

Servicios gratuitos con SMTP que también funcionan cambiando solo las variables `SMTP_*`:
- **Brevo (Sendinblue)** — 300 correos/día gratis, SMTP listo tras registro.
- **Resend** — 3.000/mes gratis (requiere verificar un dominio para enviar a cualquiera).
El código no cambia; solo pones el host/puerto/usuario/clave que te den.
