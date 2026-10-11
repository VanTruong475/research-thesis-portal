const fs = require('fs');
const path = require('path');

const replacements = {
    'kinpaku': 'primary',
    'Kinpaku': 'Primary',
    'lacquer': 'surface',
    'Lacquer': 'Surface',
    'patina': 'secondary',
    'Patina': 'Secondary',
    'champagne': 'heading',
    'Champagne': 'Heading',
    'hairline': 'border-subtle',
    'Impeccable': 'Thesis Portal',
    'impeccable': 'thesis-portal',
    'Neo Kinpaku': 'Thesis Design',
    'Neo primary': 'Thesis Design', 
};

function replaceInFile(filepath) {
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        let newContent = content;
        for (const [oldStr, newStr] of Object.entries(replacements)) {
            // using global regex for replace all
            newContent = newContent.replace(new RegExp(oldStr, 'g'), newStr);
        }
        
        if (newContent !== content) {
            fs.writeFileSync(filepath, newContent, 'utf8');
            console.log(`Updated: ${filepath}`);
        }
    } catch (e) {
        console.error(`Error reading ${filepath}:`, e);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.html') || fullPath.endsWith('.css') || fullPath.endsWith('.scss')) {
            replaceInFile(fullPath);
        }
    }
}

walkDir(path.join(__dirname, 'frontend', 'src'));
replaceInFile(path.join(__dirname, 'frontend', 'tailwind.config.js'));
replaceInFile(path.join(__dirname, 'docs', 'FRONTEND_MEMBER_B_PROGRESS.md'));

console.log('Done replacing.');
