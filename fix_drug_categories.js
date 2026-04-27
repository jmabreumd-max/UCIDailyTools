const fs = require('fs');

function fixCategories(content) {
  content = content.replace(/category: "Anti-infecciosos"/g, 'category: "Infeção"');
  content = content.replace(/category: "Sedação \/ Analgesia"/g, 'category: "Neuro"');
  content = content.replace(/category: "Neurologia.*"/g, 'category: "Neuro"');
  content = content.replace(/category: "SNC \/ Reversão"/g, 'category: "Neuro"');
  content = content.replace(/category: "Anticonvulsivantes"/g, 'category: "Neuro"');
  content = content.replace(/category: "Anti-Comiciais"/g, 'category: "Neuro"');
  content = content.replace(/category: "Analgésicos.*"/g, 'category: "Neuro"');
  content = content.replace(/category: "Anti-hipertensores"/g, 'category: "Cardio"');
  content = content.replace(/category: "Anti-Arritmicos"/g, 'category: "Cardio"');
  content = content.replace(/category: "Anti-arrítmicos"/g, 'category: "Cardio"');
  content = content.replace(/category: "Aminas Vasopressoras \/ Inotrópicos"/g, 'category: "Cardio"');
  content = content.replace(/category: "Avalgésicos"/g, 'category: "Neuro"'); // typo on Cetorolac
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

let f1 = fs.readFileSync('src/data/drugsData.ts', 'utf8');
fs.writeFileSync('src/data/drugsData.ts', fixCategories(f1));

let f2 = fs.readFileSync('src/components/tabs/FarmacosTab.tsx', 'utf8');
fs.writeFileSync('src/components/tabs/FarmacosTab.tsx', fixCategories(f2));

console.log('Categories fixed');
