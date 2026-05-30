import fs from 'fs';

const content = fs.readFileSync('src/pages/GestionPFEs.jsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let lastGoodBalance = 0;
let lastGoodLine = 0;

for (let i = 0; i < 965; i++) {
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
      if (balance === 0) {
        lastGoodBalance = 0;
        lastGoodLine = i + 1;
      }
    }
  }
}

console.log(`At line 965, balance is: ${balance}`);
console.log(`Last time balance was 0: line ${lastGoodLine}`);
console.log(`Should be 1 (inside GestionPFEs function), but is ${balance}`);
