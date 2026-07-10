# Task 1 Report: Fix ngx-markdown Dependency Conflict

## Problem

The project had `ngx-markdown@^19.0.0` as a dependency, which declares a peer dependency on `@angular/common@^19.0.0`. The project uses Angular 20 (`@angular/common@^20.0.0`), causing an `ERESOLVE` failure on `npm install`.

Additional peer dependency conflicts were also present:
- `typescript@~5.5.0` vs Angular 20 requiring `typescript@>=5.8 <6.0`
- `zone.js@~0.14.0` vs Angular 20 requiring `zone.js@~0.15.0`

## Investigation

After inspecting the codebase, **ngx-markdown was never actually used** in any component template or service:

- The only reference was `provideMarkdown()` in `src/app/app.config.ts` (the app-level provider config).
- No component imports `MarkdownModule`, `MarkdownService`, or uses the `<markdown>` component/directive.
- The chat component (`src/app/modules/chat/chat.component.ts`) renders content via a custom `renderContent()` method that only handles KaTeX math expressions (`$...$` and `$$...$$`) and outputs raw HTML via `[innerHTML]`.

Since ngx-markdown was an unused dependency, upgrading to v20 (which also requires adding `marked` as a new peer dependency) was unnecessary. The cleaner fix was to remove it entirely.

## Changes Made

### 1. `package.json` — removed ngx-markdown, fixed other peer deps

- **Removed** `"ngx-markdown": "^19.0.0"` from `dependencies`
- **Changed** `"typescript": "~5.5.0"` → `"~5.8.0"` (required by `@angular-devkit/build-angular@20`)
- **Changed** `"zone.js": "~0.14.0"` → `"~0.15.0"` (required by `@angular/core@20`)

### 2. `src/app/app.config.ts` — removed provideMarkdown

- **Removed** `import { provideMarkdown } from 'ngx-markdown';`
- **Removed** `provideMarkdown(),` from the providers array

**No component logic was changed.** The chat component's `renderContent()` method and all templates remain identical.

## Verification

### npm install — PASS
```
added 958 packages, and audited 959 packages in 38s
```
No peer dependency conflicts. `npm ls` shows zero errors or warnings about missing/invalid dependencies.

### npx ng build — PRE-EXISTING ERRORS (unrelated)

The build fails with two pre-existing errors that existed before this change:

1. **`TS2339: Property 'drawer' does not exist on type 'AppComponent'`** (`src/app/app.component.ts:21`)
   - The template references `drawer.toggle()` but the `#drawer` template ref variable is inside a `*ngIf` block and is not declared as a `@ViewChild` in the component class.

2. **`NG8103: *ngIf used without NgIf/CommonModule import`** (`src/app/modules/auth/login.component.ts:36`)
   - The `LoginComponent` uses `*ngIf` in its template but does not import `CommonModule` in its `@Component.imports`.

These are pre-existing bugs in the Angular component code, completely unrelated to the dependency resolution fix. The dependency conflict that was the subject of this task is now fully resolved.

## Final Dependency Versions (resolved)

| Package | Version |
|---------|---------|
| @angular/core | 20.3.26 |
| @angular/common | 20.3.26 |
| typescript | 5.8.3 |
| zone.js | 0.15.1 |
| katex | 0.16.47 |
