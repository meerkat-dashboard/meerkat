#!/bin/sh

# Creates a distribution tarball in a temporary directory from source.
# The path to the created tarball is the last line of the script's
# output.

( cd backend && go build )

(
	cd frontend
	npm ci
	npm run build
)

tmp=`mktemp -d`
dir="$tmp/meerkat"
mkdir -p $dir

cp README.md LICENSE $dir
cp -R dashboards-data $dir
cp Dockerfile $dir
cp -R contrib $dir
cp -R docs $dir

cp config/meerkat.toml.example $dir
cp backend/meerkat $dir

mkdir -p "$dir/frontend"
cp -R frontend/index.html frontend/style.css frontend/res frontend/assets "$dir/frontend"
cp -R frontend/react-widgets.css frontend/fonts "$dir/frontend"
cp -R frontend/dist "$dir/frontend"

tarball="$tmp/meerkat.tar.gz"
cd "$tmp"
tar cv meerkat | gzip -c > "$tarball"
echo "$tarball"
