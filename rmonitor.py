#!/usr/bin/python

import json
import socket
import logging
import datetime
import tornado.iostream
import tornado.httpclient

zero = datetime.datetime(1900, 1, 1, 0, 0, 0)

class Message(object):
    pass

class Init(Message):
    def __init__(self, tokens):
        self.timeofday = tokens[1]

    def __repr__(self):
        return '<Init timeofday=%s>' % (self.timeofday)

class Run(Message):
    def __init__(self, tokens):
        self.id = tokens[1].strip('"')
        self.name= tokens[2].strip('"')

    def __repr__(self):
        return '<Run id=%s, name=%s>' % (self.id, self.name)

class Comp(Message):
    def __init__(self, tokens):
        self.regno = tokens[1].strip('"')
        self.number = tokens[2].strip('"')
        self.firstName = tokens[4].strip('"')
        self.lastName = tokens[5].strip('"')
        self.classId = tokens[7]

    def __repr__(self):
        return '<Comp regno=%s, number=%s, classId=%s, firstName=%s, lastName=%s>' % (self.regno, self.number, self.classId, self.firstName, self.lastName)

class Race(Message):
    def __init__(self, tokens):
        self.pos = int(tokens[1])
        self.regno = tokens[2].strip('"')
        if tokens[3]:
            self.lap = int(tokens[3])
        else:
            self.lap = 0
        ts = tokens[4].strip('"')
        if '.' in ts:
            self.ts = datetime.datetime.strptime(ts, '%H:%M:%S.%f') - zero
        else:
            self.ts = datetime.datetime.strptime(ts, '%H:%M:%S') - zero

    def __repr__(self):
        return '<Race pos=%d, regno=%s, lap=%d, ts=%s>' % (self.pos, self.regno, self.lap, self.ts)


def parse(line):
    tokens = line.split(',')
    #if len(tokens) < 2:
    #    raise Exception("Incorrect line")

    if tokens[0] == '$I':
        return Init(tokens)
    elif tokens[0] == '$B':
        return Run(tokens)
    elif tokens[0] == '$A':
        return Comp(tokens)
    elif tokens[0] == '$G':
        return Race(tokens)


class RMonitorClient(object):
    def __init__(self, accountID, callback=None):
        self.callback = callback
        self.httpclient = tornado.httpclient.AsyncHTTPClient()
        self.httpclient.fetch('http://api.race-monitor.com/Info/WebRaceList?accountID=%s&seriesID=0&raceID=0' % (accountID), self.connect)

    def connect(self, response):
        if response.error:
            raise response.error

        self.config = json.loads(response.body)
        self.current_race = self.config['CurrentRaces'][0]

        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
        self.stream = tornado.iostream.IOStream(s)
        self.stream.connect((self.current_race['IPAddress'], 50000), self.join)

    def join(self):
        join_str = '$join,%s,%s\n' % (self.current_race['Instance'], self.config['LiveTimingToken'])
        #print join_str.encode('utf-8')
        self.stream.write(join_str.encode('utf-8'))
        self.stream.read_until('\n', self.on_line)

    def on_line(self, data):
        try:
            data = data.rstrip()
            #print 'Got data', data
            msg = parse(data)
            if msg:
                #print 'Msg:', msg
                if self.callback:
                    self.callback(msg)

            self.stream.read_until('\n', self.on_line)
        except Exception as e:
            logging.exception(e)
            self.stream.close()

class RMonitorFile(object):
    def __init__(self, filename, callback=None):
        self.callback = callback
        self.f = open(filename, 'r')
        tornado.ioloop.IOLoop.current().add_callback(self.on_file)

    def on_file(self):
        try:
            data = self.f.readline().rstrip()
            #print 'Got data', data
            msg = parse(data)
            if msg:
                #print 'Msg:', msg
                if self.callback:
                    self.callback(msg)

            tornado.ioloop.IOLoop.current().call_later(0.1, self.on_file)
        except Exception as e:
            logging.exception(e)
        
        

if __name__ == "__main__":
    import sys
    for line in sys.stdin:
        line = line.rstrip()
        msg = parse(line)
        if msg:
            print msg
        
