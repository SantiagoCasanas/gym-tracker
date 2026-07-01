# Guía paso a paso — Login con Google (gratis)

> El "Iniciar sesión con Google" **solo funciona para correos ya invitados** (mantiene el acceso restringido). Primero el admin invita el correo; luego esa persona puede entrar con Google usando ese mismo correo. Un Google no invitado recibe "No estás invitado".

Necesitas crear un **Client ID de OAuth** en Google Cloud (gratis). ~10 min, una sola vez.

---

## Paso 1 — Crear un proyecto en Google Cloud
1. Entra a **https://console.cloud.google.com** con tu cuenta Google.
2. Arriba, selector de proyecto → **New Project** → nombre `gym-tracker` → **Create**. Selecciónalo.

## Paso 2 — Configurar la pantalla de consentimiento (OAuth consent screen)
1. Menú (☰) → **APIs & Services → OAuth consent screen**.
2. User type: **External** → Create.
3. Rellena lo mínimo: App name `Gym Tracker`, User support email (tu correo), Developer contact (tu correo) → Save and Continue.
4. **Scopes:** Save and Continue (no agregues nada; usamos solo perfil/email básicos, que no requieren verificación de Google).
5. **Test users** (si lo dejas en modo *Testing*): agrega aquí los 2-3 correos que usarán la app. *(Alternativa: en el resumen, botón **Publish app** → "In production"; como solo usamos email/perfil, no requiere revisión de Google. Publicar evita el límite de test users.)*

## Paso 3 — Crear el Client ID (Web)
1. **APIs & Services → Credentials** → **Create Credentials** → **OAuth client ID**.
2. Application type: **Web application**. Nombre: `gym-tracker-web`.
3. **Authorized JavaScript origins** → Add URI, agrega EXACTAMENTE (sin barra final):
   - `https://gym-tracker-web-w1vq.onrender.com`  ← la URL de tu web en Render
   - `http://localhost:5180`  ← para pruebas locales (opcional)
4. (No necesitas "Authorized redirect URIs" — usamos el flujo de token del navegador.)
5. **Create** → copia el **Client ID** (termina en `.apps.googleusercontent.com`).

## Paso 4 — Ponerlo en Render (en AMBOS servicios)
El mismo Client ID va en el backend (para validar) y en la web (para el botón):
| Servicio | Variable | Valor |
|---|---|---|
| `gym-tracker-api` | `GOOGLE_CLIENT_ID` | el Client ID `...apps.googleusercontent.com` |
| `gym-tracker-web` | `VITE_GOOGLE_CLIENT_ID` | **el mismo** Client ID |

Guarda en cada uno → se redesplegarán (la web se **reconstruye** para "hornear" el Client ID; ~2 min).

## Paso 5 — Probar
1. El admin **invita** un correo (ej. tu Gmail) desde la app.
2. Abre la web → aparecerá el botón **"Iniciar sesión con Google"** bajo el formulario.
3. Inicia sesión con ese Gmail invitado → entra directo. ✅
4. Un Google **no invitado** → mensaje "No estás invitado".

---

## Notas
- Si el botón no aparece: falta `VITE_GOOGLE_CLIENT_ID` en la web, o no se reconstruyó. Redespliega la web.
- Si al pulsar da error de origen: el **Authorized JavaScript origin** del Paso 3 debe coincidir EXACTO con la URL de tu web (https, sin barra final). Si tu web tuviera otra URL, corrige el origen.
- El correo con el que entras por Google debe ser el **mismo** que el admin invitó.
