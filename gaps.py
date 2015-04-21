#!/usr/bin/python

import os
import json
import time
import hashlib
import urllib2
from collections import defaultdict
from decimal import Decimal
from pprint import pprint

def cached_open(url):
    filename = hashlib.md5(url).hexdigest() + '.json'

    if os.path.exists(filename):
        return open(filename, 'r')

    f = open(filename, 'w')
    fu = urllib2.urlopen(url)
    f.write(fu.read())
    f.close()

    return open(filename, 'r')

id = '3441037'

handicaps = {
    u'4': '0',
    u'19': '15',
    u'6': '18.7',
    u'20': '21',
    u'13': '21.4',
    u'3': '38',
    u'21': '42.046',
    u'2': '50.390',
    u'11': '52.325',
    u'17': '53',
}


karts = {}

f = cached_open('http://mylaps.com/api/eventclassification?id=%s&perClass=' % (id))
classification = json.load(f)
for kart in classification[u'classification'][u'rows'][u'default']:
    finish_position = kart[u'link'].split('=')[-1]
    #print kart[u'driver'], finish_position

    f = cached_open('http://mylaps.com/api/eventlaptimes?id=%s&finishPosition=%s' % (id, finish_position))
    laps = json.load(f)

    ts = Decimal(handicaps[kart[u'start_number']])

    for lap in laps[u'laptimes']:
        lap_time = Decimal(lap[u'lapTime'])
        ts += lap_time
        lap[u'ts'] = ts

    kart[u'laps'] = laps[u'laptimes']

    karts[kart[u'start_number']] = kart

gaps = {}

laptimes = defaultdict(dict)
for team, kart in karts.iteritems():
    gaps[team] = []
    for lap in kart[u'laps']:
        laptimes[lap[u'lap']][team] = lap[u'ts']

        
for lap, times in laptimes.iteritems():
    lead_ts = Decimal(9999)
    for team, ts in times.iteritems():
        if ts < lead_ts:
            lead_ts = ts
    for team, ts in times.iteritems():
        gaps[team].append((lap, float(lead_ts - ts)))

print json.dumps([{'label': g, 'data': gaps[g]} for g in gaps])
#for g in gaps:
#    print g, gaps[g][-1][1]
