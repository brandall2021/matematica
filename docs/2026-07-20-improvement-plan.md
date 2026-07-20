# Matematica - Plan de Mejoras Integral

> **Para agentes:** Usa `subagent-driven-development` para implementar este plan tarea por tarea.

**Goal:** Elevar el proyecto matematica de un Angular Material template a una app con identidad distintiva, seguridad robusta, y UX pulida.

**Architecture:** Fixes de seguridad críticos primero → refactor de código → design system → animaciones → tests.

**Tech Stack:** Angular 20, Spring Boot 3.3, TypeScript 5.8, Java 21, PostgreSQL, Qdrant, KaTeX, Angular Material 20

## Global Constraints

- Angular 20 standalone components (sin NgModule)
- Java 21, Spring Boot 3.3
- TypeScript 5.8 strict mode
- Docker Compose para desarrollo
- Mantener compatibilidad con la API REST existente

---

## FASE 1: Seguridad Crítica (P0)

### Task 1: Eliminar secrets por defecto

**Files:**
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/java/com/matematica/config/ProdSecurityValidator.java`

**Problema:** `JWT_SECRET` y `DB_PASSWORD` tienen defaults conocidos. Si las env vars no están seteadas, la app arranca con credenciales débiles.

- [ ] **Step 1:** En `application.yml`, cambiar los defaults a valores que causen error explícito:
  ```yaml
  jwt:
    secret: ${JWT_SECRET:?ERROR: JWT_SECRET environment variable is required}
  ```
  ```yaml
  spring:
    datasource:
      password: ${DB_PASSWORD:?ERROR: DB_PASSWORD environment variable is required}
  ```

- [ ] **Step 2:** Verificar que la app no arranca sin las env vars (debe fallar con mensaje claro)

- [ ] **Step 3:** Commit: `fix(security): remove default JWT and DB credentials`

### Task 2: Rate limiting anti-spoofing

**Files:**
- Modify: `backend/src/main/java/com/matematica/config/RateLimitInterceptor.java`

**Problema:** `X-Forwarded-For` se confía sin validación. Un atacante puede falsificar IPs y evadir rate limiting.

- [ ] **Step 1:** En `getClientIp()`, solo confiar `X-Forwarded-For` si el request viene de un proxy conocido:
  ```java
  private String getClientIp(HttpServletRequest request) {
      String xff = request.getHeader("X-Forwarded-For");
      if (xff != null && isKnownProxy(request.getRemoteAddr())) {
          return xff.split(",")[0].trim();
      }
      return request.getRemoteAddr();
  }
  ```

- [ ] **Step 2:** Agregar limpieza periódica de buckets expirados para evitar memory leak

- [ ] **Step 3:** Commit: `fix(security): prevent IP spoofing in rate limiter`

### Task 3: Validación de refresh token

**Files:**
- Modify: `backend/src/main/java/com/matematica/auth/AuthService.java`

**Problema:** En `refresh()`, se extrae `userId` antes de validar el token. Un token tampered puede causar excepciones no manejadas.

- [ ] **Step 1:** Reordenar: validar antes de extraer:
  ```java
  public AuthResponse refresh(String refreshToken) {
      if (!jwtService.isTokenValid(refreshToken)) {
          throw new IllegalArgumentException("Invalid refresh token");
      }
      String userId = jwtService.extractUserId(refreshToken);
      // ... resto
  }
  ```

- [ ] **Step 2:** Commit: `fix(auth): validate refresh token before extracting claims`

### Task 4: Null role claim handling

**Files:**
- Modify: `backend/src/main/java/com/matematica/security/JwtAuthFilter.java`

**Problema:** Si el token no tiene claim `role`, se crea `ROLE_null` como authority.

- [ ] **Step 1:** Agregar null check:
  ```java
  String role = claims.get("role", String.class);
  if (role == null) {
      return; // Reject token without role
  }
  ```

- [ ] **Step 2:** Commit: `fix(security): reject tokens missing role claim`

---

## FASE 2: Bugs y Correctness (P0-P1)

### Task 5: System.gc() en batch loop

**Files:**
- Modify: `backend/src/main/java/com/matematica/indexer/service/IndexerService.java`

**Problema:** `System.gc()` dentro del loop de indexación fuerza GC pauses innecesarias. Con 1000 chunks = 20 pausas GC forzadas.

- [ ] **Step 1:** Eliminar ambas llamadas a `System.gc()` (líneas ~93, ~98)

- [ ] **Step 2:** Commit: `fix(perf): remove forced GC calls from indexer batch loop`

### Task 6: Double DB lookup en ChatService

**Files:**
- Modify: `backend/src/main/java/com/matematica/chat/service/ChatService.java`

**Problema:** `existsByIdAndUserId` + `findById` = 2 queries para la misma sesión.

- [ ] **Step 1:** Reemplazar con un solo query:
  ```java
  ChatSession session = sessionRepository.findByIdAndUserId(request.sessionId(), userId)
      .orElseThrow(() -> new IllegalArgumentException("Session not found"));
  ```

- [ ] **Step 2:** Commit: `fix(perf): single query for session lookup in ChatService`

### Task 7: Message counter race condition

**Files:**
- Modify: `backend/src/main/java/com/matematica/chat/service/ChatService.java`
- Modify: `backend/src/main/java/com/matematica/chat/repository/ChatSessionRepository.java`

**Problema:** `setMessageCount(count + 2)` no es atómico. Concurrent requests pueden perder incrementos.

- [ ] **Step 1:** Agregar query modificante en el repository:
  ```java
  @Modifying
  @Query("UPDATE ChatSession s SET s.messageCount = s.messageCount + :increment WHERE s.id = :id")
  void incrementMessageCount(@Param("id") String id, @Param("increment") int increment);
  ```

- [ ] **Step 2:** Usar en ChatService en vez de read-modify-write

- [ ] **Step 3:** Commit: `fix(concurrency): atomic message count increment`

### Task 8: Eliminar XMLHttpRequest síncrono

**Files:**
- Modify: `frontend/src/app/core/services/auth.service.ts`

**Problema:** `refreshTokenSync()` usa `XMLHttpRequest` con `async=false`. Deprecated en todos los browsers, bloquea el thread principal.

- [ ] **Step 1:** Reemplazar con una cola de requests pendientes:
  ```typescript
  private refreshInProgress = false;
  private pendingRequests: Array<() => void> = [];

  async refreshToken(): Promise<boolean> {
    if (this.refreshInProgress) {
      return new Promise(resolve => {
        this.pendingRequests.push(() => resolve(true));
      });
    }
    this.refreshInProgress = true;
    try {
      const response = await lastValueFrom(this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/refresh`, { refreshToken: this.refreshTokenValue() }));
      this.setSession(response);
      this.pendingRequests.forEach(cb => cb());
      this.pendingRequests = [];
      return true;
    } catch {
      this.logout();
      return false;
    } finally {
      this.refreshInProgress = false;
    }
  }
  ```

- [ ] **Step 2:** Commit: `fix(frontend): replace sync XMLHttpRequest with async refresh queue`

### Task 9: JSON.parse sin try/catch

**Files:**
- Modify: `frontend/src/app/core/services/auth.service.ts`

**Problema:** `loadFromStorage()` llama `JSON.parse(user)` sin try/catch. Si localStorage está corrupto, la app crashea al bootstrap.

- [ ] **Step 1:** Envolver en try/catch:
  ```typescript
  private loadFromStorage() {
    try {
      const user = localStorage.getItem('user');
      if (user) this.currentUser.set(JSON.parse(user));
    } catch {
      localStorage.removeItem('user');
    }
  }
  ```

- [ ] **Step 2:** Commit: `fix(frontend): handle corrupt localStorage gracefully`

---

## FASE 3: Architecture (P1)

### Task 10: Role-based route guard

**Files:**
- Create: `frontend/src/app/core/guards/role.guard.ts`
- Modify: `frontend/src/app/app.routes.ts`

**Problema:** Cualquier usuario autenticado puede acceder a `/admin` o `/dashboard` por URL directa.

- [ ] **Step 1:** Crear role guard:
  ```typescript
  export const roleGuard: CanActivateFn = (route) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const requiredRoles = route.data['roles'] as string[];
    const user = auth.currentUser();
    if (!user || !requiredRoles.includes(user.role)) {
      return router.createUrlTree(['/chat']);
    }
    return true;
  };
  ```

- [ ] **Step 2:** Aplicar en rutas protegidas:
  ```typescript
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN', 'TEACHER'] } },
  ```

- [ ] **Step 3:** Commit: `feat(security): add role-based route guard`

### Task 11: Typed ApiService

**Files:**
- Modify: `frontend/src/app/core/services/api.service.ts`

**Problema:** 8 de 14 métodos usan `any`. TypeScript no aporta valor sin tipos.

- [ ] **Step 1:** Definir interfaces:
  ```typescript
  export interface ChatSession { id: string; title: string; messageCount: number; createdAt: string; updatedAt: string; }
  export interface ChatMessage { id: string; role: 'USER' | 'ASSISTANT'; content: string; createdAt: string; }
  export interface DocumentItem { id: string; filename: string; subject: string; unit: string; topic: string; indexed: boolean; createdAt: string; }
  export interface HistoryItem { sessionId: string; title: string; lastMessage: string; updatedAt: string; }
  export interface AppSetting { key: string; value: string; description: string; }
  ```

- [ ] **Step 2:** Reemplazar `any` con tipos concretos en cada método

- [ ] **Step 3:** Commit: `refactor(frontend): add TypeScript interfaces to ApiService`

### Task 12: Descomponer MathComponent (God Component)

**Files:**
- Create: `frontend/src/app/modules/math/components/operation-selector.component.ts`
- Create: `frontend/src/app/modules/math/components/plot-renderer.component.ts`
- Create: `frontend/src/app/modules/math/components/math-result.component.ts`
- Modify: `frontend/src/app/modules/math/math.component.ts`

**Problema:** 593 líneas en un solo componente. Mezcla UI, lógica, SVG rendering, historial.

- [ ] **Step 1:** Extraer `OperationSelectorComponent` (categorías + acordeón de operaciones)

- [ ] **Step 2:** Extraer `PlotRendererComponent` (SVG plotting con computed signals)

- [ ] **Step 3:** Extraer `MathResultComponent` (resultado + KaTeX preview)

- [ ] **Step 4:** Refactorizar `MathComponent` para usar los sub-componentes

- [ ] **Step 5:** Commit: `refactor(frontend): decompose MathComponent into sub-components`

### Task 13: Delete document cleanup

**Files:**
- Modify: `backend/src/main/java/com/matematica/documents/service/DocumentService.java`

**Problema:** `deleteDocument` borra de DB pero deja embeddings huérfanos en Qdrant.

- [ ] **Step 1:** Agregar limpieza del vector store antes del delete:
  ```java
  vectorStore.delete(FilterExpressionBuilder.eq("documentId", id.toString()));
  documentRepository.deleteById(id);
  ```

- [ ] **Step 2:** Commit: `fix(data): clean up vector embeddings on document delete`

---

## FASE 4: Design System (P1)

### Task 14: Design tokens

**Files:**
- Create: `frontend/src/styles/_tokens.scss`
- Modify: `frontend/src/styles.scss`

- [ ] **Step 1:** Crear tokens SCSS con identidad matemática:
  ```scss
  :root {
    // Colors - Dark chalkboard theme
    --color-bg-primary: #1a1a2e;
    --color-bg-surface: #16213e;
    --color-bg-surface-raised: #1f2b47;
    --color-accent: #e2b714;
    --color-accent-hover: #f0c929;
    --color-text-primary: #e8e8e8;
    --color-text-secondary: #a0a0b0;
    --color-success: #4caf50;
    --color-error: #ef5350;
    --color-chat-user: #2a3f5f;
    --color-chat-assistant: #1f2b47;

    // Typography
    --font-display: 'Newsreader', 'Georgia', serif;
    --font-body: 'Inter', 'Roboto', sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

    // Spacing (8px grid)
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-12: 3rem;

    // Easing
    --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  }
  ```

- [ ] **Step 2:** Importar tokens en `styles.scss` y reemplazar valores hardcoded

- [ ] **Step 3:** Commit: `feat(design): add design tokens with math identity theme`

### Task 15: Botones con feedback táctil

**Files:**
- Modify: `frontend/src/styles.scss` (o `_tokens.scss`)

- [ ] **Step 1:** Agregar estilos globales de botón:
  ```scss
  button, .mat-mdc-button, .mat-mdc-icon-button {
    transition: transform 160ms var(--ease-out);
    &:active:not([disabled]) {
      transform: scale(0.97);
    }
  }
  ```

- [ ] **Step 2:** Commit: `feat(design): add tactile feedback to all buttons`

### Task 16: prefers-reduced-motion

**Files:**
- Modify: `frontend/src/styles.scss`

- [ ] **Step 1:** Agregar media query global:
  ```scss
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

- [ ] **Step 2:** Commit: `feat(a11y): respect prefers-reduced-motion`

### Task 17: Hover states con media query

**Files:**
- Modify: `frontend/src/styles.scss`

- [ ] **Step 1:** Agregar hover solo para dispositivos con pointer fino:
  ```scss
  @media (hover: hover) and (pointer: fine) {
    .mat-mdc-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .operations-grid button:hover {
      background: var(--color-bg-surface-raised);
    }
  }
  ```

- [ ] **Step 2:** Commit: `feat(design): gate hover states behind pointer media query`

---

## FASE 5: UX Copywriting (P1)

### Task 18: Error messages humanos

**Files:**
- Modify: `frontend/src/app/modules/auth/login/login.component.ts`
- Modify: `frontend/src/app/modules/auth/register/register.component.ts`
- Modify: `frontend/src/app/modules/chat/chat.component.ts`
- Modify: `frontend/src/app/modules/dashboard/dashboard.component.ts`
- Modify: `frontend/src/app/modules/admin/admin.component.ts`

- [ ] **Step 1:** Reemplazar errores genéricos:
  | Antes | Después |
  |---|---|
  | `'Credenciales invalidas'` | `'El email o la contraseña no son correctos. Verifica e intenta de nuevo.'` |
  | `'Error al registrarse'` | `'No pudimos crear tu cuenta. Verifica los datos e intenta de nuevo.'` |
  | `'Lo siento, ocurrio un error'` | `'No pude procesar tu pregunta. Intenta reformularla o pregunta algo diferente.'` |
  | `'Error al cargar estadisticas'` | `'No se pudieron cargar las estadísticas. Revisa tu conexión.'` |
  | `'Error al reindexar: ' + err` | `'Error al reindexar. Intenta de nuevo.'` |

- [ ] **Step 2:** Commit: `feat(ux): improve error message copywriting`

### Task 19: Empty states orientadores

**Files:**
- Modify: `frontend/src/app/modules/history/history.component.ts`
- Modify: `frontend/src/app/modules/documents/documents.component.ts`

- [ ] **Step 1:** Agregar empty states con CTA:
  - History: "Empieza una conversación con el tutor" + botón al chat
  - Documents: "Aún no hay documentos. Sube tu primer archivo para empezar."

- [ ] **Step 2:** Commit: `feat(ux): add helpful empty states with CTAs`

---

## FASE 6: Animaciones (P2)

### Task 20: Chat message animations

**Files:**
- Modify: `frontend/src/app/modules/chat/chat.component.ts`

- [ ] **Step 1:** Agregar animación de entrada a mensajes con `@starting-style`:
  ```scss
  .message {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 250ms var(--ease-out), transform 250ms var(--ease-out);

    @starting-style {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  ```

- [ ] **Step 2:** Commit: `feat(animation): add slide-in for new chat messages`

### Task 21: Dashboard stat counter animation

**Files:**
- Modify: `frontend/src/app/modules/dashboard/dashboard.component.ts`

- [ ] **Step 1:** Agregar number ticker animation para stats:
  ```typescript
  animateValue(element: HTMLElement, end: number) {
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      element.textContent = Math.floor(progress * end).toString();
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
  ```

- [ ] **Step 2:** Commit: `feat(animation): add counter animation to dashboard stats`

### Task 22: Stagger animations en listas

**Files:**
- Modify: `frontend/src/app/modules/math/math.component.ts` (history chips)
- Modify: `frontend/src/app/modules/dashboard/dashboard.component.ts` (stat cards)

- [ ] **Step 1:** Agregar stagger de 50ms entre items:
  ```scss
  .stagger-item {
    opacity: 0;
    animation: fadeIn 300ms var(--ease-out) forwards;
    @for $i from 1 through 10 {
      &:nth-child(#{$i}) {
        animation-delay: #{$i * 50}ms;
      }
    }
  }
  ```

- [ ] **Step 2:** Commit: `feat(animation): add stagger to list items`

---

## FASE 7: Tests (P2)

### Task 23: Backend auth tests

**Files:**
- Modify: `backend/src/test/java/com/matematica/auth/AuthControllerTest.java`

- [ ] **Step 1:** Migrar de `@SpringBootTest` a `@WebMvcTest(AuthController.class)` para velocidad

- [ ] **Step 2:** Agregar tests faltantes:
  - Duplicate email → 409
  - Missing required fields → 400
  - Password too short → 400
  - SQL injection in email → 400

- [ ] **Step 3:** Commit: `test(backend): expand auth controller test coverage`

### Task 24: Frontend smoke test

**Files:**
- Create: `frontend/src/app/app.component.spec.ts`
- Create: `frontend/src/app/core/services/auth.service.spec.ts`

- [ ] **Step 1:** Crear smoke test de app root:
  ```typescript
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
  ```

- [ ] **Step 2:** Crear test de AuthService con mock localStorage

- [ ] **Step 3:** Commit: `test(frontend): add smoke tests for app and auth service`

---

## Resumen de Prioridades

| Fase | Tasks | Impacto | Esfuerzo |
|------|-------|---------|----------|
| **1. Seguridad** | 1-4 | Crítico | Bajo |
| **2. Bugs** | 5-9 | Alto | Medio |
| **3. Architecture** | 10-13 | Alto | Medio-Alto |
| **4. Design System** | 14-17 | Medio | Medio |
| **5. UX Copy** | 18-19 | Medio | Bajo |
| **6. Animaciones** | 20-22 | Bajo | Bajo |
| **7. Tests** | 23-24 | Alto | Medio |

**Total: 24 tasks, ~15-20 horas de trabajo**
