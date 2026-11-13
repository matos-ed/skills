#!/bin/bash
# Mede uma janela de bateria de um app Android via ADB, com o aparelho desplugado.
#
#   run-battery-test.sh <package> <nome-da-rodada> <minutos> <bg|fg> [dir-saida]
#
# Espera o estado de tela exigido pelo modo, zera o batterystats, amostra a cada
# 2 min e coleta todos os dumps ao fechar a janela.
set -u

if [ $# -lt 4 ]; then
  echo "uso: $0 <package> <nome-da-rodada> <minutos> <bg|fg> [dir-saida]" >&2
  exit 2
fi

PKG="$1"; RUN="$2"; MINS="$3"; MODE="$4"; D="${5:-.}"
mkdir -p "$D"

log() { echo "$(date +%H:%M:%S) $*" | tee -a "$D/$RUN.log"; }
die() { log "ERRO: $*"; exit 1; }

# --- pre-condicoes -----------------------------------------------------------
adb shell "ps -A | grep -q $PKG" || die "$PKG nao esta rodando"

APPPID=$(adb shell "ps -A | grep $PKG" | awk '{print $2}' | head -1)
APPUID=$(adb shell "cat /proc/$APPPID/status" | grep -m1 Uid | awk '{print $2}')
[ -n "$APPUID" ] || die "nao foi possivel obter o uid de $PKG"
log "$PKG pid=$APPPID uid=$APPUID"

# O aparelho precisa estar desplugado, senao nao ha dreno para medir.
PLUGGED=$(adb shell dumpsys battery | grep -cE "^  (AC|USB|Wireless) powered: true")
[ "$PLUGGED" = "0" ] || die "aparelho esta carregando - desplugue o cabo"

# --- espera o estado de tela do modo ----------------------------------------
if [ "$MODE" = "bg" ]; then WANT=false; else WANT=true; fi
log "aguardando mScreenOn=$WANT (modo $MODE)"
SC=""
for _ in $(seq 1 120); do
  SC=$(adb shell dumpsys deviceidle | grep -m1 mScreenOn | sed 's/.*mScreenOn=//;s/ .*//')
  [ "$SC" = "$WANT" ] && break
  sleep 5
done
[ "$SC" = "$WANT" ] || die "tela nao entrou no estado esperado em 10 min"

# --- abre a janela -----------------------------------------------------------
adb shell dumpsys batterystats --reset >/dev/null 2>&1
log "batterystats zerado - T0"
adb shell dumpsys battery \
  | grep -E "^  level|^  temperature|Charge counter" | tr -d ' ' | tr '\n' ' ' >> "$D/$RUN.log"
echo "" >> "$D/$RUN.log"

# Amostra a cada 2 min: menos wakeups que 60s e resolucao suficiente.
# ceil, para nao encurtar a janela com divisao inteira (15 min -> 8 amostras).
N=$(( (MINS + 1) / 2 ))
for i in $(seq 0 "$N"); do
  S=$(adb shell dumpsys battery 2>/dev/null \
      | grep -E "^  level|^  temperature|Charge counter|current now" | tr -d ' ' | tr '\n' ' ')
  # Estado da tela por amostra: se sair do esperado, a janela esta contaminada.
  SC=$(adb shell dumpsys deviceidle | grep -m1 mScreenOn | sed 's/.*mScreenOn=//;s/ .*//')
  MARK=""; [ "$SC" != "$WANT" ] && MARK=" <<< TELA FORA DO ESTADO"
  echo "t=$((i * 2))min $(date +%H:%M:%S) $S screen=$SC$MARK" >> "$D/$RUN-samples.txt"
  # Conexoes do app junto, para rastrear qual canal persiste (inode = identidade).
  {
    echo "--- t=$((i * 2))min ---"
    adb shell "ss -tnie 2>/dev/null" | grep "uid:$APPUID" | sed 's/  */ /g' \
      | awk '{for(j=1;j<=NF;j++){if($j ~ /^ino:/)ino=$j; if($j=="bidir")bd="BIDIR"}
              print $4, $5, ino, bd; ino=""; bd=""}'
  } >> "$D/$RUN-conns-timeline.txt"
  [ "$i" -lt "$N" ] && sleep 120
done

# --- fecha e coleta ---------------------------------------------------------
log "janela encerrada - coletando dumps"
adb shell dumpsys batterystats --charged "$PKG" > "$D/$RUN-batterystats.txt" 2>&1
adb shell dumpsys batterystats            > "$D/$RUN-batterystats-full.txt" 2>&1
adb shell dumpsys netstats detail         > "$D/$RUN-netstats.txt" 2>&1
adb logcat -d -v time                     > "$D/$RUN-logcat.txt" 2>&1
adb shell "cat /proc/net/tcp /proc/net/tcp6" \
  | awk -v u="$APPUID" '$8==u && $4=="01" {print $3}' > "$D/$RUN-conns.txt"

# Alerta de contaminacao, para nao passar batido na analise.
if grep -q "TELA FORA DO ESTADO" "$D/$RUN-samples.txt"; then
  log "ATENCAO: tela saiu do estado esperado durante a janela - verificar contaminacao"
fi
adb shell "ps -A | grep -q $PKG" || log "ATENCAO: o app morreu durante a janela"

log "RODADA $RUN COMPLETA (uid $APPUID, $MINS min, modo $MODE)"
