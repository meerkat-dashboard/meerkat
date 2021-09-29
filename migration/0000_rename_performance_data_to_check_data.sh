#!/usr/bin/env sh

if [ -z "$1" ]
then
	echo Migration failed.
	echo Please specify path to dashboards json, e.g.
	echo $0 /path/to/dashboards
	exit 1
fi

timestamp=`date +"%Y%m%d_%H%M%S"`

for dashboard in $1/*.json
do
	if grep -q checkDataSelection $dashboard
	then
		echo $dashboard has been migrated
	else
		cmd="sed -i.$timestamp s/perfDataSelection/checkDataSelection/g $dashboard"
		echo $cmd && $cmd
	fi
done
