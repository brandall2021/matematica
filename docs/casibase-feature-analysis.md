# Análisis de Features: OpenAgent/Casibase → Matematica

**Proyecto analizado:** [the-open-agent/openagent](https://github.com/the-open-agent/openagent) (antes casibase/casibase)
**Fecha:** Julio 2026

---

## Features Existentes en OpenAgent que Matematica Podría Adoptar

### 1. 🤖 Multi-Model Provider Support (PRIORIDAD ALTA)

**Qué hace OpenAgent:**
- Soporta 30+ proveedores: OpenAI, Azure, Claude, Gemini, DeepSeek, Mistral, Grok, Qwen, Ollama, HuggingFace, etc.
- Permite cambiar de modelo por conversación sin cambiar código
- Configuración centralizada de API keys

**Qué tiene Matematica:**
- Solo soporta OpenAI y Ollama (hardcoded en configuración)

**Propuesta de mejora:**
- Crear un `ModelProviderService` abstracto con implementaciones por proveedor
- Agregar un selector de modelo en la UI del chat
- Configurar API keys por proveedor en settings
- Soportar: OpenAI, Claude, Gemini, DeepSeek, Ollama (local)

**Esfuerzo:** Medio-Alto | **Impacto:** Alto

---

### 2. 🔍 Web Search & Fetch (PRIORIDAD ALTA)

**Qué hace OpenAgent:**
- Busca en la web y trae contenido vivo al contexto del agente
- Permite al tutor encontrar información actualizada

**Qué tiene Matematica:**
- Solo busca en su base de conocimiento local (RAG estático)

**Propuesta de mejora:**
- Agregar capability de web search al tutor
- Cuando el RAG local no tiene respuesta, buscar en web
- Usar herramientas como Tavily, SerpAPI, o Brave Search
- Mostrar fuentes web junto a fuentes del material de cátedra

**Esfuerzo:** Medio | **Impacto:** Alto

---

### 3. 📊 Usage Analytics & Cost Tracking (PRIORIDAD MEDIA)

**Qué hace OpenAgent:**
- Dashboard con métricas de tokens consumidos por usuario, modelo, y aplicación
- Costos estimados por provider
- Heatmaps de actividad
- Logs de requests con payloads completos

**Qué tiene Matematica:**
- Stats básicas (documentos, sesiones, consultas diarias)
- Sin tracking de tokens ni costos

**Propuesta de mejora:**
- Tracking de tokens consumidos por conversación
- Estimación de costos por usuario/mes
- Dashboard de analytics con gráficas interactivas
- Export de datos de uso

**Esfuerzo:** Medio | **Impacto:** Medio

---

### 4. 🔄 Workflow Automation (PRIORIDAD MEDIA)

**Qué hace OpenAgent:**
- Constructor visual de workflows estilo BPMN
- Ejecución condicional y paralela
- Scheduling de tareas recurrentes

**Qué tiene Matematica:**
- Sin automatización de workflows

**Propuesta de mejora (simplificada):**
- **Generador de evaluaciones automático:** El docente configura tema, cantidad, nivel → el sistema genera el examen
- **Rutinas de estudio:** Scheduling de repasos espaciados (spaced repetition)
- **Notificaciones programadas:** Enviar recordatorios de estudio

**Esfuerzo:** Alto | **Impacto:** Medio

---

### 5. 🔐 Single Sign-On (SSO) (PRIORIDAD BAJA)

**Qué hace OpenAgent:**
- OIDC / OAuth2 / LDAP / SAML
- Login con GitHub, Google, WeChat, etc.

**Qué tiene Matematica:**
- JWT propio con registro manual

**Propuesta de mejora:**
- Agregar login con Google (OAuth2) para facilitar acceso de estudiantes
- Opcional: integrar con LDAP universitario

**Esfuerzo:** Medio | **Impacto:** Medio

---

### 6. 📝 Audit Logs (PRIORIDAD MEDIA)

**Qué hace OpenAgent:**
- Historial completo de cada acción
- Logs de conexiones remotas con duración
- Tracking de operaciones API

**Qué tiene Matematica:**
- Log básico de errores
- Sin audit trail de acciones de usuario

**Propuesta de mejora:**
- Log de acciones: login, chat, upload, reindex, settings change
- Vista de admin para revisar actividad
- Retención configurable (30 días, 90 días, etc.)

**Esfuerzo:** Bajo | **Impacto:** Medio

---

### 7. 💬 Embeddable Chat Widget (PRIORIDAD ALTA)

**Qué hace OpenAgent:**
- Widget de chat que se puede embeber en cualquier sitio web
- Un solo tag `<script>` para instalar
- Personalización de tema y colores

**Qué tiene Matematica:**
- Chat solo accesible dentro de la app

**Propuesta de mejora:**
- Crear un widget embebible para el tutor
- Los estudiantes podrían usar el tutor desde la página de la materia
- Configuración de tema (colores de la universidad)
- Autenticación por token

**Esfuerzo:** Medio | **Impacto:** Alto

---

### 8. 🧠 Pluggable Embeddings (PRIORIDAD BAJA)

**Qué hace OpenAgent:**
- Soporta múltiples proveedores de embeddings
- OpenAI, Azure, Gemini, Cohere, Jina, HuggingFace, modelos locales

**Qué tiene Matematica:**
- OpenAI y Ollama para embeddings

**Propuesta de mejora:**
- Ya tiene los dos más importantes (OpenAI + Ollama)
- Podría agregar Cohere o Jina como alternativas
- Prioridad baja porque la funcionalidad actual es suficiente

**Esfuerzo:** Bajo | **Impacto:** Bajo

---

### 9. 🏗️ Multi-tenancy (PRIORIDAD BAJA)

**Qué hace OpenAgent:**
- Workspaces aislados por usuario u organización
- Permisos granulares por tenant

**Qué tiene Matematica:**
- Roles (ADMIN, TEACHER, ASSISTANT, STUDENT)
- Sin aislamiento de datos por tenant

**Propuesta de mejora (futuro):**
- Si se usa en múltiples materias/carreras, cada una podría ser un "tenant"
- Documents, chat sessions, y settings aislados por materia

**Esfuerzo:** Alto | **Impacto:** Bajo (para MVP)

---

### 10. 🔧 MCP Integration (PRIORIDAD MEDIA)

**Qué hace OpenAgent:**
- Model Context Protocol para conectar herramientas externas
- Servidores MCP vía SSE, Stdio, o StreamableHTTP

**Qué tiene Matematica:**
- Sin integración con herramientas externas

**Propuesta de mejora:**
- MCP server para que el tutor pueda:
  - Consultar la base de datos de la universidad
  - Acceder a repositorios de ejercicios
  - Conectar con sistemas de evaluación (Moodle, etc.)

**Esfuerzo:** Alto | **Impacto:** Alto (a futuro)

---

## Resumen: Top 5 Features a Implementar

| # | Feature | Esfuerzo | Impacto | Descripción |
|---|---------|----------|---------|-------------|
| 1 | **Multi-Model Provider** | Medio-Alto | Alto | Claude, Gemini, DeepSeek además de OpenAI |
| 2 | **Web Search** | Medio | Alto | Tutor puede buscar en web cuando RAG no alcanza |
| 3 | **Chat Widget Embebible** | Medio | Alto | Widget para usar el tutor desde cualquier sitio |
| 4 | **Usage Analytics** | Medio | Medio | Tracking de tokens, costos, actividad |
| 5 | **Audit Logs** | Bajo | Medio | Historial de acciones para admin |

---

## Roadmap Sugerido

### Fase 1 (Corto plazo - 1-2 semanas)
- [ ] Multi-model provider (Claude, Gemini, DeepSeek)
- [ ] Audit logs básicos

### Fase 2 (Mediano plazo - 2-4 semanas)
- [ ] Web search para tutor
- [ ] Usage analytics dashboard

### Fase 3 (Largo plazo - 1-2 meses)
- [ ] Chat widget embebible
- [ ] MCP integration
- [ ] SSO con Google OAuth

---

## Referencias

- **OpenAgent:** https://github.com/the-open-agent/openagent
- **Documentación:** https://www.openagentai.org
- **Demo:** https://demo.openagentai.org
- **Casibase (legacy):** https://github.com/casibase/casibase
