# RWM — Retro With Meni

**v2.1**

A real-time collaborative retrospective tool for agile teams. Create a session, invite your team via a shared link, and run structured retrospectives together — live, in the browser.

---

## What's New in v2.1

- **Authentication system** — local accounts, LDAP, and Microsoft EntraID (Azure AD) login
- **Admin panel** — manage users, roles, and account status at `/admin`
- **New UI** — full redesign with light theme, Inter font, and coral accent
- **Session identity** — authenticated user's real name shown on the retro board instead of auto-generated placeholders
- **LDAP fixes** — resolved TLS handshake error and invalid DN (0x22) error on plain `ldap://` connections

---

## Features

- **Real-time collaboration** — cards, votes, and phase changes sync instantly across all participants via WebSockets
- **Multiple retro formats** — choose the structure that fits your team
- **Facilitator mode** — one person drives the session through phases
- **Anonymous card writing** — cards are hidden from others during the write phase, revealed all at once
- **Dot voting** — each participant gets a fixed number of votes to prioritize topics
- **Discussion mode** — facilitator spotlights cards one at a time for focused discussion
- **Synchronized countdown timer** — shared timer visible to all participants
- **Spanish / English UI** — switch language at any time from the bottom-right corner
- **View previous sessions** — look up any past session by ID in read-only mode
- **Export** — download session results as JSON (available to facilitator in Discuss and Done phases)
- **Docker-ready** — single container with embedded SQLite database

---

## Authentication

RWM supports three login methods. All can be enabled simultaneously; disable any by leaving its env vars blank.

### Local accounts
Created by the admin in the admin panel. Passwords are hashed with bcrypt.

### LDAP
Set `LDAP_URL` and `LDAP_BASE_DN` to enable the LDAP login tab. Supports anonymous search (no service account needed) and direct-bind setups.

```env
LDAP_URL=ldap://your-dc.company.com:389
LDAP_BASE_DN=DC=company,DC=com
LDAP_BIND_DN=                          # leave blank for anonymous search
LDAP_BIND_PASSWORD=
LDAP_USER_FILTER=(sAMAccountName={{username}})
```

For LDAPS (TLS): use `ldaps://` as the URL scheme.

### Microsoft EntraID (Azure AD)
Set tenant, client ID, secret, and redirect URI to enable the Microsoft login tab.

```env
ENTRAID_TENANT_ID=your-tenant-id
ENTRAID_CLIENT_ID=your-client-id
ENTRAID_CLIENT_SECRET=your-secret
ENTRAID_REDIRECT_URI=http://localhost:3000/api/auth/entraid/callback
```

### Admin bootstrap
Set `ADMIN_EMAIL` to automatically promote that user to admin on their first login (any provider).

```env
ADMIN_EMAIL=admin@company.com
```

---

## Retrospective Formats

Default format is **Went Well / Improve / Actions**. Default votes per person is **5**.

| Format | Columns |
|--------|---------|
| **Went Well / Improve / Actions** | 👍 Went Well · 🔧 Improve · 📋 Actions |
| **Start / Stop / Continue** | 🚀 Start · 🛑 Stop · ✅ Continue |
| **4Ls** | ❤️ Liked · 📚 Learned · ⚠️ Lacked · 🌟 Longed For |
| **Mad / Sad / Glad** | 😡 Mad · 😢 Sad · 😊 Glad |

---

## Session Phases

```
✍️ Write  →  🗳️ Vote  →  💬 Discuss  →  ✅ Done
```

1. **Write** — participants add cards anonymously; other people's cards are hidden
2. **Vote** — all cards are revealed; each participant votes on what matters most
3. **Discuss** — facilitator spotlights cards one by one for the team to talk through
4. **Done** — session complete; facilitator can export results

---

## Running with Docker

### 1. Build and start

```bash
docker compose up --build
```

The app will be available at **http://localhost:8101**

### Other useful commands

```bash
# Run in background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Stop and remove the database
docker compose down -v
```

> To change the external port, edit the `ports` mapping in `docker-compose.yml` (default: `8101:3000`).

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | Yes | Random string ≥ 32 chars for cookie encryption |
| `ADMIN_EMAIL` | No | Email to auto-promote to admin on first login |
| `LDAP_URL` | No | LDAP server URL (`ldap://` or `ldaps://`) |
| `LDAP_BASE_DN` | No | LDAP search base (e.g. `DC=company,DC=com`) |
| `LDAP_BIND_DN` | No | Service account DN or `{{username}}` template |
| `LDAP_BIND_PASSWORD` | No | Service account password (blank = anonymous search) |
| `LDAP_USER_FILTER` | No | Search filter (default: `(sAMAccountName={{username}})`) |
| `ENTRAID_TENANT_ID` | No | Azure AD tenant ID |
| `ENTRAID_CLIENT_ID` | No | Azure AD app client ID |
| `ENTRAID_CLIENT_SECRET` | No | Azure AD app client secret |
| `ENTRAID_REDIRECT_URI` | No | OAuth callback URL |

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

