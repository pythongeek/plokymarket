const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

let filesUpdated = 0;
let errors = 0;

walkDir(apiDir, function (filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Use a precise regex to find 'createClient()' that is preceded by an equal sign and spaces, but NOT 'await'
        // E.g. `const supabase = createClient()` matches
        const syncClientRegex = /(=\s*)createClient\(\)/g;

        if (syncClientRegex.test(content)) {
            content = content.replace(syncClientRegex, '$1await createClient()');

            // Now ensure parent function is async
            const functionRegex = /export\s+(?:default\s+)?function\s+(\w+)\s*\(/g;
            content = content.replace(functionRegex, (match) => {
                if (match.includes('async')) return match;
                return match.replace('function', 'async function');
            });

            const arrowRegex = /export\s+const\s+(\w+)\s*=\s*\(/g;
            content = content.replace(arrowRegex, (match) => {
                if (match.includes('async')) return match;
                return match.replace('=', '= async');
            });

            const defaultFunctionRegex = /export\s+default\s+function\s*\(/g;
            content = content.replace(defaultFunctionRegex, (match) => {
                if (match.includes('async')) return match;
                return match.replace('function', 'async function');
            });

            if (content !== original) {
                fs.writeFileSync(filePath, content, 'utf8');
                filesUpdated++;
                console.log(`Updated: ${filePath}`);
            }
        }
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
        errors++;
    }
});

console.log(`Done. Updated ${filesUpdated} files. Errors: ${errors}`);
