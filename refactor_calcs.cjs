const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'calculators');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Add imports if missing
    if (!content.includes('zod')) {
      // Find the last import line
      const lines = content.split('\n');
      let lastImportIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      lines.splice(lastImportIdx + 1, 0, 'import { z } from "zod";');
      content = lines.join('\n');
    }
    
    // Add interface if missing
    if (!content.includes('export interface CalculatorProps')) {
      content = content.replace(/(const [A-Za-z0-9_]+) = \(\) => {/, 
`export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

$1 = ({ schema, defaultValues }: CalculatorProps = {}) => {`);
    }

    // Replace useState("") with useState(defaultValues?.['stateName'] || "")
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/const \[([a-zA-Z0-9_]+), set[a-zA-Z0-9_]+\] = useState(?:<string>)?\((["']{2})\)/);
      if (match) {
        const stateName = match[1];
        lines[i] = lines[i].replace(/useState(?:<string>)?\((["']{2})\)/, `useState(defaultValues?.${stateName} || "")`);
      }
    }
    content = lines.join('\n');

    fs.writeFileSync(path.join(dir, file), content);
  }
}
console.log('Done refactoring calculators.');
