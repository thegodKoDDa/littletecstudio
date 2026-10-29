from copy import deepcopy
import struct
import unittest
import json
from pathlib import Path

from input_events import InputDecoder, ActionMatcher
from raw_input_windows import is_littletec
from live_input import LiveInput


def profile():
    return {'layers':[[{'type':'none'} for _ in range(18)] for _ in range(3)]}


def key(name, modifiers=None):
    return {'type':'keyboard','steps':[{'key':name,'modifiers':modifiers or []}]}


class InputTests(unittest.TestCase):
    def test_only_the_input_interface_of_the_real_model_is_allowed(self):
        self.assertTrue(is_littletec(r'\\?\HID#VID_1189&PID_8842&MI_01&Col01#abc'))
        for path in (r'\\?\HID#VID_1189&PID_8842&MI_00#abc', r'\\?\HID#VID_1234&PID_8842&MI_01#abc',r'\\?\ACPI#keyboard'):
            self.assertFalse(is_littletec(path))

    def test_keyboard_keeps_original_modifiers_when_release_order_changes(self):
        decoder = InputDecoder()
        decoder.keyboard(1,0x1d,0,0x11)
        press = decoder.keyboard(1,0x2e,0,0x43)[0]
        decoder.keyboard(1,0x1d,1,0x11)
        release = decoder.keyboard(1,0x2e,1,0x43)[0]
        self.assertEqual(press['action'],key('C',['Ctrl']))
        self.assertEqual(release['action'],press['action'])
        self.assertEqual(release['phase'],'release')

    def test_right_modifiers_numpad_and_f24(self):
        decoder = InputDecoder()
        decoder.keyboard(1,0x1d,2,0x11)
        self.assertEqual(decoder.keyboard(1,0x1c,2,0x0d)[0]['action'],key('NumEnter',['RightCtrl']))
        self.assertEqual(decoder.keyboard(1,0,0,0x87)[0]['action'],key('F24',['RightCtrl']))

    def test_consumer_repeats_and_release_are_not_lost(self):
        decoder = InputDecoder()
        self.assertEqual(decoder.media(1,[0xe9])[0]['phase'],'press')
        self.assertEqual(decoder.media(1,[0xe9])[0]['phase'],'repeat')
        release = decoder.media(1,[])[0]
        self.assertEqual(release['phase'],'release')
        self.assertEqual(release['action'],{'type':'media','command':'volume_up'})

    def test_mouse_wheel_uses_modifiers_from_the_same_macropad_keyboard(self):
        decoder = InputDecoder()
        decoder.keyboard('keyboard-collection',0x1d,0,0x11)
        data = struct.pack('<H2xHHIiiI',0,0x400,65536-120,0,0,0,0)
        event = decoder.mouse('mouse-collection',data)[0]
        self.assertEqual(event['action'],{'type':'mouse','command':'wheel_down','modifiers':['Ctrl']})
        self.assertTrue(event['momentary'])
        self.assertEqual(event['amount'],1)

    def test_identical_positions_across_layers_do_not_invent_an_active_layer(self):
        p = profile()
        action = {'type':'media','command':'volume_up'}
        for layer in p['layers']:
            layer[14] = deepcopy(action)
        result = ActionMatcher().match({'kind':'media','phase':'press','action':action},p)
        self.assertEqual(result['confidence'],'unique')
        self.assertEqual(result['targets'],[{'layer':i,'position':14} for i in range(3)])

    def test_same_output_on_different_physical_controls_is_ambiguous(self):
        p = profile()
        action = {'type':'media','command':'mute'}
        p['layers'][0][0] = action
        p['layers'][0][13] = action
        result = ActionMatcher().match({'kind':'media','phase':'press','action':action},p)
        self.assertEqual(result['confidence'],'ambiguous')
        self.assertEqual(len(result['targets']),2)

    def test_sequence_is_matched_only_after_all_steps_and_keeps_release_target(self):
        p = profile()
        p['layers'][0][2] = {'type':'keyboard','steps':[key('C',['Ctrl'])['steps'][0],key('V',['Ctrl'])['steps'][0]]}
        matcher = ActionMatcher()
        self.assertEqual(matcher.match({'kind':'keyboard','phase':'press','action':key('C',['Ctrl'])},p,now=1)['targets'],[])
        last = {'kind':'keyboard','phase':'press','action':key('V',['Ctrl'])}
        self.assertEqual(matcher.match(last,p,now=1.1)['targets'],[{'layer':0,'position':2}])
        self.assertEqual(matcher.match(dict(last,phase='release'),p,now=1.2)['targets'],[{'layer':0,'position':2}])

    def test_modifier_prefix_does_not_falsely_identify_a_control(self):
        p = profile()
        p['layers'][0][0] = key('',['Ctrl'])
        p['layers'][0][1] = key('C',['Ctrl'])
        result = ActionMatcher().match({'kind':'keyboard','phase':'press','action':key('',['Ctrl'])},p)
        self.assertEqual(result['targets'],[])

    def test_real_knob_two_click_recovers_win_d_when_windows_omits_key_down(self):
        fixture=json.loads((Path(__file__).resolve().parents[1]/'tests/fixtures/live-win-d.json').read_text())
        clock=[100.0]
        decoder=InputDecoder(clock=lambda:clock[0])
        p=profile();p['layers'][0][16]=fixture['expected_action'];p['layers'][0][10]=key('L',['Win'])
        matcher=ActionMatcher();observed=[]
        for packet in fixture['packets']:
            clock[0]=100+packet['after_ms']/1000
            scan,flags,_,vk=struct.unpack_from('<HHHH',bytes.fromhex(packet['data_hex']))
            for event in decoder.keyboard(1,scan,flags,vk):
                matched=matcher.match(event,p,now=clock[0])
                if matched.get('observation')=='release-context':observed.append(matched)
        self.assertEqual(len(observed),2)
        for event in observed:
            self.assertEqual(event['action'],fixture['expected_action'])
            self.assertTrue(event['momentary'])
            self.assertEqual(event['targets'],[{'layer':0,'position':16}])

    def test_old_modifier_context_cannot_be_assigned_to_an_unrelated_release(self):
        clock=[1.0];decoder=InputDecoder(clock=lambda:clock[0])
        decoder.keyboard(1,0x5b,2,0x5b)
        decoder.keyboard(1,0x5b,3,0x5b)
        clock[0]=1.2
        self.assertEqual(decoder.keyboard(1,0x20,1,0x44),[])

    def test_release_recovery_does_not_guess_other_unobserved_shortcuts(self):
        decoder=InputDecoder()
        decoder.keyboard(1,0x1d,0,0x11)
        decoder.keyboard(1,0x1d,1,0x11)
        self.assertEqual(decoder.keyboard(1,0x20,1,0x44),[])


