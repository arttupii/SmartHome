#!env python
# -*- coding: iso-8859-1 -*-
###########################################################################
# 
# File:            configuration.py
#
# License:         Donationware, see attached LICENSE file for more 
#                  information
#
# Author:          Olli Lammi (olammi@iki.fi)
#
# Version:         1.0c
#
# Date:            27.10.2011
#
# Description:     Configuration file class for dialEye.py
#                  
# Requirements:    Python interpreter 2.4 or newer (www.python.org)
#                  (tested with 2.4.3)
#
# Version history: ** 27.10.2011 v1.0c (Olli Lammi) **
#                  Base copied from taloLogger application. 
#
###########################################################################

# Imports

import sys, os, string


###########################################################################

# Classes

class Configurable:
    def __init__(self):
        self.modulename = ''

    def getModuleName(self):
        return self.modulename
    
    def setModuleName(self, mname):
        self.modulename = mname
        
    # returns a tuple with two lists both containing the
    # allowed normal and listed configuration keys that this
    # configurable allows
    @staticmethod
    def getAllowedConfigurationKeys(): pass

    # reads configuration conf and configurest itself
    # returns a tuple (stat, msg) where msg is possible
    # error message and stat is (1 = ok, 0 = error)
    def handleConfiguration(self, conf): pass

    # initializes the configurable with the given config ie. runs appropriate tests
    # to check if the configuration is semantically valid and all configured resources
    # work accordingly.
    # returns a tuple (stat, msg) where msg is possible error message
    # and stat is (1 = ok, 0 = error)
    def initConfiguration(self):
        return (1, '')

    # releases/closes the configurable with the given config ie. frees resources
    # allocated by the module.
    # returns a tuple (stat, msg) where msg is possible error message
    # and stat is (1 = ok, 0 = error)
    def releaseConfiguration(self):
        return (1, '')


class Configuration:
    def __init__(self):
        self.data = {}
        self.allowedkeys = []
        self.allowedlistkeys = []
        
    def addAllowedKeys(self, keys):
        for k in keys:
            self.allowedkeys.append(k)

    def addAllowedListKeys(self, keys):
        for k in keys:
            self.allowedlistkeys.append(k)

    def addConfigurable(self, cfable):
        (norm, lst) = cfable.getAllowedConfigurationKeys()
        self.addAllowedKeys(norm)
        self.addAllowedListKeys(lst)

    # load configuration file: tuple stat, msg: 0 = open/read error, -1 = invalid file, 1 = ok
    def loadFile(self, fname):
        try:
            inf = open(fname, 'r')
            lines = inf.readlines()
            inf.close()
        except:
            return (0, '')

        for line in lines:
            line = string.strip(string.split(line, '\n')[0])
            if len(line) <= 0 or line[0] == '#':
                continue

            if line[0] == '@':
                line = line[1:]
                lineparts = string.split(line, '=', 1)
                if len(lineparts) > 1:
                    module = ''
                    key = string.strip(lineparts[0])
                    if string.find(key, ':') >= 0:
                        [module, key] = string.split(key, ':', 1)
                        module = string.strip(module)
                        key = string.strip(key)
                    elif not key in self.allowedlistkeys:
                        return (-1, "Invalid configuration key: @" + key)
                    value = string.strip(lineparts[1])
                    if not self.data.has_key(module):
                        self.data[module] = {}
                    if not self.data[module].has_key(key):
                        self.data[module][key] = [] 
                    self.data[module][key].append(value)
                else:
                    return (-1, "Invalid configuration line: @" + line)
            else:
                lineparts = string.split(line, '=', 1)
                if len(lineparts) > 1:
                    module = ''
                    key = string.strip(lineparts[0])
                    if string.find(key, ':') >= 0:
                        [module, key] = string.split(key, ':', 1)
                        module = string.strip(module)
                        key = string.strip(key)
                    elif not key in self.allowedkeys:
                        return (-1, "Invalid configuration key: " + key)
                    value = string.strip(lineparts[1])
                    if not self.data.has_key(module):
                        self.data[module] = {}
                    self.data[module][key] = value
                else:
                    return (-1, "Invalid configuration line: " + line)

        return (1, '')

    def getData(self):
        return self.data

    def hasKey(self, key, module = ''):
        if not self.hasModule(module):
            return 0
        return self.data[module].has_key(key)

    def getValue(self, key, default, module = ''):
        if self.hasKey(key, module):
            return self.data[module][key]
        else:
            return default

    def setValue(self, key, value, module = ''):
        if not self.hasModule(module):
            self.data[module] = {}
        self.data[module][key] = value

    def isTrue(self, key, module = ''):
        if not self.hasKey(key, module):
            return 0
        if string.lower(self.data[module][key]) == 'true':
            return 1
        return 0
    
    def hasModule(self, module):
        return self.data.has_key(module)
