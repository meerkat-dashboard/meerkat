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
    existing_dashboard = json.load(f)


# Migration
# Migration will work be taking the old known data and moving it to a new dashboard object
# the old dashboard object will have the remaining items (as we are doing move not copy most of the time)

migrated_dashboard = {
    "title": "",
    "slug": "",
    "background": "",
    "description": "",
    "folder": "",
    "width": "",
    "height": "",
}


# Iterate through all the top level dashboard keys
for dashboard_key in migrated_dashboard.keys():
    # Default element values get set if in the template
    if dashboard_key in existing_dashboard:
        migrated_dashboard[dashboard_key] = existing_dashboard.pop(dashboard_key)

    # Move background to new directory
    if dashboard_key == 'background':
        logger.warning(f"Renaming {dashboard_key}:{migrated_dashboard[dashboard_key]} for dashboards-background")
        migrated_dashboard[dashboard_key] = migrated_dashboard[dashboard_key].replace('dashboards-data', 'dashboards-background')

# Add the argument for folder if set
if args.folder != "":
    logger.success(f"Adding Dashboard Folder argument value: '{args.folder}'")
    migrated_dashboard['folder'] = args.folder

# Add the argument for description if set
if args.description != "":
    logger.success(f"Adding Dashboard Description argumnet value: '{args.description}'")
    migrated_dashboard['description'] = args.description


# Stuff we want to keep in the data file but probably don't have any code associated with them in v3
_sound_keys = [
    "criticalSound",
    "downSound",
    "okSound",
    "resetSound",
    "unknownSound",
    "upSound",
    "warningSound",
    "globalMute",
    "muteAlerts"
]

# Add the sound keys to the dashboard if they currently exist
# globalMute is uniq to dashboards and not elements
for dashboard_key in _sound_keys:
    if dashboard_key in existing_dashboard:
        if existing_dashboard[dashboard_key] == "":
            logger.warning(f"Deleting {dashboard_key}:{existing_dashboard.pop(dashboard_key)} as it is empty")
        else:
            migrated_dashboard[dashboard_key] = existing_dashboard.pop(dashboard_key)

        if 'dashboards-data' in str(migrated_dashboard[dashboard_key]):
            logger.warning(f"Renaming {dashboard_key}:{migrated_dashboard[dashboard_key]} for dashboards-sound")
            migrated_dashboard[dashboard_key] = migrated_dashboard[dashboard_key].replace('dashboards-data', 'dashboards-sound')

# Element keys to migrate
_element_keys = [
    "type",
    "title",
    "rect",
    "rotation"
]

# Option keys
_options_keys = [
    "audioSource",
    "backgroundColor",
    "boldText",
    "fontColor",
    "fontSize",
    "image",
    "leftArrow",
    "linkURL",
    "objectAttr",
    "objectAttrMatch",
    "objectAttrNoMatch",
    "objectName",
    "objectType",
    "rightArrow",
    "source",
    "strokeColor",
    "strokeWidth",
    "svg",
    "text",
    "textAlign",
    "textVerticalAlign",
    "timeZone"
]

# Stuff we want to keep in the data file but probably don't have any code associated with them in v3
_options_keys_to_keep_but_are_unused = [
    "criticalAcknowledgedImage",
    "criticalAcknowledgedStrokeColor",
    "criticalImage",
    "criticalStrokeColor",
    "criticalSvg",
    "dynamicText",
    "dynamicText2",
    "dynamicText2Structure",
    "okImage",
    "okStrokeColor",
    "okSvg",
    "unknownAcknowledgedImage",
    "unknownAcknowledgedStrokeColor",
    "unknownImage",
    "unknownStrokeColor",
    "unknownSvg",
    "warningAcknowledgedImage",
    "warningAcknowledgedStrokeColor",
    "warningImage",
    "warningStrokeColor",
    "warningSvg",
]

# Add the sound keys to unused option keys
# globalMute is uniq to dashboards and not elements
_sound_keys.remove('globalMute')
_options_keys_to_keep_but_are_unused.extend(_sound_keys)
# Add the unused option keys to option keys
_options_keys.extend(_options_keys_to_keep_but_are_unused)

# Type field value subsitution map
type_replace = {
    'iframe-video': 'video',
    'audio-stream': 'audio',
    'static-image': 'image'
}

# options key subsitution map new name: old name
options_replace = {
    'objectAttr': 'checkDataSelection',
    'objectAttrMatch': 'checkDataPattern',
    'objectAttrNoMatch': 'checkDataDefault'
}

