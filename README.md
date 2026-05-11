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

## Escalabilidad: de 5 a 30 clinicas — plataforma completa

Nua opera hoy con 5 clínicas, 6 desarrolladores Node.js, y un stack centrado en MongoDB + microservicios. El plan de expansión a 30 clínicas impacta toda la plataforma, no solo el panel operativo. Esta sección analiza los riesgos y mitigaciones por capa, desde la infraestructura compartida hasta cada producto.

### Arquitectura actual de Nua (5 clinicas)

```mermaid
graph TB
    subgraph "Productos de Nua"
        V[Vitalia — EHR<br/>Node.js + MongoDB]
        PP[Portal Pacientes<br/>React]
        MA[App Móvil<br/>React Native]
        DP[Panel Operativo<br/>Go + PostgreSQL]
    end

    subgraph "Datos"
        MDB[(MongoDB Atlas<br/>Expedientes clínicos<br/>Documentos semi-estructurados)]
        PG[(PostgreSQL<br/>Datos operativos + Dashboard<br/>Citas, pagos, métricas)]
    end

    subgraph "Infraestructura AWS"
        ALB[Application Load Balancer]
        ECS[ECS Fargate<br/>Microservicios Node.js]
        LAM[Lambda<br/>Panel operativo]
        S3[S3 + CloudFront<br/>SPAs estáticas]
    end

    PP --> S3
    MA --> ALB
    V --> ALB
    DP --> S3

    ALB --> ECS
    S3 -->|API calls| ALB
    S3 -->|API calls| LAM

    ECS --> MDB
    LAM --> PG

    style V fill:#059669,stroke:#047857,color:#fff
    style PP fill:#7c3aed,stroke:#5b21b6,color:#fff
    style MA fill:#7c3aed,stroke:#5b21b6,color:#fff
    style DP fill:#7c3aed,stroke:#5b21b6,color:#fff
    style MDB fill:#16a34a,stroke:#15803d,color:#fff
    style PG fill:#2563eb,stroke:#1d4ed8,color:#fff
```

### Arquitectura proyectada (30 clinicas)

```mermaid
graph TB
    subgraph "Productos"
        V[Vitalia — EHR]
        PP[Portal Pacientes]
        MA[App Móvil]
        DP[Panel Operativo]
    end

    subgraph "API Layer"
        APIGW[API Gateway<br/>Rate limiting, auth, routing]
    end

    subgraph "Compute"
        ECS[ECS Fargate<br/>Auto-scaling 2→10 tasks<br/>Microservicios Node.js]
        LAM[Lambda Go<br/>Panel operativo<br/>128MB, ~35ms cold start]
    end

    subgraph "Cache + Mensajería"
        RC[Redis ElastiCache<br/>Sesiones + cache de métricas]
        SQS[SQS / EventBridge<br/>Eventos entre servicios]
    end

    subgraph "Datos"
        MDB[(MongoDB Atlas M30<br/>Sharded por clinic_id<br/>Read replicas por región)]
        PGW[(Aurora PostgreSQL<br/>Writer — dashboard auth)]
        PGR[(Aurora PostgreSQL<br/>Read Replica — métricas)]
        S3D[(S3<br/>Documentos clínicos<br/>Imágenes, PDFs)]
    end

    subgraph "Observabilidad"
        CW[CloudWatch<br/>Logs + Métricas + Alarmas]
        XR[X-Ray<br/>Tracing distribuido]
    end

    V --> APIGW
    PP --> APIGW
    MA --> APIGW
    DP --> APIGW

    APIGW --> ECS
    APIGW --> LAM

    ECS --> RC
    ECS --> MDB
    ECS --> SQS
    ECS --> S3D
    LAM --> RC
    LAM --> PGR
    LAM --> PGW

    SQS -.->|Sync citas/pagos| PGR

    ECS --> CW
    LAM --> CW
    ECS --> XR

    style APIGW fill:#f59e0b,stroke:#d97706,color:#000
    style RC fill:#dc2626,stroke:#b91c1c,color:#fff
    style MDB fill:#16a34a,stroke:#15803d,color:#fff
    style PGW fill:#2563eb,stroke:#1d4ed8,color:#fff
    style PGR fill:#2563eb,stroke:#1d4ed8,color:#fff
```

---

### 1. MongoDB y Vitalia (EHR)

MongoDB es la elección correcta para el EHR — un expediente médico es un documento semi-estructurado que varía por especialidad. Pero a 30 clínicas los riesgos cambian:

