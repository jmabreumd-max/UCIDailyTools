const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'calculators');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (!file.endsWith('.tsx')) return;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has useCalculatorForm
  if (content.includes('useCalculatorForm')) return;

  // Add imports
  content = content.replace(/import {([^}]*?)useState([^}]*?)} from "react";/, 'import {$1$2} from "react";\nimport { z } from "zod";\nimport { useCalculatorForm } from "@/hooks/useCalculatorForm";');
  
  if (!content.includes('import { z }')) {
    content = 'import { z } from "zod";\n' + content;
  }
  
  if (!content.includes('useCalculatorForm')) {
     content = content.replace(/import.*?from "react";/, match => `${match}\nimport { useCalculatorForm } from "@/hooks/useCalculatorForm";`);
  }

  // Find all useSharedState calls
  // const [na, setNa] = useSharedState("", p.sodio, p.setSodio);
  
  const stateRegex = /const \[([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+)\]\s*=\s*useSharedState\(([^,]+),\s*([^,]+),\s*([^)]+)\);/g;
  const states = [];
  let match;
  while ((match = stateRegex.exec(content)) !== null) {
      states.push({
          varName: match[1],
          setter: match[2],
          globalGetter: match[4].trim(),
          globalSetter: match[5].trim()
      });
  }

  // Let's also find standard useState which we'll convert to RHF
  const localStateRegex = /const\s+\[([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+)\]\s*=\s*useState(?:<[^>]*>)?\(([^)]*)\);/g;
  while ((match = localStateRegex.exec(content)) !== null) {
      // Don't convert if it's not a primitive or not used in inputs
      // For simplicity, we convert string numbers
      if (match[3].includes('""') || match[3].includes("''") || match[3] === '""' || match[3].includes('"M"') || match[3].includes('"F"')) {
          states.push({
              varName: match[1],
              setter: match[2],
              globalGetter: 'undefined',
              globalSetter: 'undefined',
              defaultVal: match[3]
          });
      }
  }

  if (states.length === 0) return;

  // Clean the file by removing all these state calls
  content = content.replace(stateRegex, '');
  
  // Clean useState selectively
  states.forEach(state => {
     if (state.globalGetter === 'undefined') {
       const toRemove = new RegExp(`const \\[${state.varName},\\s*${state.setter}\\]\\s*=\\s*useState.*?;`, 'g');
       content = content.replace(toRemove, '');
     }
  });

  // Calculate bindings & schema
  let schemaFields = [];
  let bindingsObj = [];
  let watches = [];

  states.forEach(s => {
    schemaFields.push(`  ${s.varName}: z.string().optional()`);
    if (s.globalGetter !== 'undefined') {
      bindingsObj.push(`    ${s.varName}: { global: ${s.globalGetter}, setGlobal: ${s.globalSetter} }`);
    }
    watches.push(`  const ${s.varName} = form.watch("${s.varName}");`);
  });

  // Generate hook initialization
  // We place it right after `const p = usePatient();` or after component signature
  
  let hookInit = `
  const schema = z.object({
  ${schemaFields.join(',\n')}
  });
  const form = useCalculatorForm(schema, {
${bindingsObj.join(',\n')}
  });
  const { register, formState: { errors } } = form;
${watches.join('\n')}
  `;

  if (content.includes('const p = usePatient();')) {
      content = content.replace('const p = usePatient();', `const p = usePatient();\n${hookInit}`);
  } else {
      content = content.replace(/(const [A-Za-z0-9_]+ = \([^)]*\)(?: =>| {)[^{]*\{)/, `$1\n${hookInit}`);
  }

  // Now replace all `<CalcField ... value={foo} onChange={setFoo} ...`
  // with `<CalcField ... {...register("foo")} error={errors.foo?.message} ...`
  
  // We use another regex replacing the old syntax
  states.forEach(s => {
      // Find where value={s.varName} and onChange={s.setter} OR the reverse
      // Example: <CalcField label="Na⁺" value={na} onChange={setNa} unit="mEq/L" min={100} max={180} />
      const r1 = new RegExp(`value={${s.varName}}\\s+onChange={${s.setter}}`, 'g');
      content = content.replace(r1, `{...register("${s.varName}")} error={errors.${s.varName}?.message as string}`);
      
      const r2 = new RegExp(`onChange={${s.setter}}\\s+value={${s.varName}}`, 'g');
      content = content.replace(r2, `{...register("${s.varName}")} error={errors.${s.varName}?.message as string}`);
  });

  fs.writeFileSync(filePath, content);
  console.log(`Refactored ${file}`);
});
