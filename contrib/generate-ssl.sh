#!/bin/bash -x

# Generates a SSL Certificate and updates the config with the new cert

CERT_NAME=${1:-""}
SSL_DIR=${2:-"/usr/local/meerkat/ssl"}
CONFIG_FILE=${3:-"/etc/meerkat.toml"}

echo "Creating SSL directory."
mkdir -p "$SSL_DIR"

if [[ -z $CERT_NAME ]] ; then
  # Call SSL Creation and update config file
  read -p "Create SSL Certificate (for http2 support)? " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]
  then
      echo "Name of certificate: "
      read CERT_NAME  
  fi
fi

echo "Generating SSL certificate"
openssl req -new -newkey rsa:2048 -nodes \
  -keyout "$SSL_DIR/$CERT_NAME.key" \
  -out "$SSL_DIR/$CERT_NAME.csr" \
  -subj "/C=AU/ST=NSW/L=Sydney/O=Sol1/OU=Monitoring/CN=$CERT_NAME/emailAddress=support@sol1.com.au"

openssl x509 -req -days 365 -in "$SSL_DIR/$CERT_NAME.csr" -signkey "$SSL_DIR/$CERT_NAME.key" -out "$SSL_DIR/$CERT_NAME.crt"


sed -i "s|^SSLCert = .*$|SSLCert = \"$SSL_DIR/$CERT_NAME.crt\"|" "$CONFIG_FILE"
sed -i "s|^SSLKey = .*$|SSLKey = \"$SSL_DIR/$CERT_NAME.key\"|" "$CONFIG_FILE"
