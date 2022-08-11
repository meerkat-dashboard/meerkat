#!/bin/bash

LABEL=$1
INSTALLDIR=/usr/local/meerkat$LABEL

echo "Installing on ubuntu/debian. If it doesn't work, fix it."

echo "run this script from the git repo like ./contrib/install-ubuntu.sh, as it assumes you are doing that"
echo "You can pass in a LABEL as an argument to this script, which will append it to the path and startup script."
echo "This allows you to have different versions (LABELs) of meerkat installed on the same machine."
echo "You will have to modify the port in the config file yourself however."

GOVERSION=`go version |awk '{print $3}'|sed 's/go//'`

echo "You need go version 1.16 or greater to run meerkat. You have version $GOVERSION."
echo "You need nodejs 16+ - attempting to install it for you"

echo "press any key to continue or ctrl+c to abort"
read
apt install curl libcurl4

curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh

bash nodesource_setup.sh

apt install nodejs

echo "installing meerkat"

echo "stopping meerkat first!"
systemctl stop meerkat$LABEL

mkdir $INSTALLDIR -p

echo "Building meerkat"
cd backend
go build
if [ $? -ne 0 ]
    then echo "Something went wrong with the build!"
    exit
    else echo "Ok, onto installing the node stuff"
fi

chmod +x meerkat
cp -a meerkat $INSTALLDIR/

cd ..
cp -av dashboards-data $INSTALLDIR/
cp -av dashboards $INSTALLDIR/

if [ ! -f /etc/meerkat$LABEL.toml ]; then
        cp config/meerkat.toml.example /etc/meerkat$LABEL.toml
else
    echo "config already in place at /etc/meerkat$LABEL.toml"
fi

cd frontend
npm install
npm run build

cd ..

rm -rf $INSTALLDIR/frontend
cp frontend $INSTALLDIR/frontend -av

chown nagios:nagios $INSTALLDIR/ -R

echo "installing meerkat service call meerkat$LABEL.service"
echo "
[Unit]
Description=meerkat$LABEL
After=network.target

[Service]
WorkingDirectory=$INSTALLDIR/
ExecStart=$INSTALLDIR/meerkat -config /etc/meerkat$LABEL.toml
User=nagios

[Install]
WantedBy=multi-user.target" > /etc/systemd/system/meerkat$LABEL.service

systemctl daemon-reload
systemctl restart meerkat$LABEL

echo "you need to fix the meerkat config file before it will work in /etc/meerkat$LABEL.toml"
echo "its currently like this"
cat /etc/meerkat$LABEL.toml
