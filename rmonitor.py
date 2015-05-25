#!/usr/bin/python

import datetime

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
        self.id = tokens[1]
        self.name= tokens[2]

    def __repr__(self):
        return '<Run id=%s, name=%s>' % (self.id, self.name)

class Comp(Message):
    def __init__(self, tokens):
        self.regno = tokens[1]
        self.number = tokens[2]
        self.firstName = tokens[4]
        self.lastName = tokens[5]
        self.classId = tokens[7]

    def __repr__(self):
        return '<Comp regno=%s, number=%s, classId=%s, firstName=%s, lastName=%s>' % (self.regno, self.number, self.classId, self.firstName, self.lastName)

class Race(Message):
    def __init__(self, tokens):
        self.pos = int(tokens[1])
        self.regno = tokens[2]
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

if __name__ == "__main__":
    import sys
    for line in sys.stdin:
        line = line.rstrip()
        msg = parse(line)
        if msg:
            print msg
        
