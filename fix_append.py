import os
files_to_fix = [
    'templates/auto_letter/index.html',
    'templates/fire-work-rain/index.html',
    'templates/heart-beat/index.html',
    'templates/matrix-rain/index.html',
    'templates/rain-word/index.html',
    'templates/letter-img/index.html',
    'templates/letter-no-img/index.html'
]
for f in files_to_fix:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove old anti-devtools if it exists just in case
    content = content.replace('<script src="./anti-devtools.js"></script>', '')
    content = content.replace('<!-- Cơ chế bảo mật (Chống soi code) -->', '')
    
    # Append before </body>
    if '</body>' in content:
        content = content.replace('</body>', '\t<!-- Cơ chế bảo mật (Chống soi code) -->\n\t<script src="./anti-devtools.js"></script>\n</body>')
    else:
        content += '\n\t<!-- Cơ chế bảo mật (Chống soi code) -->\n\t<script src="./anti-devtools.js"></script>'
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
    print('Added anti-devtools to', f)
