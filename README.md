# Nua Salud — Panel Operativo

> **Challenge técnico.** Dashboard operativo que consolida métricas clave de las clínicas (citas, ocupación, pacientes, ingresos y ranking de doctoras) con filtros dinámicos, autenticación JWT y control de acceso por rol.

Panel de métricas operativas internas para las clínicas de Nua Salud. Consolida citas, ocupación, ingresos y rendimiento médico en un dashboard con filtros dinámicos, reemplazando el proceso manual de hojas de cálculo.

## Requisitos previos

- Go >= 1.23
- Docker y Docker Compose
- Node.js >= 20, npm >= 10
- sqlc CLI
- golang-migrate CLI

## Instalación

```bash
git clone https://github.com/tu-usuario/nua-salud-panel.git
cd nua-salud-panel
```

### Backend

```bash
cd backend
cp .env.example .env              # Ajusta DATABASE_URL si es necesario
docker compose up -d              # Levanta PostgreSQL
make migrate-up                   # Migraciones DB operativa
make dashboard-migrate-up         # Migraciones DB dashboard (usuarios, API keys)
make seed                         # Carga datos operativos desde CSV
make seed-users                   # Crea usuarios del dashboard
make seed-apikeys                 # Crea API keys de identidad
make dev                          # Inicia servidor con hot reload en http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env              # Incluye VITE_API_KEY para desarrollo local
bun install
bun run dev                       # Inicia app en http://localhost:5173
```

### Credenciales de prueba

| Email | Contraseña | Rol |
|---|---|---|
| `admin@nuasalud.com` | `admin123` | admin — acceso completo |
| `daniella@nuasalud.com` | `strategy123` | strategy — todas las métricas, sin gestión de usuarios |
| `directora.roma@nuasalud.com` | `clinica123` | clinic_director |
| `directora.polanco@nuasalud.com` | `clinica123` | clinic_director |
| `directora.condesa@nuasalud.com` | `clinica123` | clinic_director |

## Estructura del proyecto

```
nua-salud-panel/
├── backend/
│   ├── cmd/
│   │   └── nua-panel/
│   │       └── main.go                  # Entry point, dual mode (HTTP / Lambda)
│   ├── internal/
│   │   ├── core/
│   │   │   ├── db/
│   │   │   │   ├── migrations/          # SQL up/down (golang-migrate)
│   │   │   │   ├── queries/             # SQL puro para sqlc
│   │   │   │   ├── schema/              # Schema de referencia
│   │   │   │   ├── nuasqlc/             # Código generado por sqlc
│   │   │   │   └── db.go                # Conexión PostgreSQL
│   │   │   ├── router/                  # Registro de rutas Gin
│   │   │   ├── server/                  # Dual mode: HTTP local / Lambda
│   │   │   └── settings/               # Config via envconfig
│   │   ├── api/v1/
│   │   │   ├── appointments/            # M1 — Citas por período
│   │   │   │   ├── interface/controllers/
│   │   │   │   ├── interface/dtos/
│   │   │   │   ├── domain/services/
│   │   │   │   ├── domain/repositories/
│   │   │   │   └── infrastructure/repositories/
│   │   │   ├── occupancy/               # M2 — Tasa de ocupación
│   │   │   ├── patients/                # M3 — Nuevas vs recurrentes
│   │   │   ├── revenue/                 # M4 — Ingresos por clínica
│   │   │   └── doctors/                 # M5 — Top doctoras
│   │   ├── commons/
│   │   │   └── filters/                 # Filtros globales compartidos
│   │   └── utils/
│   │       └── errors/                  # Either[T], CustomError
│   ├── sqlc.yaml
│   ├── docker-compose.yml
│   ├── Makefile
│   ├── .air.toml
│   ├── .env.example
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/                  # Header, Sidebar, DashboardLayout
│   │   │   ├── filters/                 # Filtros globales
│   │   │   ├── charts/                  # Gráficas por métrica
│   │   │   └── ui/                      # KpiCard, ChartCard, LoadingSpinner
│   │   ├── hooks/                       # Custom hooks para fetch y filtros
│   │   ├── services/                    # Cliente HTTP
│   │   ├── types/                       # Tipos de API responses
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── data/
│   └── nua_salud_data.csv               # CSV con datos ficticios
└── README.md
```

