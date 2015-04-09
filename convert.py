#!/usr/bin/python

import json
import sys
from pprint import pprint

if len(sys.argv) != 2:
    print "Usage: %s <filename>" % sys.argv[0]

with open(sys.argv[1], 'r') as f:
    data = json.load(f)

participants = {}
lapCount = data[u'lapchart'][u'laps'][-1] + 1

for p in data[u'lapchart'][u'participants']:
    participant = {
        u'name': p[u'name'],
        u'placing': {},
        u'pitstops': [],
    }

    participants[p[u'startNumber']] = participant

for pos in data[u'lapchart'][u'positions']:
    lap_num = 1
    for lap in pos:
        #print lap_num, lap
        participants[lap[u'startNumber']][u'placing'][lap_num] = lap[u'position']
        lap_num += 1

out = {u'lapCount': lapCount,
       u'laps': [],
       u'lapped': [],
       u'safety': []
}

for p in participants.itervalues():
    placing = []

    for lap in p[u'placing'].iterkeys():
        placing.append(p[u'placing'][lap])

    out[u'laps'].append({
            u'name': p[u'name'],
            u'placing': placing,
            u'pitstops': [],
        })
    

out[u'event'] = data[u'session'][u'name']
out[u'datetime'] = data[u'session'][u'dateTime']
print json.dumps(out)
