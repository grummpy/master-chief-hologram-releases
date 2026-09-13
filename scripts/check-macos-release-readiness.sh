#!/bin/zsh
set -eu

# This check is intentionally read-only: it never creates identities, signs,
# notarizes, uploads, or changes release settings.
IDENTITIES="$(security find-identity -v -p codesigning 2>/dev/null || true)"
if ! print -r -- "$IDENTITIES" | grep -q 'Developer ID Application:'; then
  print 'Signing readiness: no Developer ID Application certificate found.'
  print 'Install a valid Developer ID Application certificate before a public macOS release.'
  exit 1
fi
print 'Signing readiness: Developer ID Application certificate found.'
print 'Notarization readiness: configure credentials outside this repository (keychain profile or CI secrets).'