## Modelo de datos

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   clinics    │     │   appointments   │     │   patients   │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id           │────<│ clinic_id        │>────│ id           │
│ name         │     │ patient_id       │     │ first_name   │
│ address      │     │ doctor_id        │     │ last_name    │
│ opening_hour │     │ date             │     │ email        │
│ closing_hour │     │ status           │     │ phone        │
│ created_at   │     │ created_at       │     │ birth_date   │
└──────────────┘     └──────────────────┘     │ created_at   │
                            │                 └──────────────┘
                            │
┌──────────────┐            │                 ┌──────────────┐
│   doctors    │            │                 │   payments   │
├──────────────┤            │                 ├──────────────┤
│ id           │────────────┘           ┌────>│ id           │
│ first_name   │                        │     │ appointment_id│
│ last_name    │                        │     │ amount       │
│ specialty    │     ┌──────────────────┘     │ service_type │
│ clinic_id    │     │ (appointment_id)       │ payment_date │
│ created_at   │     │                        │ created_at   │
└──────────────┘     └────────────────────────└──────────────┘
```

### Decisiones de modelado

**`doctors.clinic_id` como relación directa:** Cada doctora pertenece a una clínica. Si en el futuro una doctora atiende en múltiples clínicas, se migraría a una tabla pivote `doctor_clinics`, pero el CSV actual sugiere relación 1:N.

**`appointments.status` como enum:** Los tres estados (completed, cancelled, no_show) son finitos y conocidos. Un enum a nivel de base de datos previene datos corruptos y permite queries sin comparación de strings.

**`payments` separada de `appointments`:** El requerimiento M4 filtra por fecha de pago, no de consulta. Separar la entidad permite que un appointment exista sin pago (cancelaciones) y que el pago tenga su propio timestamp. También habilita múltiples pagos por cita si el negocio lo requiere en el futuro.

**`specialty` como enum en `doctors`:** Las 5 especialidades (ginecología, obstetricia, fertilidad, nutrición, psicología) son un catálogo estable. Si creciera a 20+ especialidades o necesitara metadata adicional, se migraría a tabla propia.

**Paciente global, no por clínica:** M3 define "nueva" como primera cita en todo Nua, no por clínica. Por eso `patients` no tiene `clinic_id` — la relación con clínicas es a través de `appointments`.

## Métricas y visualizaciones

### M1 — Citas por período
**Visualización:** Gráfica de barras apiladas + KPI cards superiores.

Las barras apiladas muestran la composición (completadas/canceladas/no-show) en cada período, permitiendo ver tanto el volumen total como la proporción de cada estado. Los KPI cards arriba dan el número exacto sin necesidad de leer la gráfica. La línea de tendencia se superpone para mostrar dirección.

**Por qué no líneas solas:** Las líneas muestran tendencia pero ocultan composición. El equipo directivo necesita ambas: "¿estamos creciendo?" (tendencia) y "¿qué proporción se pierde por cancelaciones?" (composición).

**Endpoint:** `GET /api/v1/metrics/appointments`

### M2 — Tasa de ocupación por clínica
**Visualización:** Barras horizontales con meta visual al 80%.

La comparativa entre clínicas se lee mejor en barras horizontales — los nombres de clínica se leen sin rotar. Una línea de referencia al 80% da contexto inmediato de qué clínicas están sub o sobre-utilizadas.

**Cálculo:** Cada clínica tiene horario operativo (opening_hour a closing_hour). Cada slot es de 60 min. Slots disponibles = horas operativas × días en período × doctoras activas. Ocupación = citas agendadas / slots disponibles × 100.

**Por qué no un gauge/donut por clínica:** Con 5 clínicas funciona, pero a 30 clínicas los gauges individuales no escalan visualmente. Las barras horizontales escalan a cualquier número de clínicas.

**Endpoint:** `GET /api/v1/metrics/occupancy`

### M3 — Pacientes nuevas vs. recurrentes
**Visualización:** Donut chart + número central con total, tabla inferior con desglose mensual.

El donut comunica la proporción de un vistazo — la pregunta de negocio es "¿estamos captando pacientes nuevas o dependemos de las recurrentes?" La tabla inferior muestra la evolución temporal para detectar cambios.

**Cálculo:** Una paciente es "nueva" si su primera cita completada en todo Nua cae dentro del período seleccionado. Todas las demás son "recurrentes".

**Por qué no barras:** La pregunta es de proporción (ratio nuevo/recurrente), no de volumen absoluto. El donut responde "¿cuánto del total son nuevas?" de forma más directa.

**Endpoint:** `GET /api/v1/metrics/patients`

### M4 — Ingresos por clínica
**Visualización:** Barras agrupadas por clínica con desglose de color por tipo de servicio + KPI del total.

Las barras agrupadas permiten comparar tanto el ingreso total entre clínicas como la mezcla de servicios. El KPI superior da el acumulado sin esfuerzo.

**Nota de implementación:** Se filtra por `payments.payment_date`, no por `appointments.date`, como indica el requerimiento.

**Por qué no tabla:** Una tabla con números es precisa pero no comunica escala relativa. Las barras revelan de inmediato qué clínica genera más y de qué servicio — patrones difíciles de detectar en una tabla.

**Endpoint:** `GET /api/v1/metrics/revenue`

### M5 — Top doctoras por volumen de citas
**Visualización:** Tabla rankeada con barras inline.

Un ranking es inherentemente tabular — nombre, especialidad, clínica, total de citas. Las barras inline dentro de la tabla dan proporción visual sin perder la precisión numérica. Es el formato más denso en información para este tipo de dato.

**Por qué no gráfica de barras pura:** Pierde el contexto de quién es cada doctora (nombre, especialidad, clínica). La tabla con barras inline conserva todo.

**Endpoint:** `GET /api/v1/metrics/top-doctors`

## Decisiones de arquitectura

### Base de datos: PostgreSQL

**Elegida porque** el panel operativo es un caso de uso analítico con relaciones claras entre entidades. Las 5 métricas requieren JOINs, agregaciones (SUM, COUNT, GROUP BY) y filtros compuestos — el terreno natural de SQL relacional.

#### ¿Por qué relacional y no otra familia?

| Alternativa | Por qué no para este caso |
|-------------|--------------------------|
| **MongoDB** (actual en Nua) | MongoDB es la elección correcta para Vitalia (EHR) — un expediente médico es un documento semi-estructurado que varía por especialidad. Pero para analytics: los `$lookup` encadenados entre 4-5 colecciones son frágiles y lentos; el aggregation pipeline con filtros dinámicos se vuelve inmantenible; no hay integridad referencial — si borras una doctora, las citas quedan huérfanas. En un panel que alimenta decisiones de negocio, la consistencia no es negociable. |
| **Neo4j** (grafos) | Las bases de grafos brillan cuando la pregunta es sobre las relaciones mismas: "pacientes referidas por otras pacientes que vieron a la misma doctora." Las preguntas de este panel son agregaciones sobre atributos ("total de ingresos por clínica"), no traversals de profundidad variable. Agrega complejidad operacional (otro motor, otro query language) sin beneficio. |
| **Redis** | Store in-memory para cache y datos efímeros. No es base de datos primaria para datos analíticos que necesitan persistencia durable, queries complejas y relaciones. Sería útil como capa de cache si el panel tuviera cientos de usuarios concurrentes — con ~20 usuarios internos es prematuro. |
| **BigQuery / Redshift** | Con 5 clínicas el volumen no justifica un data warehouse. Si Nua crece a 100+ clínicas y agrega más fuentes de datos, migrar las queries a un warehouse columnar sería el siguiente paso — PostgreSQL hace de puente limpio porque ambos hablan SQL. |

#### ¿Por qué PostgreSQL y no otro motor relacional?

| Alternativa | Por qué PostgreSQL gana |
|-------------|------------------------|
| **MySQL / MariaDB** | Funciona para CRUD, pero para analytics PostgreSQL tiene ventaja concreta: window functions más completas, CTEs sin limitaciones, `generate_series` para generar rangos de fechas y slots disponibles en SQL puro (en MySQL necesitas tablas auxiliares o lógica en código), `FILTER` clause para agregaciones condicionales, y enums reales a nivel de base de datos. |
| **Aurora** | Aurora no es una alternativa — es PostgreSQL (o MySQL) managed en AWS. Es donde correría PostgreSQL en producción. Desarrollamos contra PostgreSQL local, deployamos contra Aurora PostgreSQL. Misma compatibilidad, cero cambios de código. |
| **SQLite** | Excelente para prototipos y apps embebidas, pero sin concurrencia real y con funciones analíticas limitadas. No es opción para producción. |
| **CockroachDB** | PostgreSQL-compatible y distribuido. Resuelve un problema de escala horizontal que Nua no tiene con 5-30 clínicas. Agrega complejidad operacional sin beneficio proporcional. |

**Escalabilidad a 30 clínicas:** El volumen estimado a 30 clínicas es ~500K citas/año y ~500K pagos/año. PostgreSQL maneja esto sin esfuerzo con índices compuestos en `(clinic_id, date)` y `(doctor_id, status)`. Si las queries analíticas eventualmente compiten con escritura transaccional, se agrega una read replica dedicada al panel — cambio de infra, no de código. Y si la escala crece a 100+ clínicas con múltiples fuentes de datos, la migración a un warehouse columnar (Redshift, BigQuery) es directa porque ambos hablan dialecto PostgreSQL.

#### Separación en dos bases de datos

El sistema usa dos bases de datos PostgreSQL independientes:

| Base de datos | Contenido | Naturaleza |
|---------------|-----------|------------|
| `nua_salud` | clinics, doctors, patients, appointments, payments | **Datos operativos** — en producción sería una read replica o ETL del sistema real (Vitalia/EHR). El dashboard los lee, no los posee. |
| `nua_dashboard` | users, user_clinics, refresh_tokens | **Lógica del dashboard** — autenticación, roles, configuración propia del panel. Read-write. |

**Por qué no una sola base de datos:**

- **Separación de ownership:** Los datos operativos pertenecen a los sistemas transaccionales de Nua (EHR, scheduling, billing). El dashboard es un consumidor, no el dueño. Mezclar tablas de auth del dashboard con datos clínicos viola este principio.
- **Permisos diferenciados:** La DB operativa es read-only para el panel (en producción, una read replica). La DB del dashboard necesita read-write para gestionar sesiones y usuarios. Conexiones separadas con permisos distintos.
- **Migración independiente:** Si Nua cambia de EHR o migra su fuente de datos, la lógica del dashboard (usuarios, roles) no se ve afectada. Y viceversa — agregar funcionalidad al dashboard no requiere tocar el schema operativo.
- **Patrón probado:** Replica el patrón de la arquitectura existente de Nua, donde servicios distintos manejan sus propias bases de datos.

Cada base de datos genera su propio paquete sqlc (`operationalsqlc` y `dashboardsqlc`), manteniendo los tipos y queries completamente separados en el código.

### Backend: Go + Gin + sqlc

**Elegido porque** Go en AWS Lambda tiene cold starts de ~100ms vs ~500ms-3s de Node.js. Para un panel operativo que se usa en horario laboral con picos intermitentes, Lambda con Go elimina el problema de cold starts sin pagar un servidor 24/7. El binario compilado es pequeño (~10-15MB), consume menos memoria, y Lambda cobra por ms + RAM — Go es literalmente más barato de operar.

#### ¿Por qué Go y no el stack actual (Node.js)?

El equipo de Nua tiene 6 devs en Node.js. Introducir Go es un riesgo de adopción, pero la justificación es concreta: el panel operativo es un servicio aislado con 5 endpoints de lectura — no necesita que todo el equipo lo mantenga. Es un caso de uso acotado donde las ventajas de Go (performance en Lambda, binario compilado, tipado estricto) superan el costo de un segundo lenguaje. Si el equipo necesita mantenerlo sin expertise en Go, la migración a Node.js/Fastify es viable porque el SQL vive en archivos `.sql` separados del código.

#### ¿Por qué Gin?

| Alternativa | Por qué Gin gana |
|-------------|-------------------|
| **Chi** | Más idiomático y cercano a `net/http`, pero Gin tiene mejor soporte probado en Lambda con `ginadapter`, mejor performance en benchmarks reales, y middleware ecosystem más maduro (CORS, logging, recovery). |
| **Fiber** | Inspirado en Express, buen performance, pero usa `fasthttp` en vez de `net/http` estándar, lo que limita compatibilidad con el ecosistema Go y el adapter de Lambda. |
| **Echo** | Similar a Gin en features. Gin tiene más adopción, más documentación, y más ejemplos de producción con Lambda. |
| **net/http (stdlib)** | Viable para 5 endpoints, pero requiere implementar a mano routing con path params, middleware chaining, y response helpers que Gin da out of the box. |

#### ¿Por qué sqlc y no un ORM o query builder?

| Alternativa | Por qué sqlc gana |
|-------------|-------------------|
| **GORM** | ORM completo, pero genera SQL opaco que no puedes optimizar. Para queries analíticas con JOINs, agregaciones y subqueries, necesitas control total del SQL. GORM abstrae lo que este proyecto necesita controlar. |
| **sqlx** | Query builder que mapea resultados a structs via reflection en runtime. sqlc hace lo mismo pero en compile time — genera código Go desde archivos `.sql` con tipos verificados antes de correr. Sin reflection, más rápido, errores antes. |
| **SQL directo (database/sql)** | Funciona, pero requiere mapeo manual de cada columna a cada struct. sqlc automatiza eso sin perder el control del SQL. |

Las queries viven en archivos `.sql` puros — son la documentación y la implementación al mismo tiempo. Si un dev necesita entender qué hace el endpoint de ocupación, lee `queries/occupancy.sql`.

### Autenticación y roles (RBAC)

Aunque el caso técnico no requiere autenticación, se implementa porque es una decisión que un CTO tomaría desde el inicio: un panel operativo con datos financieros y de rendimiento médico no puede ser accesible sin control de acceso, especialmente cuando la expansión a 30+ clínicas implica múltiples directoras con visibilidad limitada a sus propias sedes.

#### Roles

| Rol | Quién lo usa | Visibilidad |
|-----|-------------|-------------|
| **admin** | Founders, CTO | Todas las clínicas, todas las métricas, gestión de usuarios |
| **strategy** | Head of Strategy (Daniella) | Todas las clínicas, todas las métricas, sin gestión de usuarios |
| **clinic_director** | Directoras de clínica | Solo datos de sus clínicas asignadas. El filtro de clínica se restringe automáticamente |

La diferencia clave entre roles es la **visibilidad de datos**: `clinic_director` solo ve las clínicas asignadas en `user_clinics`. Esto se aplica a nivel de API — cada query filtra por las clínicas autorizadas del usuario autenticado.

#### Identificadores: UUID v7

Se usa UUID v7 (RFC 9562) en lugar de UUID v4 o IDs autoincrementales.

| Alternativa | Por qué UUID v7 gana |
|-------------|---------------------|
| **UUID v4** | Random puro. Fragmenta los índices B-tree de PostgreSQL porque los valores no tienen orden temporal. UUID v7 es time-ordered — los inserts van al final del índice, no al medio. |
| **Autoincremental (SERIAL)** | Expone el volumen de datos (ID 1543 revela que hay ~1543 registros). Predecible. UUID no filtra información. |
| **ULID** | Resuelve el mismo problema que UUID v7 (time-ordered + random), pero UUID v7 es un estándar RFC formal con soporte nativo creciente. |

#### Hashing de passwords: Argon2id

Se usa Argon2id en lugar de bcrypt.

| Alternativa | Por qué Argon2id gana |
|-------------|----------------------|
| **bcrypt** | Estándar probado, pero vulnerable a ataques con GPUs/ASICs dedicados porque solo usa CPU. |
| **scrypt** | Mejor que bcrypt (usa memoria además de CPU), pero Argon2id es su sucesor directo — ganó el Password Hashing Competition (2015) y es el estándar recomendado por OWASP. |

Argon2id combina resistencia a ataques de GPU (variante "d") y side-channel (variante "i"), ofreciendo la mejor protección disponible.

#### JWT: Access + Refresh tokens

| Token | Vida | Propósito |
|-------|------|-----------|
| **Access token** | 15 minutos | Autorización en cada request. Corta vida limita el daño si se filtra. |
| **Refresh token** | 7 días | Renovar el access token sin re-login. Se almacena en `refresh_tokens` (DB) y se puede revocar. |

#### Bitácora de auditoría (audit log)

Toda acción relevante en el dashboard queda registrada en una tabla `audit_logs` en la DB del dashboard:

| Campo | Descripción |
|-------|-------------|
| `id` | UUID v7 |
| `user_id` | Quién realizó la acción |
| `action` | Tipo de acción (`login`, `logout`, `view_metric`, `export_data`, `create_user`, `update_user`, `delete_user`) |
| `resource` | Recurso afectado (`appointments`, `occupancy`, `revenue`, etc.) |
| `details` | JSONB con contexto adicional (filtros aplicados, clínicas consultadas, IP) |
| `ip_address` | IP desde donde se realizó la acción |
| `created_at` | Timestamp de la acción |

**Por qué:** En un sistema con datos médicos y financieros, la trazabilidad no es opcional. La bitácora responde "quién vio qué, cuándo, desde dónde" — requerimiento implícito de compliance en healthtech.

#### Endpoints de autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/auth/login` | Autenticación con email y password |
| `POST` | `/api/v1/auth/refresh` | Renovar access token con refresh token |
| `POST` | `/api/v1/auth/logout` | Revocar refresh token |
| `GET` | `/api/v1/auth/me` | Datos del usuario autenticado |

