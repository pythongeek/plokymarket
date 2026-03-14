const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'app', 'api');

function scanDir(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(scanDir(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Look for createClient() or createServiceClient() that is NOT preceded by 'await '
      // A simple regex approach:
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('createClient()') || line.includes('createServiceClient()')) {
          if (!line.includes('await createClient()') && !line.includes('await createServiceClient()')) {
            results.push({ file: fullPath, lineNum: i + 1, text: line.trim() });
          }
        }
      }
    }
  }
  return results;
}

const unawaited = scanDir(targetDir);
console.log(JSON.stringify(unawaited, null, 2));
