#!/usr/bin/env zsh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/images

# URLs verificadas (HTTP 200). Si falla una, el script aborta.
declare -A IMAGES=(
  [hero.jpg]="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80"
  [pollo.jpg]="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80"
  [arroz.jpg]="https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80"
  [pasta.jpg]="https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80"
  [ensalada.jpg]="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80"
  [pescado.jpg]="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80"
  [carne.jpg]="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80"
  [huevo.jpg]="https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80"
  [postre.jpg]="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80"
  [sopa.jpg]="https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"
  [verduras.jpg]="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80"
  [legumbres.jpg]="https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800&q=80"
  [default.jpg]="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
)

for file url in ${(kv)IMAGES}; do
  echo "↓ $file"
  code=$(curl -sL -o "public/images/$file" -w "%{http_code}" "$url")
  if [[ "$code" != "200" ]]; then
    echo "FAIL $file HTTP $code"
    exit 1
  fi
  size=$(wc -c < "public/images/$file")
  if (( size < 5000 )); then
    echo "FAIL $file too small ($size bytes)"
    exit 1
  fi
  echo "OK $file ($size bytes)"
done

echo "All images downloaded."
