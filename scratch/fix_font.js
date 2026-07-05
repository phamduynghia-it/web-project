const fs = require('fs');
const p = 'templates/rain-word/static/js/home.js';
let content = fs.readFileSync(p, 'utf8');
content = content.replace(/\/font\/\$\{i\}\.ttf/g, './font/${i}.ttf');
fs.writeFileSync(p, content);
console.log('Fixed font path');
