#!/usr/bin/env python3

import re
import os

# Read the import output
with open('/tmp/import-full-output.txt', 'r') as f:
    output = f.read()

# Extract all category sections
pattern = r'===\s+(\w+)\s+===\nAdd these \d+ item\(s\) to data/(\w+)\.ts:\n\n(.*?)(?=\n===|\n✅|$)'
matches = re.findall(pattern, output, re.DOTALL)

print(f"Found {len(matches)} categories to update\n")

for category, filename, entries in matches:
    entries = entries.strip()
    if not entries:
        continue
    
    filepath = f"data/{filename}.ts"
    
    if not os.path.exists(filepath):
        print(f"⚠️  Skipping {filename}.ts - file not found")
        continue
    
    # Read the file
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find the last occurrence of closing bracket
    last_bracket_idx = content.rfind(']')
    if last_bracket_idx == -1:
        print(f"⚠️  Skipping {filename}.ts - couldn't find closing bracket")
        continue
    
    # Find the last comma before the bracket
    before_bracket = content[:last_bracket_idx]
    last_item_end = before_bracket.rfind('},')
    
    if last_item_end == -1:
        print(f"⚠️  Skipping {filename}.ts - couldn't find last item")
        continue
    
    # Insert the new entries
    new_content = (
        content[:last_item_end + 2] +
        '\n' + entries + '\n' +
        content[last_item_end + 2:]
    )
    
    # Write back
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"✓ Updated {filename}.ts with {len(re.findall(r'id:', entries))} entries")

print("\n✅ All data files updated!")
