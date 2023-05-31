#!/usr/local/env python3

import argparse
import json
import os
import shutil

from loguru import logger

parser = argparse.ArgumentParser(description='Migrate dashboard data.')
parser.add_argument('--dashboard', type=str, help='dashboard .json', required=True)
parser.add_argument('--backup-dir', type=str, help='dashboard backup dir', default="./backup/v3/")
parser.add_argument('--dashboard-dir', type=str, help='destination dir for dashboards', default="../dashboards/")
parser.add_argument("--live", action="store_true", help="Write the changes to disk")
args = parser.parse_args()

dashboard_name = os.path.basename(args.dashboard)

logger.info(f"Source dashboard: {args.dashboard}")
logger.info(f"Backup dashboard: {args.backup_dir}migrate_{dashboard_name}")
logger.info(f"Destination dashboard: {args.dashboard_dir}{dashboard_name}")

# backup source dashboard
shutil.copy2(args.dashboard, f"{args.backup_dir}migrate_{dashboard_name}")

# Backup destintation dashboard if it exists and delete original
if os.path.isfile(f"{args.dashboard_dir}{dashboard_name}") and args.live:
    shutil.copy2(f"{args.dashboard_dir}{dashboard_name}", f"{args.backup_dir}existing_{dashboard_name}")
    # Remove the current dashboard ready for replacement
    os.remove(f"{args.dashboard_dir}{dashboard_name}")

# Parse dashboard data
with open(args.dashboard, 'r') as f:
    dashboard_json = json.load(f)

# Add in folder and description if it is missing
if 'folder' not in dashboard_json:
    dashboard_json['folder'] = ""

if 'description' not in dashboard_json:
    dashboard_json['description'] = ""

# Type field value subsitution map
type_replace = {
    'iframe-video': 'video',
    'audio-stream': 'audio',
    'static-image': 'image'
}

# options key subsitution map
options_replace = {
    'id': 'objectName', 
    'checkDataSelection': 'objectAttr',
    'checkDataPattern': 'objectAttrMatch',
    'checkDataDefault': 'objectAttrNoMatch'

}

for element in dashboard_json.get('elements', []):
    # If the type field contains value then replace value
    if element.get('type', '') in type_replace:
        element['type'] = type_replace[element['type']]

    # Now option replacements
    if 'options' in element:
        element_keys = list(element['options'].keys())
        for key in element_keys:
            # if they key is in the replacement list and the value isn't in the list of existing keys replace
            if key in options_replace:
                if options_replace[key] in element_keys:
                    element['options'].pop(key)
                else:
                    element['options'][options_replace[key]] = element['options'].pop(key)

        # If the fontSize exists then leave it be, otherwise replace it with other values if they exist
        if 'fontSize' not in element_keys:
            if 'nameFontSize' in element_keys:
                element['options']['fontSize'] = element['options'].pop('nameFontSize')
            if 'statusFontSize' in element_keys:
                element['options']['fontSize'] = element['options'].pop('statusFontSize')
        else:
            element['options'].pop('nameFontSize', None)
            element['options'].pop('statusFontSize', None)

        # Delete only
        element['options'].pop('StrokeColor', None)  # Delete 'StrokeColor' key from options if it exists

if args.live:
    with open(f"{args.dashboard_dir}{dashboard_name}", "w") as f:
        json.dump(dashboard_json, f, indent=4, sort_keys=True)
else:
    logger.debug(json.dumps(dashboard_json))
