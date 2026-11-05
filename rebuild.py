"""Build the connected world into the established game/pages delivery folder."""
from pathlib import Path
import subprocess
import sys
ROOT = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(ROOT / 'build_world.py')], check=True)
subprocess.run(['node', str(ROOT / 'hub' / 'tests' / 'release-package.cjs')], check=True)
subprocess.run([sys.executable, str(ROOT / 'hub' / 'tests' / 'v6-project-paths.py')], check=True)
for test in ('v6-save-compat.cjs', 'v6-profile-compat.cjs',
             'v6-town-routes.cjs', 'v6-assets.cjs', 'v6-lock.cjs', 'v6-urls.cjs',
             'v6-adventure-data.cjs'):
    subprocess.run(['node', str(ROOT / 'hub' / 'tests' / test)], check=True)
print('Unicorn World built in game/pages/. The existing GitHub Actions workflow publishes it on every push to main.')
