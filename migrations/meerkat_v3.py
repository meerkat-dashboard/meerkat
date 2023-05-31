#!/usr/local/env python3

# This migrator should 
# - not touch the source files
# - backup the source to <backup dir>/migrate_<original_name>
# - backup the destination to <backup dir>/existing_<original_name>
# - delete the destinatoin
# - parse the source file, change the json and write it to the destination

import argparse
import json
import os
import shutil
import sys

from loguru import logger


parser = argparse.ArgumentParser(description='Migrate dashboard data.')
parser.add_argument('--dashboard', type=str, help='dashboard .json', required=True)
parser.add_argument('--backup-dir', type=str, help='dashboard backup dir', default="./backup/v3/")
parser.add_argument('--dashboard-dir', type=str, help='destination dir for dashboards', default="../dashboards/")
parser.add_argument("--live", action="store_true", help="Write the changes to disk")

parser.add_argument('--folder', type=str, help='folder to put things in', required=False, default="")
parser.add_argument('--description', type=str, help='dashboard .json', required=False, default="")

args = parser.parse_args()

logger.remove()
logger.add(
    sys.stderr,
    colorize=True,
    format="<blue>{time:YYYY-MM-DD HH:mm:ss.SSS}</blue> <yellow>({process.id})</yellow> <level>{level}</level>:{line}: {message}",
    level="DEBUG"
    )

logger.debug(args)

dashboard_name = os.path.basename(args.dashboard)

logger.info(f"Source dashboard: {args.dashboard}")
logger.info(f"Backup dashboard: {args.backup_dir}migrate_{dashboard_name}")
logger.info(f"Destination dashboard: {args.dashboard_dir}{dashboard_name}")

# backup source dashboard
shutil.copy2(args.dashboard, f"{args.backup_dir}migrate_{dashboard_name}")

# Backup destintation dashboard if it exists 
if os.path.isfile(f"{args.dashboard_dir}{dashboard_name}") and args.live:
    shutil.copy2(f"{args.dashboard_dir}{dashboard_name}", f"{args.backup_dir}existing_{dashboard_name}")

# Parse dashboard data
with open(args.dashboard, 'r') as f:
    dashboard_json = json.load(f)

# Add in folder and description if it is missing
if 'folder' not in dashboard_json or args.folder != "":
    logger.success(f"Adding Dashboard Folder value: '{args.folder}'")
    dashboard_json['folder'] = args.folder

if 'description' not in dashboard_json:
    logger.success(f"Adding Dashboard Description value: '{args.folder}'")
    dashboard_json['description'] = args.description


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
        logger.success(f"Replacing Element Type {element['type']} with {type_replace[element['type']]}")
        element['type'] = type_replace[element['type']]

    # Now option replacements
    if 'options' in element:
        element_keys = list(element['options'].keys())
        for key in element_keys:
            # if they key is in the replacement list and the value isn't in the list of existing keys replace
            if key in options_replace:
                if options_replace[key] in element_keys:
                    logger.warning(f"Deleting Element Options key:value '{key}:{element['options'][key]}' as the replacement key '{options_replace[key]}' already exists")
                    element['options'].pop(key)
                else:
                    logger.success(f"Replacing Element Options key:value '{key}:{element['options'][key]}' with the replacement key '{options_replace[key]}' and existing value")
                    element['options'][options_replace[key]] = element['options'].pop(key)

        # If the fontSize exists then leave it be, otherwise replace it with other values if they exist
        if 'fontSize' not in element_keys:
            if 'nameFontSize' in element_keys:
                logger.success(f"Replacing Element Options key:value 'nameFontSize:{element['options']['nameFontSize']}' with the replacement key 'fontSize' and existing value")
                element['options']['fontSize'] = element['options'].pop('nameFontSize')
            if 'statusFontSize' in element_keys:
                logger.success(f"Replacing Element Options key:value 'statusFontSize:{element['options']['statusFontSize']}' with the replacement key 'fontSize' and existing value")
                element['options']['fontSize'] = element['options'].pop('statusFontSize')
        else:
            logger.warning(f"Deleting Element Options nameFontSize and statusFontSize as fontSize is already set")
            element['options'].pop('nameFontSize', None)
            element['options'].pop('statusFontSize', None)

        # Delete only
        logger.warning(f"Deleting Element Options StrokeColor")
        element['options'].pop('StrokeColor', None)  # Delete 'StrokeColor' key from options if it exists

if args.live:
    # Remove the current dashboard ready for replacement, doing this just before saving as we are trying to migrate in place
    if os.path.isfile(f"{args.dashboard_dir}{dashboard_name}"):
        os.remove(f"{args.dashboard_dir}{dashboard_name}")

    with open(f"{args.dashboard_dir}{dashboard_name}", "w") as f:
        json.dump(dashboard_json, f, indent=4, sort_keys=True)
else:
    logger.debug(json.dumps(dashboard_json))
