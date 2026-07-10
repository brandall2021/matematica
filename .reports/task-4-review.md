# Task 4 - Backend Static Code Review

## Summary

**1 compilation error found**, 1 design concern.

---

## Compilation Error

### MathService.java:65 — `IExpr.evalDouble()` does not exist

```java
yValues[i] = result.isNumber() ? result.re().evalDouble() : Double.NaN;
```

The method `evalDouble()` does **not** exist on `org.matheclipse.core.interfaces.IExpr` in matheclipse-core 3.0.0. This will fail compilation.

**Evidence:** The ExprEvaluator source code in the same library uses the pattern:
```java
if (temp.isSignedNumber()) {
    return ((ISignedNumber) temp).doubleValue();
}
```

On `IExpr`:
- `isNumber()` exists → boolean
- `re()` exists → returns `IExpr`
- `doubleValue()` does **not** exist on `IExpr` — only on `ISignedNumber`
- `evalDouble()` does **not** exist anywhere on `IExpr`

**Recommended fix** — import `org.matheclipse.core.interfaces.ISignedNumber` and change line 64–65 to:

```java
import org.matheclipse.core.interfaces.ISignedNumber;
...
if (result instanceof ISignedNumber signedNum) {
    yValues[i] = signedNum.doubleValue();
} else {
    yValues[i] = Double.NaN;
}
```

Or, if the `re()` call is intended to extract the real part of complex results:

```java
IExpr realPart = result.re();
if (realPart instanceof ISignedNumber signedNum) {
    yValues[i] = signedNum.doubleValue();
} else {
    yValues[i] = Double.NaN;
}
```

The simplest correct form (since we're evaluating at a real point, the result is typically real):

```java
yValues[i] = result.isSignedNumber() ? ((ISignedNumber) result).doubleValue() : Double.NaN;
```

---

## Design Concern (not a compilation error)

### PlotRequest uses primitive `double` — null checks in computePlotData unreachable from PlotController

**PlotRequest.java:8–11:**
```java
double xMin, double xMax, double yMin, double yMax
```

**MathService.computePlotData.java:51:** accepts `Double xMin, Double xMax, ...`

When called from `PlotController`, auto-boxing produces non-null `Double` values, so the null-default logic on lines 53–54 is unreachable from that call path. Consider making `PlotRequest` fields `Double` (boxed) to allow clients to omit them, or leave as-is if defaults from the client are always expected.

---

## Files Verified Clean (no issues)

| File | Status |
|------|--------|
| `PlotController.java` | All imports resolve. Method call to `computePlotData` matches signature. Return type `ResponseEntity<PlotResponse>` consistent. |
| `PlotResponse.java` | Valid record definition. Constructor args in `MathService.computePlotData` match field types positionally. |
| `MathRequest.java` | Valid record. `xMin`/`xMax` correctly typed as `Double` (nullable). `@NotBlank` constraints from `jakarta.validation` are available via `spring-boot-starter-validation`. |
| `SecurityConfig.java` | All Spring Security 6.x imports correct. Lambda DSL `requestMatchers(String...)` syntax valid. `csrf(csrf -> csrf.disable())` is the modern form. `JwtAuthFilter` exists at expected location. |
| `StatsService.java` | All repository method calls match declared methods. `AdminStatsResponse` constructor arg count (7) and types match record definition. `Math.round(long)` return type handled correctly with division by `double`. |
| `ChatMessageRepository.java` | Spring Data derived query methods match `ChatMessage` entity fields. JPQL `COALESCE(SUM(LENGTH(m.content)), 0)` is valid JPQL 2.1+. All imports resolve. |
| `MathService.java` (other methods) | All switch cases dispatch to correct private methods. Symja expressions (`D()`, `Integrate()`, `Limit()`, `Solve()`, `Sum()`, etc.) are valid Symja function names. `ExprEvaluator` constructor `new ExprEvaluator(false, 10)` matches the library API. |
| `pom.xml` | `matheclipse-core:3.0.0` dependency present. Spring Boot 3.3.0, Java 21, Lombok, MapStruct all declared. |

---

*Reviewed 2026-07-10 — no JDK available for compilation; all findings from static analysis.*
