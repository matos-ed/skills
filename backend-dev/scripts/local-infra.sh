#!/usr/bin/env bash
# Local infra for backend verification: MongoDB Atlas Local, Kafka SASL_SSL, optional Redis.
# Usage: local-infra.sh up | topics <T1> [T2...] | down
# Env: LOCAL_DIR (default /tmp/backend-local), WITH_REDIS=1
set -euo pipefail
DIR="${LOCAL_DIR:-/tmp/backend-local}"
KAFKA_BIN=/opt/kafka/bin

up() {
  mkdir -p "$DIR/certs" "$DIR/kafka"
  if [ ! -f "$DIR/certs/server.pem" ]; then
    openssl req -x509 -newkey rsa:2048 -nodes -keyout "$DIR/certs/key.pem" -out "$DIR/certs/cert.pem" \
      -days 30 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null
    cat "$DIR/certs/key.pem" "$DIR/certs/cert.pem" > "$DIR/certs/server.pem"
    chmod 644 "$DIR"/certs/*.pem
  fi
  cat > "$DIR/kafka/server.properties" <<'PROPS'
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
  docker rm -f be-local-mongo be-local-kafka be-local-redis >/dev/null 2>&1 || true
  docker run -d --name be-local-mongo -p 27027:27017 mongodb/mongodb-atlas-local:8.0 >/dev/null
  docker run -d --name be-local-kafka -p 19093:19093 -v "$DIR/certs:/certs:ro" -v "$DIR/kafka:/cfg:ro" \
    --entrypoint sh apache/kafka:3.9.0 -c \
    "$KAFKA_BIN/kafka-storage.sh format -t backendlocal000000000 -c /cfg/server.properties --ignore-formatted && exec $KAFKA_BIN/kafka-server-start.sh /cfg/server.properties" >/dev/null
  if [ "${WITH_REDIS:-0}" = "1" ]; then
    docker run -d --name be-local-redis -p 6390:6379 redis:7 >/dev/null
  fi
  for _ in $(seq 1 60); do docker logs be-local-kafka 2>&1 | grep -q "Kafka Server started" && break; sleep 2; done
  for _ in $(seq 1 60); do [ "$(docker inspect -f '{{.State.Health.Status}}' be-local-mongo)" = healthy ] && break; sleep 2; done
  echo "mongo:  mongodb://localhost:27027/?directConnection=true"
  echo "kafka:  localhost:19093 (SASL_SSL, PLAIN local/local) — run node with NODE_EXTRA_CA_CERTS=$DIR/certs/cert.pem"
  [ "${WITH_REDIS:-0}" = "1" ] && echo "redis:  redis://localhost:6390"
  return 0
}

topics() {
  for t in "$@"; do
    docker exec be-local-kafka "$KAFKA_BIN/kafka-topics.sh" --bootstrap-server localhost:9095 --create --if-not-exists --topic "$t" | tail -1
  done
}

down() {
  docker rm -f be-local-mongo be-local-kafka be-local-redis >/dev/null 2>&1 || true
  echo "containers removed; certs and config kept in $DIR"
}

cmd="${1:-}"; shift || true
case "$cmd" in
  up) up ;;
  topics) topics "$@" ;;
  down) down ;;
  *) echo "usage: $0 up | topics <T...> | down" >&2; exit 1 ;;
esac