| Riesgo | Volumen estimado (30 clinicas) | Mitigación |
|--------|-------------------------------|------------|
| Colección de expedientes crece a millones de documentos | ~150K pacientes activas, ~2M documentos clínicos | **Sharding por `clinic_id`** — distribuye la carga de lectura/escritura. MongoDB Atlas lo soporta nativamente. Cada clínica se convierte en un shard range predecible. |
| `$lookup` entre colecciones (citas↔expedientes↔pagos) se degrada | Latencia de 200ms+ en queries cross-collection | **Denormalización selectiva** — embeber datos frecuentemente consultados (resumen de última cita, saldo pendiente) dentro del documento del paciente. Actualizar con Change Streams. |
| Escritura concurrente en la misma paciente desde múltiples clínicas | Conflictos de escritura si una paciente se atiende en 2 sedes | **Optimistic concurrency** con versionado (`__v` de Mongoose) + retry en conflicto. Alternativa: queue de escritura por paciente con SQS. |
| Backups y recuperación en caso de desastre | Pérdida de datos clínicos = riesgo legal y de compliance | **MongoDB Atlas continuous backup** con point-in-time recovery. RPO < 1 minuto. Backups cruzados a otra región (us-west-2 si primario es us-east-1). |
| Esquemas divergen entre clínicas sin control | Deuda técnica acumulada, bugs difíciles de rastrear | **Schema validation rules** en MongoDB 5.0+ a nivel de colección. No tan estricto como SQL, pero previene documentos corruptos. Complementar con validación en Mongoose schemas. |

```mermaid
xychart-beta horizontal
    title "Latencia de lectura en MongoDB según volumen (ms, p95)"
    x-axis ["50K docs (5 clinicas)", "300K docs (15 clinicas)", "2M docs (30 clinicas)", "2M docs + sharding"]
    y-axis "ms" 0 --> 200
    bar [8, 35, 180, 12]
```

> Sin sharding, la latencia de lectura crece de forma no lineal con el volumen. Con sharding por `clinic_id`, cada query solo escanea el shard relevante y la latencia se mantiene estable.

### 2. Microservicios Node.js

El equipo actual (6 devs Node.js) opera un conjunto de microservicios en ECS Fargate. A 30 clínicas:

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| 6x más tráfico en horario pico (30 vs 5 clínicas abren simultáneamente) | ECS tasks saturan CPU/memoria, latencia se degrada | **Auto-scaling basado en CPU/requests** — ECS Fargate escala de 2 a 10 tasks en <2 minutos. Definir target tracking policy al 60% CPU. |
| Comunicación sincrónica entre servicios crea cascadas de fallos | Si el servicio de pagos cae, citas y expedientes también fallan | **Circuit breaker pattern** (opossum para Node.js) + comunicación asíncrona con SQS/EventBridge para operaciones no-críticas. Solo mantener sincrónico lo que requiere respuesta inmediata. |
| Cold starts de Node.js en Lambda (si se migran servicios) | 250-500ms en primera invocación | **No migrar los microservicios core a Lambda** — mantenerlos en ECS Fargate con min tasks=2. Lambda solo para workloads event-driven (webhooks, procesamiento de archivos, panel operativo). |
| Un solo monorepo crece sin estructura | Deploys lentos, blast radius alto, conflictos de merge | **Separar en repos por dominio** con contratos de API versionados (OpenAPI). CI/CD independiente por servicio. |
| Dependencias npm con vulnerabilidades | Supply chain attack en servicios con datos médicos | **Dependabot + npm audit** en CI. Lock files (`package-lock.json`) commiteados. Política de actualización mensual de deps. |

```mermaid
xychart-beta horizontal
    title "Tiempo de respuesta p99 según concurrencia (ms)"
    x-axis ["50 req/s (5 clinicas)", "150 req/s (15 clinicas)", "300 req/s (30 clinicas)", "300 req/s + auto-scale"]
    y-axis "ms" 0 --> 800
    bar [45, 120, 650, 85]
```

