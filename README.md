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
| PostgreSQL | 16 | Base de datos relacional |
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

### Infraestructura (Docker)
| Servicio | Imagen | Proposito |
|----------|--------|-----------|
| PostgreSQL | 16-alpine | Base de datos |
| Qdrant | 1.12 | Base vectorial |
| Ollama | latest | Modelos locales (opcional) |

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

### Motor Matematico (Cculo Simbolico)
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

## Instalacion y Despliegue

### Requisitos
- Docker y Docker Compose
- Git
- (Opcional) Node.js 22 + Angular CLI para desarrollo frontend
- (Opcional) Java 21 + Maven para desarrollo backend

### Despliegue Rapido con Docker

```bash
# Clonar el repositorio
git clone https://github.com/brandall2021/matematica.git
cd matematica

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu API key de OpenAI

# Iniciar todos los servicios
docker compose up -d

# Ver logs
docker compose logs -f
```

### Comandos Utiles (Makefile)

```bash
make up              # Iniciar servicios
make down            # Detener servicios
make logs            # Ver logs de todos los servicios
make restart         # Reiniciar servicios
make psql            # Conectar a PostgreSQL
make backend-logs    # Logs solo del backend
make frontend-logs   # Logs solo del frontend
make ollama-up       # Iniciar con Ollama (modelos locales)
make ollama-pull     # Descargar modelos Ollama
make clean           # Limpiar todo (volumes + imagenes)
make status          # Ver estado de servicios
```

### Acceso a la Aplicacion

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost |
| API (Swagger) | http://localhost:8080/swagger-ui.html |
| API (OpenAPI) | http://localhost:8080/api/docs |
| Qdrant UI | http://localhost:6333/dashboard |
| Health Check | http://localhost:8080/actuator/health |

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

### Administracion
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

## Variables de Entorno

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `DB_NAME` | Nombre de la base de datos | `matematica` |
| `DB_USER` | Usuario de BD | `matematica` |
| `DB_PASSWORD` | Contrasena de BD | `matematica` |
| `JWT_SECRET` | Secreto para firmar JWT (base64) | *(requerido)* |
| `OPENAI_API_KEY` | API key de OpenAI | *(requerido)* |
| `EMBEDDING_TYPE` | Proveedor de embeddings: `openai`, `ollama` | `openai` |
| `OLLAMA_URL` | URL de Ollama | `http://ollama:11434` |
| `SPRING_PROFILES_ACTIVE` | Perfil de Spring: `dev`, `prod`, `test` | `prod` |

---

## Despliegue en Dokploy

Dokploy es una plataforma open-source de despliegue auto-hospedada. Sigue estos pasos para desplegar Matematica en Dokploy.

### Prerequisitos en Dokploy
- Dokploy instalado y funcionando
- Docker disponible en el servidor
- Dominio configurado (opcional pero recomendado)

### Paso 1: Configurar la Base de Datos

En Dokploy ve a **Databases** y crea dos servicios:

1. **PostgreSQL**
   - Nombre: `matematica-postgres`
   - Puerto interno: `5432`
   - Base de datos: `matematica`
   - Usuario: `matematica`
   - Contrasena: *(generar una segura)*
   - Guarda las credenciales para usarlas despues.

2. **Qdrant** (Vector Database)
   - Nombre: `matematica-qdrant`
   - Imagen: `qdrant/qdrant:v1.12.0`
   - Puerto: `6333` (HTTP) y `6334` (gRPC)

### Paso 2: Crear el Servicio Backend

En Dokploy ve a **Docker Compose** y crea un nuevo proyecto:

**Proyecto**: `matematica`

Crea el archivo `docker-compose.yml`:

```yaml
services:
  backend:
    image: brandall2021/matematica-backend:latest
    container_name: matematica-backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_URL: jdbc:postgresql://postgres:5432/matematica
      DB_USERNAME: matematica
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      EMBEDDING_TYPE: openai
      QDRANT_HOST: qdrant
      QDRANT_PORT: 6334
      SERVER_PORT: 8080
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    networks:
      - matematica-net

  frontend:
    image: brandall2021/matematica-frontend:latest
    container_name: matematica-frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - matematica-net

networks:
  matematica-net:
    name: matematica-network
    driver: bridge
```

### Paso 3: Configurar Variables de Entorno

En el servicio Backend de Dokploy, configura estas variables de entorno:

```
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://matematica-postgres:5432/matematica
DB_USERNAME=matematica
DB_PASSWORD=<tu-password-de-postgres>
JWT_SECRET=<generar-con-openssl-rand-base64-64>
OPENAI_API_KEY=sk-tu-api-key-aqui
EMBEDDING_TYPE=openai
QDRANT_HOST=matematica-qdrant
QDRANT_PORT=6334
```

### Paso 4: Configurar Dominios (Opcional)

En cada servicio de Dokploy, configura los dominios:

| Servicio | Dominio | Puerto |
|----------|---------|--------|
| Frontend | `matematica.tudominio.com` | 80 (nginx) |
| Backend | `api.tudominio.com` | 8080 |

### Paso 5: Actualizar CORS del Backend

Si usas dominios personalizados, actualiza la variable de entorno:

```
APP_CORS_ALLOWED_ORIGINS=https://matematica.tudominio.com
```

### Paso 6: Build y Despliegue

Si quieres hacer build desde el codigo fuente en Dokploy:

1. **Backend**: Configura el servicio como "Build" con:
   - Build Context: `backend/`
   - Dockerfile: `Dockerfile`

2. **Frontend**: Configura el servicio como "Build" con:
   - Build Context: `frontend/`
   - Dockerfile: `Dockerfile`

O usa las imagenes pre-compiladas de Docker Hub.

### Paso 7: Migraciones de Base de Datos

Las migraciones de Flyway se ejecutan automaticamente al iniciar el backend. La primera vez creara todas las tablas y datos iniciales.

### Paso 8: Verificar

1. Verifica que el backend responda: `https://api.tudominio.com/actuator/health`
2. Verifica que el frontend cargue: `https://matematica.tudominio.com`
3. Registra un usuario nuevo desde el frontend
4. Sube un documento de prueba
5. Haz una pregunta al tutor

### Configuracion SSL/HTTPS

Dokploy soporta certificados SSL automaticos con Let's Encrypt. En la configuracion de dominio de cada servicio, habilita "HTTPS" y Dokploy gestionara el certificado automaticamente.

### Backup de Base de Datos

Para backup programado de PostgreSQL en Dokploy:

```bash
# Backup manual
docker exec matematica-postgres pg_dump -U matematica matematica > backup.sql

# Restaurar
cat backup.sql | docker exec -i matematica-postgres psql -U matematica -d matematica
```

---

## Seguridad

- Autenticacion mediante **JWT** con refresh tokens
- **Roles y permisos** granulares
- **BCrypt** para hash de contrasenas
- **Auditoria** de eventos del sistema
- **CORS** configurable
- **Validacion** de entrada en todos los endpoints
- **Manejo centralizado** de errores con Problem Detail

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

---

## Estructura del Proyecto

```
matematica/
+-- backend/
|   +-- src/main/java/com/matematica/
|   |   +-- auth/          # Autenticacion (JWT, registro, login)
|   |   +-- chat/          # Chat con sesiones y mensajes
|   |   +-- config/        # Excepciones globales
|   |   +-- documents/     # Gestion documental (upload, parser)
|   |   +-- history/       # Historial de consultas
|   |   +-- indexer/       # Indexador de documentos a vectores
|   |   +-- math/          # Motor matematico (21 operaciones + plot)
|   |   +-- rag/           # RAG semantico (busqueda + LLM)
|   |   +-- security/      # JWT filter, SecurityConfig
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
|   |   |   +-- chat/      # Chat con tutor (KaTeX, sesiones)
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