#### Lo que no se implementa (fuera de scope)

- Registro público de usuarios (solo admin crea cuentas)
- Recuperación de contraseña por email
- Verificación de email
- Rate limiting en login
- 2FA

### Frontend: React + TypeScript + Vite + Recharts + Tailwind CSS

**Elegido porque** React es el estándar de facto para aplicaciones web con estado complejo como dashboards con filtros interdependientes. Vite da hot reload instantáneo. Recharts está diseñado específicamente para dashboards en React con API declarativa.

| Alternativa | Por qué no |
|-------------|-----------|
| **Next.js** | Agrega SSR, routing de filesystem y API routes. Para un panel interno sin SEO ni rutas complejas, es peso innecesario. Vite es más simple y rápido para SPAs. |
| **Vue 3** | Framework sólido, pero si el equipo de Nua ya trabaja en React (portal de pacientes, app móvil), mantener consistencia reduce costo cognitivo. |
| **Svelte** | Excelente DX, pero ecosistema más pequeño. Contratar devs Svelte en CDMX es más difícil que React. Para una startup en expansión, el pool de talento importa. |
| **D3.js** | Máxima flexibilidad para visualizaciones, pero requiere código imperativo para cada gráfica. Recharts abstrae lo común (barras, líneas, donuts) y permite customización donde se necesita. D3 es la opción si se necesitan visualizaciones no estándar. |

