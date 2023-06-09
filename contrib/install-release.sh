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
  echo "Label is not provided."
  print_usage
fi

if [[ -z "$PORT" ]]; then
  echo "Port is not provided."
  print_usage
fi

if [[ -z "$RELEASE_URL" ]]; then
  RELEASE_URL="https://github.com/meerkat-dashboard/meerkat/releases/download/v3.0.0-beta.3/meerkat3.0.0-beta.3.linux-amd64.tar.gz"
fi

INSTALL_DIR=$BASEDIR/$LABEL

echo "Creating meerkat user: $USER"
useradd -d "$INSTALL_DIR" -s /usr/sbin/nologin $USER

echo "Stopping existing meerkat service if any"
systemctl stop meerkat$LABEL

echo "Creating necessary directories"
mkdir -p $INSTALL_DIR
mkdir -p $INSTALL_DIR-download

echo "Creating dashboards-data directory"
mkdir -p "$INSTALL_DIR/dashboards-data" 


echo "Downloading and extracting meerkat from GitHub"
curl -sL $RELEASE_URL | tar xz -C $INSTALL_DIR-download

# Move files up one directory level from $INSTALL_DIR/meerkat/ to $INSTALL_DIR
mv $INSTALL_DIR-download/meerkat/* $INSTALL_DIR/

# Remove the now empty $INSTALL_DIR/meerkat/ directory
rm -rf $INSTALL_DIR-download

echo "Creating SSL directory."
SSL_DIR="${INSTALL_DIR}/ssl"
mkdir -p "$SSL_DIR"

echo "Generating SSL certificate"
openssl req -new -newkey rsa:2048 -nodes \
  -keyout "$SSL_DIR/$CERT_NAME.key" \
  -out "$SSL_DIR/$CERT_NAME.csr" \
  -subj "/C=AU/ST=NSW/L=Sydney/O=Sol1/OU=Monitoring/CN=$CERT_NAME/emailAddress=support@sol1.com.au"

openssl x509  -req  -days 365  -in $SSL_DIR/$CERT_NAME.csr  -signkey $SSL_DIR/$CERT_NAME.key  -out $SSL_DIR/$CERT_NAME.crt


echo "Setting owner for meerkat install dir: $INSTALL_DIR"
chown -R $USER "$INSTALL_DIR"


if [ ! -f /etc/meerkat-$LABEL.toml ]; then
echo "
# The address, in host:port format, to serve meerkat from. For example 0.0.0.0:6969. The default is “:8080” i.e. all IPv4, IPv6 addresses port 8080.
HTTPAddr = \"0.0.0.0:$PORT\"

# A URL pointing to an instance of Icinga serving the Icinga API
IcingaURL = \"https://127.0.0.1:5665\"

# The username and password with which to authenticate to Icinga. Normally set in /etc/icinga2/conf.d/api-users.conf on your Icinga2 master.
IcingaUsername = \"meerkat\"
IcingaPassword = \"YOUR SECURE PASSWORD HERE\"

# If set to true, verification of the TLS certificates served by the Icinga API is skipped. This is often required when Icinga is configured with self-signed certificates.
#IcingaInsecureTLS = true

# If set to true, meerkat will serve data over http2 using the crt and key.
SSLEnable = true
SSLCert = \"$SSL_DIR/$CERT_NAME.crt\"
SSLKey = \"$SSL_DIR/$CERT_NAME.key\"
" >> /etc/meerkat-$LABEL.toml

echo "update /etc/meerkat-$LABEL.toml with Icinga details!"
else
    echo "Config already in place at /etc/meerkat-$LABEL.toml"
fi


echo "Installing meerkat service as meerkat-$LABEL.service"
echo "
[Unit]
Description=meerkat-$LABEL
After=network.target

[Service]
WorkingDirectory=$INSTALL_DIR/
ExecStart=$INSTALL_DIR/meerkat -config /etc/meerkat-$LABEL.toml
User=$USER

[Install]
WantedBy=multi-user.target" > /etc/systemd/system/meerkat-$LABEL.service

echo "Enabling meerkat service"
systemctl enable meerkat-$LABEL
systemctl daemon-reload
systemctl restart meerkat-$LABEL

