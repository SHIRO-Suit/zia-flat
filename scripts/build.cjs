const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let mismatch = false;
for (const [folder, extension, output] of [['css', 'css', 'chrome.css'], ['js', 'js', 'zia-flat.uc.js']]) {
  const directory = path.join(root, 'src', folder);
  const content = fs.readdirSync(directory).filter(name => name.endsWith('.' + extension)).sort()
    .map(name => fs.readFileSync(path.join(directory, name), 'utf8').replace(/\r\n/g, '\n').trimEnd() + '\n').join('\n');
  const destination = path.join(root, output);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8').replace(/\r\n/g, '\n') !== content) {
      console.error(output + ' is out of date'); mismatch = true;
    }
  } else fs.writeFileSync(destination, content);
}
if (mismatch) process.exitCode = 1;
