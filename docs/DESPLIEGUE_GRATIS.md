# Guía de despliegue gratuito — Gym Tracker

Objetivo: poner la app en internet **sin pagar** para que 2-3 personas la usen desde el celular.

---

## Recomendación (100% gratis, sin tarjeta de crédito): Render

[Render](https://render.com) permite, en su plan gratuito y sin tarjeta, alojar las **tres** piezas que necesitamos:
- **Static Site** → el frontend (React/Vite).
- **Web Service** → el backend (Node/Express).
- **PostgreSQL** → la base de datos persistente.

| Pieza | Servicio Render | Costo |
|---|---|---|
| Frontend | Static Site | Gratis |
| Backend | Web Service (free) | Gratis |
| Base de datos | PostgreSQL (free) | Gratis |

> ⚠️ **Caveat del plan free de Render:** el backend "se duerme" tras ~15 min sin uso y el primer request luego tarda ~30-50 s en despertar (cold start). Para uso personal de 2-3 personas es perfectamente aceptable. Si molesta, hay un truco gratis (un "ping" cada 10 min con [cron-job.org](https://cron-job.org)) o el plan pago (~7 USD/mes).

Alternativas equivalentes: **Neon** (Postgres serverless gratis, muy generoso) para la BD + **Vercel/Netlify** para el frontend. Railway da solo ~1 USD de crédito/mes (no alcanza para estar siempre encendido). Fly.io ya pide tarjeta.

---

## ⚠️ Cambios de código necesarios ANTES de desplegar

El proyecto hoy usa **SQLite (archivo local)** y guarda las **fotos en disco**. En hosting gratuito el disco es **efímero** (se borra en cada redeploy/reinicio), así que perderíamos datos y fotos. Hay que hacer 2 ajustes (los puede hacer el equipo de agentes en una tarea aparte):

1. **Base de datos → PostgreSQL.** Cambiar el `provider` de Prisma de `sqlite` a `postgresql` y usar la `DATABASE_URL` que da Render/Neon. El código de la app casi no cambia (Prisma abstrae el motor); solo hay que regenerar la migración.
2. **Fotos → guardarlas en la base de datos** (como bytes) en vez de en disco, o usar un bucket gratis (Cloudflare R2). Para 2-3 usuarios con imágenes pequeñas, **guardarlas en Postgres es lo más simple y gratis**.

> Dime cuándo quieres que el equipo haga esta migración (SQLite→Postgres + fotos→BD) y la agendo como un `/feature`. La app seguirá funcionando igual en local.

---

## Pasos de despliegue (una vez hechos los 2 ajustes)

### 0. Subir el proyecto a GitHub
Render despliega desde un repo de GitHub.
```bash
cd C:/Users/Sistemas/Desktop/gym-tracker
git init && git add . && git commit -m "Gym Tracker"
# crea un repo en github.com y:
git remote add origin https://github.com/TU_USUARIO/gym-tracker.git
git push -u origin main
```
(El `.env` NO se sube — está en `.gitignore`. Las variables se configuran en Render.)

### 1. Crear la base de datos
1. En Render → **New → PostgreSQL** → plan **Free** → Create.
2. Copia la **Internal Database URL** (la usará el backend).

### 2. Desplegar el backend (Web Service)
1. Render → **New → Web Service** → conecta tu repo.
2. **Root Directory:** `server`
3. **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
4. **Start Command:** `node dist/index.js`
5. **Environment Variables** (pestaña Environment): copia todo lo de `server/.env.example` y llénalo:
   - `DATABASE_URL` = la Internal URL del paso 1
   - `JWT_SECRET` = una cadena aleatoria larga
   - `APP_URL` = la URL pública del frontend (paso 3), ej. `https://gym-tracker.onrender.com`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
   - `SMTP_*` y `MAIL_FROM` (ver `docs/GUIA_CORREO.md`)
6. Tras el primer deploy, corre el seed una vez desde la consola de Render (**Shell**): `npm run seed`.
7. Anota la URL pública del backend, ej. `https://gym-tracker-api.onrender.com`.

### 3. Desplegar el frontend (Static Site)
1. Render → **New → Static Site** → mismo repo.
2. **Root Directory:** `.` (la raíz)
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. **Environment Variable:** `VITE_API_URL` = la URL del backend (paso 2).
6. **Rewrite rule** (para que el ruteo de React funcione): en Redirects/Rewrites añade `/*` → `/index.html` (Rewrite).

### 4. Ajustes finales
- En el backend, pon `APP_URL` = la URL final del frontend (para que los links de invitación apunten bien) y verifica que **CORS** permita ese origen.
- Entra a `https://tu-frontend.onrender.com`, inicia sesión con el admin, y envía una invitación de prueba.

---

## Resumen de costos
| Concepto | Costo |
|---|---|
| Frontend (Static Site) | **0** |
| Backend (Web Service free) | **0** (con cold start) |
| PostgreSQL (free) | **0** |
| Correo (Gmail SMTP) | **0** |
| Dominio | opcional (la subdominio `.onrender.com` es gratis) |
| **Total** | **Gratis** |
