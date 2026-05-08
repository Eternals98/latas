import json
from graphify.extract import collect_files, extract
from pathlib import Path

code_files = []
detect = json.loads(Path('.graphify_detect.json').read_text(encoding='utf-8'))
for f_path in detect.get('files', {}).get('code', []):
    code_files.extend(collect_files(Path(f_path)) if Path(f_path).is_dir() else [Path(f_path)])

if code_files:
    result = extract(code_files)
    Path('.graphify_ast.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(f'AST: {len(result["nodes"])} nodes, {len(result["edges"])} edges')
else:
    Path('.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}), encoding='utf-8')
    print('No code files - skipping AST extraction')
