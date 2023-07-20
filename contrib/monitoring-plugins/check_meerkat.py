#!/usr/bin/env python3

import humanize
import json
import requests

from argparse import ArgumentParser
from datetime import datetime, timedelta
from dateutil.parser import parse
from loguru import logger

from lib.util import init_logging, MonitoringPlugin, initRequestsCache

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def getArgs():
    parser = ArgumentParser()
    parser.add_argument("--url", help="URL to Meekat server, eg: https://localhost:8080", required=True)

    parser.add_argument('--debug', action="store_true")
    parser.add_argument('--enable-screen-debug', action="store_true")
    parser.add_argument('--log-rotate', type=str, default='1 day')
    parser.add_argument('--log-retention', type=str, default='1 week')

    # Connection type
    subparser = parser.add_subparsers(title='Mode', dest='mode', help='Help for mode', required=True)

    # Modes
    subparserStatus = subparser.add_parser("status", help="Check Status")
    subparserStatus.add_argument('--events-received', type=int, help='Minimum number of events received from backends (where backend has event_streams to subscribe to) ', default=1)
    subparserStatus.add_argument('--events-age', type=int, help='Maximum age in seconds since last events received from backends (where backend has event_streams to subscribe to) ', default=15)

    args = parser.parse_args()
    return args

class Meerkat:
    def __init__(self, url, _args) -> None:
        self.url = url
        self.args = _args
        self._headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    
    def get(self, url, decode_json = False):
        return self.__request('GET', url, decode_json)

    def post(self, url, payload, decode_json = False):
        return self.__request('POST', url, payload, decode_json)
 
    def __request(self, reqtype, url, payload = None, decode_json: bool = True):
        try:
            logger.debug(f"Request to {url} using {reqtype}\n")
            if reqtype == 'GET':
                response = requests.get(url=url, headers=self._headers, verify=False)
            elif reqtype == 'POST':
                response = requests.post(url=url, headers=self._headers, json=payload, verify=False)
            else:
                logger.error(f"Meerkat request not GET or POST, this shouldn't happen.")
            logger.debug(f"Meerkat {reqtype} response {response}")
        except Exception as e:
            logger.error(f"Meerkat request error for {url}: {e}")

        # If we don't get a good error message then add a error but still return the result
        if response.status_code not in [200,201,202,300,301]:
            logger.error(f"Meerkat request bad return code for {url}. Response code: {response.status_code}\n Response text: \n{response.text}")
            plugin.setMessage(f"Meerkat request bad return code for http request to {url}. Response code: {response.status_code}", plugin.STATE_CRITICAL, True)
            plugin.exit()

        try:
            if decode_json:
                result = json.loads(response.text)
            else:
                result = response.text
        except Exception as e:
            result = response.text
            logger.error(f"Meerkat request parse error for {url}: {e}")
        logger.info(f"Meerkat {reqtype} response: {response}")
        return result
    
    def _getStatus(self):
        url = f'{self.url}/api/status'
        return self.get(url, True)     
    
    def _getDateTime(self, epoch, milliseconds = True):
        
        if epoch:
            _epoch = epoch
        else:
            return None
        
        try:
            if milliseconds:
                _epoch = epoch / 1000
            return datetime.fromtimestamp(_epoch)
        except Exception as e:
            logger.warning(f"Unable to parse epoch {epoch}")
            return None

    def _getDateTimeText(self, epoch, milliseconds = True, missing_val = ''):
        dt = self._getDateTime(epoch, milliseconds)
        if dt is None:
            return missing_val
        else:
            return dt


    def status(self):
        result = self._getStatus()
        # logger.debug(result)

        plugin.message = f"Info: Meerkat started at {self._getDateTimeText(result.get('meerkat', {}).get('start_time', None))}\n"
        logger.debug(result.get('meerkat', {}).get('start_time', None))
        for backend, details in result.get('backends', {}).items():
            plugin.message = f"\nBackend named '{backend}' of type {details.get('type', 'unknown')}\n"
            status_message = f"Status {details.get('status', 'unknown')}"
            if details.get('status_message', 'no status message'):
                status_message += f" - {details.get('status_message', 'no status message')}"
            if details.get('status', '') != 'working':
                plugin.setMessage(f"{status_message}\n", plugin.STATE_CRITICAL, True)
            else:
                plugin.setMessage(f"{status_message}\n", plugin.STATE_OK, True)

            if 'event_streams' in details.get('connections', {}):
                logger.debug("parsing event_streams")
                event_streams = details['connections']['event_streams']
                last_event_received = event_streams.get('last_event_received', None)
                if last_event_received is not None:
                    try:
                        logger.debug(f"datetime.now() [{datetime.now()}] - self._getDateTime(last_event_received)) [{self._getDateTime(last_event_received)}] = {datetime.now() - self._getDateTime(last_event_received)}")
                        if (datetime.now() - timedelta(seconds=self.args.events_age)) < self._getDateTime(last_event_received):
                            plugin.setMessage(f"Last event received {humanize.naturaltime(datetime.now() - self._getDateTime(last_event_received))} is less than threashold {self.args.events_age} seconds\n", plugin.STATE_OK, True)
                        else:
                            plugin.setMessage(f"Last event received {humanize.naturaltime(datetime.now() - self._getDateTime(last_event_received))} is more than threashold {self.args.events_age} seconds\n", plugin.STATE_CRITICAL, True)
                    except Exception as e:
                        plugin.message = f"Info: Last event received {self._getDateTimeText(last_event_received)}\n"
                
                received_count_1min = event_streams.get('received_count_1min', -1)
                if received_count_1min < self.args.events_received:
                    plugin.setMessage(f"Backend events received in the last minuite is {received_count_1min}\n", plugin.STATE_CRITICAL, True)
                else:
                    plugin.setMessage(f"Backend events received in the last minuite is {received_count_1min}\n", plugin.STATE_OK, True)


# Init args
args = getArgs()

# Init logging
init_logging(debug=args.debug, enableScreenDebug=args.enable_screen_debug, logFile='/var/log/icinga2/check_meerkat.log', logRotate=args.log_rotate, logRetention=args.log_retention)
logger.info("Processing Meerkat check with args [{}]".format(args))

# Init plugin
plugin = MonitoringPlugin(logger, args.mode)

# Run and exit
meerkat = Meerkat(args.url, args)
logger.debug("Running check for {}".format(args.mode))
eval('meerkat.{}()'.format(args.mode))
plugin.exit()
