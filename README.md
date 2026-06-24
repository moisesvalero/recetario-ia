<div align="center">

# Recetario IA

### De lo que tienes en la nevera a una receta lista para cocinar — en segundos.

[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

**[Ver demo en vivo](https://recetario-ia.vercel.app)** · [Recetas de ejemplo](/recetas) · [Reportar issue](https://github.com/moisesvalero/recetario-ia/issues)

![Captura de Recetario IA](./public/screenshot.png)

</div>

---

## El problema

Abres ChatGPT, escribes _"tengo pollo y arroz"_, y recibes un párrafo largo. Sin pasos claros, sin tiempos, sin modo cocina. Cierras el chat y vuelves a pedir delivery.

## La solución

**Recetario IA** convierte tus ingredientes en una **ficha de cocina estructurada**: cantidades, pasos, tiempos, tips y un **modo cocinar** paso a paso con temporizadores. Todo en una interfaz rápida, pensada para la cocina real.

---

## Características

| | |
|---|---|
| **Generador inteligente** | Añade ingredientes como chips, define tiempo, porciones, dieta y dificultad |
| **Recetas estructuradas** | JSON validado con Zod → UI clara, no texto suelto |
| **Modo cocinar** | Navegación paso a paso con temporizadores integrados |
| **Historial local** | Tus últimas recetas guardadas en el navegador |
| **Catálogo estático** | 7 recetas de ejemplo con Content Collections de Astro 7 |
| **Rendimiento** | Astro 7 + islas Svelte 5: carga mínima en cliente |

---

## Stack técnico

```
Astro 7          → SSR, Content Collections (Sätteri), rutas híbridas
Svelte 5         → Islas interactivas (generador, modo cocinar)
Tailwind CSS 4   → UI responsive mobile-first
Vercel AI SDK    → generateObject + schema Zod
OpenAI           → gpt-4o-mini
Vercel           → Deploy serverless
```

---

## Inicio rápido

### Requisitos

- Node.js ≥ 22.12
- pnpm
- Clave de [OpenAI API](https://platform.openai.com/api-keys)

### Instalación

```bash
git clone https://github.com/moisesvalero/recetario-ia.git
cd recetario-ia
cp .env.example .env
# Edita .env y añade OPENAI_API_KEY=sk-...
pnpm install
pnpm dev
```

Abre [http://localhost:4321](http://localhost:4321).

### Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm preview` | Previsualizar build |
| `pnpm check` | astro check + tsc |
| `pnpm lint` | oxlint |
| `pnpm test` | Vitest |
| `pnpm format:check` | Prettier |

---

## Variables de entorno

| Variable | Contexto | Descripción |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Servidor | Clave de OpenAI para `/api/generate-recipe` |

En Vercel: **Settings → Environment Variables** → añade `OPENAI_API_KEY` en Production y Preview.

---

## Arquitectura

```mermaid
flowchart LR
  User[Usuario] --> UI[Isla Svelte]
  UI -->|POST /api/generate-recipe| API[Endpoint Astro]
  API --> OpenAI[gpt-4o-mini]
  OpenAI --> API
  API --> UI
  UI --> History[localStorage]
  Static[Content Collections] --> Pages[/recetas]
```

---

## Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | SSR + isla | Generador IA |
| `/recetas` | Estática | Listado de recetas ejemplo |
| `/recetas/[slug]` | Estática | Detalle de receta |
| `/api/generate-recipe` | Serverless | Generación con OpenAI |

---

## Por qué no es otro ChatGPT

- **Formulario guiado** con restricciones reales (tiempo, dieta, porciones)
- **Salida tipada** con Zod — siempre la misma estructura
- **Modo cocinar** con timers — pensado para tener el móvil en la encimera
- **Historial persistente** sin cuenta ni login
- **Recetas estáticas** indexables para SEO

---

## Licencia

MIT — úsalo, modifícalo, despliégalo.

---

<div align="center">

Hecho con **Astro 7** y mucha hambre.

[⭐ Star en GitHub](https://github.com/moisesvalero/recetario-ia) si te salva la cena.

</div>
