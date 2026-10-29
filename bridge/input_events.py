"""Eventos de entrada e associação às ações gravadas. Sem USB, GUI ou hooks globais."""
from collections import deque
import json
import struct
import time

MODIFIERS = ('Ctrl', 'Shift', 'Alt', 'Win', 'RightCtrl', 'RightShift', 'RightAlt', 'RightWin')
SCANS = {0x02+i: key for i, key in enumerate('1234567890')}
for start, row in ((0x10, 'QWERTYUIOP'), (0x1e, 'ASDFGHJKL'), (0x2c, 'ZXCVBNM')):
    SCANS.update({start+i: key for i, key in enumerate(row)})
SCANS.update({0x01:'Escape',0x0e:'Backspace',0x0f:'Tab',0x1c:'Enter',0x39:'Space',0x3a:'CapsLock',
              0x0c:'Minus',0x0d:'Equal',0x1a:'BracketLeft',0x1b:'BracketRight',0x2b:'Backslash',
              0x27:'Semicolon',0x28:'Quote',0x29:'Grave',0x33:'Comma',0x34:'Period',0x35:'Slash',
              0x46:'ScrollLock',0x45:'NumLock',0x56:'IntlBackslash',0x47:'Num7',0x48:'Num8',
              0x49:'Num9',0x4b:'Num4',0x4c:'Num5',0x4d:'Num6',0x4f:'Num1',0x50:'Num2',
              0x51:'Num3',0x52:'Num0',0x53:'NumDecimal',0x4a:'NumSubtract',0x4e:'NumAdd',0x37:'NumMultiply'})
EXTENDED = {0x1c:'NumEnter',0x35:'NumDivide',0x47:'Home',0x48:'Up',0x49:'PageUp',0x4b:'Left',
            0x4d:'Right',0x4f:'End',0x50:'Down',0x51:'PageDown',0x52:'Insert',0x53:'Delete',0x37:'PrintScreen',0x5d:'Menu'}
MEDIA_USAGES = {0xcd:'play_pause',0xb7:'stop',0xb6:'previous',0xb5:'next',0xe2:'mute',0xe9:'volume_up',
                0xea:'volume_down',0x6f:'brightness_up',0x70:'brightness_down',0x194:'computer',
                0x183:'media_player',0x192:'calculator',0x223:'browser_home',0x18a:'email',
                0x152:'bass_up',0x153:'bass_down',0x154:'treble_up',0x155:'treble_down',
                0x227:'browser_refresh',0x225:'browser_forward',0x224:'browser_back'}


def signature(action):
    return json.dumps(action, sort_keys=True, separators=(',', ':'))


