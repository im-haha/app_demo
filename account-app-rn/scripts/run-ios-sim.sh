#!/usr/bin/env bash
set -euo pipefail

SIM_NAME="${1:-iPhone 17}"

SIM_UDID="$(xcrun simctl list devices available | awk -F '[()]' -v name="$SIM_NAME" '$0 ~ "^[[:space:]]*" name " \\(" {print $2; exit}')"

if [[ -z "${SIM_UDID}" ]]; then
  echo "Simulator '${SIM_NAME}' not found." >&2
  exit 1
fi

# Keep simulator state deterministic so run-ios does not race against a shutdown device.
xcrun simctl shutdown all || true
xcrun simctl boot "${SIM_UDID}" || true
xcrun simctl bootstatus "${SIM_UDID}" -b

exec npx react-native run-ios \
  --udid "${SIM_UDID}" \
  --no-packager
