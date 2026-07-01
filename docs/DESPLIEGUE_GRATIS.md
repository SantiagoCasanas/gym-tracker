# Guía de despliegue gratuito — Gym Tracker (Render + Neon)

Poner la app en internet **sin pagar** para que 2-3 personas la usen desde el celular.
El código YA está preparado: PostgreSQL, fotos en la base de datos, CORS por variable de entorno y un **`render.yaml`** (blueprint) que crea el API + la web casi con un clic.

Stack (todo gratis, sin tarjeta):
- **Neon** → base de datos PostgreSQL persistente (NO expira).
- **Render** → Web Service (API Node) + Static Site (web React).

> ⚠️ La BD gratis de **Render** se borra a los 30 días; por eso la base va en **Neon**, cuyo free no expira. Render solo aloja el API y la web.
> ⚠️ El plan free de Render "duerme" el backend tras ~15 min sin uso; el primer request luego tarda ~30-50 s en despertar. Aceptable para uso personal. Truco: un ping cada 10 min con [cron-job.org](https://cron-job.org).

---

## PARTE 1 — Código en GitHub ✅ (ya hecho)
El repo está en `https://github.com/SantiagoCasanas/gym-tracker` (rama `main`). Los `.env` con secretos NO se subieron.
> Para actualizar en el futuro: `git add . && git commit -m "..." && git push` → Render redepliega solo.

---

## PARTE 2 — Crear la base de datos en Neon

1. Entra a **https://neon.tech** → **Sign up** (puedes usar tu GitHub). Sin tarjeta.
2. **Create project** → nombre `gym-tracker`, región la más cercana (ej. US East). Deja Postgres por defecto.
3. Al crearlo, Neon muestra la **Connection string**. Elige el formato **URI** (empieza con `postgresql://...`). Cópiala completa — se ve así:
   ```
   postgresql://usuario:clave@ep-xxxx.us-east-2.aws.neon.tech/gym-tracker?sslmode=require
   ```
   Guárdala; es tu `DATABASE_URL` para el paso 3.
   > Debe incluir `?sslmode=require` al final (Neon lo trae por defecto).

---

## PARTE 3 — Desplegar en Render con el Blueprint

1. Crea cuenta en **https://render.com** → "Get Started" → **Sign in with GitHub**. No pide tarjeta.
2. Autoriza a Render a ver tu repo `gym-tracker`.
3. Dashboard: **New → Blueprint**.
4. Selecciona el repo `gym-tracker`. Render detecta el `render.yaml` y propone crear: **1 web service (API) + 1 static site (web)** (la BD NO, va en Neon). Pulsa **Apply**.
5. Render empieza a crear los servicios. El primer build del API puede tardar unos minutos (instala, migra el esquema en Neon con `prisma db push`, y siembra el admin).

### 3.1 — Completar variables de entorno
Ve a cada servicio → pestaña **Environment** y completa las que quedaron vacías:

**En `gym-tracker-api`:**
| Variable | Valor |
|---|---|
| `DATABASE_URL` | la **URI de Neon** que copiaste en la Parte 2 |
| `ADMIN_EMAIL` | el correo con el que entrarás como admin |
| `ADMIN_PASSWORD` | una contraseña fuerte |
| `ADMIN_NAME` | tu nombre (ej. Santiago) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | tu Gmail |
| `SMTP_PASS` | tu app password de Gmail (sin espacios) |
| `MAIL_FROM` | tu Gmail |
| `APP_URL` | *(se llena en el paso 3.2)* |
| `CORS_ORIGIN` | *(se llena en el paso 3.2)* |
| `JWT_SECRET` | ⚙️ generada automáticamente (no la toques) |

**En `gym-tracker-web`:**
| Variable | Valor |
|---|---|
| `VITE_API_URL` | *(se llena en el paso 3.2)* |

> Importante: pon `DATABASE_URL` **antes** de que termine el primer build (o vuelve a desplegar el API después de ponerla), porque el build necesita la BD para migrar y sembrar.

### 3.2 — Enlazar las URLs entre sí
Cuando los servicios tengan su URL pública (tipo `https://gym-tracker-api.onrender.com` y `https://gym-tracker-web.onrender.com`):

1. En `gym-tracker-web` → Environment → `VITE_API_URL` = la URL del **API**. Guarda → re-despliega la web.
2. En `gym-tracker-api` → Environment:
   - `APP_URL` = la URL de la **web** → para que los links de invitación apunten bien.
   - `CORS_ORIGIN` = la URL de la **web** → para que el navegador permita las llamadas.
   Guarda → re-despliega el API.

> El admin se crea solo en el primer arranque (`npm run seed` con `ADMIN_EMAIL`/`ADMIN_PASSWORD`). Si cambiaste esas variables después, en `gym-tracker-api` → **Manual Deploy → Clear build cache & deploy**, o corre `npm run seed` desde la pestaña **Shell**.

### 3.3 — Probar
1. Abre la URL de la web.
2. Inicia sesión con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Envía una invitación de prueba → revisa que llegue el correo.
4. Registra un ejercicio con foto y series → cierra sesión y vuelve → los datos persisten (en Neon).

---

## Resumen de costos
| Concepto | Servicio | Costo |
|---|---|---|
| Base de datos | Neon (Postgres, no expira) | 0 |
| API | Render Web Service (free) | 0 (con cold start) |
| Web | Render Static Site | 0 |
| Correo | Gmail SMTP | 0 |
| **Total** | | **Gratis** |

## Notas
- **Fotos:** se guardan dentro de Postgres (Neon), no en disco, por eso persisten aunque Render reinicie el contenedor.
- **Neon free:** 0.5 GB de almacenamiento, suficiente para 2-3 personas. Si algún día crece, se puede subir de plan sin cambiar código.
- **Backups:** el free de Neon no trae backups automáticos; para este uso no es crítico, pero tenlo presente.
