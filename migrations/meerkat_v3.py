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

type_replace = {'iframe-video': 'video', 'audio-stream': 'audio', 'static-image': 'image'}
opt_replace = {'statusFontSize': 'fontSize', 'id': 'objectName'}

for element in dashboard_json.get('elements', []):
    if element.get('type') in type_replace:
        element['type'] = type_replace[element['type']]
    if 'options' in element:
        for key in list(element['options'].keys()):
            if key in opt_replace:
                element['options'][opt_replace[key]] = element['options'].pop(key)
        element['options'].pop('StrokeColor', None)  # Delete 'StrokeColor' key from options if it exists

if args.live:
    with open(f"{args.dashboard_dir}{dashboard_name}", "w") as f:
        json.dump(dashboard_json, f, indent=4, sort_keys=True)
else:
    logger.debug(json.dumps(dashboard_json))