**Escalabilidad a 30 clínicas:** El frontend no se ve afectado por el número de clínicas — los filtros son dinámicos y las gráficas se alimentan de la API. Si el panel crece a múltiples páginas, se agrega React Router. Si necesita state management global, Zustand es la extensión natural.

## Diseño de información

Las visualizaciones se eligieron siguiendo un principio: **cada gráfica debe responder una pregunta de negocio sin necesidad de interpretación**. La audiencia (Daniella, directoras de clínica, founders) es no-técnica — el panel debe comunicar, no solo mostrar datos.

| Métrica | Pregunta de negocio | Visualización | Justificación |
|---------|---------------------|---------------|---------------|
| M1 | ¿Estamos creciendo? ¿Cuánto perdemos por cancelaciones? | Barras apiladas + KPI | Muestra volumen, composición y tendencia simultáneamente |
| M2 | ¿Qué clínicas están sub-utilizadas? | Barras horizontales con meta | Comparativa directa entre clínicas, escala a 30 |
| M3 | ¿Dependemos de recurrentes o captamos nuevas? | Donut + tabla temporal | Proporción de un vistazo + evolución temporal |
| M4 | ¿Qué clínica genera más? ¿De qué servicio? | Barras agrupadas + KPI | Compara clínicas y desglosa por servicio |
| M5 | ¿Quiénes son las doctoras más productivas? | Tabla rankeada + barras inline | Ranking con contexto (nombre, especialidad, clínica) |

