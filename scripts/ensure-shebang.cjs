// enforce shebang on built CLI
// why: npm marks bin files executable; ensure correct first line
// how: prepend or replace shebang post-build
'use strict';
const fs = require('fs');
const path = require('path');

const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');
try {
  if (!fs.existsSync(cliPath)) {
    process.exit(0);
  }
  const content = fs.readFileSync(cliPath, 'utf8');
  const shebang = '#!/usr/bin/env node\n';
  let updated = content;
  if (!content.startsWith('#!')) {
    updated = shebang + content;
  } else if (!content.startsWith(shebang)) {
    const firstNewline = content.indexOf('\n');
    updated = shebang + content.slice(firstNewline + 1);
  }
  if (updated !== content) {
    fs.writeFileSync(cliPath, updated, { encoding: 'utf8' });
  }
} catch (err) {
  console.error('[envsaurus] ensure-shebang failed:', err && err.message);
  process.exit(0);
}


