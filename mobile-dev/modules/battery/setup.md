# Device Setup

Read at battery step 2.

## 1. Get ADB working without the cable

The device must be physically unplugged during measurement, so control has to move to Wi-Fi first.

```bash
adb devices -l                  # confirm USB connection and get the model
adb shell ip route              # device IP on wlan0
```

Prefer the device's native **Wireless debugging** (Developer options → Pair device with code) over
legacy `adb tcpip`:

```bash
adb pair <ip>:<pair-port>       # enter the 6-digit code
adb connect <ip>:<connect-port> # port differs from the pairing port
```

`adb tcpip 5555` also drops the USB connection immediately, and often fails anyway — routers with
client isolation block it, and each failed `adb connect` blocks ~60s. If USB access is lost, unplug
and replug the cable to restore it.

Then have the user unplug the cable and verify:

```bash
adb shell dumpsys battery | grep -E "AC powered|USB powered|Wireless powered|level|temperature|Charge counter"
```

All three `powered` values must be `false`. `Charge counter` (µAh) is the support metric; record it.

Never use `dumpsys battery unplug` as a substitute — it only changes the framework's view while the
hardware keeps charging, so no drain occurs.

## 2. Handle the screen timeout (foreground runs only)

A window longer than the device's screen timeout dies silently. Save the original value, extend it,
and **restore it when done** — this is a user-visible device setting.

```bash
adb shell settings get system screen_off_timeout        # save this
adb shell settings put system screen_off_timeout 1200000
```

## 3. Confirm the app is in the intended state

```bash
PKG=<package>
adb shell "ps -A | grep $PKG"                                  # process alive?
adb shell dumpsys deviceidle | grep -m1 mScreenOn               # screen state
adb shell dumpsys package $PKG | grep -m1 versionName           # right build?
```

Get the uid — needed for every later query:

```bash
PID=$(adb shell "ps -A | grep $PKG" | awk '{print $2}')
adb shell "cat /proc/$PID/status" | grep -m1 Uid                # second field = uid
```

Do not name a shell variable `UID` — it is read-only in zsh and the assignment fails.

## 4. Verify the variable under test is actually active

A comparison mislabels itself easily, especially when the variable comes from a server-side flag that
is not observable from outside. Verify by behavior before trusting the label:

```bash
# app's established connections, by uid (hex addresses, little-endian per byte)
adb shell "cat /proc/net/tcp /proc/net/tcp6" | awk -v u=$APPUID '$8==u && $4=="01" {print $3}' | sort | uniq -c

# richer: inode (creation order, identity across samples) and the bidir flag
adb shell "ss -tnie" | grep -E "<peer-ip>" | sed 's/  */ /g'
```

Identification traps, all encountered in practice:

- **Shared IPs.** Different services often resolve to the same load balancer. Resolve the hostnames
  (`dig +short`) before attributing an IP to a service.
- **CDN certificates prove nothing.** A cert fetched by SNI from a shared CDN IP reflects the name
  you asked for, not who owns the service.
- **Identify by socket, not address.** A stable inode across samples means one long-lived connection;
  a changing inode means short requests, or a reconnect. `bidir` suggests sustained two-way traffic.

Log a connection sample per battery sample so this evidence lands inside the run's own results.