## Variables de entorno

### Backend (`.env.example`)
```
ENVIRONMENT=local
PORT=3001
DATABASE_URL=postgresql://nua:nua_secret@localhost:5432/nua_salud?sslmode=disable
DASHBOARD_DATABASE_URL=postgresql://nua:nua_secret@localhost:5432/nua_dashboard?sslmode=disable
JWT_SECRET=cambiar-en-produccion-usar-al-menos-32-caracteres
JWT_REFRESH_SECRET=cambiar-en-produccion-usar-al-menos-32-caracteres-diferente
```

### Frontend (`.env.example`)
```
VITE_API_URL=http://localhost:3001/api/v1
```

## Desarrollo local

```bash
# Terminal 1 — PostgreSQL
cd backend && docker compose up -d

# Terminal 2 — Backend con hot reload
cd backend && make dev

# Terminal 3 — Frontend
cd frontend && npm run dev
```

### Comandos del Makefile

| Comando | Qué hace |
|---------|----------|
| `make dev` | Inicia backend con Air (hot reload) |
| `make build` | Compila binario local |
| `make lambda-build` | Compila binario para Lambda (linux/amd64) |
| `make migrate-up` | Aplica migraciones pendientes |
| `make migrate-down` | Revierte última migración |
| `make migrate-create name=X` | Crea nueva migración |
| `make sqlc` | Genera código Go desde queries SQL |
| `make seed` | Importa datos del CSV |

## Roadmap de escalabilidad

Decisiones que no se implementan ahora pero están contempladas para la expansión a 30+ clínicas:

1. **Read replica de PostgreSQL** — Separar lectura analítica de escritura transaccional cuando el volumen lo justifique.
2. **Cache con Redis** — Para queries costosas que no cambian en tiempo real (ingresos mensuales consolidados).
3. **Export a CSV/PDF** — Para que Daniella siga compartiendo reportes con stakeholders que no usan el panel.
4. **Data warehouse** — Si se agregan fuentes más allá de citas y pagos (NPS, marketing, costos operativos), migrar la capa analítica a un warehouse columnar.
5. **Rate limiting** — Protección contra fuerza bruta en el endpoint de login.
6. **2FA** — Segundo factor de autenticación para usuarios con acceso a datos sensibles.
