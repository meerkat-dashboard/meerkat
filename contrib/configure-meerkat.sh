#!/bin/bash -x

USER=${1:-"meerkat"}
INSTALL_DIR=${2:-"/usr/local/meerkat"}
CONFIG_FILE=${3:-"/etc/meerkat.toml"}
PORT=${4:-"8080"}
LABEL=${5:-""}

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
sed -i "s/HTTPAddr = \"0.0.0.0:8080\"/HTTPAddr = \"0.0.0.0:$PORT\"/" $CONFIG_FILE
read -p "Create SSL Certificate (for http2 support)? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Name of certificate: "
    read CERT_NAME
    ./create-ssl.sh $CERT_NAME $INSTALL_DIR/ssl
    sed -i "s/SSLCert = \"\"/SSLCert = \"$INSTALL_DIR/ssl/$CERT_NAME.crt\"/" $CONFIG_FILE
    sed -i "s/SSLKey = \"\"/SSLKey = \"$INSTALL_DIR/ssl/$CERT_NAME.key\"/" $CONFIG_FILE
fi

echo "Installing meerkat service as meerkat.service"

$SERVICE_FILE = "/etc/systemd/system/meerkat.service"
sed -i "s/.*WorkingDirectory=.*/WorkingDirectory=$INSTALL_DIR/" $SERVICE_FILE
sed -i "s/.*ExecStart=.*/ExecStart=$INSTALL_DIR/meerkat -config $CONFIG_FILE" $SERVICE_FILE
sed -i "s/.*User=.*/User=$USER" $SERVICE_FILE


echo "Enabling meerkat service"
systemctl enable meerkat
systemctl daemon-reload
systemctl restart meerkat
