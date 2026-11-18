#!/usr/bin/env python3
"""Kiểm tra trùng tên toàn cục: loader nối mọi file trong FILES (index.html) vào MỘT scope.
const/let/class trùng tên => sập game; function trùng tên => file sau đè lặng lẽ.
Chạy: python3 tools/qa/dupes.py  (từ thư mục school/)"""
import re, sys, os
root = os.path.join(os.path.dirname(__file__), '..', '..')
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
block = html[html.index('const FILES = ['):]
block = block[:block.index('];')]
files = re.findall(r"'([^']+\.js)'", block)
decl = re.compile(r'^(const|let|var|function\*?|async function|class)\s+([A-Za-z_$][\w$]*)(.*)$')
seen = {}
for f in files:
    for n, line in enumerate(open(os.path.join(root, f), encoding='utf-8'), 1):
        m = decl.match(line)
        if not m: continue
        kind, name = m.group(1), m.group(2)
        names = [name]
        if kind in ('const', 'let', 'var'):  # const A = 1, B = 2 (chỉ bắt dạng đơn giản ở đầu dòng)
            names += re.findall(r',\s*([A-Za-z_$][\w$]*)\s*=(?!=)', re.sub(r'\(.*?\)|\{.*?\}|\[.*?\]|=>.*', '', m.group(3)))
        for nm in names:
            seen.setdefault(nm, []).append((kind.split()[-1], f, n))
bad = 0
for nm, L in sorted(seen.items()):
    if len(L) < 2: continue
    kinds = {k for k, _, _ in L}
    hard = bool(kinds & {'const', 'let', 'class'})
    if hard or 'v54q' in nm.lower():
        bad += hard
        print(('LỖI ' if hard else 'đè  ') + nm + ': ' + ', '.join(f'{k} {f}:{n}' for k, f, n in L))
print(f'{len(files)} file, {len(seen)} tên; trùng nguy hiểm (const/let/class): {bad}')
sys.exit(1 if bad else 0)
