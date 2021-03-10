#!/bin/bash
echo "Installing on ubuntu 18.04"

echo "run this script from the git repo like ./contrib/install-ubuntu.sh, as it assumes you are doing that"

GOVERSION=`go version |awk '{print $3}'|sed 's/go//'`

echo "You need go version 1.15 or greater to run meerkat. You have version $GOVERSION."
echo "You need nodejs 12+ - attempting to install it for you"

echo "press any key to continue or ctrl+c to abort"
read
apt install curl libcurl4

curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh

bash nodesource_setup.sh
apt install nodejs npm

echo "installing meerkat"

mkdir /usr/local/meerkat -p

echo "Building meerkat"
cd backend
go build

chmod +x meerkat
cp -a meerkat /usr/local/meerkat/

cd ..
cp -av dashboards-data /usr/local/meerkat/
cp -av dashboards /usr/local/meerkat/

cp config/meerkat.toml.example /etc/meerkat/meerkat.toml

cd frontend/
npm i
npm run prod

cd ..

cp frontend /usr/local/meerkat/frontend -av

chown nagios:nagios /usr/local/meerkat/ -R

echo "installing meerkat service
cp contrib/meerkat.service /etc/systemd/system/meerkat.service
systemctl daemon-reload
systemctl restart meerkat

echo "you need to fix the meerkat config file before it will work in /etc/meerkat.toml"
echo " its currently like this:"
cat /etc/meerkat.toml




