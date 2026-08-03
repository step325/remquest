#!/usr/bin/env bash
# Runner unico dei test. Richiede Node >= 22.18 (type stripping nativo di TypeScript).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Typecheck"
npx tsc --noEmit

echo "==> Unit test"
node --import ./tests/loader/register.mjs --test 'tests/unit/*.test.ts'

echo "==> Audit dipendenze di produzione (bloccante)"
npm audit --omit=dev --audit-level=moderate

echo "==> Audit toolchain di sviluppo (informativo)"
npm audit --audit-level=high || echo "   ^ solo dev, non finisce nel bundle del plugin"

echo "==> Build di produzione"
NODE_ENV=production npx webpack

echo "==> Tutti i controlli superati"
