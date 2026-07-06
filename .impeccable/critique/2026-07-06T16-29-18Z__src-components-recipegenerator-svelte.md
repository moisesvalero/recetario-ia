---
target: src/components/RecipeGenerator.svelte
total_score: 25
p0_count: 0
p1_count: 2
timestamp: 2026-07-06T16-29-18Z
slug: src-components-recipegenerator-svelte
---

Method: dual-agent (A: 6e8fa8c7-8f2c-4a10-8213-9312b0647eeb · B: n/a)

# Design Critique: src/components/RecipeGenerator.svelte

## Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                                                                                                                                                          |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1         | Visibility of System Status     | 3/4       | Muestra feedback visual flotante al guardar/marcar favoritos y spinner al generar, pero usa confirmaciones nativas sutiles del navegador (`confirm`) y no hay confirmaciones amigables no invasivas.               |
| 2         | Match System / Real World       | 4/4       | Utiliza lenguaje común del mundo culinario, medidas estándar y el "Modo Cocinar" imita la acción de cocinar en la encimera.                                                                                        |
| 3         | User Control and Freedom        | 3/4       | Permite salir del modo cocina y borrar ingredientes con la "×". Sin embargo, no hay opción de "Deshacer" (undo) tras eliminar una receta guardada o vaciar la lista de compras.                                    |
| 4         | Consistency and Standards       | 2/4       | Discrepancia visual en radios de borde (`rounded-[var(--radius-lg)]` vs `rounded-3xl` de la especificación). Se usan variables de color no declaradas en `DESIGN.md` (`var(--accent-soft)`, `var(--accent-ring)`). |
| 5         | Error Prevention                | 3/4       | Excelente autoguardado del buffer de ingredientes al presionar "Generar" sin añadir antes. Faltan límites robustos o validaciones complejas si la API falla.                                                       |
| 6         | Recognition Rather Than Recall  | 3/4       | En `CookMode`, destaca los ingredientes mencionados en el paso actual, reduciendo drásticamente la carga de memoria. Las sugerencias de ingredientes rápidos son visibles.                                         |
| 7         | Flexibility and Efficiency      | 2/4       | No hay atajos de teclado o aceleradores para usuarios avanzados. El modo cocinar secuencial es rígido y poco flexible en móviles con manos sucias.                                                                 |
| 8         | Aesthetic and Minimalist Design | 2/4       | Panel de generación sobrecargado con 10 chips rápidos y 4 dropdowns. El Hero inicial es muy alto en móviles y desplaza el contenido principal de cocina.                                                           |
| 9         | Error Recovery                  | 2/4       | Mensajes de error en rojo al fallar la generación, pero los errores de autenticación (como intentar guardar sin sesión) abren el modal de login abruptamente sin una explicación o recuperación amigable previa.   |
| 10        | Help and Documentation          | 1/4       | Inexistencia de ayuda contextual, explicaciones de uso de la IA o FAQs dentro de la aplicación.                                                                                                                    |
| **Total** |                                 | **25/40** | **Acceptable**                                                                                                                                                                                                     |

## Anti-Patterns Verdict

- **LLM Assessment**:
  - El diseño visual general abraza correctamente los tonos tierra definidos en `DESIGN.md`, pero se apoya en un badge flotante "IA" y destellos ✨ que son clichés visuales de "AI slop".
  - Hay inconsistencia en los radios de bordes de las tarjetas (`RecipeHistory` y `CookMode` usan `rounded-[var(--radius-lg)]`, mientras que `RecipeCard` usa `rounded-3xl` e inputs usan `rounded-2xl`). Esto denota falta de rigor en la consistencia de componentes.
  - La estructura visual del formulario en desktop alineando selectores en una cuadrícula densa denota un layout un poco impersonal y plano, reminiscente de tableros SaaS clásicos (anti-referencia en `PRODUCT.md`).

## Overall Impression

El componente `RecipeGenerator.svelte` y sus componentes dependientes ofrecen una base sólida y funcional, destacando especialmente la utilidad del "Modo Cocinar" interactivo. Sin embargo, sufre de sobrecarga de opciones en la pantalla de generación inicial y pequeñas inconsistencias de diseño visual y de variables CSS con respecto a la guía `DESIGN.md`. La experiencia móvil para un cocinero con manos sucias (el caso de uso principal) tiene fricción debido a botones pequeños y elementos colapsados en móviles.

## What's Working

1. **Autoguardado de Ingredientes**: El hecho de que el ingrediente escrito en el campo de texto se añada automáticamente al hacer clic en "Generar receta" previene errores típicos de usuarios despistados.
2. **Contexto de Ingredientes en Pasos**: En `CookMode.svelte`, resaltar dinámicamente qué ingredientes de la receta se utilizan en el paso activo es una excelente ayuda de reconocimiento en tiempo real.
3. **Modo Cocinar con Temporizadores Integrados**: La presencia de temporizadores interactivos reales directamente en los pasos de cocina aporta una gran utilidad física.

## Priority Issues

- **[P1] Carga Cognitiva e Inundación Visual del Formulario**:
  - **Why it matters**: El usuario se encuentra de entrada con un formulario con 10 chips de ingredientes rápidos, un campo de texto con botón dashed, 4 selectores de preferencias y un botón principal. Esto excede con creces el límite de 4 elementos en la memoria de trabajo, abrumando a Jordan o a Casey.
  - **Fix**: Rediseñar el panel de generación aplicando progressive disclosure. Permitir añadir ingredientes primero y, una vez añadidos, revelar las opciones secundarias o agruparlas bajo un colapsable de "Preferencias de cocina". Agrupar los chips de ingredientes por categorías.
  - **Suggested command**: `/impeccable quieter` para limpiar la interfaz y reducir la carga de opciones.

