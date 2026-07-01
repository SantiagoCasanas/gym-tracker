# Guía paso a paso — Correo con Brevo (gratis, funciona en Render)

> Render (plan free) **bloquea el SMTP**, por eso Gmail SMTP no funciona ahí. Usamos **Brevo**, que envía por **API HTTP** (no bloqueada). Gratis: **300 correos/día**, suficiente para 2-3 personas. Envía a cualquier correo tras verificar tu remitente.

---

## Paso 1 — Crear cuenta en Brevo
1. Entra a **https://www.brevo.com** → **Sign up free**. Sin tarjeta.
2. Completa el registro (te pedirá nombre, empresa — pon cualquiera, tipo "Gym Tracker").

## Paso 2 — Verificar tu remitente (sender)
El correo debe salir "desde" una dirección verificada.
1. En Brevo → menú **Senders, Domains & Dedicated IPs** → pestaña **Senders** → **Add a sender**.
2. Pon tu nombre y **tu correo** (ej. tu Gmail) → Save.
3. Brevo te enviará un correo de verificación a esa dirección → ábrelo y confirma.
   - Esa dirección verificada es tu **`MAIL_FROM`**.

## Paso 3 — Obtener la API key
1. En Brevo → arriba a la derecha, tu nombre → **SMTP & API** (o **Settings → SMTP & API**).
2. Pestaña **API Keys** → **Generate a new API key** → nómbrala `gym-tracker`.
3. Copia la clave (empieza con `xkeysib-...`). **Solo se muestra una vez.**

## Paso 4 — Ponerla en Render
En Render → servicio **`gym-tracker-api`** → pestaña **Environment**, agrega/edita:
| Variable | Valor |
|---|---|
| `BREVO_API_KEY` | la clave `xkeysib-...` |
| `MAIL_FROM` | tu correo verificado en el Paso 2 |
| `MAIL_FROM_NAME` | `Gym Tracker` |

Guarda → el API se redespliega solo (~1-2 min).

## Paso 5 — Probar
1. Entra a la app como admin → **Invitaciones** → envía una a un correo tuyo de prueba.
2. Debe llegar (revisa **Spam** la primera vez). En el panel, la invitación mostrará el envío exitoso.

---

## Problemas comunes
| Síntoma | Solución |
|---|---|
| No llega y el link sí aparece | `BREVO_API_KEY` mal copiada, o `MAIL_FROM` no coincide con el remitente verificado. |
| Error "sender not valid" | El `MAIL_FROM` debe ser exactamente el correo verificado en el Paso 2. |
| Llega a Spam | Normal la 1ª vez; márcalo "No es spam". |

> 🔒 La API key es un secreto: va solo en Render (Environment), nunca en el código ni en el chat. Si se filtra, bórrala en Brevo y genera otra.
