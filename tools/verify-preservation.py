"""Confere o projeto anterior sem alterar seus arquivos ou acessar USB."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', type=Path, default=ROOT.parent / 'littletec-og')
args = parser.parse_args()
manifest = json.loads((ROOT / 'docs/preservacao/desktop-qt-1.1.0.json').read_text())
errors = []
protected = {p: h for p, h in manifest['sha256'].items() if p.startswith(('original/', 'novo/dist/', 'novo/src/', 'novo/tests/', 'novo/tools/'))}
for relative, digest in protected.items():
    source = args.root / relative
    if not source.is_file() or hashlib.sha256(source.read_bytes()).hexdigest() != digest:
        errors.append(relative)
if errors:
    raise SystemExit('Arquivos ausentes ou diferentes:\n' + '\n'.join(errors))
print(f"{len(protected)} arquivos preservados: fontes versionadas, original e distribuição Qt.")