class InputDecoder:
    """Estado só das coleções do LittleTec, nunca do teclado principal."""
    def __init__(self, clock=time.monotonic):
        self.modifiers = {}
        self.pressed = {}
        self.consumer = {}
        self.clock = clock
        self.released_modifiers = ([],0)

    def mods(self):
        active = set().union(*self.modifiers.values()) if self.modifiers else set()
        return [m for m in MODIFIERS if m in active]

    def keyboard(self, device, scan, flags, vk):
        if vk >= 255 or scan == 255:
            return []
        up, extended = bool(flags & 1), bool(flags & 2)
        modifier = ({0x1d:'RightCtrl' if extended else 'Ctrl',0x2a:'Shift',0x36:'RightShift',
                     0x38:'RightAlt' if extended else 'Alt',0x5b:'Win',0x5c:'RightWin'}).get(scan)
        token = (device, scan, extended, vk)
        current = self.modifiers.setdefault(device, set())
        key = '' if modifier else f'F{vk-0x70+1}' if 0x70<=vk<=0x87 else 'Pause' if vk==0x13 else (EXTENDED if extended else SCANS).get(scan)
        if up:
            action = self.pressed.pop(token, None)
            if modifier:
                self.released_modifiers = (self.mods(),self.clock())
                current.discard(modifier)
            if action:
                return [{'kind':'keyboard','phase':'release','action':action}]
            # Win+D observado: Windows omite D-down, entrega Win-up e D-up 5 ms depois.
            # Recuperar apenas com contexto de modificadores observado neste aparelho.
            previous,stamp = self.released_modifiers
            mods = self.mods() or (previous if self.clock()-stamp<=0.08 else [])
            if key == 'D' and mods == ['Win']:
                return [{'kind':'keyboard','phase':'press','action':{'type':'keyboard','steps':[{'key':key,'modifiers':mods}]},
                         'momentary':True,'observation':'release-context'}]
            return []
        repeat = token in self.pressed
        if modifier:
            current.add(modifier)
        if key is None:
            return []
        action = {'type':'keyboard','steps':[{'key':key,'modifiers':self.mods()}]}
        self.pressed[token] = action
        return [{'kind':'keyboard','phase':'repeat' if repeat else 'press','action':action}]

    def mouse(self, device, data):
        if len(data) < 24:
            raise ValueError('RAWMOUSE incompleto.')
        flags, buttons, wheel, dx, dy = struct.unpack_from('<H2xHh4xii', data)
        events = []
        for down, up, name in ((1,2,'left'),(4,8,'right'),(16,32,'middle')):
            token = (device, name)
            if buttons & down:
                action = {'type':'mouse','command':name,'modifiers':[m for m in self.mods() if m in ('Ctrl','Shift','Alt')]}
                self.pressed[token] = action
                events.append({'kind':'mouse','phase':'press','action':action})
            if buttons & up:
                action = self.pressed.pop(token, {'type':'mouse','command':name,'modifiers':[]})
                events.append({'kind':'mouse','phase':'release','action':action})
        if buttons & 0x400 and wheel:
            events.append({'kind':'mouse','phase':'press','action':{'type':'mouse','command':'wheel_up' if wheel>0 else 'wheel_down',
                           'modifiers':[m for m in self.mods() if m in ('Ctrl','Shift','Alt')]},'amount':abs(wheel)/120,'momentary':True})
        if dx or dy:
            events.append({'kind':'pointer','phase':'move','dx':dx,'dy':dy,'absolute':bool(flags & 1)})
        return events

    def media(self, device, usages):
        current = {code for code in usages if code in MEDIA_USAGES}
        previous = self.consumer.get(device, set())
        self.consumer[device] = current
        return ([{'kind':'media','phase':'release','action':{'type':'media','command':MEDIA_USAGES[code]}} for code in sorted(previous-current)] +
                [{'kind':'media','phase':'repeat' if code in previous else 'press','action':{'type':'media','command':MEDIA_USAGES[code]}} for code in sorted(current)])

    def remove(self, device):
        self.released_modifiers = ([],0)
        self.modifiers.pop(device, None)
        self.consumer.pop(device, None)
        self.pressed = {key:value for key,value in self.pressed.items() if key[0] != device}


class ActionMatcher:
    """Origem inferida da configuração realmente lida; camadas iguais não são adivinhadas."""
    def __init__(self):
        self.history = deque(maxlen=256)
        self.held = {}
        self.profile = None

    def match(self, event, profile, now=None):
        now = time.monotonic() if now is None else now
        if profile is not self.profile:
            self.profile = profile
            self.history.clear()
            self.held.clear()
        result = dict(event, targets=[], confidence='unmapped', origin='configured-action')
        action = event.get('action')
        if not action or not profile:
            return result
        key = signature(action)
        if event['phase'] == 'release':
            result['targets'] = self.held.pop(key, [])
        else:
            if action['type'] == 'keyboard':
                self.history.append((now, action['steps'][0]))
            for layer, actions in enumerate(profile['layers']):
                for position, mapped in enumerate(actions):
                    matches = mapped == action
                    if mapped['type'] == 'keyboard' and action['type'] == 'keyboard':
                        steps = mapped['steps']
                        history = [s for stamp,s in self.history if now-stamp <= 2 and (s['key'] or any(not v['key'] for v in steps))]
                        matches = len(history)>=len(steps) and history[-len(steps):] == steps
                        # Um modificador sozinho também pode ser prefixo de outro atalho.
                        if matches and not action['steps'][0]['key']:
                            mods = set(action['steps'][0]['modifiers'])
                            matches = not any(candidate['type']=='keyboard' and any(step['key'] and mods.issubset(step['modifiers']) for step in candidate['steps'])
                                              or candidate['type']=='mouse' and mods.issubset(candidate['modifiers'])
                                              for row in profile['layers'] for candidate in row)
                    if matches:
                        result['targets'].append({'layer':layer,'position':position})
            self.held[key] = result['targets']
        physical = {target['position'] for target in result['targets']}
        result['confidence'] = 'unique' if len(physical)==1 else 'ambiguous' if physical else 'unmapped'
        return result
