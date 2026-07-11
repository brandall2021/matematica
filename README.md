# Matematica

**Tutor Inteligente de Matematica basado en IA con RAG Semantico**

Plataforma web que funciona como un tutor virtual para estudiantes de matematica universitaria. El sistema no solo responde preguntas: ensena, explica conceptos, resuelve ejercicios paso a paso, genera nuevos ejercicios y utiliza como base de conocimiento todo el material de la catedra mediante un sistema RAG semantico de ultima generacion.

---

## Arquitectura

```
+-----------------------------------------------------------+
|                    Frontend Angular 20                     |
|            (Angular Material + KaTeX + SVG Plots)          |
+----------------------------+------------------------------+
                             | HTTP/REST (JWT Auth)
+----------------------------v------------------------------+
|                 Backend Spring Boot 3.3                   |
|  +----------+ +---------+ +--------+ +----------------+  |
|  |   Auth   | |  Chat   | |  RAG   | | Math Engine    |  |
|  | JWT/JWT  | | Sessions| | Vector | | 21 Operations  |  |
|  +----------+ +---------+ +--------+ +----------------+  |
|  |Documents | |Indexer  | |History | |  Settings      |  |
|  |  Tika    | | Qdrant  | | Chats  | |  Admin Stats   |  |
|  +----------+ +---------+ +--------+ +----------------+  |
+-------+--------------------------+-----------------------+
        |                          |
+-------v----------+      +--------v-----------+
|    PostgreSQL    |      |      Qdrant        |
|   (Metadatos)    |      |    (Vectores)      |
+------------------+      +--------------------+
```

## Stack Tecnologico

### Backend
| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| Java | 21 | Lenguaje principal |
| Spring Boot | 3.3 | Framework web |
| Spring Security | 3.3 | Autenticacion y autorizacion |
| Spring AI | 1.0.0-M2 | Integracion con modelos de IA |
| JPA / Hibernate | - | ORM y persistencia |
| PostgreSQL | 16+ | Base de datos relacional |
| Qdrant | 1.12 | Base de datos vectorial |
| Apache Tika | 2.9 | Extraccion de texto de documentos |
| Apache POI | 5.3 | Procesamiento DOCX/PPTX |
| JWT (jjwt) | 0.12 | Tokens de autenticacion |
| MapStruct | 1.6 | Mapeo DTO/Entidad |
| OpenAPI/Swagger | 2.6 | Documentacion de API |
| Flyway | - | Migraciones de BD |
| Symja (MathEclipse) | 3.0 | Motor de calculo simbolico |

### Frontend
| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| Angular | 20 | Framework frontend |
| Angular Material | 20 | Componentes UI |
| KaTeX | 0.16 | Renderizado de formulas matematicas |
| TypeScript | 5.8 | Lenguaje principal |
| RxJS | 7.8 | Programacion reactiva |
| DOMPurify | - | Sanitizacion de HTML (XSS) |

### Infraestructura (Docker)
| Servicio | Imagen | Proposito |
|----------|--------|-----------|
| Qdrant | 1.12 | Base vectorial |
| Ollama | latest | Modelos locales (opcional) |
| PostgreSQL | externo | Base de datos relacional |

---

## Modulos del Sistema

### Autenticacion
- Registro e inicio de sesion con JWT
- Refresh tokens
- Roles: `ADMIN`, `TEACHER`, `ASSISTANT`, `STUDENT`
- Proteccion de rutas por rol

### Administracion
- Panel de administracion
- Estadisticas del sistema (documentos, sesiones, consultas diarias, tokens estimados)
- Reindexacion de documentos
- Gestion de usuarios

### Gestion Documental
Soporta los siguientes formatos:
- **PDF** -> Extraccion con Apache Tika
- **DOCX** -> Procesamiento con Apache POI
- **PPTX** -> Procesamiento con Apache POI
- **TXT** -> Texto plano
- **Markdown** -> Texto plano
- **YouTube** -> Transcripcion automatica

### Indexador
Pipeline automatico de indexacion:

```
Documento -> Extraer texto -> Limpiar -> Chunking inteligente -> Embeddings -> Qdrant
```

Cada chunk almacena metadatos: autor, titulo, materia, unidad, tema, pagina, tipo, URL, timestamp.

### Motor RAG (Retrieval-Augmented Generation)

- **Busqueda hibrida**: semantica + keywords
- **Reranking** de resultados
- **Citacion obligatoria** de fuentes:
  - "Apunte Unidad 3, Pagina 18"
  - "Video Clase 5, Minuto 12:35"
- Umbral de similitud configurable
- Top-K configurable

### Chat IA
El tutor puede:
- Explicar conceptos paso a paso
- Resolver ejercicios detalladamente
- Dar multiples formas de explicacion
- Generar ejemplos y contraejemplos
- Generar ejercicios nuevos (faciles, medios, dificiles)
- Adaptar la explicacion al nivel del alumno
- **Nunca inventa informacion** -- si no hay contexto suficiente, lo indica

### Motor Matematico (Calculo Simbolico)
Operaciones soportadas (21 total):

