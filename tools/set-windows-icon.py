"""Incorpora o ícone oficial no PE, preservando os demais recursos do Electron."""
import argparse
import ctypes as c
from ctypes import wintypes as w
from pathlib import Path
import struct
import sys


def set_icon(executable, icon):
    if sys.platform != 'win32':
        raise RuntimeError('Use Python Windows para atualizar os recursos do executável.')
    kernel = c.WinDLL('kernel32', use_last_error=True)
    kernel.LoadLibraryExW.argtypes = [w.LPCWSTR, w.HANDLE, w.DWORD]
    kernel.LoadLibraryExW.restype = w.HMODULE
    kernel.FreeLibrary.argtypes = [w.HMODULE]
    enum_callback = c.WINFUNCTYPE(w.BOOL, w.HMODULE, c.c_void_p, c.c_void_p, c.c_ssize_t)
    kernel.EnumResourceNamesW.argtypes = [w.HMODULE, c.c_void_p, enum_callback, c.c_ssize_t]
    lang_callback = c.WINFUNCTYPE(w.BOOL, w.HMODULE, c.c_void_p, c.c_void_p, w.WORD, c.c_ssize_t)
    kernel.EnumResourceLanguagesW.argtypes = [w.HMODULE, c.c_void_p, c.c_void_p, lang_callback, c.c_ssize_t]
    kernel.BeginUpdateResourceW.argtypes = [w.LPCWSTR, w.BOOL]
    kernel.BeginUpdateResourceW.restype = w.HANDLE
    kernel.UpdateResourceW.argtypes = [w.HANDLE, c.c_void_p, c.c_void_p, w.WORD, c.c_void_p, w.DWORD]
    kernel.EndUpdateResourceW.argtypes = [w.HANDLE, w.BOOL]
    groups = []
    module = kernel.LoadLibraryExW(str(executable), None, 0x2)
    if not module:
        raise c.WinError(c.get_last_error())

    @enum_callback
    def group_found(handle, kind, name, _):
        saved_name = name if name <= 0xffff else c.wstring_at(name)

        @lang_callback
        def language_found(_h, _t, _n, language, _p):
            groups.append((saved_name, language))
            return True

        kernel.EnumResourceLanguagesW(handle, kind, name, language_found, 0)
        return True

    try:
        kernel.EnumResourceNamesW(module, 14, group_found, 0)
    finally:
        kernel.FreeLibrary(module)
    if not groups:
        groups = [(1, 0)]
    raw = Path(icon).read_bytes()
    reserved, kind, count = struct.unpack_from('<HHH', raw)
    if reserved or kind != 1 or not count:
        raise ValueError('ICO inválido.')
    update = kernel.BeginUpdateResourceW(str(executable), False)
    if not update:
        raise c.WinError(c.get_last_error())
    committed = False

    def write(resource_type, name, language, data):
        named = c.cast(c.c_wchar_p(name), c.c_void_p) if isinstance(name, str) else name
        buffer = c.create_string_buffer(data)
        if not kernel.UpdateResourceW(update, resource_type, named, language, buffer, len(data)):
            raise c.WinError(c.get_last_error())

    try:
        directory = bytearray(raw[:6])
        languages = {language for _, language in groups}
        for index in range(count):
            entry = raw[6 + 16 * index:22 + 16 * index]
            length, offset = struct.unpack_from('<II', entry, 8)
            image = raw[offset:offset + length]
            if len(image) != length:
                raise ValueError('Imagem ICO truncada.')
            resource_id = 20000 + index
            directory.extend(entry[:12] + struct.pack('<H', resource_id))
            for language in languages:
                write(3, resource_id, language, image)
        for name, language in groups:
            write(14, name, language, bytes(directory))
        if not kernel.EndUpdateResourceW(update, False):
            raise c.WinError(c.get_last_error())
        committed = True
    finally:
        if not committed:
            kernel.EndUpdateResourceW(update, True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('executable', type=Path)
    parser.add_argument('icon', type=Path)
    args = parser.parse_args()
    set_icon(args.executable.resolve(), args.icon.resolve())
    print('Ícone oficial incorporado ao executável Windows.')