App runs at **http://localhost:3000** in development.

The SQLite database is created automatically at `data/retro.db`.

> **Note for Windows users:** The dev server uses Webpack (not Turbopack) to avoid a Windows junction point issue with native modules. This is already configured in `server.js`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Real-time | Socket.io |
| Database | SQLite (better-sqlite3) |
| Auth | iron-session + bcryptjs + ldapts + @azure/msal-node |
| Styling | Tailwind CSS |
| i18n | Built-in (English / Spanish) |
| Runtime | Node.js 20 |
| Container | Docker |

---

## Project Structure

```
app/
├── login/page.tsx              # Login — local / LDAP / Microsoft
├── home/page.tsx               # Home — create or look up a session
├── admin/                      # Admin panel (user management)
├── api/
│   ├── auth/                   # Auth routes (login, ldap, entraid, me, logout)
│   ├── sessions/               # Session CRUD
│   └── sessions/[id]/export/   # JSON export
└── session/[sessionId]/
    ├── page.tsx                # Live retro board
    └── view/page.tsx           # Read-only session viewer

components/
├── board/                      # RetroBoard, Column, Card, VoteButton, CardForm
├── session/                    # PhaseControls, CountdownTimer, ParticipantList,
│                               # CreateSessionForm, LookupSessionForm, SessionList
├── providers/                  # SocketProvider, LanguageProvider
└── LanguageToggle.tsx          # EN/ES language switch

lib/
├── db.js                       # SQLite connection
├── db-queries.js               # Database helpers (sessions + users)
├── auth-helpers.js             # upsertExternalUser, sessionPayload
├── session.js                  # iron-session config
├── ldap.js                     # LDAP authentication
├── entraid.js                  # EntraID / Azure AD authentication
├── retro-formats.js            # Column definitions per format
└── i18n/
    ├── en.json                 # English translations
    └── es.json                 # Spanish translations

middleware.ts                   # Route protection (auth guard)
socket/
└── handlers.js                 # Socket.io event handlers

server.js                       # Custom Node.js server (Next.js + Socket.io)
```

---

## License

MIT

---
---

# RWM — Retro With Meni *(Español)*

**v2.1**

Una herramienta de retrospectiva colaborativa en tiempo real para equipos ágiles. Crea una sesión, invita a tu equipo mediante un enlace compartido y lleven a cabo retrospectivas estructuradas juntos — en vivo, desde el navegador.

---

## Novedades en v2.1

- **Sistema de autenticación** — cuentas locales, LDAP e inicio de sesión con Microsoft EntraID (Azure AD)
- **Panel de administración** — gestiona usuarios, roles y estado de cuentas en `/admin`
- **Nueva interfaz** — rediseño completo con tema claro, fuente Inter y acento coral
- **Identidad en sesión** — el nombre real del usuario autenticado se muestra en el tablero en lugar de nombres generados automáticamente
- **Correcciones de LDAP** — resuelto error de TLS y DN inválido (0x22) en conexiones `ldap://` sin TLS

---

## Funcionalidades

- **Colaboración en tiempo real** — tarjetas, votos y cambios de fase se sincronizan al instante entre todos los participantes mediante WebSockets
- **Múltiples formatos de retro** — elige la estructura que mejor se adapte a tu equipo
- **Modo facilitador** — una persona guía la sesión a través de las fases
- **Escritura anónima de tarjetas** — las tarjetas están ocultas para los demás durante la fase de escritura y se revelan todas a la vez
- **Votación por puntos** — cada participante recibe un número fijo de votos para priorizar temas
- **Modo de discusión** — el facilitador destaca las tarjetas de una en una para una discusión enfocada
- **Temporizador de cuenta regresiva sincronizado** — temporizador compartido visible para todos los participantes
- **Interfaz en español / inglés** — cambia el idioma en cualquier momento desde la esquina inferior derecha
- **Ver sesiones anteriores** — consulta cualquier sesión pasada por ID en modo de solo lectura
- **Exportar** — descarga los resultados de la sesión en formato JSON (disponible para el facilitador en las fases Discutir y Listo)
- **Listo para Docker** — contenedor único con base de datos SQLite integrada

---

## Autenticación

RWM soporta tres métodos de inicio de sesión. Todos pueden habilitarse simultáneamente; para deshabilitar alguno, simplemente deja sus variables de entorno en blanco.

### Cuentas locales
Creadas por el administrador en el panel de administración. Las contraseñas se almacenan con hash bcrypt.

### LDAP
Configura `LDAP_URL` y `LDAP_BASE_DN` para habilitar la pestaña de inicio de sesión LDAP. Soporta búsqueda anónima (sin cuenta de servicio) y conexión directa.

