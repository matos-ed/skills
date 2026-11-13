#!/usr/bin/env bash
# Builds and starts the branch (current checkout) and the base (worktree at BASE_REF) of one project,
# each with its own synthetic environments/.env, port and database, plus the third-party stub.
# Usage:
#   run.sh start <repo-path>     builds both, writes envs from the profile, starts stub + servers, waits for health
#   run.sh stop <repo-path>      stops servers and stub, removes the base worktree
#   run.sh logs <repo-path>      prints the log paths
# Reads <skill>/projects/<repo-name>/profile.env and env.template.
# Do not pipe its output (| tail): the servers outlive the script and keep the pipe open.
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LT_HOME="${LT_HOME:-$HOME/.local/share/local-testing}"
cmd="${1:-}"
repo="$(cd "${2:?repo path}" && pwd)"
name="$(basename "$repo")"
profile_dir="$SKILL_DIR/projects/$name"
run_dir="$LT_HOME/runs/$name"

[ -f "$profile_dir/profile.env" ] || { echo "no profile at $profile_dir — create it first (see modules/profiles.md)" >&2; exit 1; }
# shellcheck disable=SC1091
source "$profile_dir/profile.env"
BASE_REF="${BASE_REF:-origin/stage}"
BUILD_CMD="${BUILD_CMD:-yarn -s build}"
HEALTH_PATH="${HEALTH_PATH:-/public/health}"
STUB_PORT="${STUB_PORT:-4010}"

write_env() { # <target dir> <port> <db>
  mkdir -p "$1/environments"
  sed -e "s#__PORT__#$2#g" -e "s#__DB_NAME__#$3#g" -e "s#__LT_HOME__#$LT_HOME#g" -e "s#__STUB__#http://127.0.0.1:$STUB_PORT#g" \
    "$profile_dir/env.template" > "$1/environments/.env"
}

start_server() { # <label> <source dir> <port>
  local env_file="$run_dir/$1/environments/.env"
  (cd "$run_dir/$1" && env $(grep -E '^(AWS_ENDPOINT_URL[A-Z0-9_]*)=' "$env_file" | xargs) \
    NODE_EXTRA_CA_CERTS="$LT_HOME/certs/cert.pem" ${NODE_BIN:-node} ${NODE_ARGS:-} "$2/$ENTRY" < /dev/null > "$run_dir/$1.log" 2>&1 &)
}

wait_health() { # <port>
  for _ in $(seq 1 45); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$1$HEALTH_PATH" || true)
    [ "$code" != "000" ] && { echo "$code"; return 0; }
    sleep 2
  done
  echo "timeout"
}

stop_port() { local pids; pids=$(lsof -ti "tcp:$1" || true); [ -n "$pids" ] && kill $pids || true; }

case "$cmd" in
  start)
    mkdir -p "$run_dir"
    git -C "$repo" fetch -q origin
    git -C "$repo" worktree remove --force "$run_dir/base-src" >/dev/null 2>&1 || true
    git -C "$repo" worktree add -q --detach "$run_dir/base-src" "$BASE_REF"
    if cmp -s "$repo/package.json" "$run_dir/base-src/package.json" && cmp -s "$repo/yarn.lock" "$run_dir/base-src/yarn.lock"; then
      ln -s "$repo/node_modules" "$run_dir/base-src/node_modules"
    else
      [ -f "$repo/.npmrc" ] && cp "$repo/.npmrc" "$run_dir/base-src/.npmrc"
      (cd "$run_dir/base-src" && yarn install --frozen-lockfile >/dev/null)
    fi
    (cd "$repo" && $BUILD_CMD) && echo "branch built"
    (cd "$run_dir/base-src" && $BUILD_CMD) && echo "base built ($BASE_REF)"
    write_env "$run_dir/branch" "$PORT_BRANCH" "$DB_BRANCH"
    write_env "$run_dir/base" "$PORT_BASE" "$DB_BASE"
    stop_port "$STUB_PORT"; stop_port "$PORT_BRANCH"; stop_port "$PORT_BASE"
    rules=""; [ -f "$profile_dir/stub-rules.json" ] && rules="$profile_dir/stub-rules.json"
    (node "$SKILL_DIR/scripts/stub.js" "$STUB_PORT" $rules < /dev/null > "$run_dir/stub.log" 2>&1 &)
    start_server branch "$repo" "$PORT_BRANCH"
    start_server base "$run_dir/base-src" "$PORT_BASE"
    echo "branch :$PORT_BRANCH health=$(wait_health "$PORT_BRANCH")"
    echo "base   :$PORT_BASE health=$(wait_health "$PORT_BASE")"
    grep -hE "Producer Connected|Consumer Connected|listening" "$run_dir/branch.log" | head -3 || true
    ;;
  stop)
    stop_port "$PORT_BRANCH"; stop_port "$PORT_BASE"; stop_port "$STUB_PORT"
    git -C "$repo" worktree remove --force "$run_dir/base-src" >/dev/null 2>&1 || true
    echo "stopped $name"
    ;;
  logs) ls -1 "$run_dir"/*.log ;;
  *) sed -n '2,8p' "$0"; exit 1 ;;
esac