### 3. App móvil y portal de pacientes

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| 30 clínicas = ~90K pacientes activas usando la app | Push notifications saturan, API de citas recibe picos de 1K+ req/s al abrir agenda matutina | **API Gateway con throttling** por usuario (100 req/min). Push notifications via SNS con batching. |
| Pacientes en múltiples ciudades con latencia variable | UX degradada para clínicas fuera de la región principal del servidor | **CloudFront para assets estáticos** + evaluar multi-región para la API si se expande fuera de CDMX. |
| Actualizaciones de la app móvil forzadas por cambios de API | Pacientes con versiones viejas reciben errores | **API versioning** (v1, v2) con deprecación gradual. Mínimo 2 versiones activas simultáneas. Feature flags para rollout progresivo (LaunchDarkly o GrowthBook). |
| Datos médicos en dispositivos móviles | Riesgo de compliance si el dispositivo se pierde/roba | **No cachear datos clínicos en disco** — solo en memoria. Sesión con timeout de inactividad (15 min). Biometric auth para reabrir. |

### 4. Panel operativo (este proyecto)

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Queries analíticas compiten con escritura transaccional del EHR | Latencia en el dashboard cuando hay carga operativa alta | **Read replica de PostgreSQL** dedicada al panel. Cambio de infra, no de código — solo se modifica la connection string. |
| Volumen de datos crece (~500K citas/año, ~500K pagos/año) | Queries de cohortes y agregaciones se vuelven más lentas | **Índices compuestos** en `(clinic_id, date)` y `(doctor_id, status)` ya están preparados. Si no es suficiente, materialized views para métricas consolidadas mensuales. |
| Más fuentes de datos (NPS, marketing, costos operativos) | El modelo relacional operativo se vuelve insuficiente | Migrar la capa analítica a un **data warehouse columnar** (Redshift, BigQuery). La migración es directa porque ambos hablan SQL. |
| 30 clínicas × múltiples directoras = más usuarios concurrentes | Conexiones saturan el pool | **PgBouncer** entre la API y PostgreSQL. |
| Más combinaciones de filtros = más queries distintas | Cache miss frecuente | **Redis cache** con TTL de 5-15 min para métricas de baja volatilidad (ingresos consolidados, cohortes). |
| Filtros con 30 clínicas en dropdowns | UX degradada | Búsqueda dentro del multi-select, agrupación por zona geográfica. |
| Sin export de reportes | Directoras necesitan compartir métricas offline | **Export CSV y PDF** desde el frontend. |

### 5. Sincronización de datos entre sistemas

El panel operativo consume datos del EHR (MongoDB) pero los almacena en PostgreSQL. A 30 clínicas, la sincronización se vuelve crítica:

```mermaid
graph LR
    subgraph "EHR (MongoDB)"
        CS[Change Streams<br/>citas, pagos, pacientes]
    end

    subgraph "Sync Layer"
        SQS[SQS Queue<br/>Buffer de eventos]
        W[Worker Node.js<br/>Transformación + carga]
    end

    subgraph "Panel (PostgreSQL)"
        PG[(appointments<br/>payments<br/>patients)]
    end

    CS -->|Eventos en tiempo real| SQS
    SQS --> W
    W -->|Upsert| PG

    style CS fill:#16a34a,stroke:#15803d,color:#fff
    style SQS fill:#f59e0b,stroke:#d97706,color:#000
    style PG fill:#2563eb,stroke:#1d4ed8,color:#fff
```

| Patrón | Cuándo usarlo | Latencia |
|--------|---------------|----------|
| **Change Streams → SQS → Worker** | Datos que necesitan estar actualizados en <5 min (citas del día, pagos) | ~2-10 segundos |
| **ETL batch nocturno** | Datos históricos que no cambian (cohortes pasadas, métricas consolidadas) | Nightly job |
| **API directa al EHR** | Datos que cambian muy frecuentemente y no justifican duplicación | Tiempo real, pero acopla los sistemas |

### 6. Seguridad y compliance (HIPAA / datos médicos)

| Riesgo | Aplica a | Mitigación |
|--------|----------|------------|
| Datos médicos en tránsito sin cifrar | Todos los servicios | **TLS 1.3 obligatorio** en ALB y API Gateway. Certificados via ACM. |
| Datos en reposo sin cifrar | MongoDB, PostgreSQL, S3 | **Encryption at rest** — MongoDB Atlas lo incluye por defecto, Aurora tiene KMS, S3 con SSE-S3. |
| Sin audit trail de quién accede a qué | EHR, panel operativo | **Bitácora de auditoría** ya implementada en el panel. Extender el patrón a Vitalia con middleware de logging. |
| Acceso a producción sin control | Infraestructura | **IAM con least privilege** — roles separados para devs, CI/CD y servicios. No hay credenciales en código. |
| Sin plan de respuesta a incidentes | Toda la plataforma | Documentar runbook de incidentes: quién es notificado, cómo se contiene, cómo se comunica a pacientes afectadas. |
| Rate limiting ausente en endpoints de auth | Panel + EHR | **AWS WAF** con reglas por IP. Rate limit de 10 intentos/min en login. |
| Sin 2FA para roles administrativos | Panel + EHR | **TOTP (Google Authenticator)** obligatorio para admin y strategy. |

