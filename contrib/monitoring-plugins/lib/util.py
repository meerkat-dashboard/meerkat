#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import pickle
import sys
import time
from loguru import logger

# Init logging
def init_logging(**kwargs):
    logFile = kwargs.get('logFile', '/var/log/icinga2/check_meerkat.log')
    debug = kwargs.get('debug', False)
    enableScreenDebug = kwargs.get('enableScreenDebug', False)
    logRotate = kwargs.get('logRotate', '1 day')
    logRetention = kwargs.get('logRetention', '3 days')

    if os.path.isfile(logFile):
        if not os.access(logFile, os.W_OK):
            print("Permissions error, unable to write to log file ({})".format(logFile))
            sys.exit(os.EX_CONFIG)
    # Because the library comes with a logger to std.err initalized and you want to get rid of that
    if not enableScreenDebug:
        logger.remove()
        # To debug or not to debug
    if debug:
        logger.add(logFile, colorize=True,
                   format="<blue>{time:YYYY-MM-DD HH:mm:ss.SSS}</blue> <yellow>({process.id})</yellow> <level>{level}</level>: {message}",
                   level="DEBUG", rotation=logRotate, retention=logRetention, compression="gz")
    else:
        logger.add(logFile, colorize=True,
                   format="<blue>{time:YYYY-MM-DD HH:mm:ss.SSS}</blue> <yellow>({process.id})</yellow> <level>{level}</level>: {message}",
                   level="INFO", rotation=logRotate, retention=logRetention, compression="gz")
    logger.debug(f"Log initalized with logFile: {logFile}, debug: {debug}, enablescreendebug: {enableScreenDebug}, logRotate: {logRotate}, logretention: {logRetention}")


def initRequestsCache(cache_file, expire_after = 30):
    """_summary_

    Args:
        cache_file (str): full path to cache file
        expire_after (int, optional): seconds till the cache expires. Defaults to 30.

    Returns:
        tuple: (bool, str) the boolan value is success/failure, the string is the message
    """    
    import requests_cache
    if os.path.isfile(cache_file):
        if not os.access(cache_file, os.W_OK):
            return (False, f"Permissions error, unable to write to requests cache file ({cache_file})")

    backend = requests_cache.SQLiteCache(cache_file, check_same_thread=False)
    requests_cache.install_cache(cache_file, backend=backend, expire_after=expire_after)
    requests_cache.patcher.remove_expired_responses()
    return (True, f'Successfully initalized requests cache file ({cache_file})')