# Iterate though all the elements
migrated_dashboard['elements'] = []
for element in existing_dashboard.get('elements', []):
    new_element = {}
    # Iterate through all the element keys
    for element_key in _element_keys:
        # update only if the key is in the template
        if element_key in element:
            # Keep the title so we know which element has leftovers
            if element_key == "title":
                new_element[element_key] = element[element_key]
            # Do a substitution with type
            elif element_key == 'type' and element.get('type', '') in type_replace:
                logger.success(
                    f"Replacing Element {element_key} value {element['type']} with {type_replace[element['type']]}")
                new_element[element_key] = type_replace[element['type']]
                element.pop(element_key)
            else:
                new_element[element_key] = element.pop(element_key)

    # Now option replacements
    if 'options' in element:
        new_element['options'] = {}
        for option_key in _options_keys:
            # We delete empty stuff but continue so if other things need to be added back they can be
            if option_key in element['options'] and element['options'][option_key] == "":
                logger.warning(f"Deleting {option_key}:{element['options'].pop(option_key)} as it is empty")

            # If the option key is font size look for alt font size fields in existing option
            if option_key == 'fontSize':
                if option_key in element['options']:
                    new_element['options'][option_key] = element['options'].pop(option_key)
                    element['options'].pop('statusFontSize', '')
                    element['options'].pop('nameFontSize', '')
                elif 'statusFontSize' in element['options']:
                    logger.success(
                        f"Replacing Element Options key:value 'statusFontSize:{element['options']['statusFontSize']}' with the replacement key 'fontSize' and existing value")
                    new_element['options']['fontSize'] = element['options'].pop('statusFontSize')
                    element['options'].pop('nameFontSize', '')
                elif 'nameFontSize' in element['options']:
                    logger.success(
                        f"Replacing Element Options key:value 'nameFontSize:{element['options']['nameFontSize']}' with the replacement key 'fontSize' and existing value")
                    new_element['options']['fontSize'] = element['options'].pop('nameFontSize')

            # If the option is related to the host or service called handle it here
            elif option_key == 'objectName':
                # if the filter is None or empty
                if element['options'].get('filter', '') is None or element['options'].get('filter', None) == "":
                    element['options'].pop('filter')
                # if we have a filter then we should use the filter
                if 'filter' in element['options']:
                    logger.success(
                        f"Replacing Element Options key:value 'filter:{element['options']['filter']}' with the replacement key '{option_key}' and existing value")
                    new_element['options']['objectName'] = element['options'].pop('filter')
                    # if we use a filter then we need to adjust the objectType to suit
                    # we use objectType over selection as selection has been merged with objectType
                    if 'service' in element['options'].get('objectType', ''):
                        new_element['options']['objectType'] = "servicefilter"
                    elif 'host' in element['options'].get('objectType', ''):
                        new_element['options']['objectType'] = "hostfilter"
                    else:
                        logger.critical(
                            f"aborting: unable to determine filter type from objectType:{element['options'].get('objectType', 'objectType key does not exist')}")
                        exit()
                    logger.warning(
                        f"Deleting objectType value {element['options'].pop('objectType', None)}, chose to use filter value instead and need objectType filter version instead of original")
                    if 'id' in element['options']:
                        logger.warning(
                            f"Deleting id value {element['options'].pop('id', None)}, chose to use filter value instead")
                    if 'objectName' in element['options']:
                        logger.warning(
                            f"Deleting id value {element['options'].pop('objectName', None)}, chose to use filter value instead")
                # We don't have a filter, try the objectName
                elif 'objectName' in element['options']:
                    logger.success(
                        f"Replacing Element Options key:value 'id:{element['options']['objectName']}' with the replacement key '{option_key}' and existing value")
                    new_element['options']['objectName'] = element['options'].pop('objectName')
                    new_element['options']['objectType'] = element['options'].pop('objectType')
                # We don't have a filter, try the id
                elif 'id' in element['options']:
                    logger.success(
                        f"Replacing Element Options key:value 'id:{element['options']['id']}' with the replacement key '{option_key}' and existing value")
                    new_element['options']['objectName'] = element['options'].pop('id')
                    new_element['options']['objectType'] = element['options'].pop('objectType')
                logger.warning(
                    f"Deleting selection value {element['options'].pop('selection', None)}, we use objectType over selection as selection has been merged with objectType")
                
            # Skipping objectType as it will be set with objectName
            elif option_key == 'objectType':
                pass
            
            # If the option key is in existing options copy the value
            elif option_key in element['options']:
                new_element['options'][option_key] = element['options'].pop(option_key)

            # If the option key is in the replacement list and the old key exist copy value
            elif option_key in options_replace and options_replace[option_key] in element['options']:
                logger.success(
                    f"Replacing Element Options key:value '{options_replace[option_key]}:{element['options'][options_replace[option_key]]}' with the replacement key '{option_key}' and existing value")
                new_element['options'][option_key] = element['options'].pop(options_replace[option_key])

            # Rename the sound directories
            if 'dashboards-data' in str(new_element['options'].get(option_key, '')) and 'Sound' in option_key:
                logger.warning(f"Renaming option {option_key}:{new_element['options'][option_key]} for dashboards-sound")
                new_element['options'][option_key] = new_element['options'][option_key].replace('dashboards-data', 'dashboards-sound')

        migrated_dashboard['elements'].append(new_element)    

if args.live:
    # Remove the current dashboard ready for replacement, doing this just before saving as we are trying to migrate in place
    if os.path.isfile(f"{args.dashboard_dir}{dashboard_name}"):
        os.remove(f"{args.dashboard_dir}{dashboard_name}")

    with open(f"{args.dashboard_dir}{dashboard_name}", "w") as f:
        json.dump(migrated_dashboard, f, indent=4, sort_keys=True)
else:
    logger.debug(json.dumps(migrated_dashboard))

logger.error(f"Remaining dashboard: \n{existing_dashboard}")
