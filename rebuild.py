"""Build the current game into the ignored game/pages deployment folder."""
from pathlib import Path
import subprocess
import sys
ROOT = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(ROOT / 'game' / 'build_pages.py')], check=True)
print('Current game built in game/pages/. GitHub Actions builds this same source on every push to main.')
