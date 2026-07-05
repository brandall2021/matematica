# Matematica

**Tutor Inteligente de Matemática basado en IA con RAG Semántico**

Plataforma web que funciona como un tutor virtual para estudiantes de matemática universitaria. El sistema no solo responde preguntas: enseña, explica conceptos, resuelve ejercicios paso a paso, genera nuevos ejercicios y utiliza como base de conocimiento todo el material de la cátedra mediante un sistema RAG semántico de última generación.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Angular 20                   │
│              (Angular Material + KaTeX + Markdown)       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST (JWT Auth)
┌──────────────────────▼──────────────────────────────────┐
│                 Backend Spring Boot 3                    │
│  ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────────┐  │
│  │   Auth   │ │  Chat   │ │  RAG   │ │ Math Engine  │  │
│  ├──────────┤ ├─────────┤ ├────────┤ ├──────────────┤  │
│  │Documents │ │Indexer  │ │History │ │  Settings    │  │
│  └──────────┘ └─────────┘ └────────┘ └──────────────┘  │
└──────┬──────────────────────┬──────────────────────────┘
       │                      │
┌──────▼──────┐      ┌───────▼────────┐
│  PostgreSQL  │      │    Qdrant     │
│  (Metadatos) │      │ (Vectores)    │
└──────────────┘      └────────────────┘
```

## Stack Tecnológico

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Java | 21 | Lenguaje principal |
| Spring Boot | 3.3 | Framework web |
| Spring Security | 3.3 | Autenticación y autorización |
| Spring AI | 1.0.0-M2 | Integración con modelos de IA |
| JPA / Hibernate | - | ORM y persistencia |
| PostgreSQL | 16 | Base de datos relacional |
| Qdrant | 1.12 | Base de datos vectorial |
| Apache Tika | 2.9 | Extracción de texto de documentos |
| JWT (jjwt) | 0.12 | Tokens de autenticación |
| MapStruct | 1.6 | Mapeo DTO/Entidad |
| OpenAPI/Swagger | 2.6 | Documentación de API |
| Flyway | - | Migraciones de BD |
| Symja (MathEclipse) | 3.0 | Motor de cálculo simbólico |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Angular | 20 | Framework frontend |
| Angular Material | 20 | Componentes UI |
| KaTeX | 0.16 | Renderizado de fórmulas matemáticas |
| ngx-markdown | 19 | Renderizado de Markdown |
| TypeScript | 5.5 | Lenguaje principal |

### Infraestructura (Docker)
| Servicio | Imagen | Propósito |
|----------|--------|-----------|
| PostgreSQL | 16-alpine | Base de datos |
| Qdrant | 1.12 | Base vectorial |
| Ollama | latest | Modelos locales (opcional) |

---

## Módulos del Sistema

### Autenticación
- Registro e inicio de sesión con JWT
- Refresh tokens
- Roles: `ADMIN`, `TEACHER`, `ASSISTANT`, `STUDENT`
- Protección de rutas por rol

### Administración
- Panel de administración
- Estadísticas del sistema
- Reindexación de documentos
- Gestión de usuarios

### Gestión Documental
Soporta los siguientes formatos:
- **PDF** → Extracción con Apache Tika
- **DOCX** → Procesamiento con Apache POI
- **PPTX** → Procesamiento con Apache POI
- **TXT** → Texto plano
- **Markdown** → Texto plano
- **YouTube** → Transcripción automática

### Indexador
Pipeline automático de indexación:

```
Documento → Extraer texto → Limpiar → Chunking inteligente → Embeddings → Qdrant
```

Cada chunk almacena metadatos: autor, título, materia, unidad, tema, página, tipo, URL, timestamp.

### Motor RAG (Retrieval-Augmented Generation)

- **Búsqueda híbrida**: semántica + keywords
- **Reranking** de resultados
- **Citación obligatoria** de fuentes:
  - "Apunte Unidad 3, Página 18"
  - "Video Clase 5, Minuto 12:35"
- Umbral de similitud configurable
- Top-K configurable

### Chat IA
El tutor puede:
- Explicar conceptos paso a paso
- Resolver ejercicios detalladamente
- Dar múltiples formas de explicación
- Generar ejemplos y contraejemplos
- Generar ejercicios nuevos (fáciles, medios, difíciles)
- Adaptar la explicación al nivel del alumno
- **Nunca inventa información** — si no hay contexto suficiente, lo indica

### Motor Matemático (Cálculo Simbólico)
Operaciones soportadas:
- Derivadas
- Integrales
- Límites
- Simplificación algebraica
- Factorización
- Resolución de ecuaciones
- Determinantes de matrices
- Inversas de matrices

**Regla**: El LLM explica, el motor matemático calcula. Nunca al revés.

### Historial y Aprendizaje Personalizado
- Guarda todas las preguntas y respuestas
- Documentos consultados por sesión
- Detección automática de:
  - Fortalezas
  - Debilidades
  - Errores repetitivos
- Recomendaciones de estudio:
  - Qué ejercicios resolver
  - Qué videos mirar
  - Qué apuntes leer

### Generador de Evaluaciones
El docente puede configurar:
- Tema
- Cantidad de ejercicios
- Nivel (fácil, medio, difícil)
- Tiempo límite
- Tipo (parcial, práctico, quiz)
- Con o sin soluciones
- Con o sin pistas

---

## Instalación y Despliegue

### Requisitos
- Docker y Docker Compose
- Git
- (Opcional) Node.js 22 + Angular CLI para desarrollo frontend
- (Opcional) Java 21 + Maven para desarrollo backend

### Despliegue Rápido con Docker

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

### Comandos Útiles (Makefile)

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
```

