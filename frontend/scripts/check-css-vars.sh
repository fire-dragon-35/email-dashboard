#!/usr/bin/env bash
# Fails if any var(--x) referenced in src/ isn't defined in
# src/styles/tokens.css. Catches the class of bug where a component
# references a token name that was never added (or was a placeholder
# guess) — stylelint's disallowed-value rules don't check this, since
# var(--anything) always passes as "not a raw value."
set -euo pipefail
cd "$(dirname "$0")/.."

used=$(grep -rohE 'var\(--[a-zA-Z0-9-]+' src --include='*.css' --include='*.tsx' --include='*.ts' \
  | sed 's/var(//' | sort -u)
defined=$(grep -ohE '^\s*--[a-zA-Z0-9-]+' src/styles/tokens.css | tr -d ' ' | sort -u)

missing=$(comm -23 <(echo "$used") <(echo "$defined"))

if [ -n "$missing" ]; then
  echo "Referenced CSS variables with no definition in tokens.css:"
  echo "$missing"
  exit 1
fi

echo "All referenced CSS variables are defined."