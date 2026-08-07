const fs = require('fs');

const path = 'apps/admin/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// The write_to_file tool literally inserted the escape characters \` and \$ 
// because they were copied directly from a JavaScript template string.
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(path, content);
console.log('Syntax error fixed!');
