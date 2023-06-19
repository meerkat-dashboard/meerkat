#!/bin/bash

LABEL=""
CERT_NAME=""
RELEASE_URL=""
INSTALL_DIR=""
USER=""
PORT=""

BASEDIR=/usr/local/meerkat

print_usage() {
  printf "Usage: %s --label LABEL --port PORT --user USER [--cert-name CERT_NAME] [--release-url RELEASE_URL]\n" $(basename $0)
  echo "  --label       Unique label for the meerkat instance under $BASEDIR"
  echo "  --user        User for the meerkat instance"
  echo "  --port        Port for the meerkat instance"
  echo "  --cert-name   Name for the SSL certificate"
  echo "  --release-url URL of the meerkat release to download from GitHub"
  exit 1
}

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --label) LABEL="$2"; shift ;;
    --user) USER="$2"; shift ;;
    --port) PORT="$2"; shift ;;
    --cert-name) CERT_NAME="$2"; shift ;;
    --release-url) RELEASE_URL="$2"; shift ;;
    *) echo "Unknown parameter passed: $1"; print_usage ;;
  esac
  shift
done

if [[ -z "$LABEL" ]]; then
  echo "Label is not provided."
  print_usage
fi

if [[ -z "$USER" ]]; then
  echo "User is not provided."
  print_usage
fi

if [[ -z "$PORT" ]]; then
  echo "Port is not provided."
  print_usage
fi

if [[ -z "$RELEASE_URL" ]]; then
  RELEASE_URL=`curl https://api.github.com/repos/meerkat-dashboard/meerkat/releases/latest | jq -r '.assets[0].browser_download_url' || true`
  if [ $? -ne 0 ]; then
    echo "Unable to find the latest RELEASE_URL (returned: $RELEASE_URL)"
    echo "Please try again passing in the RELEASE_URL"
    exit 1
  fi
fi

INSTALL_DIR="$BASEDIR/$LABEL"

echo "Stopping existing meerkat service if any"
systemctl stop meerkat-$LABEL

echo "Creating necessary directories"
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR-download"

echo "Downloading and extracting meerkat from GitHub"
curl -sL $RELEASE_URL | tar xz -C "$INSTALL_DIR-download"

# Move files up one directory level from $INSTALL_DIR/meerkat/ to $INSTALL_DIR
mv "$INSTALL_DIR-download/meerkat/*" "$INSTALL_DIR/"

# Remove the now empty $INSTALL_DIR/meerkat/ directory
rm -rf "$INSTALL_DIR-download"

# Run configure-meerkat.sh
CONFIG_FILE="/etc/meerkat-$LABEL.toml"
SERVICE_NAME="meerkat-$LABEL"
if [[ -z $CERT_NAME ]]; then
  CERT_NAME="$SERVICE_NAME" 
"$INSTALL_DIR/contrib/configure-meerkat.sh" "$USER" "$INSTALL_DIR" "$CONFIG_FILE" "$SERVICE_NAME" "$PORT" "$CERT_NAME"
