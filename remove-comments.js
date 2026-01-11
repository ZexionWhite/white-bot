import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getAllJsFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function removeComments(code) {
  let result = '';
  let i = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inRegex = false;
  
  while (i < code.length) {
    const char = code[i];
    const nextChar = code[i + 1];
    const prevChar = code[i - 1];
    
    if (char === "'" && !inDoubleQuote && !inBacktick && prevChar !== '\\') {
      inSingleQuote = !inSingleQuote;
      result += char;
      i++;
      continue;
    }
    
    if (char === '"' && !inSingleQuote && !inBacktick && prevChar !== '\\') {
      inDoubleQuote = !inDoubleQuote;
      result += char;
      i++;
      continue;
    }
    
    if (char === '`' && !inSingleQuote && !inDoubleQuote && prevChar !== '\\') {
      inBacktick = !inBacktick;
      result += char;
      i++;
      continue;
    }
    
    if (inSingleQuote || inDoubleQuote || inBacktick) {
      result += char;
      i++;
      continue;
    }
    
    if (char === '/' && nextChar === '*') {
      i += 2;
      while (i < code.length - 1) {
        if (code[i] === '*' && code[i + 1] === '/') {
          i += 2;
          if (result[result.length - 1] !== '\n' && code[i] === '\n') {
            result += '\n';
          }
          break;
        }
        i++;
      }
      continue;
    }
    
    if (char === '/' && nextChar === '/') {
      i += 2;
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      continue;
    }
    
    result += char;
    i++;
  }
  
  return result.replace(/\n\s*\n\s*\n+/g, '\n\n').trim() + '\n';
}

async function main() {
  const srcDir = join(__dirname, 'src');
  const files = getAllJsFiles(srcDir);
  
  console.log(`Procesando ${files.length} archivos...\n`);
  
  let processed = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const cleaned = removeComments(content);
      writeFileSync(file, cleaned, 'utf8');
      processed++;
      const relativePath = file.replace(__dirname + '\\', '').replace(__dirname + '/', '');
      console.log(`✓ ${relativePath}`);
    } catch (error) {
      errors++;
      const relativePath = file.replace(__dirname + '\\', '').replace(__dirname + '/', '');
      console.error(`✗ ${relativePath}: ${error.message}`);
    }
  }
  
  console.log(`\nCompletado: ${processed} procesados, ${errors} errores`);
}

main().catch(console.error);
