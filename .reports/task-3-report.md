# Task 3 Report: Rewrite MathComponent

## Summary
Completely rewrote the Angular MathComponent to support 17 math operations across 6 categories, with KaTeX rendering, SVG chart visualization, dynamic input fields, and calculation history.

## Files Changed

### 1. `frontend/src/app/core/services/api.service.ts`
**What was done:**
- Added `xMin?: number` and `xMax?: number` optional fields to `MathRequest`
- Added `PlotRequest` interface with fields: `expression`, `variable?`, `xMin?`, `xMax?`
- Added `PlotResponse` interface with fields: `xValues: number[]`, `yValues: number[]`, `expression`, `latexExpression`
- Added `plotMath(req: PlotRequest)` method posting to `/api/math/plot`

### 2. `frontend/src/app/modules/math/math.component.ts`
**What was done:**
Complete rewrite from ~100 lines to ~535 lines. New features:

#### Category-based Operation Selector
- 6 categories with expandable `MatExpansionPanel` sections:
  - **Cálculo**: Derivar, Integrar, Límites, Series de Taylor
  - **Álgebra**: Simplificar, Factorizar, Expandir, Resolver ecuaciones, Raíces
  - **Álgebra Lineal**: Rango, Escalonamiento
  - **Números**: Sumatoria, Productoria, Suma Numérica, MCD, MCM
  - **EDO**: Resolver Ecuaciones Diferenciales
  - **Gráficas**: Graficar función

#### Dynamic Input Fields
- Standard operations: single expression input
- `limit`: expression + point input
- `summation`/`product`/`nsum`: expression + "start,end" point input
- `taylor`/`series`: expression + "point,order" point input
- `gcd`/`lcm`: expression + second number/variable input
- `plot`: expression + optional xMin, xMax inputs

#### KaTeX Rendering
- Real-time LaTeX preview of input expression above the input area
- Rendered input expression and result in the result card
- Rendered LaTeX expression from plot response
- Graceful fallback to plain text on render errors

#### SVG Plot Visualization
- Inline SVG chart (600x400 viewBox) with:
  - Background, grid lines (horizontal + vertical)
  - X and Y axes with tick labels
  - Function polyline rendered from plot API response
- Responsive: scales to container width via viewBox

#### Step-by-step Result Display
- Result card with success/error icon
- Shows: input expression (rendered), operation performed, and result (rendered)
- Error messages styled in red

#### History
- Stores last 10 calculations in a signal + `localStorage`
- Displays as clickable chips at the bottom
- Clicking a chip loads that operation and expression
- Deduplicates by operation + expression

## Architecture Decisions
- Used Angular signals throughout for reactive state management
- Used `@ViewChildren` + `QueryList.changes` to trigger KaTeX renders after DOM updates
- SVG plot computed via getter properties derived from `PlotResponse` data
- No external charting library — pure SVG for zero dependency overhead
- All UI text in Spanish per requirements

## Build Status
Build succeeds cleanly with `ng build`. Chunk size for math-component: 72.25 KB raw / 14.65 KB transferred.

## Constraints Followed
- No new npm dependencies (KaTeX already installed)
- Standalone component pattern maintained
- Angular Material components used consistently
- Colors: primary #3f51b5, accent #ff4081, warn #f44336 (via Material theming)
- Responsive layout: max-width 900px centered
