import json
from graphify.cache import save_semantic_cache
from pathlib import Path

# 1. Save new results to cache
new_path = Path('graphify-out/.graphify_semantic_new.json')
if new_path.exists():
    new = json.loads(new_path.read_text())
    saved = save_semantic_cache(new.get('nodes', []), new.get('edges', []), new.get('hyperedges', []))
    print(f'Cached {saved} files')

# 2. Merge cached + new results
cached_path = Path('.graphify_cached.json')
cached = json.loads(cached_path.read_text()) if cached_path.exists() else {'nodes':[],'edges':[],'hyperedges':[]}
new = json.loads(new_path.read_text()) if new_path.exists() else {'nodes':[],'edges':[],'hyperedges':[]}

all_nodes = cached['nodes'] + new.get('nodes', [])
all_edges = cached['edges'] + new.get('edges', [])
all_hyperedges = cached.get('hyperedges', []) + new.get('hyperedges', [])
seen = set()
deduped = []
for n in all_nodes:
    if n['id'] not in seen:
        seen.add(n['id'])
        deduped.append(n)

merged = {
    'nodes': deduped,
    'edges': all_edges,
    'hyperedges': all_hyperedges,
    'input_tokens': new.get('input_tokens', 0),
    'output_tokens': new.get('output_tokens', 0),
}
Path('.graphify_semantic.json').write_text(json.dumps(merged, indent=2))
print(f'Extraction complete - {len(deduped)} nodes, {len(all_edges)} edges ({len(cached["nodes"])} from cache, {len(new.get("nodes",[]))} new)')
