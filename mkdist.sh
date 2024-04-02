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
	rmdir $tmp
fi

if ! test -d "$outdir"
then
	echo "$outdir not a directory"
	echo $usage
	exit 1
fi

(
	cd ui
	npm ci
	npm run build
)

workdir="$tmp/meerkat"
mkdir -p $workdir
mkdir -p $workdir/dashboards-sound

# Build using the latest tag version of the branch name
build_version=$(git describe --tags `git rev-list --tags --max-count=1` 2>/dev/null || git rev-parse --abbrev-ref HEAD)
echo $build_version > VERSION
(cd cmd/meerkat && go build" -o $workdir/)
cp README.md LICENSE $workdir
cp Dockerfile $workdir
cp favicon.ico $workdir
cp -R contrib $workdir
cp -R docs $workdir
cp -R migrations $workdir
cp -R default_assets/*.mp3 $workdir/dashboards-sound/

tarball="$outdir/meerkat.tar.gz"
( cd "$workdir/.."  && tar cv meerkat | gzip -c )  > "$tarball"
echo "$tarball"
