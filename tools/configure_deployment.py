"""Set public URLs after a GitHub Pages URL or custom domain is known."""
import argparse
from datetime import date
from html import escape
from pathlib import Path
import re
from urllib.parse import urlsplit, urljoin

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('base_url', help='Public HTTPS URL, including a repository subpath when applicable')
parser.add_argument('--directory', type=Path, default=Path(__file__).resolve().parents[1], help='Website directory; defaults to the repository root')
args = parser.parse_args()
url = urlsplit(args.base_url)
if url.scheme != 'https' or not url.hostname or url.username or url.password or url.query or url.fragment:
    parser.error('Use a public HTTPS base URL without credentials, query parameters, or fragments.')
base = args.base_url.rstrip('/') + '/'
root = args.directory.resolve()
pages = ['index.html','about.html','surgical-day.html','pathway.html','opportunities.html','partners.html','contact.html']
urls = []
for name in pages:
    target = root/name
    text = target.read_text(encoding='utf-8')
    canonical = base if name == 'index.html' else urljoin(base, name)
    urls.append(canonical)
    text = re.sub(r'\s*<link rel="canonical"[^>]*>', '', text)
    text = re.sub(r'\s*<meta property="og:url"[^>]*>', '', text)
    text = re.sub(r'(<meta property="og:image" content=")[^"]*(")', lambda m: m[1]+escape(urljoin(base,'assets/images/jspi-social.png'),quote=True)+m[2], text)
    text = text.replace('</head>', '<link rel="canonical" href="'+escape(canonical,quote=True)+'">\n<meta property="og:url" content="'+escape(canonical,quote=True)+'">\n</head>')
    target.write_text(text, encoding='utf-8')
sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join('  <url><loc>'+escape(u)+'</loc></url>\n' for u in urls) + '</urlset>\n'
(root/'sitemap.xml').write_text(sitemap, encoding='utf-8')
(root/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+urljoin(base,'sitemap.xml')+'\n', encoding='utf-8')
print('Configured canonical URLs, social image URLs, robots.txt, and a seven-page sitemap for '+base)
