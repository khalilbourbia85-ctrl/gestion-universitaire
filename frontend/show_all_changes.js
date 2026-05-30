import fs from 'fs';

const content = fs.readFileSync('src/pages/GestionPFEs.jsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let prevBalance = 0;

for (let i = 0; i < Math.min(500, lines.length); i++) {
  const line = lines[i];
  prevBalance = balance;
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
  
  if (balance !== prevBalance) {
    const content_snippet = line.trim().substring(0, 80);
    if (i < 100 || balance <= 1 || (i >= 340 && i <= 365)) {
      console.log(`${String(i+1).padStart(4)}: [${prevBalance}→${balance}] ${content_snippet}`);
    }
  }
}

console.log(`\nFinal at line ${lines.length}: balance=${balance}`);
