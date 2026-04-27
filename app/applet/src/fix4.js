const fs = require('fs');
const path = require('path');

function fixCategories(content) {
  content = content.replace(/category: "Anti-infecciosos"/g, 'category: "Infeção"');
  content = content.replace(/category: "Sedação \/ Analgesia"/g, 'category: "Neuro"');
  content = content.replace(/category: "Neurologia"/g, 'category: "Neuro"');
  content = content.replace(/category: "Neurologia \/ Psiquiatria"/g, 'category: "Neuro"');
  content = content.replace(/category: "Neurologia \/ Analgesia"/g, 'category: "Neuro"');
  content = content.replace(/category: "SNC \/ Reversão"/g, 'category: "Neuro"');
  content = content.replace(/category: "Anticonvulsivantes"/g, 'category: "Neuro"');
  content = content.replace(/category: "Anti-Comiciais"/g, 'category: "Neuro"');
  content = content.replace(/category: "Analgésicos"/g, 'category: "Neuro"');
  content = content.replace(/category: "Anti-hipertensores"/g, 'category: "Cardio"');
  content = content.replace(/category: "Anti-Arritmicos"/g, 'category: "Cardio"');
  content = content.replace(/category: "Anti-arrítmicos"/g, 'category: "Cardio"');
  content = content.replace(/category: "Aminas Vasopressoras \/ Inotrópicos"/g, 'category: "Cardio"');
  content = content.replace(/category: "Avalgésicos"/g, 'category: "Neuro"');
  content = content.replace(/category: "Diuréticos"/g, 'category: "Renal"');
  content = content.replace(/category: "GGI \/ Endócrino"/g, 'category: "Digestivo"');
  content = content.replace(/category: "Osmoterapia"/g, 'category: "Neuro"');
  content = content.replace(/category: "Transfusões \/ Endocrinologia"/g, 'category: "Hemato"');
  content = content.replace(/category: "Anticoagulantes"/g, 'category: "Hemato"');
  content = content.replace(/category: "Neuromuscular"/g, 'category: "Vent"');
  content = content.replace(/category: "Vasodilatadores \/ Neurológicos"/g, 'category: "Neuro"');
  content = content.replace(/category: "Endocrinologia"/g, 'category: "Renal"');
  return content;
}

const f1_path = path.join(__dirname, 'data', 'drugsData.ts');
if (fs.existsSync(f1_path)) {
  let f1 = fs.readFileSync(f1_path, 'utf8');
  fs.writeFileSync(f1_path, fixCategories(f1));
}

const f2_path = path.join(__dirname, 'components', 'tabs', 'FarmacosTab.tsx');
if (fs.existsSync(f2_path)) {
  let f2 = fs.readFileSync(f2_path, 'utf8');
  fs.writeFileSync(f2_path, fixCategories(f2));
}

console.log('Categories fixed');
