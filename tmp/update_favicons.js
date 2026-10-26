const fs = require('fs');

const getB64 = (f) => fs.readFileSync('public/' + f).toString('base64');

const favIco = 'data:image/x-icon;base64,' + getB64('favicon.ico');
const favPng = 'data:image/png;base64,' + getB64('favicon.png');
const fav32 = 'data:image/png;base64,' + getB64('favicon-32.png');
const fav16 = 'data:image/png;base64,' + getB64('favicon-16.png');
const icon192 = 'data:image/png;base64,' + getB64('icon-192.png');
const appleTouch = 'data:image/png;base64,' + getB64('apple-touch-icon.png');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Remove <base href="./">
content = content.replace('    <base href="./">\n', '');
content = content.replace('<base href="./">', '');

// 2. Replace link tags with base64 data URIs
const newHeadLinks = [
  '<link rel="manifest" href="manifest.json">',
  `<link rel="shortcut icon" href="${favIco}" type="image/x-icon">`,
  `<link rel="icon" type="image/x-icon" href="${favIco}">`,
  `<link rel="icon" type="image/png" sizes="32x32" href="${fav32}">`,
  `<link rel="icon" type="image/png" sizes="16x16" href="${fav16}">`,
  `<link rel="icon" type="image/png" sizes="192x192" href="${icon192}">`,
  `<link rel="apple-touch-icon" sizes="180x180" href="${appleTouch}">`
].join('\n    ');

const oldLinkStart = content.indexOf('<link rel="manifest"');
const oldLinkEnd = content.indexOf('apple-touch-icon.png">') + 'apple-touch-icon.png">'.length;

if (oldLinkStart !== -1 && oldLinkEnd !== -1) {
  content = content.substring(0, oldLinkStart) + newHeadLinks + content.substring(oldLinkEnd);
} else {
  console.log('Link block not found as expected, searching alternative...');
}

fs.writeFileSync('index.html', content);
console.log('Successfully embedded Favicon and Apple Touch icons as Base64 Data URIs in index.html head and removed base tag');
