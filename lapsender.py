#!/usr/bin/python

from os import path as op
import datetime
import socket
from tornado import web, ioloop, iostream
from tornadio2 import SocketConnection, TornadioRouter, SocketServer
import rmonitor


ROOT = op.normpath(op.dirname(__file__))


class RMonitorClient(object):
    def __init__(self, addr):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
        self.stream = tornado.iostream.IOStream(s)
        self.stream.connect(addr, self.join)

    def join(self):
        #self.stream.write('JOIN')
        self.read_until('\n', self.on_line)

    def on_line(self, data):
        print 'Got data', data



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
    SocketServer(application)
