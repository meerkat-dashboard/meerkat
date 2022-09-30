#!/bin/sh

# Creates a distribution tarball in the named directory (or a
# temporary directory if none specified) from source. The path to the
# created tarball is the last line of the script's output.

usage="usage: mkdist.sh [directory]"

if test $# -gt 1
then
	echo $usage
	exit 2
fi

tmp=`mktemp -d`
outdir="$tmp"
if test -n "$1"
then
	outdir="$1"
fi

if ! test -d "$outdir"
then
	echo "$outdir not a directory"
	echo $usage
	exit 1
fi

( cd backend && go build )

(
	cd frontend
	npm ci
	npm run build
)

workdir="$tmp/meerkat"
mkdir -p $workdir

cp README.md LICENSE $workdir
cp -R dashboards-data $workdir
cp Dockerfile $workdir
cp -R contrib $workdir
cp -R docs $workdir

cp config/meerkat.toml.example $workdir
cp backend/meerkat $workdir

mkdir -p "$workdir/frontend"
cp -R frontend/index.html frontend/style.css frontend/res frontend/assets "$workdir/frontend"
cp -R frontend/react-widgets.css frontend/fonts "$workdir/frontend"
cp -R frontend/dist "$workdir/frontend"

tarball="$outdir/meerkat.tar.gz"
( cd "$workdir" && tar cv meerkat | gzip -c )  > "$tarball"
echo "$tarball"
