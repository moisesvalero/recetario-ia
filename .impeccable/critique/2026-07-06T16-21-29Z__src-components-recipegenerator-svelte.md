---
target: src/components/RecipeGenerator.svelte
total_score: 20
p0_count: 1
p1_count: 2
timestamp: 2026-07-06T16-21-29Z
slug: src-components-recipegenerator-svelte
---

Method: dual-agent (A: 3a732d8b-353d-4366-8d69-ceaecf2fd027 · B: d7dc6abf-873f-4f2a-862a-f0f10152830e)

# Design Critique: src/components/RecipeGenerator.svelte

## 1. Overview

**Creative North Star: "El Cuaderno de la Abuela"**

Evaluación visual y funcional del generador de recetas principal. Aunque el componente cuenta con un flujo estructurado y dinámico bastante correcto, sufre de problemas de sobrecarga funcional, rigidez en el modo de cocción guiada y un exceso de ruido decorativo ("AI slop") que resta valor a su personalidad rústica e íntima.

**Key Characteristics:**

- **Exceso de ruido visual:** Saturación de iconos y emojis.
- **Modo cocina desconectado:** El flujo de cocción aísla la información de ingredientes.
- **Acciones destructivas sensibles:** Falta de confirmación en borrados y cancelaciones.

## 2. Design Health Score

| #         | Heurística                                | Score     | Key Issue                                                                                       |
| --------- | ----------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| 1         | Visibilidad del Estado del Sistema        | **3/4**   | Feedback claro de carga, pero falta de esqueletos al cambiar de pestañas.                       |
| 2         | Relación entre el Sistema y el Real World | **3/4**   | Lenguaje natural, pero categorías dietéticas y momentos del día están mezclados en el selector. |
| 3         | Control y Libertad del Usuario            | **2/4**   | Salir de la cocción guiada o borrar una receta es inmediato y destructivo.                      |
| 4         | Consistencia y Estándares                 | **2/4**   | Variaciones sutiles de bordes y uso esporádico de colores fijos de Tailwind en vez de tokens.   |
| 5         | Error Prevention                          | **2/4**   | El ingrediente en curso se descarta en silencio si se pulsa "Generar" directamente.             |
| 6         | Recognition Rather Than Recall            | **2/4**   | `CookMode` no muestra los ingredientes ni sus cantidades por paso.                              |
| 7         | Flexibility and Efficiency of Use         | **1/4**   | Sin atajos de teclado, carga rápida de ingredientes comunes o bulk actions.                     |
| 8         | Aesthetic and Minimalist Design           | **2/4**   | Fila de botones de acción saturada y emojis infantiles excesivos.                               |
| 9         | Error Recovery                            | **2/4**   | Mensajes de error secos ("⚠️ {error}") sin sugerencias de recuperación.                         |
| 10        | Help and Documentation                    | **1/4**   | Sin guías explicativas en la UI para temporizadores o generación.                               |
| **Total** |                                           | **20/40** | **Acceptable (Significant work needed)**                                                        |

## 3. Anti-Patterns Verdict

**FAIL.** El diseño del generador todavía carga con varios "tells" e inconsistencias visuales típicas de plantillas de IA:

- **Clutter de Emojis:** Se listan hasta 11 emojis diferentes en encabezados principales (`👋`, `✨`, `🍳`, `📖`, `❤️`, `🛒`, `🕐`, `📂`, `💖`, `🧺`, `⏳`), lo cual genera un aspecto ruidoso e infantil en lugar de una calidez editorial sofisticada.
- **Hacking de Opacidad en Tailwind:** Se detectó el uso de clases como `bg-[var(--accent-soft)]/50` en el markup. En Tailwind CSS, los modificadores de opacidad aplicados sobre variables CSS que contienen colores hexadecimales directos fallan silenciosamente o no se renderizan en algunos navegadores.
- **Componente Monolítico:** `RecipeGenerator.svelte` acumula más de 600 líneas de código y asume demasiadas responsabilidades (fórmularios, listas de favoritos, carrito, etc.), violando la cohesión arquitectónica.