class MonitoringPlugin:

    def __init__(self, logger, checktype = None):
        # The states of the server
        self.STATE_OK = 0            # We know it is OK and it isn't WARN or CRIT when set
        self.STATE_WARNING = 1       # We know it is WARN and isn't CRIT when set
        self.STATE_CRITICAL = 2      # We know it is CRIT
        self.STATE_UNKNOWN = 3       # We don't know anything yet
        self._current_state = self.STATE_UNKNOWN
        self._message = ""
        self._perfdata = ""
        self._type = checktype
        self._logger = logger

    def getStateLabel(self, state):
        label = "INVALID ({})".format(state)
        if state == self.STATE_OK:
            label = "OK"
        elif state == self.STATE_WARNING:
            label = "WARNING"
        elif state == self.STATE_CRITICAL:
            label = "CRITICAL"
        elif state == self.STATE_UNKNOWN:
            label = "UNKNOWN"
        self._logger.debug(f"Get state label for state ({state}): {label}")
        return label            

    def setOk(self):
        self._logger.debug("MonitoringPlugin.setOk")
        if self.state == self.STATE_UNKNOWN:
            self.state = self.STATE_OK

    def setWarning(self):
        self._logger.debug("MonitoringPlugin.setWarning")
        if self.state != self.STATE_CRITICAL:
            self.state = self.STATE_WARNING

    def setCritical(self):
        self._logger.debug("MonitoringPlugin.setCritical")
        self.state = self.STATE_CRITICAL

    def setState(self,state):
        self._logger.debug(f"MonitoringPlugin.setState({state})")
        if self.state == state:
            return state
        if self.state == self.STATE_UNKNOWN:
            self.state = state
        elif self.state < state:
            self.state = state
        return self.state

    def exit(self, exit_state = None, force_state = False):
        # If we pass in a new exit state then only change to it if we at a lower state
        if exit_state is not None:
            if self.state < exit_state or self.state == self.STATE_UNKNOWN or force_state:
                self.state = exit_state

        # Add the check type to the top of the message        
        if self._type:
            self._message = self._type + " check\n" + self._message

        # Set the prefix for the message
        self._message = "{}: {}".format(self.getStateLabel(self.state), self._message)
        
        # Add the pipe '|' before perfdata if we have any
        if self._perfdata != "":
            self._perfdata = "|" + self._perfdata

        # Print the message and perfdata, log the exit and exit with error code
        print(self._message + self._perfdata)
        self._logger.info("Exiting run with state {}".format(self._current_state))
        exit(self._current_state)

    @property
    def state(self):
        return self._current_state

    @state.setter
    def state(self, new_state):
        self._logger.debug("MonitoringPlugin@state.setter: State change old {old} new {new}".format(old=self._current_state, new=new_state))
        self._current_state = new_state
    
    @property
    def message(self):
        return self._message

    @message.setter
    def message(self, msg):
        # message only
        self._message += msg

    @message.deleter
    def message(self):
        self._message = ""

    def setMessage(self, msg, state = None, set_state = False, no_prefix = False):
        # If state isn't set then use the current state
        if state is None:
            state = self.state
        # change state 
        if set_state:
            self.setState(state)
        # message only
        if no_prefix:
            self._message += msg
        else:
            self._message += "{}: {}".format(self.getStateLabel(state).title(), msg)
            
    @property
    def performancedata(self):
        return self._perfdata
    
    @performancedata.setter
    def performancedata(self, data):
        self._perfdata += data

    @performancedata.deleter
    def performancedata(self):
        self._perfdata = ""

    # UOM's 
    # no unit specified - assume a number (int or float) of things (eg, users, processes, load averages)
    # s - seconds (also us, ms)
    # % - percentage
    # B - bytes (also KB, MB, TB)
    # c - a continous counter (such as bytes transmitted on an interface)
    def perfdata(self, label, value, unit_of_measurement = "", warn = "", crit = "", minimum = "", maximum = ""):
        self.setPerfdata(label, value, unit_of_measurement = "", warn = "", crit = "", minimum = "", maximum = "")
        
    def setPerfdata(self, label, value, unit_of_measurement = "", warn = "", crit = "", minimum = "", maximum = ""):
        self._perfdata += "{label}={value}{uom};{warn};{crit};{min};{max} ".format(label=label, value=value, uom=unit_of_measurement, warn=warn, crit=crit, min=minimum, max=maximum)

    def clearPerfdata(self):
        self._perfdata = ""

class AgeCache:
    def __init__(self, **kwargs):
        self._age = kwargs.get('age', 0)
        self._cacheDir = str(kwargs.get('cacheDir', '/tmp/'))

        if not self._has_dir(self._cacheDir):
            raise OSError
        
    def _has_dir(self, dir):
        if not os.path.isdir(dir) or not os.access(dir, os.W_OK):
            try:
                logger.error(f"Permissions error, unable to write to cache dir ({dir})")
            except:
                print(f"Permissions error, unable to write to cache dir ({dir})")
            return False
        return True
        
    def _has_file(self, file):
        if not os.path.isfile(file):
            return False
        if not os.access(file, os.R_OK):
            try:
                logger.error(f"Permissions error, unable to read from cache file ({file})")
            except:
                print(f"Permissions error, unable to read from cache file ({file})")
            return False
        return True

    def _get_cache_path(self, key):
        return self._cacheDir + str(key) + '.cache'

    @property
    def age(self):
        return self._age

    @age.setter
    def age(self, age):
        self._age = age

    def read(self, key, age = None):
        response = None
        if age is None:
            age = self._age
        file = self._get_cache_path(key)
        # File exist and the file modify time in relation to the current time is less than the cache age time (all in seconds)
        if self._has_file(file) and (time.time()-os.stat(file).st_mtime) < age:
            try:
                logger.info(f"Read from cache {file}")
                fh = open(file, 'rb')
                response = pickle.load(fh)
            except Exception as e:
                raise OSError
        logger.debug(f"Return from cache {file}: {response}")
        return response

    def write(self, key, payload):
        file = self._get_cache_path(key)
        try: 
            fh = open(file, 'wb')
            pickle.dump(payload, fh)
            logger.debug(f"Write to cache {file}: {payload}")
        except Exception as e:
            raise OSError

