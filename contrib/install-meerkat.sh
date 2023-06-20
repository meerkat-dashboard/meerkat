#!/bin/bash 

# Configures a single meerkat instance and all required user, directories, permissions and system files

USER=${1:-"meerkat"}
INSTALL_DIR=${2:-"/usr/local/meerkat"}
CONFIG_FILE=${3:-"/etc/meerkat.toml"}
SERVICE_NAME=${4:-"$USER"}
PORT=${5:-"8080"}
CERT_NAME=${6:-"$USER"}

echo "Creating meerkat user: $USER"
useradd -d "$INSTALL_DIR" -s /usr/sbin/nologin $USER

echo "Creating dashboards directory"
mkdir -p "$INSTALL_DIR/dashboards" 

echo "Creating dashboards-background directory"
mkdir -p "$INSTALL_DIR/dashboards-background" 

echo "Creating dashboards-sound directory"
mkdir -p "$INSTALL_DIR/dashboards-sound" 

echo "Creating log directory"
mkdir -p "$INSTALL_DIR/log" 

echo "Setting owner for meerkat install dir: $INSTALL_DIR"
chown -R $USER "$INSTALL_DIR"

echo "Setting up meerkat config"
if [[ ! -e $CONFIG_FILE ]]; then
    cp "$INSTALL_DIR/contrib/meerkat.toml.example" "$CONFIG_FILE"
fi
chown $USER "$CONFIG_FILE"

sed -i "s|^HTTPAddr = \"0.0.0.0:8080\"|HTTPAddr = \"0.0.0.0:$PORT\"|g" "$CONFIG_FILE"

# SSL Creation
"$INSTALL_DIR/contrib/generate-ssl.sh" "$CERT_NAME" "$INSTALL_DIR/ssl" "$CONFIG_FILE"

echo "Setting owner for meerkat install dir: $INSTALL_DIR"
chown -R $USER "$INSTALL_DIR"


echo "Installing meerkat service as $SERVICE_NAME.service"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
# Copy the service template and update from passed in vars
cp "$INSTALL_DIR/contrib/meerkat.service" "$SERVICE_FILE"
sed -i "s|^WorkingDirectory=.*$|WorkingDirectory=$INSTALL_DIR/|g" "$SERVICE_FILE"
sed -i "s|^ExecStart=.*$|ExecStart=$INSTALL_DIR/meerkat -config $CONFIG_FILE|g" "$SERVICE_FILE"
sed -i "s|^User=.*$|User=$USER|g" "$SERVICE_FILE"


echo "Enabling meerkat service: $SERVICE_NAME"
systemctl enable $SERVICE_NAME
systemctl daemon-reload
systemctl restart $SERVICE_NAME
