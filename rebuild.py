"""Build the connected world into the established game/pages delivery folder."""
from pathlib import Path
import subprocess
import sys
ROOT = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(ROOT / 'build_world.py')], check=True)
subprocess.run(['node', str(ROOT / 'hub' / 'tests' / 'release-package.cjs')], check=True)
print('Unicorn World built in game/pages/. The existing GitHub Actions workflow publishes it on every push to main.')
