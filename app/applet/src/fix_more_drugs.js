const fs = require('fs');
const path = require('path');

const newDrugs = `
  {
    name: "Linezolida",
    category: "Infeção",
    dose: "600mg 12/12h IV ou PO",
    renal: "Sem necessidade de ajuste sistemático.",
    hepatic: "Uso com extrema precaução na cirrose grave.",
    rrt: "Não removido por HD em quantias vitais, não ajustar.",
    albumin: "31% ligada. Indiferente.",
    notes: "Risco de trombocitopenia após uso prolongado (>10 dias) e neuropatia. Monitorizar plaquetas."
  },
  {
    name: "Amicacina",
    category: "Infeção",
    dose: "15 mg/kg 24/24h IV (dose dependendo de picos).",
    renal: "MUITO NEFROTÓXICA. Ajuste de intervalo imperativo de acordo com clearance e nível sérico.",
    hepatic: "Sem Ajuste.",
    rrt: "Apenas removida lentamente por RRT contínua. Suplementar dose após a diálise intermitente.",
    albumin: "Baixa ligação proteica.",
    notes: "Pico de eficácia dependente de níveis monitorizados (Cmax e trough). Risco ototóxico."
  },
  {
    name: "Soro Hipertónico (NaCl 3% / 7.5%)",
    category: "Neuro",
    dose: "Bolus ou perfusão em HIC (>250mL 3% ao dia ou sos).",
    renal: "Evitar em anúria absoluta pela sobrecarga.",
    hepatic: "Indiferente.",
    rrt: "Monitorizar estritamente Natremia.",
    albumin: "Irrelevante.",
    notes: "Terapêutica da Hipertensão Intracraniana via restabelecimento do gradiente osmótico. Manter CVC sempre que \u22653%."
  },
  {
    name: "Cisatracúrio",
    category: "Vent",
    dose: "Bolus 0.15 mg/kg IV. Perfusão: 1 a 3 mcg/kg/min.",
    renal: "Independente - degradação de Hofmann (depende do pH e Temperatura).",
    hepatic: "Independente.",
    rrt: "Seguro. Não requer extras.",
    albumin: "Sem problema.",
    notes: "Menor libertação de histamina que atracúrio nativo."
  },
  {
    name: "Rocurónio",
    category: "Vent",
    dose: "Bolus de 0.6 a 1.2 mg/kg. Manutenção: bolus extras ou perfusão baixa.",
    renal: "T1/2 prolongada em renal grave mas pode ser usado.",
    hepatic: "Eliminação principalmente biliar/hepática - prolonga semi-vida.",
    rrt: "Sugerido ajuste de dose diário clínico.",
    albumin: "Sem efeito.",
    notes: "Bloqueador não-despolarizante reversível por Sugammadex (Bridion)."
  },
  {
    name: "Salbutamol",
    category: "Vent",
    dose: "Nas crises 2.5-5mg Bromb./Neb. ou MDI com câmara expansora.",
    renal: "Sem ajuste.",
    hepatic: "Metabolismo sem ajuste grave de broncodilatação.",
    rrt: "Igual.",
    albumin: "Igual.",
    notes: "Pode induzir taquicardia e hipocaliemia franca."
  },
  {
    name: "Milrinona",
    category: "Cardio",
    dose: "Ataque 50mcg/kg. Perfusão: 0.3 a 0.75 mcg/kg/min.",
    renal: "Obrigatório baixar perfusão em Lesão Renal ou suspender bólus (acumula).",
    hepatic: "Sem alteração.",
    rrt: "Removedor fraco, não dialisável ativamente em excesso.",
    albumin: "Moderada. 70%.",
    notes: "Inodilatador (PDE3). Reduz Pós-Carga direita. Cuidado com Hipotensão extrema."
  },
  {
    name: "Esmolol",
    category: "Cardio",
    dose: "50 a 300 mcg/kg/min em perfusão.",
    renal: "Seguro.",
    hepatic: "Metabolismo plasmático, independente do fígado.",
    rrt: "Pode ser mantido sem ajuste.",
    albumin: "Esterases sanguíneas, indiferente.",
    notes: "Ação ultra curta. Beta 1-Tópico e controlo rápido da FC em fibrilhação/flutter/taquicardia."
  },
  {
    name: "Bicarbonato de Sódio",
    category: "Renal",
    dose: "Tipicamente 1 a 2 mEq/kg bólus ou perfusão a 8.4% ou 1.4% (isotónico).",
    renal: "Terapêutica da IR, ou toxicidade. Teto restritivo de hipernatremia.",
    hepatic: "Inócuo a disfunção.",
    rrt: "Reposições são dadas via líquido dialisante (RRT).",
    albumin: "N/A",
    notes: "Vigiar e compensar rapidamente pH, não usar sem ventilação adequada face ao delta CO2 produzido."
  },
  {
    name: "Pantoprazol",
    category: "Digestivo",
    dose: "40mg 24h ou 80mg perfusão (Hemorragia Digestiva).",
    renal: "Seguro total.",
    hepatic: "Metabolismo CYP, limitar a 20mg a longo prazo em IH severa.",
    rrt: "Não dialisável (98% proteína).",
    albumin: "Forte ligação.",
    notes: "Profilaxia de Úlcera de Stress e proteção GI."
  },
  {
    name: "Metoclopramida",
    category: "Digestivo",
    dose: "10mg 8/8h IV",
    renal: "Ajustar em ClCr <40-50, reduzir a meio dose diária.",
    hepatic: "Monitorizar efeitos neurológicos secundários.",
    rrt: "Sem ajuste drástico, evitar sobre-exposição.",
    albumin: "Indiferente.",
    notes: "Risco considerável de EPS (Extrapiramidais). CI em obstrução franca."
  },
  {
    name: "Lactulose",
    category: "Digestivo",
    dose: "A dose para induzir 2 a 3 dejeções moles c/ Encefalopatia Hepática.",
    renal: "Sem absorção sistémica.",
    hepatic: "Terapia essencial na Cirrose p/ limpeza de amónia.",
    rrt: "Irrelevante.",
    albumin: "Indiferente.",
    notes: "Pode causar o íleo paralítico perante distensão. Avaliar ruídos hidroaéreos."
  },
  {
    name: "Enoxaparina (HBPM)",
    category: "Hemato",
    dose: "Profilaxia: 40mg SC 24/24. Terapia: 1mg/kg SC 12/12h.",
    renal: "Crucial! Reduzir 50% ou evitar se ClCr < 30.",
    hepatic: "Monitorizar sangramento.",
    rrt: "Perigosa por semi-vida alta com risco acumulativo sem HNF. Prefenção para heparinas fixas não fracionadas ou ajustar.",
    albumin: "Grosso peso molecular.",
    notes: "Monitorizar a-Xa se obesos (>100kg), doentes renais agudos limítrofes ou grávidas."
  },
  {
    name: "Ácido Tranexâmico",
    category: "Hemato",
    dose: "1g (ex: Crash-2: 1g bólus seguido 1g/8h) em hemorragia massiva.",
    renal: "Ajustar fortemente na Terapia Prolongada IR.",
    hepatic: "N/A",
    rrt: "Gera depuração rápida.",
    albumin: "3%.",
    notes: "Antifibrinolítico. Aplicação precoce <3h trauma. Cuidado c/ tromboembolismo."
  }
];
`;

let targetFile = path.join(__dirname, 'data', 'drugsData.ts');
let content = fs.readFileSync(targetFile, 'utf8');

// Insert the newDrugs before "];" at the end of the DRUGS_DATA array definition.
let injectionPoint = content.lastIndexOf('];');
if (injectionPoint !== -1) {
  content = content.substring(0, injectionPoint) + newDrugs + content.substring(injectionPoint);
  fs.writeFileSync(targetFile, content);
  console.log("Added new extra drugs.");
}

