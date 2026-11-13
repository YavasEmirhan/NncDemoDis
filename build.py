"""Builds index.html from src/: embeds the fonts and joins the scripts into one self-contained page.
Usage: npm install && python3 build.py"""
import pathlib, base64
s = pathlib.Path('src')
b64 = lambda p: base64.b64encode(pathlib.Path(p).read_bytes()).decode()
F = 'node_modules/@fontsource/hedvig-letters-serif/files/hedvig-letters-serif-'
G = 'node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-'
css = ((s / 'styles.css').read_text()
       .replace('/*FONT_SERIF_EXT*/', b64(F + 'latin-ext-400-normal.woff2'))
       .replace('/*FONT_SERIF*/', b64(F + 'latin-400-normal.woff2'))
       .replace('/*FONT_SANS_EXT*/', b64(G + 'latin-ext-wght-normal.woff2'))
       .replace('/*FONT_SANS*/', b64(G + 'latin-wght-normal.woff2')))
js = ''.join((s / f).read_text() for f in ['core.js', 'site.js', 'panel.js'])
html = (s / 'index.html').read_text().replace('/*CSS*/', css).replace('/*JS*/', js)
pathlib.Path('index.html').write_text(html)
print(f'index.html written, {len(html):,} bytes')
