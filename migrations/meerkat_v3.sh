#!/bin/bash

original_name="$1"
file_name=`basename $1`
backup_name="./backup/v3/migrated_$file_name"
dashboard_name="../dashboards/$file_name"

echo "Source: $original_name"
echo "File: $file_name"
echo "Backup: $backup_name"
echo "Dashboard: $dashboard_name"

# Backup the source file to a clean location for this version
cp "$original_name" "$backup_name"

# Backup the current dashboard a clean location, might be the same file might not be the same file
if [ -f "$dashboard_name" ]; then
    cp "$dashboard_name" "./backup/v3/overridden_$file_name"
    # Remove the current dashboard ready for replacement
    rm "dashboard_name"
fi


# Perform migration
perl -MData::Dumper -MJSON -n0777 -le'$j = decode_json($_); %type_replace = qw(iframe-video video audio-stream audio static-image image); %opt_replace = qw(statusFontSize fontSize id objectName); foreach my $e (@{$j->{elements}}) {foreach my $r (keys %type_replace) {$e->{type} = $type_replace{$r} if $e->{type} eq $r}; foreach my $r (keys %opt_replace) {$e->{options}->{$opt_replace{$r}} = delete $e->{options}->{$r} if exists $e->{options}->{$r}}; delete $e->{options}->{StrokeColor}} print encode_json($j)' < $backup_name | jq -S . > $dashboard_name