**Detección determinista:** El escaneo del detector CLI arrojó `[]` (0 hallazgos) en este archivo gracias al refactor de tokens semánticos realizado en el pase anterior. Sin embargo, el detector a nivel global reporta la fuente `Plus Jakarta Sans` como una violación de `overused-font`, lo cual se clasifica como un falso positivo ya que es la tipografía oficial dictada por `DESIGN.md`.

## 4. Overall Impression

El generador es intuitivo y responde rápido, pero se siente como un prototipo saturado de opciones y decoraciones superfluas. Su mayor oportunidad reside en simplificar la jerarquía visual de acciones y robustecer la experiencia física de cocinar con el modo guiado.

## 5. What's Working

- El flujo reactivo de Svelte 5 funciona de forma excelente.
- El diseño adaptativo responde muy bien a los anchos de pantalla de móviles y tablets.

## 6. Priority Issues

- **[P0] El Modo Cocinar carece de Cantidades de Ingredientes (Memory Bridge)**
  - _Why it matters:_ Los cocineros no saben qué cantidad añadir y tienen que salir de la guía perdiendo el temporizador y el paso actual.
  - _Fix:_ Mostrar los ingredientes/cantidades implicados en el paso actual en un panel lateral o desplegable integrado en `CookMode.svelte`.
  - _Suggested command:_ `/impeccable clarify`
- **[P1] Eliminación sin Confirmación ni Deshacer (User Control & Freedom)**
  - _Why it matters:_ Pérdida accidental de recetas guardadas o listas de compras al presionar botones táctiles sensibles con manos húmedas.
  - _Fix:_ Añadir un modal de confirmación o un toast persistente de "Deshacer" (Undo) durante 5 segundos.
  - _Suggested command:_ `/impeccable harden`
- **[P1] Descarte del ingrediente en el búfer de entrada (Error Prevention)**
  - _Why it matters:_ Los usuarios pierden el último ingrediente escrito si hacen clic directamente en "Generar receta".
  - _Fix:_ En `generateRecipe`, si el `ingredientInput` no está vacío, agregarlo automáticamente a la lista de ingredientes antes de la llamada a la API.
  - _Suggested command:_ `/impeccable polish`
- **[P2] Contraste Insuficiente en Texto Secundario (Accessibility)**
  - _Why it matters:_ Pobre legibilidad de textos auxiliares en pantallas de cocina bajo iluminación variable.
  - _Fix:_ Cambiar `--muted` en `global.css` a un tono gris más oscuro (como `#475569`).
  - _Suggested command:_ `/impeccable colorize`
- **[P2] Fila de Acciones en Tarjeta Sobrecargada (Aesthetic & Minimalist Design)**
  - _Why it matters:_ Exceso de botones adyacentes en `RecipeCard` que abruman al usuario.
  - _Fix:_ Agrupar acciones secundarias (Compartir, PDF) bajo un menú de tres puntos o menú desplegable.
  - _Suggested command:_ `/impeccable quieter`

## 7. Persona Red Flags

- **Alex (Impatient Power User):**
  - No cuenta con atajos de teclado para controlar los temporizadores o avanzar entre los pasos de cocción guiada.
  - Tampoco hay atajos rápidos para agregar ingredientes comunes sin tener que escribirlos letra a letra.
- **Jordan (Confused First-Timer):**
  - Pierde ingredientes escritos en la caja al presionar "Generar" sin presionar el botón "+" primero.
  - Se confunde con el selector mixto "Tipo de comida" que mezcla "Cena" con restricciones como "Sin gluten".
- **Casey (Distracted Mobile User):**
  - Taps erróneos debido a la proximidad física de botones pequeños en el modo cocinar con manos húmedas.
  - Pérdida instantánea de su lista de compras por presionar "Limpiar lista" sin confirmación.
