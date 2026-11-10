#!/bin/sh
set -eu
# Runtime values stay in Nginx, never in JavaScript or the browser bundle.
: "${TRAILQUEST_API_UPSTREAM:=trailquest-api:8080}"
: "${TRAILQUEST_TRUSTED_FORWARDER:?Set the exact immediate HTTPS proxy IP}"
if ! printf '%s' "$TRAILQUEST_API_UPSTREAM" | grep -Eq '^[A-Za-z0-9._-]+:[0-9]{2,5}$'; then
  echo 'Invalid API upstream: use a Docker hostname and port, without a URL, credentials or path.' >&2
  exit 2
fi
if ! printf '%s' "$TRAILQUEST_TRUSTED_FORWARDER" | grep -Eq '^[0-9A-Fa-f:.]+$'; then
  echo 'Invalid trusted forwarder: an exact IP address is required; networks and wildcards are not allowed.' >&2
  exit 2
fi
export TRAILQUEST_API_UPSTREAM TRAILQUEST_TRUSTED_FORWARDER
umask 077
mkdir -p /tmp/trailquest/conf.d
envsubst '${TRAILQUEST_API_UPSTREAM} ${TRAILQUEST_TRUSTED_FORWARDER}' < /etc/nginx/trailquest.conf.template > /tmp/trailquest/conf.d/default.conf
nginx -t
exec nginx -g 'daemon off;'
