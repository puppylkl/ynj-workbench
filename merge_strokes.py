import json, re, urllib.request, urllib.parse, os, sys

base = '/root/clacky_workspace/ynj-workbench/js'
hanzi_src = open(os.path.join(base, 'data-hanzi.js'), encoding='utf-8').read()
chars = re.findall(r'\{c:"(.)"', hanzi_src)
print('hanzi count', len(chars), chars[:10])

strokes_src = open(os.path.join(base, 'strokes-data.js'), encoding='utf-8').read()
i = strokes_src.find('{')
old, _ = json.JSONDecoder().raw_decode(strokes_src[i:].strip())
print('old strokes', len(old))
# strip trailing comment lines if any
data = dict(old)

missing = [c for c in chars if c not in data]
print('missing', len(missing), ''.join(missing))

fail = []
for c in missing:
    url = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/' + urllib.parse.quote(c) + '.json'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        raw = urllib.request.urlopen(req, timeout=20).read().decode('utf-8')
        data[c] = json.loads(raw)
    except Exception as e:
        fail.append((c, str(e)[:60]))
print('fetched', len(missing) - len(fail), 'failed', fail)

# keep only needed chars + old ones (in original order for stability)
out_chars = []
for c in list(old.keys()) + [c for c in chars if c not in old]:
    if c not in out_chars and c in data:
        out_chars.append(c)

merged = {c: data[c] for c in out_chars}
with open(os.path.join(base, 'strokes-data.js'), 'w', encoding='utf-8') as f:
    f.write('// 笔顺数据（hanzi-writer-data），覆盖一年级生字库全部汉字\n')
    f.write('window.STROKES_DATA = ' + json.dumps(merged, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('written', len(merged), 'chars ->', os.path.getsize(os.path.join(base, 'strokes-data.js')), 'bytes')
