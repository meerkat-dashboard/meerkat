#!/bin/sh

# a list of values of GOOS and GOARCH we'd like meerkat for.
systems="linux darwin openbsd"
arches="amd64 arm64"

cachedir="$HOME/.cache/meerkat-build"
mkdir -p $cachedir

cd $cachedir

etag=""
if test -f etag
then
	etag=`cat etag`
fi
# Get etag from the header using a HEAD request,
# trimming the carriage-return.
latest=`curl -sLI https://github.com/meerkat-dashboard/meerkat/archive/refs/heads/main.tar.gz | grep etag | tr -d '\015'`
if test "$etag" == "$latest"
then
	echo "cached meerkat $etag matches latest $latest"
	exit 0
fi

# The remote has a newer revision than our cache.
# Flush our cache then fetch, extract the latest.
# The root of the tar consists of a single directory named "meerkat-main".
rm -rf $cachedir/meerkat-main
curl -sL https://github.com/meerkat-dashboard/meerkat/archive/refs/heads/main.tar.gz | gunzip -c | tar x

# Change to the source code directory; we won't leave it from here on
cd $cachedir/meerkat-main
for os in $systems
do
	for arch in $arches
	do
		# Change to the source code directory, make an archive and get a path to it
		# from the last line of output.
		built=`GOOS=$os GOARCH=$arch ./mkdist.sh | tail -1`
		new="$cachedir/meerkat.$os-$arch.tar.gz"
		mv $built $new
		rm -rf `dirname $built` # remove the temp working directory
		echo $new
	done
done

echo "$latest" > etag
