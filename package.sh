#!/usr/bin/env bash
# Package / sign the anicca Firefox new-tab add-on (extension/).
#
#   ./package.sh lint    # validate
#   ./package.sh build   # lint + build an unsigned .zip for AMO upload
#   ./package.sh sign     # lint + produce a signed .xpi for permanent personal install
#
# `sign` needs API credentials (addons.mozilla.org -> Developer Hub -> Manage API Keys):
#   export WEB_EXT_API_KEY=user:xxxx
#   export WEB_EXT_API_SECRET=xxxx
set -euo pipefail
cd "$(dirname "$0")"
SRC=extension
OUT=web-ext-artifacts

if ! command -v web-ext >/dev/null 2>&1; then
  echo "web-ext not found — install it:  npm i -g web-ext" >&2
  exit 1
fi

case "${1:-build}" in
  lint)
    web-ext lint -s "$SRC"
    ;;
  build)
    web-ext lint -s "$SRC"
    web-ext build -s "$SRC" -a "$OUT" --overwrite-dest
    echo "→ unsigned .zip in $OUT/ — upload at addons.mozilla.org -> Developer Hub -> Submit a New Add-on"
    ;;
  sign)
    : "${WEB_EXT_API_KEY:?set WEB_EXT_API_KEY (addons.mozilla.org -> Manage API Keys)}"
    : "${WEB_EXT_API_SECRET:?set WEB_EXT_API_SECRET}"
    web-ext sign -s "$SRC" -a "$OUT" --channel=unlisted \
      --api-key="$WEB_EXT_API_KEY" --api-secret="$WEB_EXT_API_SECRET"
    echo "→ signed .xpi in $OUT/ — install via about:addons -> gear -> Install Add-on From File"
    ;;
  *)
    echo "usage: ./package.sh [lint|build|sign]" >&2
    exit 1
    ;;
esac