class Monitor:
    def __init__(self,emit):
        self.emit = emit
        self.running = False
    def start(self):
        self.running = True
    def stop(self):
        self.running = False
    def status(self):
        return {'ready':self.running,'devices':[{'kind':'consumer'}],'error':None}


class LiveTests(unittest.TestCase):
    def test_one_tab_stopping_does_not_stop_another_and_poll_does_not_consume_events(self):
        p = profile()
        hub = LiveInput(lambda:p,Monitor)
        try:
            hub.start('a');hub.start('b')
            hub.emit({'kind':'media','phase':'press','action':{'type':'media','command':'mute'}})
            self.assertEqual(len(hub.poll('a',0,0)['events']),1)
            self.assertEqual(len(hub.poll('b',0,0)['events']),1)
            hub.stop('a')
            self.assertTrue(hub.monitor.running)
            hub.stop('b')
            self.assertIsNone(hub.monitor)
        finally:
            hub.close()

    def test_buffer_is_bounded_and_reports_lost_events(self):
        hub = LiveInput(lambda:profile(),Monitor)
        try:
            hub.start('a')
            for _ in range(530):
                hub.emit({'kind':'pointer','phase':'move','dx':1,'dy':0})
            result = hub.poll('a',0,0)
            self.assertEqual(len(result['events']),512)
            self.assertTrue(result['live']['lost'])
        finally:
            hub.close()


if __name__ == '__main__':
    unittest.main()
