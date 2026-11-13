#!/usr/bin/env bash
# Drops the given databases in the local Mongo (port 27027) so both builds start from the same seed.
# Usage: mongo-reset.sh DB1 [DB2...]
set -euo pipefail
for db in "$@"; do
  docker exec lt-mongo mongosh --quiet --eval "db.getSiblingDB('$db').dropDatabase()" >/dev/null
  echo "dropped $db"
done
