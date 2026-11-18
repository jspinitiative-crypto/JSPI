"""Assemble the deployable site into dist/ (only public files; nothing else leaves this machine)."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
PAGES = ['index.html', 'pathway.html', 'activities.html', 'faculty.html', 'partners.html', 'impact.html', 'contact.html']
FILES = PAGES + ['robots.txt', 'sitemap.xml', '_headers', '_redirects']
DIRS = ['css', 'js', 'assets']
SKIP_SUFFIXES = {'.ttf', '.md'}  # original font sources and internal notes are not served

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

for name in FILES:
    shutil.copy2(ROOT / name, DIST / name)
for folder in DIRS:
    for src in (ROOT / folder).rglob('*'):
        if src.is_file() and src.suffix.lower() not in SKIP_SUFFIXES:
            target = DIST / src.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, target)

count = sum(1 for p in DIST.rglob('*') if p.is_file())
size = sum(p.stat().st_size for p in DIST.rglob('*') if p.is_file())
print(f'Built dist/: {count} files, {size/1024:.0f} KiB')
