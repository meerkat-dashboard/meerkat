#!/bin/bash -x

CERT_NAME=${1:-"localhost"}
SSL_DIR=${2:-"/usr/local/meerkat/ssl"}

echo "Creating SSL directory."
mkdir -p "$SSL_DIR"

echo "Generating SSL certificate"
openssl req -new -newkey rsa:2048 -nodes \
  -keyout "$SSL_DIR/$CERT_NAME.key" \
  -out "$SSL_DIR/$CERT_NAME.csr" \
  -subj "/C=AU/ST=NSW/L=Sydney/O=Sol1/OU=Monitoring/CN=$CERT_NAME/emailAddress=support@sol1.com.au"

openssl x509  -req  -days 365  -in $SSL_DIR/$CERT_NAME.csr  -signkey $SSL_DIR/$CERT_NAME.key  -out $SSL_DIR/$CERT_NAME.crt

