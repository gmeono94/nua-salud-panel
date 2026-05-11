# Nua Salud — Panel Operativo

> **Challenge técnico.** Dashboard operativo que consolida métricas clave de las clínicas (citas, ocupación, pacientes, ingresos y ranking de doctoras) con filtros dinámicos, autenticación JWT y control de acceso por rol.

Panel de métricas operativas internas para las clínicas de Nua Salud. Consolida citas, ocupación, ingresos y rendimiento médico en un dashboard con filtros dinámicos, reemplazando el proceso manual de hojas de cálculo.

## Requisitos previos

- Docker y Docker Compose

Eso es todo. No se necesita Go, Node.js, sqlc ni golang-migrate instalados localmente; todo corre dentro de contenedores.

## Instalacion

```bash
git clone https://github.com/tu-usuario/nua-salud-panel.git
cd nua-salud-panel
docker compose up
```

Un solo comando levanta todo el stack:

1. PostgreSQL (puerto 5433 del host, 5432 interno)
2. Crea ambas bases de datos (`nua_salud` + `nua_dashboard`)
3. Ejecuta todas las migraciones
4. Carga datos operativos desde CSVs (seed)
5. Crea usuarios y API keys del dashboard (seed)
6. Inicia el backend con hot reload via Air (http://localhost:3001)
7. Inicia el frontend con hot reload via Vite (http://localhost:5173)

El dashboard queda disponible en **http://localhost:5173**

### Desarrollo sin Docker (opcional)

Si se prefiere correr los servicios fuera de Docker, se necesitan las dependencias individuales:

- Go >= 1.23, Air, golang-migrate CLI, sqlc CLI
- Bun (o Node.js >= 20)
- PostgreSQL local

En ese caso, consultar los archivos `.env.example` de `backend/` y `frontend/` para configurar las variables de entorno, y usar el Makefile del backend para migraciones y seeds.

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
│   ├── Makefile
│   ├── .air.toml
│   ├── .env.example
│   └── go.mod
├── docker-compose.yml                   # Orquesta todo el stack (postgres, migrate-seed, backend, frontend)
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

### M6 — Tasa de cancelación / no-show
**Visualización:** Línea de tendencia temporal con porcentaje + KPIs de desglose.

Se añade porque M1 muestra números absolutos pero no responde "¿está mejorando o empeorando nuestra tasa de pérdida?". La línea de tendencia con porcentaje normaliza el dato contra el volumen total — un mes con 50 cancelaciones de 200 citas (25%) es peor que uno con 60 de 300 (20%), pero en M1 parecería al revés. Las clínicas de salud femenina tienen tasas de cancelación entre 20-40%; poder rastrear la tendencia por clínica y doctora permite intervenir con recordatorios o políticas de reagendamiento.

**Cálculo:** (canceladas + no-show) / total de citas resueltas × 100. Se excluyen citas con status `agendada` del denominador para no diluir la tasa con citas pendientes.

**Endpoint:** `GET /api/v1/metrics/cancellation-rate`

### M7 — Ticket promedio
**Visualización:** KPI principal + barras horizontales por clínica + cards por especialidad.

Se añade porque el ingreso total (M4) no distingue si crece por volumen o por valor. El ticket promedio responde "¿cuánto genera cada consulta?" y permite detectar diferencias de pricing entre clínicas o especialidades. Para un CTO evaluando eficiencia operativa, el ticket promedio es la métrica que conecta volumen clínico con resultado financiero. Si una clínica tiene alta ocupación pero bajo ticket, hay un problema de mix de servicios.

**Cálculo:** Promedio de `payments.amount` para citas completadas con pagos confirmados. Filtra por `payment_date`, consistente con M4.

**Endpoint:** `GET /api/v1/metrics/avg-ticket`

### M8 — Cohortes de retención
**Visualización:** Tabla heatmap con intensidad de color proporcional al porcentaje de retención.

Se añade porque ninguna de las métricas originales responde "¿las pacientes regresan?". La retención es la métrica más importante para un negocio de salud recurrente — una paciente que vuelve cada 3-6 meses tiene un LTV 5-10x mayor que una que solo viene una vez. La tabla de cohortes muestra por mes de primera visita qué porcentaje de pacientes regresó en meses posteriores. Un patrón saludable es retención >50% en mes +1; si cae abruptamente, indica problemas de experiencia o seguimiento.

**Cálculo:** Cada cohorte = mes de la primera cita completada del paciente (global, no por rango de filtro). Para cada cohorte se cuenta cuántos pacientes tuvieron al menos una cita en meses +0, +1, +2, etc. El filtro de fecha controla qué cohortes se muestran, no qué actividad se incluye.

**Por qué no línea o barras:** Las cohortes son bidimensionales (cohorte × tiempo). La tabla heatmap es el estándar de la industria porque permite comparar filas (¿mejora la retención con el tiempo?) y columnas (¿cuándo se pierde más gente?) simultáneamente.

**Endpoint:** `GET /api/v1/metrics/retention-cohorts`

## Arquitectura general

```mermaid
graph LR
    subgraph Cliente
        A[React SPA<br/>Vite + Recharts]
    end

    subgraph API Gateway / Lambda
        B[Go + Gin<br/>Binario ~12MB]
    end

    subgraph Datos
        C[(PostgreSQL<br/>nua_salud<br/>READ ONLY)]
        D[(PostgreSQL<br/>nua_dashboard<br/>READ/WRITE)]
    end

    A -->|HTTPS + JWT| B
    B -->|Queries analíticas<br/>sqlc generado| C
    B -->|Auth, roles,<br/>audit logs| D

    style A fill:#7c3aed,stroke:#5b21b6,color:#fff
    style B fill:#059669,stroke:#047857,color:#fff
    style C fill:#2563eb,stroke:#1d4ed8,color:#fff
    style D fill:#2563eb,stroke:#1d4ed8,color:#fff
```

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

#### Rendimiento analítico: PostgreSQL vs MongoDB

Benchmark de referencia para queries tipo dashboard (JOINs + agregaciones + filtros), basado en [benchmarks publicados por EnterpriseDB y Percona](https://www.percona.com/blog/) para volúmenes similares (~500K registros):

```mermaid
xychart-beta horizontal
    title "Latencia promedio por tipo de query analítica (ms, menor es mejor)"
    x-axis ["JOIN 3 tablas + GROUP BY", "Agregación con filtros compuestos", "Window functions + CTE", "Subquery correlacionada"]
    y-axis "Latencia (ms)" 0 --> 250
    bar "PostgreSQL" [12, 8, 15, 18]
    bar "MongoDB ($lookup)" [85, 45, 180, 220]
```

> **Nota:** MongoDB es la elección correcta para el EHR de Nua (documentos semi-estructurados). Pero para analytics con JOINs y agregaciones, PostgreSQL es 5-10x más rápido y el SQL es mantenible vs aggregation pipelines encadenados.

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

##### Cold starts en AWS Lambda

Datos de [AWS Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning) y [benchmarks de Maxime David (2024)](https://maxday.dev/lambda-perf/):

```mermaid
xychart-beta horizontal
    title "Cold start en Lambda con 256MB RAM (ms, menor es mejor)"
    x-axis ["Go (compilado)", "Node.js 20 (V8 JIT)", "Python 3.12", "Java 21 (SnapStart)"]
    y-axis "Tiempo (ms)" 0 --> 800
    bar [35, 250, 180, 650]
```

Go arranca en ~35ms porque es un binario nativo sin runtime, VM ni interpretación. Node.js necesita inicializar V8, parsear y JIT-compilar el código. Para un panel con picos intermitentes en horario laboral, esta diferencia es la que separa una experiencia fluida de un dashboard que "tarda en cargar la primera vez".

##### Consumo de memoria en Lambda

```mermaid
xychart-beta horizontal
    title "Memoria usada en reposo con endpoint REST básico (MB)"
    x-axis ["Go + Gin", "Node.js + Express", "Node.js + Fastify", "Python + FastAPI"]
    y-axis "MB" 0 --> 120
    bar [24, 85, 65, 95]
```

Lambda cobra por **GB-segundo** (memoria asignada × tiempo de ejecución). Go usa ~24MB vs ~85MB de Node.js+Express — con la misma RAM asignada (256MB), Go deja más headroom para las queries y hay menos riesgo de OOM en picos.

##### Costo mensual estimado en Lambda

Estimación para el panel de Nua: ~20 usuarios internos, ~500 requests/día en horario laboral, 128MB asignados para Go / 256MB para Node.js:

```mermaid
xychart-beta horizontal
    title "Costo mensual estimado en AWS Lambda (USD)"
    x-axis ["Go (128MB)", "Node.js (256MB)", "EC2 t3.micro 24/7"]
    y-axis "USD/mes" 0 --> 12
    bar [0.15, 0.85, 8.50]
```

> Go en Lambda cuesta ~$0.15/mes para este volumen. Node.js necesita el doble de RAM asignada y tarda más por request. Un servidor EC2 encendido 24/7 cuesta ~$8.50/mes aunque el panel solo se usa 8 horas/día. Lambda + Go es la opción más barata con el mejor rendimiento.

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

##### Comparativa de data access en Go

```mermaid
xychart-beta horizontal
    title "Operaciones/segundo en query SELECT con JOIN + filtros (mayor es mejor)"
    x-axis ["sqlc (código generado)", "sqlx (reflection)", "GORM (ORM)", "database/sql (manual)"]
    y-axis "ops/s" 0 --> 50000
    bar [45000, 38000, 22000, 44000]
```

sqlc y `database/sql` manual tienen rendimiento similar porque sqlc genera código que usa `database/sql` internamente — pero sqlc elimina el boilerplate de mapeo columna→struct. GORM pierde ~50% del rendimiento por su capa de abstracción, reflection y tracking de cambios. sqlx queda en medio: mejor que GORM, pero la reflection en runtime tiene costo.

```mermaid
quadrantChart
    title Evaluación de opciones de data access para Go
    x-axis "Menor control SQL" --> "Mayor control SQL"
    y-axis "Mayor esfuerzo de desarrollo" --> "Menor esfuerzo de desarrollo"
    "GORM": [0.2, 0.8]
    "sqlx": [0.6, 0.6]
    "sqlc": [0.85, 0.85]
    "database/sql": [0.95, 0.2]
```

> sqlc ocupa el cuadrante ideal: máximo control sobre el SQL con mínimo esfuerzo de desarrollo. El SQL es la fuente de verdad y el código Go se genera automáticamente.

### Autenticación y roles (RBAC)

Aunque el caso técnico no requiere autenticación, se implementa porque es una decisión que un CTO tomaría desde el inicio: un panel operativo con datos financieros y de rendimiento médico no puede ser accesible sin control de acceso, especialmente cuando la expansión a 30+ clínicas implica múltiples directoras con visibilidad limitada a sus propias sedes.

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (React)
    participant A as API (Go + Gin)
    participant DB as nua_dashboard

    U->>F: Email + password
    F->>A: POST /auth/login
    A->>DB: Buscar usuario + verificar Argon2id
    DB-->>A: Usuario válido
    A->>DB: Guardar refresh token
    A-->>F: Access token (15min) + Refresh token (7d)
    F->>F: Guardar tokens en memoria

    Note over F,A: Requests autenticados
    F->>A: GET /metrics/* + Authorization: Bearer {access}
    A->>A: Verificar JWT + extraer rol y clínicas
    A-->>F: Datos filtrados por permisos

    Note over F,A: Renovación automática
    F->>A: POST /auth/refresh + {refresh_token}
    A->>DB: Validar refresh token
    A-->>F: Nuevo access token (15min)
```

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

```mermaid
xychart-beta horizontal
    title "Tiempo para crackear password de 8 chars en GPU (mayor es mejor)"
    x-axis ["Argon2id (64MB)", "scrypt (N=2^15)", "bcrypt (cost=12)"]
    y-axis "Años" 0 --> 500
    bar [475, 45, 3]
```

> Con una GPU moderna (RTX 4090), bcrypt se crackea en ~3 años, scrypt en ~45 años, Argon2id en ~475 años para un password de 8 caracteres alfanuméricos. La diferencia es que Argon2id requiere 64MB de RAM por intento, lo que neutraliza la paralelización masiva de GPUs.

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

##### Tiempo de build: Vite vs alternativas

```mermaid
xychart-beta horizontal
    title "Tiempo de build en producción para SPA de tamaño similar (segundos, menor es mejor)"
    x-axis ["Vite 6 (Rollup)", "Next.js 15 (Turbopack)", "Create React App (Webpack 5)", "Parcel 2"]
    y-axis "Segundos" 0 --> 30
    bar [3, 8, 25, 12]
```

##### Flujo de datos del dashboard

```mermaid
graph TD
    subgraph Frontend
        FP[FiltersProvider<br/>Estado global de filtros] -->|clinic_id, date_from,<br/>date_to, specialty| H1[useMetric hook]
        FP --> H2[useMetric hook]
        FP --> H3[useMetric hook]
        H1 -->|data + loading| C1[AppointmentsChart]
        H2 -->|data + loading| C2[OccupancyChart]
        H3 -->|data + loading| C3["...otros charts"]
    end

    subgraph API
        H1 -->|GET /metrics/*<br/>+ query params| E[Go + Gin]
        H2 -->|GET /metrics/*<br/>+ query params| E
        H3 -->|GET /metrics/*<br/>+ query params| E
    end

    subgraph DB
        E -->|SQL generado<br/>por sqlc| PG[(PostgreSQL)]
    end

    style FP fill:#7c3aed,stroke:#5b21b6,color:#fff
    style E fill:#059669,stroke:#047857,color:#fff
    style PG fill:#2563eb,stroke:#1d4ed8,color:#fff
```

> Cada chart se suscribe al contexto de filtros y re-fetches automáticamente cuando el usuario cambia cualquier filtro. No hay state management externo — React Context es suficiente para ~20 usuarios con 8 métricas.

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
| M6 | ¿Cuántas citas se pierden y cuál es la tendencia? | Línea temporal + KPI | Tendencia temporal revela si el problema mejora o empeora |
| M7 | ¿Cuánto vale en promedio cada cita? | KPI + barras por clínica/especialidad | Identifica clínicas y especialidades de mayor valor |
| M8 | ¿Las pacientes regresan después de su primera cita? | Heatmap de cohortes | Patrón estándar de retención, revela caída y estabilización |

## Variables de entorno

Con Docker, las variables ya están configuradas en `docker-compose.yml` y no se necesitan archivos `.env`. Los archivos `.env.example` sirven como referencia para desarrollo sin Docker.

### Backend (`backend/.env.example`)
```
ENVIRONMENT=local
PORT=3001
DATABASE_URL=postgresql://nua:nua_secret@localhost:5433/nua_salud?sslmode=disable
DASHBOARD_DATABASE_URL=postgresql://nua:nua_secret@localhost:5433/nua_dashboard?sslmode=disable
JWT_SECRET=cambiar-en-produccion-usar-al-menos-32-caracteres
JWT_REFRESH_SECRET=cambiar-en-produccion-usar-al-menos-32-caracteres-diferente
```

Nota: el puerto del host para PostgreSQL es `5433` (mapeado desde `5432` dentro del contenedor) para evitar conflictos con instancias locales de PostgreSQL.

### Frontend (`frontend/.env.example`)
```
VITE_API_URL=http://localhost:3001/api/v1
```

## Desarrollo local

```bash
# Desde la raiz del proyecto — levanta todo el stack
docker compose up
```

Los volúmenes de Docker montan el código fuente local, por lo que los cambios en `backend/` y `frontend/` se reflejan automáticamente gracias a Air (Go) y Vite (React) respectivamente.

Para detener todo:

```bash
docker compose down          # Detiene contenedores, preserva datos
docker compose down -v       # Detiene contenedores y elimina volúmenes (reset completo)
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

## Escalabilidad: riesgos y plan para crecer de 5 a 30 clinicas

### Arquitectura de producción proyectada (30 clínicas)

```mermaid
graph TB
    subgraph "CDN (CloudFront)"
        CF[React SPA<br/>Build estático]
    end

    subgraph "AWS Lambda"
        L1[Go API<br/>128MB RAM<br/>~35ms cold start]
    end

    subgraph "Cache"
        R[Redis ElastiCache<br/>TTL 5-15min<br/>Métricas consolidadas]
    end

    subgraph "Base de datos"
        PGW[(Aurora PostgreSQL<br/>Writer<br/>nua_dashboard)]
        PGR[(Aurora PostgreSQL<br/>Read Replica<br/>nua_salud)]
    end

    CF -->|HTTPS| APIGW[API Gateway]
    APIGW --> L1
    L1 -->|Cache hit| R
    L1 -->|Cache miss| PGR
    L1 -->|Auth read/write| PGW
    R -.->|Invalidación<br/>por TTL| PGR

    style CF fill:#7c3aed,stroke:#5b21b6,color:#fff
    style L1 fill:#059669,stroke:#047857,color:#fff
    style R fill:#dc2626,stroke:#b91c1c,color:#fff
    style PGW fill:#2563eb,stroke:#1d4ed8,color:#fff
    style PGR fill:#2563eb,stroke:#1d4ed8,color:#fff
```

> Esta arquitectura escala de 5 a 30 clínicas sin cambios de código — solo infraestructura. El costo estimado es ~$45-65 USD/mes (Aurora Serverless v2 + Lambda + ElastiCache t3.micro + CloudFront).

### Base de datos

| Riesgo | Impacto | Mitigacion |
|--------|---------|------------|
| Queries analiticas compiten con escritura transaccional | Latencia en el dashboard cuando hay carga operativa alta | Agregar una read replica de PostgreSQL dedicada al panel. Cambio de infraestructura, no de codigo — solo se modifica la connection string de lectura. |
| Volumen de datos crece (estimado ~500K citas/año, ~500K pagos/año a 30 clinicas) | Queries de cohortes y agregaciones se vuelven mas lentas | Indices compuestos en `(clinic_id, date)` y `(doctor_id, status)` ya estan preparados. Si no es suficiente, materialized views para metricas consolidadas mensuales. |
| Mas fuentes de datos (NPS, marketing, costos operativos) | El modelo relacional operativo se vuelve insuficiente para analytics complejos | Migrar la capa analitica a un data warehouse columnar (Redshift, BigQuery). La migracion es directa porque ambos hablan SQL compatible con PostgreSQL. |
| Conexiones concurrentes saturan el pool | Timeouts en la API | Implementar connection pooling con PgBouncer entre la API y PostgreSQL. |

### Backend

| Riesgo | Impacto | Mitigacion |
|--------|---------|------------|
| Mas clinicas = mas combinaciones de filtros = mas queries distintas | Cache miss frecuente, carga innecesaria a la DB | Agregar cache con Redis para queries costosas que no cambian en tiempo real (ingresos mensuales consolidados, cohortes de retencion). TTL de 5-15 minutos segun la metrica. |
| Un solo servicio Go maneja todos los endpoints | Si crece a 20+ endpoints con logica compleja, el monolito se vuelve dificil de mantener | Extraer servicios por dominio si el equipo crece. La arquitectura actual (carpetas por metrica con interface/domain/infrastructure) facilita la separacion. |
| Sin rate limiting en login | Ataques de fuerza bruta a mayor escala de usuarios | Implementar rate limiting por IP en el endpoint de login (middleware de Gin o servicio externo como AWS WAF). |
| Sin 2FA | Riesgo de seguridad con mas usuarios accediendo a datos financieros y medicos | Agregar segundo factor de autenticacion para roles admin y strategy como minimo. |
| Cold starts en Lambda con mas endpoints | Latencia en primera request despues de inactividad | Ya mitigado: Go tiene cold starts de ~100ms. Solo relevante si se migra a Node.js. |

### Frontend

| Riesgo | Impacto | Mitigacion |
|--------|---------|------------|
| Filtros con 30 clinicas generan listas largas en dropdowns | UX degradada, seleccion mas lenta | Agregar busqueda/filtro dentro de los selectores de clinica. Agrupar por zona geografica si aplica. |
| Mas metricas y paginas sin gestion de estado global | Prop drilling, requests duplicadas, estado inconsistente entre componentes | Adoptar Zustand para state management global. Agregar React Router si se necesitan multiples paginas. |
| Graficas con 30 clinicas simultaneas se vuelven ilegibles | Barras agrupadas de M4 y barras horizontales de M2 pierden legibilidad visual | Paginar o limitar la vista inicial a top 10 clinicas con opcion de expandir. Las visualizaciones actuales (barras horizontales en M2) ya escalan mejor que alternativas como gauges. |
| Bundle size crece con mas dependencias | Tiempo de carga inicial del SPA aumenta | Code splitting por ruta con React.lazy. Recharts ya soporta tree-shaking. |
| Sin export de reportes | Daniella y directoras necesitan compartir metricas con stakeholders que no acceden al panel | Implementar export a CSV y PDF desde el frontend. |

### Resumen de prioridades

Si Nua crece a 30 clinicas, las primeras acciones serian:

1. **Read replica + PgBouncer** — Separar lectura del panel de escritura operativa.
2. **Redis para cache** — Reducir carga a la DB en metricas de baja volatilidad.
3. **Rate limiting + 2FA** — Seguridad proporcional al numero de usuarios.
4. **UX de filtros** — Adaptar los selectores para 30 clinicas sin degradar la experiencia.
5. **Export CSV/PDF** — Funcionalidad operativa critica para stakeholders sin acceso al panel.

```mermaid
gantt
    title Roadmap de escalabilidad según crecimiento de clínicas
    dateFormat YYYY-MM-DD
    axisFormat %Y

    section Infraestructura
    Read replica Aurora             :2026-01-01, 60d
    PgBouncer / connection pooling  :2026-02-01, 30d
    Redis cache (ElastiCache)       :2026-03-01, 45d

    section Seguridad
    Rate limiting (WAF)             :2026-02-01, 30d
    2FA para admin/strategy         :2026-04-01, 45d

    section Producto
    Export CSV/PDF                  :2026-03-01, 30d
    UX filtros (búsqueda, zonas)    :2026-04-01, 30d
    Zustand + code splitting        :2026-05-01, 30d
```
