#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Creado .env — añade tu OPENAI_API_KEY antes de generar recetas."
fi

pnpm install
chmod +x .husky/pre-commit
pnpm lint
pnpm check
pnpm format:check
pnpm test
pnpm build

echo "Listo. Ejecuta: pnpm dev"
