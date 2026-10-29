"""Entrada passiva do 1189:8842/MI_01 via Windows Raw Input.

Não abre HIDAPI, não escreve no dispositivo e não bloqueia entrada do Windows.
Filtra a origem ANTES de interpretar teclado/mouse. Outros teclados são ignorados.
"""
import ctypes as c
from ctypes import wintypes as w
import re
import struct
import sys
from threading import Event, Thread, current_thread
import uuid

from input_events import InputDecoder


def is_littletec(path):
    return bool(re.search(r'vid_1189&pid_8842(?:[&#])', path, re.I) and re.search(r'&mi_01(?:[&#])', path, re.I))


class RawInputMonitor:
    def __init__(self, emit, trace=None):
        self.emit = emit
        self.trace = trace
        self.decoder = InputDecoder()
        self.ready = Event()
        self.thread = None
        self.hwnd = None
        self.error = None
        self.warnings = 0
        self.devices = {}
        self.names = {}
        self.preparsed = {}

    def start(self):
        if sys.platform != 'win32':
            raise RuntimeError('Entrada ao vivo requer a ponte Windows.')
        if self.thread and self.thread.is_alive():
            return
        self.ready.clear()
        self.error = None
        self.thread = Thread(target=self._run, name='LittleTec-RawInput', daemon=True)
        self.thread.start()
        if not self.ready.wait(5):
            raise RuntimeError('A entrada ao vivo não iniciou no prazo.')
        if self.error:
            raise RuntimeError(self.error)

    def stop(self):
        if self.hwnd:
            self.user.PostMessageW(self.hwnd, 0x10, 0, 0)
        if self.thread and self.thread is not current_thread():
            self.thread.join(timeout=5)

    def status(self):
        return {'ready':bool(self.thread and self.thread.is_alive() and self.hwnd),
                'devices':list(self.devices.values()), 'error':self.error, 'unsupportedReports':self.warnings,
                'source':'windows-raw-input', 'exclusive':False}

    def _apis(self):
        self.user = c.WinDLL('user32', use_last_error=True)
        self.kernel = c.WinDLL('kernel32', use_last_error=True)
        self.hid = c.WinDLL('hid', use_last_error=True)
        ptr = c.c_void_p
        uint = c.c_uint
        self.user.DefWindowProcW.argtypes = [ptr,uint,c.c_size_t,c.c_ssize_t]
        self.user.DefWindowProcW.restype = c.c_ssize_t
        self.user.CreateWindowExW.argtypes = [uint,w.LPCWSTR,w.LPCWSTR,uint,c.c_int,c.c_int,c.c_int,c.c_int,ptr,ptr,ptr,ptr]
        self.user.CreateWindowExW.restype = ptr
        self.user.RegisterClassExW.argtypes = [ptr]
        self.user.RegisterClassExW.restype = c.c_ushort
        self.user.UnregisterClassW.argtypes = [w.LPCWSTR,ptr]
        self.user.GetRawInputData.argtypes = [ptr,uint,ptr,c.POINTER(uint),uint]
        self.user.GetRawInputData.restype = uint
        self.user.GetRawInputDeviceInfoW.argtypes = [ptr,uint,ptr,c.POINTER(uint)]
        self.user.GetRawInputDeviceInfoW.restype = uint
        self.user.GetRawInputDeviceList.argtypes = [ptr,c.POINTER(uint),uint]
        self.user.GetRawInputDeviceList.restype = uint
        self.user.RegisterRawInputDevices.argtypes = [ptr,uint,uint]
        self.user.RegisterRawInputDevices.restype = w.BOOL
        self.user.PostMessageW.argtypes = [ptr,uint,c.c_size_t,c.c_ssize_t]
        self.user.DestroyWindow.argtypes = [ptr]
        self.user.GetMessageW.argtypes = [c.POINTER(w.MSG),ptr,uint,uint]
        self.user.GetMessageW.restype = c.c_int
        self.user.TranslateMessage.argtypes = [c.POINTER(w.MSG)]
        self.user.DispatchMessageW.argtypes = [c.POINTER(w.MSG)]
        self.user.DispatchMessageW.restype = c.c_ssize_t
        self.kernel.GetModuleHandleW.argtypes = [w.LPCWSTR]
        self.kernel.GetModuleHandleW.restype = ptr
        self.hid.HidP_GetUsages.argtypes = [c.c_int,c.c_ushort,c.c_ushort,c.POINTER(c.c_ushort),c.POINTER(c.c_ulong),ptr,ptr,c.c_ulong]
        self.hid.HidP_GetUsages.restype = c.c_long

    def _name(self, handle):
        if handle not in self.names:
            size = c.c_uint()
            if self.user.GetRawInputDeviceInfoW(handle, 0x20000007, None, c.byref(size)) == 0xffffffff:
                return ''
            name = c.create_unicode_buffer(size.value+1)
            if self.user.GetRawInputDeviceInfoW(handle, 0x20000007, name, c.byref(size)) == 0xffffffff:
                return ''
            self.names[handle] = name.value
        return self.names[handle]

    def _refresh(self):
        class Device(c.Structure):
            _fields_ = [('handle',c.c_void_p),('kind',c.c_uint)]
        size = c.c_uint()
        if self.user.GetRawInputDeviceList(None,c.byref(size),c.sizeof(Device)) == 0xffffffff:
            raise c.WinError(c.get_last_error())
        items = (Device*(size.value+8))()
        size.value = len(items)
        count = self.user.GetRawInputDeviceList(items,c.byref(size),c.sizeof(Device))
        if count == 0xffffffff:
            return
        devices = {}
        for item in items[:count]:
            if not is_littletec(self._name(item.handle)):
                continue
            info = c.create_string_buffer(32)
            struct.pack_into('<I',info,0,32)
            length = c.c_uint(32)
            self.user.GetRawInputDeviceInfoW(item.handle,0x2000000b,info,c.byref(length))
            devices[item.handle] = {'kind':{0:'mouse',1:'keyboard',2:'consumer'}.get(item.kind,'other'),
                                    'usagePage':struct.unpack_from('<H',info,20)[0] if item.kind==2 else 1,
                                    'usage':struct.unpack_from('<H',info,22)[0] if item.kind==2 else 6 if item.kind==1 else 2}
        self.devices = devices

    def _consumer_usages(self, handle, report):
        if handle not in self.preparsed:
            length = c.c_uint()
            self.user.GetRawInputDeviceInfoW(handle,0x20000005,None,c.byref(length))
            if not 0 < length.value < 1_000_000:
                raise ValueError('Descritor HID indisponível.')
            data = c.create_string_buffer(length.value)
            if self.user.GetRawInputDeviceInfoW(handle,0x20000005,data,c.byref(length)) == 0xffffffff:
                raise c.WinError(c.get_last_error())
            self.preparsed[handle] = data
        usages = (c.c_ushort*128)()
        count = c.c_ulong(len(usages))
        buffer = c.create_string_buffer(report,len(report))
        status = self.hid.HidP_GetUsages(0,0x0c,0,usages,c.byref(count),self.preparsed[handle],buffer,len(report)) & 0xffffffff
        if status != 0x00110000:
            raise ValueError(f'Coleção de mídia não interpretada: {status:08x}.')
        return list(usages[:count.value])

    def _input(self, parameter):
        header_size = 8+c.sizeof(c.c_void_p)*2
        length = c.c_uint()
        self.user.GetRawInputData(parameter,0x10000003,None,c.byref(length),header_size)
        if not header_size <= length.value <= 1_000_000:
            return
        buffer = c.create_string_buffer(length.value)
        if self.user.GetRawInputData(parameter,0x10000003,buffer,c.byref(length),header_size) == 0xffffffff:
            return
        kind = struct.unpack_from('<I',buffer)[0]
        handle = int.from_bytes(buffer.raw[8:8+c.sizeof(c.c_void_p)],'little')
        if not is_littletec(self._name(handle)):
            return  # Não interpretar nem guardar entrada de outros dispositivos.
        data = buffer.raw[header_size:length.value]
        if self.trace:
            self.trace({'kind':kind,'data_hex':data.hex()})
        if kind == 1 and len(data) >= 16:
            scan, flags, _, vk = struct.unpack_from('<HHHH',data)
            events = self.decoder.keyboard(handle,scan,flags,vk)
        elif kind == 0:
            events = self.decoder.mouse(handle,data)
        elif kind == 2 and len(data) >= 8:
            size,count = struct.unpack_from('<II',data)
            if size == 0 or count>512 or size*count>len(data)-8:
                raise ValueError('RAWHID incompleto.')
            events = []
            for offset in range(count):
                report = data[8+offset*size:8+(offset+1)*size]
                events.extend(self.decoder.media(handle,self._consumer_usages(handle,report)))
        else:
            events = []
        for event in events:
            self.emit(event)

    def _run(self):
        atom = None
        instance = None
        registrations = None
        name = 'LittleTecLive_'+uuid.uuid4().hex
        try:
            self._apis()
            procedure = c.WINFUNCTYPE(c.c_ssize_t,c.c_void_p,c.c_uint,c.c_size_t,c.c_ssize_t)
            class WindowClass(c.Structure):
                _fields_ = [('cbSize',c.c_uint),('style',c.c_uint),('proc',procedure),('classExtra',c.c_int),('windowExtra',c.c_int),
                            ('instance',c.c_void_p),('icon',c.c_void_p),('cursor',c.c_void_p),('background',c.c_void_p),
                            ('menu',w.LPCWSTR),('name',w.LPCWSTR),('smallIcon',c.c_void_p)]
            class Registration(c.Structure):
                _fields_ = [('page',c.c_ushort),('usage',c.c_ushort),('flags',c.c_uint),('target',c.c_void_p)]
            @procedure
            def callback(hwnd,message,wp,lp):
                try:
                    if message == 0xff:
                        self._input(lp)
                    elif message == 0xfe:
                        target = is_littletec(self._name(lp))
                        if wp == 2:
                            self.decoder.remove(lp)
                            self.names.pop(lp,None)
                            self.preparsed.pop(lp,None)
                        self._refresh()
                        if target:
                            self.emit({'kind':'device','phase':'connect' if wp==1 else 'disconnect'})
                    elif message == 0x10:
                        self.user.DestroyWindow(hwnd)
                        return 0
                    elif message == 2:
                        self.hwnd = None
                        self.user.PostQuitMessage(0)
                        return 0
                except Exception:
                    self.warnings += 1
                return self.user.DefWindowProcW(hwnd,message,wp,lp)
            instance = self.kernel.GetModuleHandleW(None)
            window_class = WindowClass(c.sizeof(WindowClass),0,callback,0,0,instance,None,None,None,None,name,None)
            atom = self.user.RegisterClassExW(c.byref(window_class))
            if not atom:
                raise c.WinError(c.get_last_error())
            self.hwnd = self.user.CreateWindowExW(0,name,'LittleTec Live',0,0,0,0,0,None,None,instance,None)
            if not self.hwnd:
                raise c.WinError(c.get_last_error())
            registrations = (Registration*3)(Registration(1,6,0x2100,self.hwnd),Registration(1,2,0x2100,self.hwnd),Registration(0x0c,1,0x2100,self.hwnd))
            if not self.user.RegisterRawInputDevices(registrations,3,c.sizeof(Registration)):
                raise c.WinError(c.get_last_error())
            self._refresh()
            self.ready.set()
            message = w.MSG()
            while True:
                result = self.user.GetMessageW(c.byref(message),None,0,0)
                if result == 0:
                    break
                if result == -1:
                    raise c.WinError(c.get_last_error())
                self.user.TranslateMessage(c.byref(message))
                self.user.DispatchMessageW(c.byref(message))
        except Exception as error:
            self.error = str(error)
        finally:
            if registrations is not None:
                for registration in registrations:
                    registration.flags = 1
                    registration.target = None
                self.user.RegisterRawInputDevices(registrations,3,c.sizeof(registrations[0]))
            if self.hwnd:
                self.user.DestroyWindow(self.hwnd)
            self.hwnd = None
            if atom:
                self.user.UnregisterClassW(name,instance)
            self.ready.set()
