import json
from pathlib import Path
d = json.loads(Path('.graphify_detect.json').read_text())
print(f"Corpus: {d['total_files']} files · ~{d['total_words']} words")
for k, v in d['files'].items():
    if v:
        print(f"  {k}: {len(v)} files")
