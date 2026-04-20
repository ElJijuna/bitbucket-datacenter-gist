#!/bin/sh
set -e

if [ -n "$BITBUCKET_SERVER_HOST" ]; then
  HOST=$(echo "$BITBUCKET_SERVER_HOST" | sed 's|^https\?://||' | sed 's|/.*||')
  BITBUCKET_PORT=${BITBUCKET_HTTPS_PORT:-443}
  CERT_FILE=/usr/local/share/ca-certificates/bitbucket-ca.crt

  echo "Fetching CA certificate from $HOST:$BITBUCKET_PORT..."
  openssl s_client -connect "$HOST:$BITBUCKET_PORT" -showcerts </dev/null 2>/dev/null \
    | awk '/-----BEGIN CERTIFICATE-----/{p=1} p; /-----END CERTIFICATE-----/{p=0}' \
    | awk 'BEGIN{n=0} /-----BEGIN CERTIFICATE-----/{n++} n==2' \
    > "$CERT_FILE"

  if [ -s "$CERT_FILE" ]; then
    update-ca-certificates
    echo "CA certificate installed."
  else
    # fallback: use the leaf cert (self-signed or single-cert chain)
    openssl s_client -connect "$HOST:$BITBUCKET_PORT" </dev/null 2>/dev/null \
      | openssl x509 > "$CERT_FILE"
    update-ca-certificates
    echo "CA certificate installed (leaf fallback)."
  fi
fi

exec "$@"
