const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'app', 'api');

function countAwaited(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(countAwaited(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('@/lib/supabase/server')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('await createClient') || line.includes('await createServiceClient')) {
            results.push({ file: fullPath, lineNum: i + 1, text: line.trim() });
          }
        }
      }
    }
  }
  return results;
}

const awaited = countAwaited(targetDir);
console.log(`Found ${awaited.length} awaited instances.`);