### 7. Infraestructura y costos

```mermaid
xychart-beta horizontal
    title "Costo mensual estimado de infraestructura AWS (USD)"
    x-axis ["5 clinicas (actual)", "15 clinicas", "30 clinicas", "30 clinicas optimizado"]
    y-axis "USD/mes" 0 --> 2500
    bar [350, 850, 2200, 1400]
```

| Componente | 5 clínicas | 30 clínicas | Optimización |
|------------|-----------|-------------|-------------|
| MongoDB Atlas | M10 ($60) | M30 + sharding ($450) | Reservar instancia 1 año (-40%) |
| ECS Fargate | 2 tasks ($80) | 2-10 tasks auto-scale ($400) | Fargate Spot para tasks no-críticos (-70%) |
| Aurora PostgreSQL | Serverless v2 ($30) | Serverless v2 + replica ($90) | — ya es serverless |
| Lambda (panel) | ~$0.15 | ~$2 | — irrelevante a esta escala |
| ElastiCache Redis | — | t3.micro ($15) | — |
| CloudFront + S3 | $5 | $15 | — |
| API Gateway | $10 | $50 | — |
| Monitoring (CloudWatch) | $15 | $80 | Filtrar logs, retención 30 días |
| **Total** | **~$350** | **~$2,200** | **~$1,400** |

### 8. Equipo y organización

```mermaid
xychart-beta horizontal
    title "Devs necesarios por área según número de clínicas"
    x-axis ["5 clinicas (actual)", "15 clinicas", "30 clinicas"]
    y-axis "Desarrolladores" 0 --> 16
    bar "Backend (Node.js)" [3, 5, 7]
    bar "Frontend + Mobile" [2, 3, 5]
    bar "Infra / DevOps" [0, 1, 2]
    bar "Data / Analytics" [0, 0, 1]
```

| Fase | Equipo | Prioridad de contratación |
|------|--------|--------------------------|
| 5 clínicas (hoy) | 6 devs full-stack Node.js | No se necesita más — el equipo actual cubre todo. |
| 10-15 clínicas | 8-9 devs + 1 DevOps | **DevOps/SRE** para manejar infra, CI/CD, monitoring. Los 6 devs actuales no deberían operar infra y desarrollar producto al mismo tiempo. |
| 20-30 clínicas | 12-15 personas | **Tech lead por dominio** (EHR, plataforma, data). Sin liderazgo técnico por área, las decisiones de arquitectura se toman ad-hoc y la deuda técnica se acumula. |

### Resumen de prioridades por fase

```mermaid
gantt
    title Roadmap de escalabilidad — plataforma completa
    dateFormat YYYY-MM-DD
    axisFormat %Y-%m

    section Fase 1: 10 clinicas
    MongoDB read replicas              :2026-07-01, 30d
    Auto-scaling ECS Fargate           :2026-07-01, 30d
    API Gateway + WAF                  :2026-07-15, 30d
    Contratar DevOps/SRE               :2026-07-01, 60d
    CI/CD por servicio                 :2026-08-01, 30d

    section Fase 2: 15-20 clinicas
    MongoDB sharding por clinic_id     :2026-10-01, 45d
    Change Streams → SQS sync          :2026-10-01, 45d
    Redis cache (sesiones + métricas)  :2026-10-15, 30d
    Read replica Aurora (panel)        :2026-11-01, 15d
    2FA para admin/strategy            :2026-11-01, 30d
    Contratar tech leads por dominio   :2026-10-01, 60d

    section Fase 3: 25-30 clinicas
    Circuit breakers entre servicios   :2027-01-01, 30d
    Tracing distribuido (X-Ray)        :2027-01-15, 30d
    Data warehouse (Redshift/BQ)       :2027-02-01, 60d
    Multi-región (si aplica)           :2027-03-01, 60d
    Incident response runbook          :2027-01-01, 30d
```
