"""Rebuild current editable game and install the root Pages release."""
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
GAME = ROOT / 'game'
subprocess.run([sys.executable, str(GAME / 'build_pages.py')], check=True)
for name in ('index.html', 'sw.js', 'manifest.webmanifest', 'VERSION.json', '.nojekyll'):
    shutil.copy2(GAME / 'pages' / name, ROOT / name)
shutil.copytree(GAME / 'pages' / 'icons', ROOT / 'icons', dirs_exist_ok=True)
print('Built standalone HTML in game/ and GitHub Pages release at index.html.')
