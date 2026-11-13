#!/usr/bin/env bash
# Local infra for backend testing. Containers are reused between runs: `stop` keeps them, `down` removes them.
# Usage:
#   infra.sh up [mongo] [kafka] [redis] [minio]   (default: mongo kafka)
#   infra.sh topics T1 [T2...]
#   infra.sh bucket NAME
#   infra.sh status | stop | down
# Env: LT_HOME (default ~/.local/share/local-testing)
set -euo pipefail
LT_HOME="${LT_HOME:-$HOME/.local/share/local-testing}"
KAFKA_BIN=/opt/kafka/bin
MONGO_PORT=27027
KAFKA_PORT=19093
REDIS_PORT=6390
MINIO_PORT=9000
MINIO_USER=localkey
MINIO_PASSWORD=localsecret

certs() {
  mkdir -p "$LT_HOME/certs" "$LT_HOME/kafka"
  [ -f "$LT_HOME/certs/server.pem" ] && return 0
  openssl req -x509 -newkey rsa:2048 -nodes -keyout "$LT_HOME/certs/key.pem" -out "$LT_HOME/certs/cert.pem" \
    -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null
  cat "$LT_HOME/certs/key.pem" "$LT_HOME/certs/cert.pem" > "$LT_HOME/certs/server.pem"
  chmod 644 "$LT_HOME"/certs/*.pem
}

kafka_config() {
  cat > "$LT_HOME/kafka/server.properties" <<'PROPS'
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@localhost:9094
listeners=SASL_SSL://0.0.0.0:19093,CONTROLLER://localhost:9094,INTERNAL://localhost:9095
advertised.listeners=SASL_SSL://localhost:19093,INTERNAL://localhost:9095
listener.security.protocol.map=SASL_SSL:SASL_SSL,CONTROLLER:PLAINTEXT,INTERNAL:PLAINTEXT
inter.broker.listener.name=INTERNAL
controller.listener.names=CONTROLLER
sasl.enabled.mechanisms=PLAIN
listener.name.sasl_ssl.plain.sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="local" password="local" user_local="local";
ssl.keystore.type=PEM
ssl.keystore.location=/certs/server.pem
log.dirs=/tmp/kraft-logs
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
group.initial.rebalance.delay.ms=0
num.partitions=1
PROPS
}

# Start the container when it exists, create it otherwise.
ensure() {
  local name=$1
  shift
  if docker inspect "$name" >/dev/null 2>&1; then
    [ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ] || docker start "$name" >/dev/null
  else
    docker run -d --name "$name" "$@" >/dev/null
  fi
}

up() {
  # Accept "mongo kafka" as one argument too (zsh does not split unquoted variables).
  local components
  read -ra components <<< "$*"
  [ ${#components[@]} -eq 0 ] && components=(mongo kafka)
  certs
  for component in "${components[@]}"; do
    case "$component" in
      mongo) ensure lt-mongo -p $MONGO_PORT:27017 mongodb/mongodb-atlas-local:8.0 ;;
      kafka)
        kafka_config
        ensure lt-kafka -p $KAFKA_PORT:19093 -v "$LT_HOME/certs:/certs:ro" -v "$LT_HOME/kafka:/cfg:ro" \
          --entrypoint sh apache/kafka:3.9.0 -c \
          "$KAFKA_BIN/kafka-storage.sh format -t ltlocal00000000000000 -c /cfg/server.properties --ignore-formatted && exec $KAFKA_BIN/kafka-server-start.sh /cfg/server.properties"
        ;;
      redis) ensure lt-redis -p $REDIS_PORT:6379 redis:7 ;;
      minio)
        ensure lt-minio -p $MINIO_PORT:9000 -e MINIO_ROOT_USER=$MINIO_USER -e MINIO_ROOT_PASSWORD=$MINIO_PASSWORD \
          minio/minio:latest server /data
        ;;
      *) echo "unknown component: $component" >&2; exit 1 ;;
    esac
  done
  for component in "${components[@]}"; do
    case "$component" in
      mongo)
        for _ in $(seq 1 60); do [ "$(docker inspect -f '{{.State.Health.Status}}' lt-mongo)" = healthy ] && break; sleep 2; done
        echo "mongo:  mongodb://localhost:$MONGO_PORT/?directConnection=true"
        ;;
      kafka)
        for _ in $(seq 1 60); do docker logs lt-kafka 2>&1 | grep -q "Kafka Server started" && break; sleep 2; done
        echo "kafka:  localhost:$KAFKA_PORT (SASL_SSL, PLAIN local/local) — node needs NODE_EXTRA_CA_CERTS=$LT_HOME/certs/cert.pem"
        ;;
      redis) echo "redis:  redis://localhost:$REDIS_PORT" ;;
      minio)
        for _ in $(seq 1 30); do curl -sf "http://127.0.0.1:$MINIO_PORT/minio/health/live" >/dev/null && break; sleep 1; done
        echo "minio:  http://127.0.0.1:$MINIO_PORT ($MINIO_USER/$MINIO_PASSWORD) — set AWS_ENDPOINT_URL_S3 to it"
        ;;
    esac
  done
}

topics() {
  local list
  read -ra list <<< "$*"
  for topic in "${list[@]}"; do
    docker exec lt-kafka "$KAFKA_BIN/kafka-topics.sh" --bootstrap-server localhost:9095 --create --if-not-exists --topic "$topic" >/dev/null
  done
  echo "topics: ${list[*]}"
}

bucket() {
  docker exec lt-minio sh -c "mc alias set l http://127.0.0.1:9000 $MINIO_USER $MINIO_PASSWORD >/dev/null && mc mb -p l/$1 >/dev/null"
  echo "bucket: $1"
}

status() {
  docker ps -a --filter name=lt- --format '{{.Names}}\t{{.Status}}'
}

case "${1:-}" in
  up) shift; up "$@" ;;
  topics) shift; topics "$@" ;;
  bucket) bucket "$2" ;;
  status) status ;;
  stop) docker stop lt-mongo lt-kafka lt-redis lt-minio >/dev/null 2>&1 || true; echo "stopped (containers kept)" ;;
  down) docker rm -f lt-mongo lt-kafka lt-redis lt-minio >/dev/null 2>&1 || true; echo "removed; certs kept in $LT_HOME" ;;
  *) sed -n '2,9p' "$0"; exit 1 ;;
esac
