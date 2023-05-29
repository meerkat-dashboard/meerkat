#!/bin/bash -x

USER=${1:-"meerkat"}
INSTALL_DIR=${2:-"/usr/local/meerkat"}
CONFIG_FILE=${3:-"/etc/meerkat.toml"}

echo "Creating meerkat user: $USER"
useradd -d "$INSTALL_DIR" -s /usr/sbin/nologin $USER

echo "Creating dashboards directory"
mkdir -p "$INSTALL_DIR/dashboards" 

echo "Creating dashboards-background directory"
mkdir -p "$INSTALL_DIR/dashboards-background" 

echo "Setting owner for meerkat install dir: $INSTALL_DIR"
chown -R $USER "$INSTALL_DIR"

echo "Installing meerkat service"
cp "$INSTALL_DIR/contrib/meerkat.service" /etc/systemd/system/
systemctl daemon-reload

echo "Setting up meekat config"
if [[ ! -e $CONFIG_FILE ]]; then
    cp "$INSTALL_DIR/contrib/meerkat.toml.example" "$CONFIG_FILE"
fi
chown $USER "$CONFIG_FILE"

echo "Enabling meerkat service"
systemctl enable meerkat