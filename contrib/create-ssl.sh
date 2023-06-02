#!/bin/bash -x

HOST_NAME=${1:-"localhost"}
SSL_DIR=${2:-"/usr/local/meerkat/ssl"}

# Create SSL directory.
mkdir -p "$SSL_DIR"

# Generate SSL certificate
cd "$SSL_DIR"
openssl req  -new  -newkey rsa:2048  -nodes  -keyout $HOST_NAME.key  -out $HOST_NAME.csr
openssl  x509  -req  -days 365  -in $HOST_NAME.csr  -signkey $HOST_NAME.key  -out $HOST_NAME.crt


