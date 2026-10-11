import os
import glob

replacements = {
    'kinpaku': 'primary',
    'Kinpaku': 'Primary',
    'lacquer': 'surface',
    'Lacquer': 'Surface',
    'patina': 'secondary',
    'Patina': 'Secondary',
    'champagne': 'heading',
    'Champagne': 'Heading',
    'hairline': 'border-subtle',
    'Impeccable': 'Thesis Portal',
    'impeccable': 'thesis-portal',
    'Neo Kinpaku': 'Thesis Design',
    'Neo primary': 'Thesis Design', # in case Kinpaku gets replaced first
    'raised-lacquer': 'surface-raised' # wait, I already changed it to lacquer-raised, so it will become surface-raised
}

# Ensure specific order to avoid partial matches
# It's better to just use simple string replace

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for old_str, new_str in replacements.items():
            new_content = new_content.replace(old_str, new_str)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

# Process frontend/src
src_dir = r"c:\Users\Mr VU\Desktop\research-thesis-portal\frontend\src"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.html', '.css', '.scss')):
            replace_in_file(os.path.join(root, file))

# Process tailwind config
replace_in_file(r"c:\Users\Mr VU\Desktop\research-thesis-portal\frontend\tailwind.config.js")

# Process docs
replace_in_file(r"c:\Users\Mr VU\Desktop\research-thesis-portal\docs\FRONTEND_MEMBER_B_PROGRESS.md")

print("Done replacing.")
