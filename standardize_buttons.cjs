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
  
  // Replace big primary buttons
  content = content.replace(/className=(["`])([^"`]*bg-primary[^"`]*text-white[^"`]*px-[68][^"`]*)\1/g, (match, p1, p2) => {
    if (p2.includes('absolute')) return match; // skip absolute positioned buttons like cart icon
    
    // Check if it should be lg, md or sm based on original padding
    let sizeClass = 'btn-md';
    if (p2.includes('px-8') || p2.includes('py-3') || p2.includes('py-4') || p2.includes('text-lg')) sizeClass = 'btn-lg';
    
    // Add additional classes that might be important (like w-full, flex-1)
    let extra = '';
    if (p2.includes('w-full')) extra += ' w-full';
    if (p2.includes('flex-1')) extra += ' flex-1';
    if (p2.includes('mt-') || p2.includes('mb-') || p2.includes('my-') || p2.includes('mx-')) {
      const marginMatches = p2.match(/\bm[xybtlr]?-\w+\b/g);
      if (marginMatches) extra += ' ' + marginMatches.join(' ');
    }
    
    return `className=${p1}btn btn-primary ${sizeClass}${extra}${p1}`;
  });

  // Replace small primary buttons
  content = content.replace(/className=(["`])([^"`]*bg-primary[^"`]*text-white[^"`]*px-[234][^"`]*)\1/g, (match, p1, p2) => {
    if (p2.includes('absolute') || p2.includes('text-[9px]') || p2.includes('w-4') || p2.includes('w-5')) return match; // skip badges/icons
    
    let sizeClass = 'btn-sm';
    
    // Add extra layout classes
    let extra = '';
    if (p2.includes('w-full')) extra += ' w-full';
    if (p2.includes('flex-1')) extra += ' flex-1';
    if (p2.includes('mt-') || p2.includes('mb-') || p2.includes('my-') || p2.includes('mx-')) {
      const marginMatches = p2.match(/\bm[xybtlr]?-\w+\b/g);
      if (marginMatches) extra += ' ' + marginMatches.join(' ');
    }
    
    return `className=${p1}btn btn-primary ${sizeClass}${extra}${p1}`;
  });
  
  // Replace secondary buttons
  content = content.replace(/className=(["`])([^"`]*bg-white[^"`]*border-neutral-300[^"`]*text-neutral-700[^"`]*)\1/g, (match, p1, p2) => {
    let sizeClass = 'btn-md';
    if (p2.includes('px-8')) sizeClass = 'btn-lg';
    if (p2.includes('px-2') || p2.includes('px-3')) sizeClass = 'btn-sm';
    
    let extra = '';
    if (p2.includes('w-full')) extra += ' w-full';
    
    return `className=${p1}btn btn-secondary ${sizeClass}${extra}${p1}`;
  });
  
  // aspect ratio for images
  content = content.replace(/aspect-\[4\/5\]/g, 'aspect-square');
  content = content.replace(/aspect-\[4\/3\]/g, 'aspect-square');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Changed ${changedFiles} files`);
