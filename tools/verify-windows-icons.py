"""Confere os bytes dos ícones realmente incorporados aos executáveis Windows."""
import argparse
import hashlib
from pathlib import Path
import struct
import pefile


def verify(executable, icon):
    raw = Path(icon).read_bytes()
    count = struct.unpack_from('<H', raw, 4)[0]
    expected = []
    for index in range(count):
        length, offset = struct.unpack_from('<II', raw, 6 + index * 16 + 8)
        expected.append(hashlib.sha256(raw[offset:offset + length]).hexdigest())
    with pefile.PE(str(executable), fast_load=True) as binary:
        binary.parse_data_directories(directories=[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_RESOURCE']])
        groups, images = [], {}
        for kind in binary.DIRECTORY_ENTRY_RESOURCE.entries:
            if kind.id not in (3, 14):
                continue
            for name in kind.directory.entries:
                for language in name.directory.entries:
                    data = language.data.struct
                    content = binary.get_data(data.OffsetToData, data.Size)
                    if kind.id == 3:
                        images[name.id, language.id] = content
                    else:
                        groups.append((language.id, content))
        assert groups, f'Ícone não encontrado: {executable}'
        for language, group in groups:
            actual = []
            entries = struct.unpack_from('<H', group, 4)[0]
            for index in range(entries):
                resource = struct.unpack_from('<H', group, 6 + index * 14 + 12)[0]
                actual.append(hashlib.sha256(images[resource, language]).hexdigest())
            assert actual == expected, f'Ícone diferente do projeto: {executable}'
    print(f'Ícone oficial conferido: {Path(executable).name} ({count} tamanhos).')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('icon', type=Path)
    parser.add_argument('executables', type=Path, nargs='+')
    args = parser.parse_args()
    for executable in args.executables:
        verify(executable, args.icon)
