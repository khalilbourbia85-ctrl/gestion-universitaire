import fs from 'fs';

const content = fs.readFileSync('src/pages/GestionPFEs.jsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let majorEvents = [];

for (let i = 0; i < 962; i++) {
  const line = lines[i];
  let inString = false;
  let inComment = false;
  const oldBalance = balance;
  
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
  
  // Log when balance changes significantly or at important lines
  if (oldBalance !== balance) {
    if (i < 65 || i > 850 || balance <= 1) {
      majorEvents.push(`Line ${i+1}: ${line.trim().substring(0, 60)} => balance: ${oldBalance} → ${balance}`);
    }
  }
}

majorEvents.forEach(e => console.log(e));
console.log(`\nFinal balance at line 962: ${balance}`);
