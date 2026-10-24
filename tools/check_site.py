"""Check the build-free JSPI website using only the Python standard library."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['index.html', 'about.html', 'surgical-day.html', 'pathway.html', 'opportunities.html', 'partners.html', 'contact.html']

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids = []; self.refs = []; self.h1 = 0; self.current = 0; self.title = ''; self.description = ''; self.in_title = False
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag == 'h1': self.h1 += 1
        if tag == 'title': self.in_title = True
        if a.get('aria-current') == 'page': self.current += 1
        if tag == 'meta' and a.get('name') == 'description': self.description = a.get('content', '')
        for key in ['href', 'src']:
            if key in a: self.refs.append(a[key])
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
    def handle_data(self, text):
        if self.in_title: self.title += text

errors = []; parsed = {}; total_refs = 0
for name in PAGES:
    file = ROOT / name
    if not file.is_file(): errors.append(f'Missing page: {name}'); continue
    text = file.read_text(encoding='utf-8'); p = Page(text); parsed[name] = p
    if p.h1 != 1: errors.append(f'{name}: expected one h1')
    if p.current != 1: errors.append(f'{name}: expected one current-page navigation link')
    if not p.description: errors.append(f'{name}: missing description')
    if '<html lang="en"' not in text: errors.append(f'{name}: missing English language declaration')
    for id_, count in Counter(p.ids).items():
        if count > 1: errors.append(f'{name}: duplicate id {id_}')
for name, p in parsed.items():
    for ref in p.refs:
        total_refs += 1
        u = urlsplit(ref)
        if u.scheme or u.netloc: continue
        if ref.startswith('/'): errors.append(f'{name}: root-relative reference {ref}'); continue
        target = (ROOT / unquote(u.path)).resolve() if u.path else ROOT / name
        if not target.is_relative_to(ROOT): errors.append(f'{name}: outside-root reference {ref}'); continue
        if not target.is_file(): errors.append(f'{name}: missing reference {ref}'); continue
        if u.fragment:
            if target.suffix == '.html':
                target_page = parsed.get(target.name) or Page(target.read_text(encoding='utf-8'))
                if unquote(u.fragment) not in target_page.ids: errors.append(f'{name}: unknown anchor {ref}')
            elif target.suffix == '.svg':
                ids = {e.get('id') for e in ET.parse(target).iter()}
                if u.fragment not in ids: errors.append(f'{name}: unknown icon {ref}')
css = (ROOT/'css/styles.css').read_text(encoding='utf-8')
for ref in re.findall(r'url\([\'"]?([^\)\'\"]+)', css):
    if not (ROOT/'css'/ref).resolve().is_file(): errors.append(f'CSS: missing resource {ref}')
for property_ in ['title', 'description']:
    values = [getattr(p, property_) for p in parsed.values()]
    if len(set(values)) != len(values): errors.append(f'Page {property_} values must be unique')
headers = []; footers = []
for name in PAGES:
    text = (ROOT/name).read_text(encoding='utf-8')
    headers.append(re.sub(r' aria-current="page"', '', re.search(r'<header\b.*?</header>', text, re.S).group()))
    footers.append(re.search(r'<footer\b.*?</footer>', text, re.S).group())
if len(set(headers)) != 1: errors.append('Headers are inconsistent')
if len(set(footers)) != 1: errors.append('Footers are inconsistent')
if errors:
    print('\n'.join('FAIL: '+e for e in errors)); sys.exit(1)
print(f'PASS: {len(parsed)} pages; {total_refs} references; local assets, anchors, icons, metadata, and shared navigation validated.')
