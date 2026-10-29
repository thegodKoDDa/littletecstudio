"""Monitor compartilhado, buffer limitado e leases por aba. Sem envio USB."""
from collections import deque
import time
from threading import Condition, Event, Lock, Thread

from input_events import ActionMatcher


class LiveInput:
    def __init__(self, profile_provider, factory=None):
        self.profile_provider = profile_provider
        self.factory = factory
        self.monitor = None
        self.condition = Condition()
        self.lock = Lock()
        self.clients = {}
        self.buffer = deque(maxlen=512)
        self.sequence = 0
        self.matcher = ActionMatcher()
        self.closed = Event()
        self.sweeper = None

    def emit(self, event):
        with self.condition:
            matched = self.matcher.match(event,self.profile_provider())
            self.sequence += 1
            self.buffer.append(dict(matched,id=self.sequence,at=round(time.time()*1000)))
            self.condition.notify_all()

    def _status(self):
        return self.monitor.status() if self.monitor else {'ready':False,'devices':[],'error':None}

    def start(self, client):
        with self.lock:
            if not self.monitor:
                if self.factory is None:
                    from raw_input_windows import RawInputMonitor
                    self.factory = RawInputMonitor
                self.monitor = self.factory(self.emit)
            self.monitor.start()
            self.clients[client] = time.monotonic()+15
            if not self.sweeper:
                self.sweeper = Thread(target=self._expire,name='LittleTec-live-leases',daemon=True)
                self.sweeper.start()
            with self.condition:
                cursor = self.sequence
            return {'live':dict(self._status(),client=client,cursor=cursor)}

    def poll(self, client, cursor, wait_ms=700):
        with self.lock:
            if client not in self.clients:
                raise ValueError('A sessão ao vivo expirou. Ative novamente.')
            self.clients[client] = time.monotonic()+15
            monitor = self.monitor
        with self.condition:
            if self.sequence <= cursor and not self.closed.is_set():
                self.condition.wait(min(max(wait_ms,0),1000)/1000)
            events = [event for event in self.buffer if event['id']>cursor]
            lost = bool(self.buffer and cursor<self.buffer[0]['id']-1)
            next_cursor = self.sequence
        return {'live':dict(monitor.status(),client=client,cursor=next_cursor,lost=lost,mappingAvailable=self.profile_provider() is not None),'events':events}

    def stop(self, client):
        with self.lock:
            self.clients.pop(client,None)
            if not self.clients and self.monitor:
                self.monitor.stop()
                self.monitor = None
                self.matcher = ActionMatcher()
        return {'live':{'ready':False,'devices':[],'client':client}}

    def _expire(self):
        while not self.closed.wait(3):
            with self.lock:
                now = time.monotonic()
                self.clients = {client:deadline for client,deadline in self.clients.items() if deadline>=now}
                if not self.clients and self.monitor:
                    self.monitor.stop()
                    self.monitor = None
                    self.matcher = ActionMatcher()

    def close(self):
        self.closed.set()
        with self.condition:
            self.condition.notify_all()
        with self.lock:
            self.clients.clear()
            if self.monitor:
                self.monitor.stop()
                self.monitor = None
