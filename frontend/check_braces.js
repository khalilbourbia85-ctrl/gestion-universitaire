import fs from 'fs';
const content = fs.readFileSync('src/pages/GestionPFEs.jsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inString = false;
  let inComment = false;
  
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    
    if (inComment) {
      if (c === '/' && line[j-1] === '*') inComment = false;
    } else if (inString) {
      if (c === '"' && line[j-1] !== '\\') inString = false;
    } else if (c === '/' && line[j+1] === '/') {
      break;
    } else if (c === '/' && line[j+1] === '*') {
      inComment = true;
    } else if (c === '"') {
      inString = true;
    } else if (c === '{') {
      balance++;
    } else if (c === '}') {
      balance--;
    }
  }
  
  if (i < 10 || (i >= 960 && i <= 970) || (i >= 1360 && i <= 1382)) {
    console.log(`Line ${i+1}: balance=${balance}, preview=${line.slice(0, 50)}`);
  }
  
  if (balance < 0) {
    console.log(`ERROR: Extra closing brace at line ${i+1}`);
    process.exit(1);
  }
}

console.log(`Final balance: ${balance}`);