```env
LDAP_URL=ldap://tu-dc.empresa.com:389
LDAP_BASE_DN=DC=empresa,DC=com
LDAP_BIND_DN=                          # dejar vacío para búsqueda anónima
LDAP_BIND_PASSWORD=
LDAP_USER_FILTER=(sAMAccountName={{username}})
```

Para LDAPS (TLS): usa `ldaps://` como esquema de URL.

### Microsoft EntraID (Azure AD)
Configura tenant, client ID, secreto y redirect URI para habilitar la pestaña de inicio de sesión con Microsoft.

### Bootstrap de administrador
Configura `ADMIN_EMAIL` para promover automáticamente ese usuario a administrador en su primer inicio de sesión (cualquier proveedor).

---

## Formatos de Retrospectiva

El formato predeterminado es **Qué salió Bien / Cosas a Mejorar / Acciones**. Votos por persona predeterminados: **5**.

| Formato | Columnas |
|---------|---------|
| **Qué salió Bien / Cosas a Mejorar / Acciones** | 👍 Qué salió Bien · 🔧 Cosas a Mejorar · 📋 Acciones |
| **Iniciar / Detener / Continuar** | 🚀 Iniciar · 🛑 Detener · ✅ Continuar |
| **4Ls** | ❤️ Gustó · 📚 Aprendí · ⚠️ Faltó · 🌟 Anhelé |
| **Enfadado / Triste / Feliz** | 😡 Enfadado · 😢 Triste · 😊 Feliz |

---

## Fases de la Sesión

```
✍️ Escribir  →  🗳️ Votar  →  💬 Discutir  →  ✅ Listo
```

1. **Escribir** — los participantes agregan tarjetas de forma anónima; las tarjetas de otros están ocultas
2. **Votar** — todas las tarjetas se revelan; cada participante vota lo que más importa
3. **Discutir** — el facilitador destaca las tarjetas una por una para que el equipo las analice
4. **Listo** — sesión completada; el facilitador puede exportar los resultados

---

## Ejecutar con Docker

### 1. Construir e iniciar

```bash
docker compose up --build
```

La aplicación estará disponible en **http://localhost:8101**

### Otros comandos útiles

```bash
# Ejecutar en segundo plano
docker compose up --build -d

# Ver logs
docker compose logs -f

# Detener
docker compose down

# Detener y eliminar la base de datos
docker compose down -v
```

> Para cambiar el puerto externo, edita el mapeo de `ports` en `docker-compose.yml` (por defecto: `8101:3000`).

---

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La app se ejecuta en **http://localhost:3000** en modo desarrollo.

La base de datos SQLite se crea automáticamente en `data/retro.db`.

> **Nota para usuarios de Windows:** El servidor de desarrollo usa Webpack (no Turbopack) para evitar un problema con puntos de unión en Windows con módulos nativos. Esto ya está configurado en `server.js`.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Tiempo real | Socket.io |
| Base de datos | SQLite (better-sqlite3) |
| Auth | iron-session + bcryptjs + ldapts + @azure/msal-node |
| Estilos | Tailwind CSS |
| i18n | Integrado (Inglés / Español) |
| Runtime | Node.js 20 |
| Contenedor | Docker |

---

## Estructura del Proyecto

```
app/
├── login/page.tsx              # Login — local / LDAP / Microsoft
├── home/page.tsx               # Inicio — crear o buscar una sesión
├── admin/                      # Panel de administración (gestión de usuarios)
├── api/
│   ├── auth/                   # Rutas de auth (login, ldap, entraid, me, logout)
│   ├── sessions/               # CRUD de sesiones
│   └── sessions/[id]/export/   # Exportación JSON
└── session/[sessionId]/
    ├── page.tsx                # Tablero de retro en vivo
    └── view/page.tsx           # Vista de sesión de solo lectura

components/
├── board/                      # RetroBoard, Column, Card, VoteButton, CardForm
├── session/                    # PhaseControls, CountdownTimer, ParticipantList,
│                               # CreateSessionForm, LookupSessionForm, SessionList
├── providers/                  # SocketProvider, LanguageProvider
└── LanguageToggle.tsx          # Selector de idioma EN/ES

lib/
├── db.js                       # Conexión SQLite
├── db-queries.js               # Helpers de base de datos (sesiones + usuarios)
├── auth-helpers.js             # upsertExternalUser, sessionPayload
├── session.js                  # Configuración de iron-session
├── ldap.js                     # Autenticación LDAP
├── entraid.js                  # Autenticación EntraID / Azure AD
├── retro-formats.js            # Definición de columnas por formato
└── i18n/
    ├── en.json                 # Traducciones en inglés
    └── es.json                 # Traducciones en español

middleware.ts                   # Protección de rutas (guardia de autenticación)
socket/
└── handlers.js                 # Manejadores de eventos Socket.io

server.js                       # Servidor Node.js personalizado (Next.js + Socket.io)
```

---

## Licencia

MIT
