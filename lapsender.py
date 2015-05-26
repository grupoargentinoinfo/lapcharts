#!/usr/bin/python

from os import path as op
import datetime
from tornado import web, ioloop, iostream
from tornadio2 import SocketConnection, TornadioRouter, SocketServer
import rmonitor


ROOT = op.normpath(op.dirname(__file__))

class Session(object):
    def __init__(self, rmclient):
        self.rmclient = rmclient
        self.rmclient.callback = self.on_msg
        self.racers = {}
        self.comps = {}
        self.laps = {}
        self.last_lap = 0
        self.leader_time = None

    def on_msg(self, msg):
        try:
            #print 'Session.on_msg:' , msg
            if isinstance(msg, rmonitor.Comp):
                self.racers[msg.regno] = msg
                self.comps[msg.regno] = {}

            elif isinstance(msg, rmonitor.Run):
                self.name = msg.name
                #TODO broadcast to client
                print {regno: ' '.join((racer.firstName, racer.lastName)) for regno,racer in self.racers.iteritems()}
               

            elif isinstance(msg, rmonitor.Race):
                if msg.lap < 1:
                    return

                if msg.lap > self.last_lap and msg.pos == 1:
                    self.laps[msg.lap] = msg.ts
                    self.last_lap = msg.lap

                if not msg.lap in self.comps[msg.regno]:
                    gap = (msg.ts - self.laps[msg.lap]).total_seconds()
                    self.comps[msg.regno][msg.lap] = gap
                    #TODO broadcast
                    print (msg.regno, msg.lap, gap)
        except Exception as e:
            print e


class IndexHandler(web.RequestHandler):
    """Regular HTTP handler to serve the chatroom page"""
    def get(self):
        self.render('lapsender.html')


class SocketIOHandler(web.RequestHandler):
    def get(self):
        self.render('socket.io.js')


class LapsConnection(SocketConnection):
    participants = set()
    unique_id = 0

    @classmethod
    def get_username(cls):
        cls.unique_id += 1
        return 'User%d' % cls.unique_id

    def on_open(self, info):
        print 'Chat', repr(info)

        # Give user unique ID
        self.user_name = self.get_username()
        self.participants.add(self)

    def on_message(self, message):
        pass

    def on_close(self):
        self.participants.remove(self)

    def broadcast(self, msg):
        for p in self.participants:
            p.send(msg)


class RouterConnection(SocketConnection):
    __endpoints__ = {'/laps': LapsConnection}

    def on_open(self, info):
        print 'Router', repr(info)

# Create tornadio server
MyRouter = TornadioRouter(RouterConnection)

# Create socket application
application = web.Application(
    MyRouter.apply_routes([(r"/", IndexHandler),
                           (r"/socket.io.js", SocketIOHandler)]),
    flash_policy_port = 8843,
    flash_policy_file = op.join(ROOT, 'flashpolicy.xml'),
    socket_io_port = 8001,
    verify_remote_ip = False
)

if __name__ == "__main__":
    import logging
    logging.getLogger().setLevel(logging.DEBUG)

    # Create and start tornadio server
    #SocketServer(application)

    def printer(msg):
        print 'In cb:', msg

    rm = rmonitor.RMonitorClient(('127.0.0.1', 8005))
    session = Session(rm)

    ioloop.IOLoop.current().start()
