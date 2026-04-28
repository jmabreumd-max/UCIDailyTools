const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find all <CalcField ... onChange={foobar} ... />
  // and replace onChange={foobar} value={baz} with value={baz} onChange={(e) => foobar(e.target.value)} 
  // ONLY if it hasn't been transformed yet.

  const calcFieldRegex = /<CalcField([^>]*?)value={([^}]+)}([^>]*?)onChange={([^}]+)}([^>]*?)>/g;
  content = content.replace(calcFieldRegex, (match, p1, value, p2, onChangeFunc, p3) => {
    if (onChangeFunc.includes('e.target.value')) {
      return match;
    }
    return `<CalcField${p1}value={${value}}${p2}onChange={(e) => ${onChangeFunc}(e.target.value)}${p3}>`;
  });

  // Also catch reverse order: onChange={foobar} value={baz}
  const calcFieldRegex2 = /<CalcField([^>]*?)onChange={([^}]+)}([^>]*?)value={([^}]+)}([^>]*?)>/g;
  content = content.replace(calcFieldRegex2, (match, p1, onChangeFunc, p2, value, p3) => {
    if (onChangeFunc.includes('e.target.value')) {
      return match;
    }
    return `<CalcField${p1}value={${value}}${p2}onChange={(e) => ${onChangeFunc}(e.target.value)}${p3}>`;
  });

  fs.writeFileSync(filePath, content);
}

// Convert non-calculator files first
const nonCalcFiles = [
  'src/components/tabs/VentilatorioTab.tsx',
  'src/components/tabs/RenalTab.tsx',
  'src/components/tabs/NeurologicoTab.tsx',
  'src/components/tabs/CardiovascularTab.tsx',
  'src/components/tabs/DigestivoTab.tsx',
  'src/components/tabs/HematologicoTab.tsx',
  'src/components/tabs/GeralTab.tsx',
  'src/components/UniversalInfusionConverter.tsx',
  'src/components/FluidBalance.tsx'
];

nonCalcFiles.forEach(f => {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) {
    processFile(p);
  }
});
console.log('Non-calculator files updated.');
