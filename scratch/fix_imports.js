const fs = require('fs');
const path = require('path');
const dir = 'templates/rain-word-img/static/js';
const files = fs.readdirSync(dir);

files.forEach(f => {
  if(f.endsWith('.js')) {
    const p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');
    
    let newContent = content.replace(/"\/static\/js\//g, '"./');
    
    // Also replace absolute font imports if they exist
    newContent = newContent.replace(/"\/font\//g, '"./font/');
    
    if(content !== newContent) {
      fs.writeFileSync(p, newContent);
      console.log('Updated ' + f);
    }
  }
});