- **[P1] Fricción en el Modo Cocinar para Dispositivos Móviles (Casey)**:
  - **Why it matters**: En móviles, los ingredientes requeridos para el paso actual se ocultan en un colapsable `<details>`, obligando al usuario a hacer clic sobre la pantalla en plena cocina. Además, los botones de navegación de pasos son pequeños (`px-5 py-2.5 text-xs`), requiriendo alta precisión táctil.
  - **Fix**: Mostrar siempre los ingredientes necesarios para el paso actual en móviles de forma visible (no colapsada). Ampliar el tamaño y el área táctil de los botones "Anterior" y "Siguiente" a un tamaño mínimo de 48px, o implementar gestos de deslizamiento (swipe) para cambiar de paso.
  - **Suggested command**: `/impeccable shape` para reestructurar las tarjetas e inputs y adaptarlos a pantallas táctiles.

- **[P2] Incumplimiento de la Guía de Estilos y Consistencia Visual**:
  - **Why it matters**: El uso de variables CSS de color como `var(--accent-soft)` o `var(--accent-ring)` no está en `DESIGN.md`. De igual forma, el radio de esquinas es inconsistente (`rounded-[var(--radius-lg)]` vs `rounded-3xl` que es la regla del cuaderno orgánico). Esto debilita la consistencia visual del sistema.
  - **Fix**: Reemplazar las clases y variables CSS inconsistentes por variables centralizadas según la especificación de `DESIGN.md`. Unificar los radios de esquinas en tarjetas a 24px (`rounded-3xl`) y en botones/inputs a 12px/16px.
  - **Suggested command**: `/impeccable audit` para buscar desviaciones y unificar el sistema de diseño.

- **[P2] Contraste Insuficiente de Textos Secundarios (Sam)**:
  - **Why it matters**: El uso de color de texto gris `var(--muted)` (mapeado a `#64748b`) sobre fondos crema `var(--neutral-bg)` (`#f4f6f8`) produce un contraste de ~3.0:1, lo cual incumple la accesibilidad WCAG AA (mínimo 4.5:1). Esto dificulta la lectura a media distancia en la cocina.
  - **Fix**: Aumentar el contraste de la variable `--muted` o utilizar un tono de gris más oscuro para subtextos sobre fondos de color crema slate.
  - **Suggested command**: `/impeccable colorize` para ajustar la paleta y contrastes de color.

- **[P3] Flujo de Registro Abrupto en Acciones Secundarias**:
  - **Why it matters**: Intentar guardar una receta o descargar un PDF sin haber iniciado sesión interrumpe el flujo abriendo el modal de inicio de sesión inmediatamente, lo que genera frustración.
  - **Fix**: Mostrar un mensaje de explicación amigable o usar un estado deshabilitado/explicativo que invite a registrarse en lugar de forzar el modal directamente.
  - **Suggested command**: `/impeccable onboard` para refinar el flujo de entrada e interacción de invitados.

## Persona Red Flags

- **Jordan (Confundido primerizo)**:
  - El botón para agregar ingredientes escritos a mano (`+ Agregar ingrediente`) tiene un estilo dashed grisáceo muy apagado y secundario en comparación con el input de texto y el botón naranja "Generar receta". Jordan puede pensar que basta con escribir el ingrediente y pulsar "Generar receta", sin darse cuenta de que debe agregarse formalmente. Aunque la app realiza una prevención de errores autoguardándolo al generar, no hay una confirmación visual clara de que se haya añadido antes de generar, creando incertidumbre.
  - La pantalla inicial muestra "Tu receta aparecerá aquí" de forma inactiva y triste.
- **Sam (Accesibilidad)**:
  - El contraste de colores del texto muted (`#64748b`) sobre el fondo crema slate (`#f4f6f8`) no es WCAG AA.
  - No hay un atajo o modo de navegación por teclado accesible e intuitivo en el "Modo Cocinar" para usuarios que no usan ratón o pantallas táctiles.
- **Casey (Distracted Mobile User)**:
  - Con el dispositivo en la encimera y las manos ocupadas, los botones táctiles del temporizador y de pasar de página en `CookMode` son demasiado pequeños y están en la base de la pantalla, lo que exige demasiada precisión.
  - Ocultar los ingredientes del paso en un `<details>` colapsable en móvil es una mala decisión de interacción en un contexto húmedo o de cocina real.

## Minor Observations

- El uso de `confirm` nativo de JavaScript para limpiar la lista de compras o salir del modo cocina rompe la calidez y el aspecto analógico de "cuaderno de la abuela" con ventanas emergentes grises del sistema.
- Las animaciones del temporizador son puramente textuales y carecen de un microindicador circular o barra de progreso temporal que ayude a ver de un vistazo cuánto tiempo queda a distancia.

## Questions to Consider

- ¿Cómo mejoraría el flujo si la interfaz inicial fuera de un solo paso de entrada ("¿Qué ingredientes tienes hoy?") y las opciones de dieta o momento del día se revelaran solo opcionalmente o como filtros secundarios?
- ¿Podríamos implementar un control por voz básico (ej. "siguiente", "atrás") o gestos sin contacto físico para avanzar en el modo cocina, resolviendo el problema de manos sucias de Casey?
- ¿Es posible sustituir los `confirm` del sistema por toasts de confirmación con la opción de deshacer la acción de forma no obstructiva?
