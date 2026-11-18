#!/usr/bin/env python3
"""v62f: đổi số dòng trong rubik-school-game.js (mã nối) sang file:dòng thật. Chạy: python3 tools/qa/v62f-line.py 13167 21641"""
import re, sys, os
root = os.path.join(os.path.dirname(__file__), '..', '..')
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
block = html[html.index('const FILES = ['):]; block = block[:block.index('];')]
files = re.findall(r"'([^']+\.js)'", block)
spans, ln = [], 4
for f in files:
    n = open(os.path.join(root, f), encoding='utf-8').read().count('\n') + 1
    spans.append((ln, f)); ln += n
for a in sys.argv[1:]:
    L = int(a); f0, s0 = None, None
    for s, f in spans:
        if s <= L: s0, f0 = s, f
    print(a, '->', f'{f0}:{L - s0 + 1}')
