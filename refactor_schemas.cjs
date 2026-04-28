const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'calculators');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (!file.endsWith('.tsx')) return;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if we shouldn't adjust schemas or already done
  if (content.includes('calcFieldValidator')) return;

  let hasCalcFieldValidator = false;
  let importAdded = false;

  // Extract all CalcField instances to find ranges
  // Regex needs to capture {...register("name")} and optional min={x} max={y}
  const calcFieldRegex = /<CalcField([^>]+)>/g;
  let formFields = {};
  
  let match;
  while ((match = calcFieldRegex.exec(content)) !== null) {
      const attrs = match[1];
      
      const registerMatch = attrs.match(/\{\.\.\.register\("([^"]+)"\)\}/);
      if (registerMatch) {
          const fieldName = registerMatch[1];
          let min = undefined;
          let max = undefined;

          const minMatch = attrs.match(/min={([\d.-]+)}/);
          if (minMatch) min = minMatch[1];

          const maxMatch = attrs.match(/max={([\d.-]+)}/);
          if (maxMatch) max = maxMatch[1];

          formFields[fieldName] = { min, max };
      }
  }

  // Update object properties in calcSchema
  const schemaVarRegex = /const calcSchema = z\.object\(\{\s*([\s\S]*?)\}\);/;
  const schemaMatch = content.match(schemaVarRegex);

  if (schemaMatch && Object.keys(formFields).length > 0) {
      let schemaBody = schemaMatch[1];
      
      Object.keys(formFields).forEach(key => {
          const { min, max } = formFields[key];
          
          let args = [];
          if (min !== undefined) args.push(min);
          else if (max !== undefined) args.push("undefined"); // So we can pass max as 2nd arg

          if (max !== undefined) {
             if (args.length === 0) args.push("undefined");
             args.push(max);
          }

          // Regex to replace the property key
          const propRegex = new RegExp(`\\b${key}\\s*:\\s*z\\.string\\(\\)\\.optional\\(\\),?`, 'g');
          
          if (args.length > 0) {
            schemaBody = schemaBody.replace(propRegex, `${key}: calcFieldValidator(${args.join(', ')}),`);
          } else {
            schemaBody = schemaBody.replace(propRegex, `${key}: calcFieldValidator(),`);
          }
      });
      
      // Clean up multiple trailing commas maybe (or doesn't matter too much in string before replacement)
      content = content.replace(schemaMatch[1], schemaBody);
      hasCalcFieldValidator = true;
  }

  if (hasCalcFieldValidator && !content.includes('calcFieldValidator')) {
      content = 'import { calcFieldValidator } from "@/utils/validation";\n' + content;
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
