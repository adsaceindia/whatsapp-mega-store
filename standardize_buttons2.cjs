const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Clean up primary buttons
  content = content.replace(/className=(["`])([^"`]*bg-primary[^"`]*text-white[^"`]*)\1/g, (match, p1, p2) => {
    if (p2.includes('absolute') || p2.includes('btn ') || p2.includes('w-4 ') || p2.includes('w-5 ')) return match;
    
    let sizeClass = 'btn-md';
    if (p2.includes('py-3') || p2.includes('py-4') || p2.includes('text-lg') || p2.includes('text-base')) sizeClass = 'btn-lg';
    if (p2.includes('py-1') || p2.includes('text-xs') || p2.includes('text-[10px]') || p2.includes('text-[8px]')) sizeClass = 'btn-sm';
    
    let extra = '';
    if (p2.includes('w-full')) extra += ' w-full';
    if (p2.includes('flex-1')) extra += ' flex-1';
    
    const marginMatches = p2.match(/\bm[xybtlr]?-[0-9]+\b/g);
    if (marginMatches) extra += ' ' + marginMatches.join(' ');
    
    return `className=${p1}btn btn-primary ${sizeClass}${extra}${p1}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});
console.log(`Changed ${changedFiles} files`);
