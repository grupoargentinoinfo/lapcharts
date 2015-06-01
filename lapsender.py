#!/usr/bin/python

from os import path as op
import json
import logging
import datetime
from tornado import web, ioloop, iostream
import tornado.options
import tornadio2.persistent
from tornadio2 import SocketConnection, TornadioRouter, SocketServer
import rmonitor


ROOT = op.normpath(op.dirname(__file__))

# Monkeypatch TornadioWebSocketHandler
def check_origin(self, origin):
    return True

tornadio2.persistent.TornadioWebSocketHandler.check_origin = check_origin


class Session(object):
    def __init__(self, rmclient):
        self.rmclient = rmclient
        self.rmclient.callback = self.on_msg
        self.init_data()

    def init_data(self):
        self.racers = {}
        self.comps = {}
        self.laps = {}
        self.last_lap = 0
        self.leader_time = None

    def on_msg(self, msg):
        try:
            if isinstance(msg, rmonitor.Init):
                self.init_data()

            elif isinstance(msg, rmonitor.Comp):
                self.racers[msg.regno] = msg
                self.comps[msg.regno] = {}

            elif isinstance(msg, rmonitor.Run):
                self.name = msg.name
                #TODO broadcast to client
                racers = {regno: ' '.join((racer.firstName, racer.lastName)) for regno,racer in self.racers.iteritems()}
                logging.debug('Run %s %s', self.name, racers)
                LapsConnection.broadcast(self.get_data())

            elif isinstance(msg, rmonitor.Race):
                if msg.lap < 1:
                    return

                if msg.lap > self.last_lap and msg.pos == 1:
                    self.laps[msg.lap] = msg.ts
                    self.last_lap = msg.lap

                if not msg.lap in self.laps:
                    return

                if not msg.lap in self.comps[msg.regno]:
                    gap = (self.laps[msg.lap] - msg.ts).total_seconds()
                    self.comps[msg.regno][msg.lap] = gap
                    #TODO broadcast
                    logging.debug('%s', (msg.regno, msg.lap, gap))
                    LapsConnection.broadcast({'type': 'gap', 'data': (msg.regno, msg.lap, gap)})
        except Exception as e:
            logging.exception(e)

    def get_data(self):
        # data format
        # [{"data": [[1, -52.371], [2, -50.442], [3, -51.52], [4, -51.318], [135, -48.728]], "label": "11"},
        #racers = {regno: ' '.join((racer.firstName, racer.lastName)) for regno,racer in self.racers.iteritems()}
        data = []
        for racer in self.racers.itervalues():
            data.append({
                'regno': racer.regno,
                'label': ' '.join((racer.firstName, racer.lastName)),
                'data': [lap for lap in self.comps[racer.regno].iteritems()],
            })
        return {'type': 'init', 'data': data}


class IndexHandler(web.RequestHandler):
    """Regular HTTP handler to serve the chatroom page"""
    def get(self):
        self.render('lapsender.html')


class FileHandler(web.RequestHandler):
    def get(self, opt=None):
        print opt
        self.render(self.request.uri[1:])


class DataHandler(web.RequestHandler):
    def get(self):
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(session.get_data()))


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
        self.send(session.get_data())

    def on_message(self, message):
        pass

    def on_close(self):
        self.participants.remove(self)

    @staticmethod
    def broadcast(msg):
        for p in LapsConnection.participants:
            p.send(msg)


class RouterConnection(SocketConnection):
    __endpoints__ = {'/laps': LapsConnection}

    def on_open(self, info):
        print 'Router', repr(info)

if __name__ == "__main__":
    tornado.options.define('appid', default='165', help='RMonitor AppID')
    tornado.options.parse_command_line()

    # Create RaceMonitor client
    rm = rmonitor.RMonitorClient(tornado.options.options.appid)
    #rm = rmonitor.RMonitorFile('race.log')
    session = Session(rm)

    # Create tornadio server
    MyRouter = TornadioRouter(RouterConnection)

    # Create socket application
    application = web.Application(
        MyRouter.apply_routes([(r"/", IndexHandler),
                               (r"/data.json", DataHandler),
                               (r"/.*js", FileHandler),
                               (r"/.*css", FileHandler),
                               (r"/.*gif", FileHandler),
                              ]),
        flash_policy_port = 8843,
        flash_policy_file = op.join(ROOT, 'flashpolicy.xml'),
        socket_io_port = 8001,
        verify_remote_ip = False
    )

    # Create and start tornadio server
    SocketServer(application)
