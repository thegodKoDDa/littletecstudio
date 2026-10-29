"""Gera o catálogo web a partir do Studio, sem acesso USB."""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / 'novo' / 'src'))
from littletec import catalog

names = ('KEYS', 'KEY_LABELS', 'MODIFIERS', 'MOD_LABELS', 'MEDIA', 'MOUSE', 'COLORS',
         'LED_MODES', 'SHORTCUT_PRESETS', 'QUICK_ACTIONS', 'ENCODER_PRESETS', 'LAYER_TEMPLATES', 'MODELS')
content = {name: getattr(catalog, name) for name in names}
content['TEXT_CHAR_MAP'] = catalog._TEXT_CHAR_MAP
(ROOT / 'src/lib/catalog.json').write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Catálogo web atualizado a partir do Studio.')
