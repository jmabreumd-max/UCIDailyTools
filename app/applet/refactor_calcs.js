const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'calculators');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.tsx') && !file.includes('DrugInfusionCalc') && !file.includes('IonReplacementCalc')) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Add imports if missing
    if (!content.includes('import { z } from "zod"')) {
      content = content.replace(/import {([^}]+)} from "react";/g, 'import { $1 } from "react";\nimport { z } from "zod";');
    }
    
    // Add interface if missing
    if (!content.includes('export interface CalculatorProps')) {
      content = content.replace(/(const \w+Calc) = \(\) => {/, 
`export interface CalculatorProps {
  schema?: z.AnyZodObject;
  defaultValues?: Record<string, any>;
}

$1 = ({ schema, defaultValues }: CalculatorProps) => {`);
    }

    // Replace useState("") with useState(defaultValues?.['stateName'] || "")
    // It's a bit tricky to guess the variable name from useState
    // Let's match line by line
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/const \[([a-zA-Z0-9_]+), set[a-zA-Z0-9_]+\] = useState\(([^)]*)\);/);
      if (match) {
        const stateName = match[1];
        if (lines[i].includes('useState("")') || lines[i].includes("useState('')")) {
          lines[i] = lines[i].replace(/useState\(["']["']\)/, `useState(defaultValues?.${stateName} || "")`);
        }
      }
    }
    content = lines.join('\n');

    fs.writeFileSync(path.join(dir, file), content);
  }
}
console.log('Done refactoring calculators.');