| Categoria | Operacion | Parametros |
|-----------|-----------|------------|
| **Calculo** | `derive` | expression, variable |
| | `integrate` | expression, variable |
| | `limit` | expression, variable, point |
| | `taylor` / `series` | expression, variable, "point,order" |
| **Algebra** | `simplify` | expression |
| | `factor` | expression |
| | `expand` | expression |
| | `solve` | expression, variable |
| | `roots` | expression, variable |
| **Algebra Lineal** | `matrix-determinant` | expression |
| | `matrix-inverse` | expression |
| | `matrix-rank` | expression |
| | `matrix-echelon` | expression |
| **Numeros** | `summation` / `sum` | expression, variable, "start,end" |
| | `product` / `prod` | expression, variable, "start,end" |
| | `nsum` / `numerical-sum` | expression, variable, "start,end" |
| | `gcd` | expression (a), variable (b) |
| | `lcm` | expression (a), variable (b) |
| **EDO** | `dsolve` | expression (ecuacion), variable |
| **Graficas** | `plot` | expression, variable, xMin, xMax |
| **General** | `evaluate` | expression |

**Graficador SVG**: El endpoint `POST /api/math/plot` genera 200 puntos de la funcion y retorna arrays x/y para renderizado inline.

**Regla**: El LLM explica, el motor matematico calcula. Nunca al revés.

### Historial y Aprendizaje Personalizado
- Guarda todas las preguntas y respuestas
- Documentos consultados por sesion
- Deteccion automatica de:
  - Fortalezas
  - Debilidades
  - Errores repetitivos
- Recomendaciones de estudio:
  - Que ejercicios resolver
  - Que videos mirar
  - Que apuntes leer

### Generador de Evaluaciones
El docente puede configurar:
- Tema
- Cantidad de ejercicios
- Nivel (facil, medio, dificil)
- Tiempo limite
- Tipo (parcial, practico, quiz)
- Con o sin soluciones
- Con o sin pistas

---

## Seguridad

- Autenticacion mediante **JWT** con refresh tokens
- **Roles y permisos** granulares
- **BCrypt** para hash de contrasenas
- **Rate Limiting**: 30 req/min general, 10 req/min chat/RAG
- **XSS Protection**: Sanitizacion con DOMPurify en el frontend
- **IDOR Protection**: Validacion de pertenencia de sesiones en el backend
- **Code Injection Protection**: Validacion regex en el motor matematico
- **CORS** configurable por variable de entorno
- **Auditoria** de eventos del sistema
- **Validacion** de entrada en todos los endpoints
- **Manejo centralizado** de errores con Problem Detail
- **JWT Secret validation** en perfil prod (rechaza secrets por defecto)

---

## Variables de Entorno

### Backend

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `DB_URL` | URL JDBC de PostgreSQL | `jdbc:postgresql://localhost:5432/matematica` |
| `DB_USERNAME` | Usuario de BD | `matematica` |
| `DB_PASSWORD` | Contrasena de BD | `matematica` |
| `JWT_SECRET` | Secreto para firmar JWT (base64, min 32 bytes) | *(requerido en prod)* |
| `OPENAI_API_KEY` | API key de OpenAI | *(requerido)* |
| `EMBEDDING_TYPE` | Proveedor de embeddings: `openai`, `ollama` | `openai` |
| `OLLAMA_URL` | URL de Ollama | `http://ollama:11434` |
| `QDRANT_HOST` | Host de Qdrant | `localhost` |
| `QDRANT_PORT` | Puerto gRPC de Qdrant | `6334` |
| `SPRING_PROFILES_ACTIVE` | Perfil de Spring: `dev`, `prod`, `test` | `prod` |
| `CORS_ALLOWED_ORIGINS` | Origenes permitidos (separados por coma) | `http://localhost:4200` |

### Frontend

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `apiUrl` | URL base de la API | `/api` (Docker) / `http://localhost:8080/api` (dev) |

---

## Instalacion y Despliegue

### Requisitos
- Docker y Docker Compose
- Git
- PostgreSQL externo (Docker, RDS, Supabase, Neon, etc.)
- (Opcional) Node.js 22 + Angular CLI para desarrollo frontend
- (Opcional) Java 21 + Maven para desarrollo backend

### Despliegue Rapido con Docker

```bash
# Clonar el repositorio
git clone https://github.com/brandall2021/matematica.git
cd matematica

# Configurar variables de entorno en docker-compose.yml
# (ajustar DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET, OPENAI_API_KEY)

# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f
```

### Servicios Docker

El `docker-compose.yml` incluye:
- **backend**: Spring Boot (puerto 8080)
- **frontend**: Angular + nginx (puerto 8008)
- **qdrant**: Base vectorial (puertos 6333/6334)
- **ollama**: Modelos locales (perfil opcional, puerto 11434)

> **Nota**: PostgreSQL debe estar en un servidor externo. Configurar `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` en el compose.

### Desarrollo Local

#### Backend
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Frontend
```bash
cd frontend
npm install
ng serve
```

---

## API REST

### Autenticacion
```
POST /api/auth/register   -> Registro de usuario
POST /api/auth/login      -> Inicio de sesion
POST /api/auth/refresh    -> Renovar token
```

