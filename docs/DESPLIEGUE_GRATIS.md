# Guía de despliegue gratuito — Gym Tracker (Render)

Poner la app en internet **sin pagar** para que 2-3 personas la usen desde el celular.
El código YA está preparado: PostgreSQL, fotos en la base de datos, CORS por variable de entorno y un **`render.yaml`** (blueprint) que crea los 3 servicios casi con un clic.

Stack: **Render** (todo gratis, sin tarjeta) → Static Site (web) + Web Service (API) + PostgreSQL.

> ⚠️ El plan free de Render "duerme" el backend tras ~15 min sin uso; el primer request luego tarda ~30-50 s en despertar. Para uso personal es aceptable. Truco gratis: un ping cada 10 min con [cron-job.org](https://cron-job.org).

---

## PARTE 1 — Subir el código a GitHub

El repo ya está inicializado y con el commit inicial hecho (rama `main`). Los `.env` con secretos NO se suben (están en `.gitignore`).

1. Entra a **https://github.com/new** y crea un repositorio **vacío** (sin README, sin .gitignore) llamado `gym-tracker`. Puede ser **privado**.
2. Copia la URL que te da (ej. `https://github.com/TU_USUARIO/gym-tracker.git`).
3. En una terminal, dentro de `C:/Users/Sistemas/Desktop/gym-tracker`:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/gym-tracker.git
   git push -u origin main
   ```
   (Si Git pide login, se abrirá el navegador para autorizar; acepta.)

---

## PARTE 2 — Desplegar en Render con el Blueprint

1. Crea cuenta en **https://render.com** (botón "Get Started" → "Sign in with GitHub"). No pide tarjeta.
2. Autoriza a Render a ver tu repo `gym-tracker`.
3. En el dashboard: **New → Blueprint**.
4. Selecciona el repo `gym-tracker`. Render detecta el `render.yaml` y propone crear: **1 base de datos Postgres + 1 web service (API) + 1 static site (web)**. Pulsa **Apply**.
5. Render empezará a crear todo. La base de datos y el primer build tardan unos minutos.

### 2.1 — Completar las variables de entorno (las marcadas para llenar)
Algunas variables quedan vacías a propósito (secretos y URLs que solo se conocen al final). Ve a cada servicio → pestaña **Environment** y complétalas:

**En el servicio `gym-tracker-api`:**
| Variable | Valor |
|---|---|
| `ADMIN_EMAIL` | tu correo de admin (con el que entrarás) |
| `ADMIN_PASSWORD` | una contraseña fuerte para el admin |
| `ADMIN_NAME` | tu nombre (ej. Santiago) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | tu Gmail |
| `SMTP_PASS` | tu app password de Gmail (sin espacios) |
| `MAIL_FROM` | tu Gmail |
| `APP_URL` | *(se llena en el paso 2.2)* |
| `CORS_ORIGIN` | *(se llena en el paso 2.2)* |
| `DATABASE_URL` | ⚙️ ya conectada automáticamente a la BD |
| `JWT_SECRET` | ⚙️ generada automáticamente |

**En el servicio `gym-tracker-web`:**
| Variable | Valor |
|---|---|
| `VITE_API_URL` | *(se llena en el paso 2.2)* |

### 2.2 — Enlazar las URLs entre sí
Cuando los servicios estén creados, Render te da sus URLs públicas (algo como `https://gym-tracker-api.onrender.com` y `https://gym-tracker-web.onrender.com`).

1. En `gym-tracker-web` → Environment → `VITE_API_URL` = la URL del **API** (`https://gym-tracker-api.onrender.com`). Guarda → esto re-despliega la web.
2. En `gym-tracker-api` → Environment:
   - `APP_URL` = la URL de la **web** (`https://gym-tracker-web.onrender.com`) → así los links de invitación apuntan bien.
   - `CORS_ORIGIN` = la URL de la **web** (misma de arriba) → para que el navegador permita las llamadas.
   Guarda → re-despliega el API.

> El admin se crea solo en el primer arranque (el build corre `npm run seed` con `ADMIN_EMAIL`/`ADMIN_PASSWORD`). Si cambiaste esas variables después, entra a `gym-tracker-api` → **Manual Deploy → Clear build cache & deploy**, o corre `npm run seed` desde la pestaña **Shell**.

### 2.3 — Probar
1. Abre la URL de la web (`https://gym-tracker-web.onrender.com`).
2. Inicia sesión con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Envía una invitación de prueba → revisa que llegue el correo.
4. Registra un ejercicio con foto y series → cierra sesión y vuelve → los datos persisten (ahora en Postgres).

---

## Resumen de costos
| Concepto | Costo |
|---|---|
| Web (Static Site) | 0 |
| API (Web Service free) | 0 (con cold start) |
| PostgreSQL (free) | 0 |
| Correo (Gmail SMTP) | 0 |
| **Total** | **Gratis** |

## Notas
- **Actualizar la app en el futuro:** haz cambios en local, `git add . && git commit -m "..." && git push`. Render redepliega solo.
- **Base de datos free de Render:** tiene límite de almacenamiento generoso para este uso; si algún día se llena, Neon es una alternativa gratis (solo cambias `DATABASE_URL`).
- **Fotos:** se guardan dentro de Postgres (no en disco), por eso persisten aunque Render reinicie el contenedor.