### Acceso a la Aplicación

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
npm install --legacy-peer-deps
ng serve
```

---

## API REST

### Autenticación
```
POST /api/auth/register   → Registro de usuario
POST /api/auth/login      → Inicio de sesión
POST /api/auth/refresh    → Renovar token
```

### Chat y RAG
```
POST /api/chat/message        → Enviar mensaje al tutor
GET  /api/chat/sessions       → Listar sesiones
GET  /api/chat/sessions/{id}/messages → Mensajes de una sesión
POST /api/rag/query           → Consulta RAG directa
```

### Documentos
```
POST   /api/documents/upload   → Subir archivo (PDF, DOCX, PPTX, TXT, MD)
POST   /api/documents/youtube  → Agregar video de YouTube
GET    /api/documents          → Listar documentos
GET    /api/documents/{id}     → Obtener documento
DELETE /api/documents/{id}     → Eliminar documento
```

### Motor Matemático
```
POST /api/math/evaluate  → Evaluar expresión matemática
```

### Operaciones Matemáticas
| Parámetro `operation` | Descripción |
|----------------------|-------------|
| `derive` | Derivar expresión |
| `integrate` | Integrar expresión |
| `limit` | Calcular límite |
| `simplify` | Simplificar expresión |
| `factor` | Factorizar expresión |
| `solve` | Resolver ecuación |
| `matrix-determinant` | Calcular determinante |
| `matrix-inverse` | Calcular inversa |

### Administración
```
GET  /api/stats/admin   → Estadísticas del sistema
POST /api/indexer/reindex → Reindexar todos los documentos
```

### Configuración
```
GET  /api/settings      → Listar configuración
GET  /api/settings/{key} → Obtener configuración por clave
PUT  /api/settings/{key} → Actualizar configuración
```

---

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_NAME` | Nombre de la base de datos | `matematica` |
| `DB_USER` | Usuario de BD | `matematica` |
| `DB_PASSWORD` | Contraseña de BD | `matematica` |
| `JWT_SECRET` | Secreto para firmar JWT | *(requerido)* |
| `OPENAI_API_KEY` | API key de OpenAI | *(requerido)* |
| `EMBEDDING_TYPE` | Proveedor de embeddings | `openai` |
| `OLLAMA_URL` | URL de Ollama | `http://ollama:11434` |
| `SPRING_PROFILES_ACTIVE` | Perfil de Spring | `prod` |

---

## Seguridad

- Autenticación mediante **JWT** con refresh tokens
- **Roles y permisos** granulares
- **BCrypt** para hash de contraseñas
- **Auditoría** de eventos del sistema
- **CORS** configurable
- **Validación** de entrada en todos los endpoints
- **Manejo centralizado** de errores con Problem Detail

---

## Calidad del Código

- Arquitectura por capas (Controller → Service → Repository)
- Inyección de dependencias
- DTOs para desacoplar API de persistencia
- Mapeo con MapStruct
- Logs estructurados con SLF4J
- Manejo centralizado de excepciones
- Documentación OpenAPI/Swagger
- Migraciones de base de datos con Flyway

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