### Chat y RAG
```
POST /api/chat/message              -> Enviar mensaje al tutor
GET  /api/chat/sessions             -> Listar sesiones
GET  /api/chat/sessions/{id}/messages -> Mensajes de una sesion
POST /api/rag/query                 -> Consulta RAG directa
```

### Documentos
```
POST   /api/documents/upload   -> Subir archivo (PDF, DOCX, PPTX, TXT, MD)
POST   /api/documents/youtube  -> Agregar video de YouTube
GET    /api/documents          -> Listar documentos
GET    /api/documents/{id}     -> Obtener documento
DELETE /api/documents/{id}     -> Eliminar documento
```

### Motor Matematico
```
POST /api/math/evaluate -> Evaluar expresion matematica
POST /api/math/plot     -> Generar datos de grafico
```

### Administracion (requiere rol ADMIN)
```
GET  /api/stats/admin    -> Estadisticas del sistema
POST /api/indexer/reindex -> Reindexar todos los documentos
```

### Configuracion
```
GET    /api/settings       -> Listar configuracion
GET    /api/settings/{key} -> Obtener configuracion por clave
PUT    /api/settings/{key} -> Actualizar configuracion
```

### Historial
```
GET /api/history -> Historial de consultas del usuario
```

---

## Despliegue en Dokploy

### Paso 1: Base de Datos Externa

Configura un PostgreSQL externo (Docker en otra red, RDS, Supabase, Neon, etc.) y obtiene la connection string.

### Paso 2: Crear Servicio Docker Compose en Dokploy

1. Ve a **Docker Compose** → Nuevo proyecto
2. Conecta el repositorio: `https://github.com/brandall2021/matematica.git`
3. Selecciona el archivo `docker-compose.yml`

### Paso 3: Variables de Entorno en Dokploy

En el servicio Backend, configura:

```
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host-externo>:5432/matematica
DB_USERNAME=<usuario>
DB_PASSWORD=<password>
JWT_SECRET=<generar-con-openssl-rand-base64-64>
OPENAI_API_KEY=sk-...
EMBEDDING_TYPE=openai
QDRANT_HOST=matematica-qdrant
QDRANT_PORT=6334
CORS_ALLOWED_ORIGINS=https://tu-dominio.com,http://ip-servidor:8008
```

### Paso 4: Configurar Dominio

En Dokploy → tu servicio → **Domains**:
- Agrega dominio (ej: `matematica.tudominio.com`)
- Puerto: `8008`
- Protocolo: HTTPS

### Paso 5: Verificar

1. Backend: `https://tu-dominio.com/actuator/health`
2. Frontend: `https://tu-dominio.com`
3. Registrar usuario y probar el tutor

---

## Estructura del Proyecto

```
matematica/
+-- backend/
|   +-- src/main/java/com/matematica/
|   |   +-- auth/          # Autenticacion (JWT, registro, login)
|   |   +-- chat/          # Chat con sesiones y mensajes
|   |   +-- config/        # Rate limiting, validacion prod, excepciones
|   |   +-- documents/     # Gestion documental (upload, parser)
|   |   +-- history/       # Historial de consultas
|   |   +-- indexer/       # Indexador de documentos a vectores
|   |   +-- math/          # Motor matematico (21 operaciones + plot)
|   |   +-- rag/           # RAG semantico (busqueda + LLM)
|   |   +-- security/      # JWT filter, SecurityConfig, IDOR protection
|   |   +-- settings/      # Configuracion del sistema
|   |   +-- stats/         # Estadisticas del admin
|   +-- src/main/resources/
|   |   +-- application.yml
|   |   +-- db/migration/  # Flyway migrations
|   +-- pom.xml
|   +-- Dockerfile
+-- frontend/
|   +-- src/app/
|   |   +-- core/          # Guards, interceptors, services
|   |   +-- modules/
|   |   |   +-- auth/      # Login, Register
|   |   |   +-- chat/      # Chat con tutor (KaTeX, sesiones, DOMPurify)
|   |   |   +-- math/      # Motor matematico (21 ops, SVG plots)
|   |   |   +-- documents/ # Gestion documental
|   |   |   +-- history/   # Historial de consultas
|   |   |   +-- dashboard/ # Dashboard admin
|   |   |   +-- admin/     # Panel administracion
|   |   |   +-- settings/  # Configuracion
|   +-- angular.json
|   +-- package.json
|   +-- Dockerfile
|   +-- nginx.conf
+-- docker-compose.yml
+-- Makefile
+-- .env.example
```

---

## Calidad del Codigo

- Arquitectura por capas (Controller -> Service -> Repository)
- Inyeccion de dependencias
- DTOs para desacoplar API de persistencia
- Mapeo con MapStruct
- Logs estructurados con SLF4J
- Manejo centralizado de excepciones
- Documentacion OpenAPI/Swagger
- Migraciones de base de datos con Flyway
- Angular signals para estado reactivo
- Componentes standalone (sin NgModule)
- Lazy loading de rutas
- Interceptors HTTP para auth y errores
- Sanitizacion XSS con DOMPurify
- Rate limiting configurable

---

## Licencia

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
