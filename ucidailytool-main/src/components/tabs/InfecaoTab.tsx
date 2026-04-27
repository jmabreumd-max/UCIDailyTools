import { useMemo } from "react";
import { usePatient } from "@/contexts/PatientContext";
import { usePersistedState } from "@/hooks/usePersistedState";
import Interpretation from "../Interpretation";
import InfoTooltip from "../InfoTooltip";
import AlertBanner from "../AlertBanner";
import CollapsibleSection from "../CollapsibleSection";
import ExamChecklist from "../ExamChecklist";
import SectionDivider from "../SectionDivider";

const INFEC_EXAM: { category: string; items: string[] }[] = [
  { category: "Sinais Sistémicos", items: ["Febre", "Hipotermia", "Calafrios", "Taquicardia", "Taquipneia", "Hipotensão", "Alteração consciência"] },
  { category: "Pele / Tecidos Moles", items: ["Eritema", "Celulite", "Abcesso", "Ferida infetada", "Fasceíte necrotizante", "Úlcera de pressão infetada", "Exantema"] },
  { category: "Respiratório", items: ["Secreções purulentas", "Infiltrado novo Rx", "Consolidação", "Derrame parapneumónico", "Empiema"] },
  { category: "Urinário", items: ["Urina turva", "Piúria", "Disúria", "Dor lombar", "Algália > 7 dias"] },
  { category: "Abdominal", items: ["Peritonite", "Diarreia C. difficile", "Colangite", "Abcesso intra-abdominal"] },
  { category: "SNC", items: ["Rigidez da nuca", "Cefaleia", "Fotofobia", "Alteração consciência", "LCR turvo"] },
  { category: "Cateter / Dispositivos", items: ["Sinais locais CVC", "Bacteriemia associada a cateter", "Infeção prótese", "Infeção pacemaker", "Mediastinite"] },
  { category: "Osso / Articular", items: ["Artrite séptica", "Osteomielite", "Espondilodiscite"] },
];

interface AntibioticDrug {
  name: string;
  class: string;
  normalDose: string;
  adjustments: { clCrRange: string; min: number; max: number; dose: string }[];
  rrtDose: string;
  notes: string;
}

const ANTIBIOTICS: AntibioticDrug[] = [
  // Penicilinas
  { name: "Amoxicilina", class: "Penicilina", normalDose: "500–1000 mg PO/IV 8/8h",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "Dose habitual" }, { clCrRange: "10–29", min: 10, max: 30, dose: "500 mg 8/8–12/12h" }, { clCrRange: "< 10", min: 0, max: 10, dose: "500 mg 12/12h" }],
    rrtDose: "500 mg 8/8h. Suplementar pós-HD.", notes: "Excreção renal 60%. Tempo-dependente." },
  { name: "Amoxicilina/Clav", class: "Penicilina + Inibidor β-lactamase", normalDose: "1.2g IV 8/8h",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "Dose habitual" }, { clCrRange: "10–29", min: 10, max: 30, dose: "1.2g IV 12/12h" }, { clCrRange: "< 10", min: 0, max: 10, dose: "1.2g IV 24/24h" }],
    rrtDose: "1.2g IV 12/12h pós-HD.", notes: "Ajustar pelo componente amoxicilina." },
  { name: "Ampicilina", class: "Penicilina", normalDose: "2g IV 4/4–6/6h",
    adjustments: [{ clCrRange: "≥ 50", min: 50, max: 999, dose: "2g IV 4/4–6/6h" }, { clCrRange: "10–49", min: 10, max: 50, dose: "2g IV 6/6–8/8h" }, { clCrRange: "< 10", min: 0, max: 10, dose: "2g IV 12/12h" }],
    rrtDose: "2g IV 6/6h. Suplementar pós-HD.", notes: "Listeria, Enterococcus. Tempo-dependente." },
  { name: "Flucloxacilina", class: "Penicilina (antiestafilocócica)", normalDose: "2g IV 6/6h",
    adjustments: [{ clCrRange: "≥ 10", min: 10, max: 999, dose: "Dose habitual" }, { clCrRange: "< 10", min: 0, max: 10, dose: "Dose habitual. Monitorizar." }],
    rrtDose: "Dose habitual.", notes: "Eliminação hepática. Hepatotoxicidade." },
  { name: "Penicilina G (Benzilpenicilina)", class: "Penicilina", normalDose: "4 MUI IV 4/4h",
    adjustments: [{ clCrRange: "≥ 50", min: 50, max: 999, dose: "4 MUI 4/4h" }, { clCrRange: "10–49", min: 10, max: 50, dose: "2–4 MUI 6/6h" }, { clCrRange: "< 10", min: 0, max: 10, dose: "2 MUI 6/6h" }],
    rrtDose: "2–4 MUI 4/4–6/6h pós-HD.", notes: "Meningite meningocócica, endocardite estreptocócica." },
  { name: "Piperacilina/Tazobactam", class: "Penicilina + Inibidor β-lactamase", normalDose: "4.5g IV 6/6h (perfusão 4h)",
    adjustments: [{ clCrRange: "≥ 40", min: 40, max: 999, dose: "4.5g IV 6/6h" }, { clCrRange: "20–39", min: 20, max: 40, dose: "4.5g IV 8/8h" }, { clCrRange: "< 20", min: 0, max: 20, dose: "4.5g IV 12/12h" }],
    rrtDose: "CVVH: 4.5g 8/8h. HD: 2.25g 12/12h + pós-HD.", notes: "Perfusão prolongada 4h otimiza T>MIC." },
  // Cefalosporinas
  { name: "Cefazolina", class: "Cefalosporina 1ª G", normalDose: "2g IV 8/8h",
    adjustments: [{ clCrRange: "≥ 35", min: 35, max: 999, dose: "2g IV 8/8h" }, { clCrRange: "11–34", min: 11, max: 35, dose: "1g IV 12/12h" }, { clCrRange: "≤ 10", min: 0, max: 11, dose: "1g IV 24/24h" }],
    rrtDose: "1g IV 24/24h. Supl pós-HD.", notes: "Profilaxia cirúrgica. MSSA pele/tecidos moles." },
  { name: "Cefotaxima", class: "Cefalosporina 3ª G", normalDose: "2g IV 6/6–8/8h",
    adjustments: [{ clCrRange: "≥ 20", min: 20, max: 999, dose: "Dose habitual" }, { clCrRange: "< 20", min: 0, max: 20, dose: "2g IV 12/12h" }],
    rrtDose: "2g IV 8/8h. Supl pós-HD.", notes: "Meningite, sépsis. Não cobre Pseudomonas." },
  { name: "Ceftriaxone", class: "Cefalosporina 3ª G", normalDose: "1–2g IV 1×/dia",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "1–2g IV 1×/dia — SEM ajuste" }],
    rrtDose: "1–2g 1×/dia. Sem ajuste.", notes: "Excreção biliar + renal. CI em neonatos c/ bilirrubinemia." },
  { name: "Cefepime", class: "Cefalosporina 4ª G", normalDose: "2g IV 8/8h",
    adjustments: [{ clCrRange: "≥ 60", min: 60, max: 999, dose: "2g IV 8/8h" }, { clCrRange: "30–59", min: 30, max: 60, dose: "2g IV 12/12h" }, { clCrRange: "11–29", min: 11, max: 30, dose: "1g IV 12/12h" }, { clCrRange: "≤ 10", min: 0, max: 11, dose: "1g IV 24/24h" }],
    rrtDose: "CVVH: 2g 12/12h. HD: 1g pós-HD.", notes: "Neurotoxicidade em IR. Ajuste obrigatório." },
  { name: "Ceftazidima/Avibactam", class: "Cefalosporina + Inibidor", normalDose: "2.5g IV 8/8h (perfusão 2h)",
    adjustments: [{ clCrRange: "≥ 50", min: 50, max: 999, dose: "2.5g 8/8h" }, { clCrRange: "31–50", min: 31, max: 51, dose: "1.25g 8/8h" }, { clCrRange: "16–30", min: 16, max: 31, dose: "0.94g 12/12h" }, { clCrRange: "≤ 15", min: 0, max: 16, dose: "0.94g 24/24h" }],
    rrtDose: "CVVH: 2.5g 8/8h. HD: 0.94g pós-HD.", notes: "Para KPC e OXA-48." },
  { name: "Ceftolozano/Tazobactam", class: "Cefalosporina + Inibidor", normalDose: "1.5g IV 8/8h (3g 8/8h pneumonia)",
    adjustments: [{ clCrRange: "≥ 50", min: 50, max: 999, dose: "Dose habitual" }, { clCrRange: "30–49", min: 30, max: 50, dose: "750mg 8/8h" }, { clCrRange: "15–29", min: 15, max: 30, dose: "375mg 8/8h" }, { clCrRange: "< 15", min: 0, max: 15, dose: "Dados limitados." }],
    rrtDose: "HD: 750mg pós-HD. CVVH: dose habitual.", notes: "Pseudomonas MDR. Sem atividade KPC." },
  { name: "Ceftarolina", class: "Cefalosporina 5ª G", normalDose: "600 mg IV 12/12h (perfusão 1h)",
    adjustments: [{ clCrRange: "≥ 50", min: 50, max: 999, dose: "600 mg 12/12h" }, { clCrRange: "31–50", min: 31, max: 51, dose: "400 mg 12/12h" }, { clCrRange: "15–30", min: 15, max: 31, dose: "300 mg 12/12h" }, { clCrRange: "< 15", min: 0, max: 15, dose: "200 mg 12/12h" }],
    rrtDose: "200 mg 12/12h. Supl pós-HD.", notes: "Atividade anti-MRSA. Pneumonia e SSTI." },
  // Carbapenemos
  { name: "Meropenem", class: "Carbapenemo", normalDose: "1–2g IV 8/8h (perfusão 3h)",
    adjustments: [{ clCrRange: "≥ 50", min: 50, max: 999, dose: "1–2g 8/8h" }, { clCrRange: "25–49", min: 25, max: 50, dose: "1g 12/12h" }, { clCrRange: "10–24", min: 10, max: 25, dose: "500mg–1g 12/12h" }, { clCrRange: "< 10", min: 0, max: 10, dose: "500mg 24/24h" }],
    rrtDose: "CVVH: 1–2g 8/8h. HD: 500mg–1g pós-HD.", notes: "Perfusão 3h. Reduz limiar convulsivo." },
  { name: "Ertapenem", class: "Carbapenemo", normalDose: "1g IV 1×/dia",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "1g 1×/dia" }, { clCrRange: "< 30", min: 0, max: 30, dose: "500mg 1×/dia" }],
    rrtDose: "HD: 500mg pós-HD. CVVH: 1g 1×/dia.", notes: "Sem atividade contra Pseudomonas/Acinetobacter." },
  // Monobactamo
  { name: "Aztreonam", class: "Monobactamo", normalDose: "2g IV 6/6–8/8h",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "Dose habitual" }, { clCrRange: "10–29", min: 10, max: 30, dose: "1g 8/8h" }, { clCrRange: "< 10", min: 0, max: 10, dose: "500mg 8/8h" }],
    rrtDose: "500mg 8/8h. Supl pós-HD.", notes: "Só Gram-neg. Alternativa em alergia grave a penicilinas. Sem reação cruzada com β-lactâmicos." },
  // Aminoglicosídeos
  { name: "Amicacina", class: "Aminoglicosídeo", normalDose: "15–20 mg/kg IV 1×/dia (dose única diária)",
    adjustments: [{ clCrRange: "≥ 60", min: 60, max: 999, dose: "15–20 mg/kg 1×/dia" }, { clCrRange: "40–59", min: 40, max: 60, dose: "15 mg/kg 36/36h" }, { clCrRange: "20–39", min: 20, max: 40, dose: "15 mg/kg 48/48h" }, { clCrRange: "< 20", min: 0, max: 20, dose: "Guiar por níveis (vale < 5)" }],
    rrtDose: "CVVH: 10 mg/kg 48/48h. HD: pós-HD por níveis.", notes: "Oto/nefrotóxica. Pico: 56–64 mg/L. Vale: < 5." },
  { name: "Gentamicina", class: "Aminoglicosídeo", normalDose: "5–7 mg/kg IV 1×/dia",
    adjustments: [{ clCrRange: "≥ 60", min: 60, max: 999, dose: "5–7 mg/kg 1×/dia" }, { clCrRange: "40–59", min: 40, max: 60, dose: "5 mg/kg 36/36h" }, { clCrRange: "20–39", min: 20, max: 40, dose: "5 mg/kg 48/48h" }, { clCrRange: "< 20", min: 0, max: 20, dose: "Guiar por níveis" }],
    rrtDose: "CVVH: 2 mg/kg 48/48h. HD: pós-HD.", notes: "Oto/nefrotóxica. Vale < 1 mg/L. Sinergia em endocardite." },
  // Glicopeptídeos
  { name: "Vancomicina", class: "Glicopeptídeo", normalDose: "15–20 mg/kg IV 12/12h",
    adjustments: [{ clCrRange: "≥ 90", min: 90, max: 999, dose: "15–20 mg/kg 12/12h. AUC/MIC 400–600." }, { clCrRange: "60–89", min: 60, max: 90, dose: "15 mg/kg 12/12h" }, { clCrRange: "30–59", min: 30, max: 60, dose: "15 mg/kg 24/24h" }, { clCrRange: "15–29", min: 15, max: 30, dose: "15 mg/kg 48/48h" }, { clCrRange: "< 15", min: 0, max: 15, dose: "15 mg/kg dose única, guiar por níveis" }],
    rrtDose: "CVVH: 15–20 mg/kg loading, 7.5–10 mg/kg 12/12h. HD: pós-HD.", notes: "Nefrotóxica. AUC/MIC ou vale 15–20." },
  // Oxazolidinonas
  { name: "Linezolida", class: "Oxazolidinona", normalDose: "600 mg IV/PO 12/12h",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "600 mg 12/12h — SEM ajuste" }],
    rrtDose: "600 mg 12/12h. Sem ajuste.", notes: "Trombocitopenia. Plaquetas semanais. Máx 14–28 dias." },
  // Lipopeptídeo
  { name: "Daptomicina", class: "Lipopeptídeo", normalDose: "6–10 mg/kg IV 1×/dia",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "6–10 mg/kg 1×/dia" }, { clCrRange: "< 30", min: 0, max: 30, dose: "6–10 mg/kg 48/48h" }],
    rrtDose: "HD: 6–10 mg/kg pós-HD 48/48h.", notes: "Bacteriemia MRSA, endocardite. Inativado pelo surfactante → não usar em pneumonia." },
  // Fluoroquinolonas
  { name: "Ciprofloxacina", class: "Fluoroquinolona", normalDose: "400 mg IV 8/8–12/12h ou 500 mg PO 12/12h",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "Dose habitual" }, { clCrRange: "< 30", min: 0, max: 30, dose: "200–400 mg IV 12/12h ou 250–500 mg PO 12/12h" }],
    rrtDose: "200–400 mg IV 12/12h.", notes: "Pseudomonas. Tendinopatia. QT. Sem combinar com Mg/Ca/Fe." },
  { name: "Levofloxacina", class: "Fluoroquinolona", normalDose: "500–750 mg IV/PO 1×/dia",
    adjustments: [{ clCrRange: "≥ 50", min: 50, max: 999, dose: "750 mg 1×/dia" }, { clCrRange: "20–49", min: 20, max: 50, dose: "750 mg 1×, depois 500 mg 1×/dia" }, { clCrRange: "< 20", min: 0, max: 20, dose: "750 mg 1×, depois 500 mg 48/48h" }],
    rrtDose: "500 mg 48/48h.", notes: "Pneumonia comunitária. QT prolongado." },
  // Macrólidos
  { name: "Azitromicina", class: "Macrólido", normalDose: "500 mg IV/PO 1×/dia",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "500 mg 1×/dia — SEM ajuste" }],
    rrtDose: "Sem ajuste.", notes: "QT. Pneumonia atípica. 3–5 dias." },
  { name: "Claritromicina", class: "Macrólido", normalDose: "500 mg PO/IV 12/12h",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "Dose habitual" }, { clCrRange: "< 30", min: 0, max: 30, dose: "250 mg 12/12h ou 500 mg 24/24h" }],
    rrtDose: "250 mg 12/12h.", notes: "Múltiplas interações (CYP3A4). QT." },
  { name: "Eritromicina", class: "Macrólido", normalDose: "500 mg–1g IV 6/6h",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "Sem ajuste renal (excreção hepática)" }],
    rrtDose: "Sem ajuste.", notes: "Procinético em UCI (250 mg IV 8/8h). QT. Flebite IV." },
  // Tetraciclinas
  { name: "Doxiciclina", class: "Tetraciclina", normalDose: "100 mg IV/PO 12/12h",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "100 mg 12/12h — SEM ajuste" }],
    rrtDose: "Sem ajuste.", notes: "Excreção GI. Fotossensibilidade. Atípicos, Rickettsia, MRSA (PO)." },
  // Lincosamidas
  { name: "Clindamicina", class: "Lincosamida", normalDose: "600–900 mg IV 8/8h",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "Sem ajuste renal (excreção hepática)" }],
    rrtDose: "Sem ajuste.", notes: "Risco de C. difficile. Toxinas estafilocócicas. Alergia penicilina." },
  // Nitroimidazol
  { name: "Metronidazol", class: "Nitroimidazol", normalDose: "500 mg IV 8/8h",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "500 mg 8/8h — Sem ajuste" }],
    rrtDose: "500 mg 8/8h. Supl pós-HD.", notes: "Anaeróbios. C. difficile. Neuropatia periférica se prolongado." },
  // Ansamicina
  { name: "Rifampicina", class: "Ansamicina", normalDose: "600 mg IV/PO 1×/dia (ou 300 mg 12/12h)",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "Sem ajuste renal" }],
    rrtDose: "Sem ajuste.", notes: "Indutor CYP450 — múltiplas interações. Hepatotoxicidade. Biofilme." },
  // Sulfonamida
  { name: "TMP/SMX (Cotrimoxazol)", class: "Sulfonamida", normalDose: "TMP 5 mg/kg IV 6/6–8/8h (PCP: 15–20 mg/kg/dia TMP)",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "Dose habitual" }, { clCrRange: "15–29", min: 15, max: 30, dose: "Dose habitual ou ↓ 50%" }, { clCrRange: "< 15", min: 0, max: 15, dose: "Evitar se possível. Alternativas." }],
    rrtDose: "TMP 5 mg/kg 12/12h pós-HD.", notes: "PCP, Stenotrophomonas, Nocardia. Hipercaliemia, mielotoxicidade." },
  // Polimixinas
  { name: "Colistina (Colistimetato)", class: "Polimixina", normalDose: "Loading: 9 MUI IV, depois 4.5 MUI IV 12/12h",
    adjustments: [{ clCrRange: "≥ 80", min: 80, max: 999, dose: "4.5 MUI 12/12h" }, { clCrRange: "50–79", min: 50, max: 80, dose: "3.5 MUI 12/12h" }, { clCrRange: "30–49", min: 30, max: 50, dose: "3 MUI 12/12h" }, { clCrRange: "< 30", min: 0, max: 30, dose: "2 MUI 12/12h" }],
    rrtDose: "CVVH: 4.5 MUI 12/12h. HD: 2 MUI pós-HD.", notes: "Último recurso para Gram-neg MDR. Nefro/neurotóxica. Nebulização: 2–4 MUI 8/8h." },
  // Tópico
  { name: "Mupirocina", class: "Tópico", normalDose: "Pomada nasal 2% 12/12h × 5 dias",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "Tópico — Sem ajuste" }],
    rrtDose: "N/A (tópico)", notes: "Descolonização MRSA nasal. Não usar > 10 dias (resistência)." },
  // Nitrofurano
  { name: "Nitrofurantoína", class: "Nitrofurano", normalDose: "100 mg PO 6/6h (5–7 dias)",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "100 mg PO 6/6h" }, { clCrRange: "< 30", min: 0, max: 30, dose: "CONTRAINDICADA — ineficaz e neurotóxica" }],
    rrtDose: "CONTRAINDICADA", notes: "Só ITU baixa. CI em IR grave." },
  // Antifúngicos
  { name: "Fluconazol", class: "Antifúngico (Azol)", normalDose: "400–800 mg IV 1×/dia (loading 800 mg)",
    adjustments: [{ clCrRange: "≥ 50", min: 50, max: 999, dose: "Dose habitual" }, { clCrRange: "< 50", min: 0, max: 50, dose: "↓ 50% (loading sem ajuste)" }],
    rrtDose: "HD: dose habitual pós-HD. CVVH: dose habitual.", notes: "Candida sensível. Interações CYP2C9/3A4. Hepatotoxicidade." },
  { name: "Anidulafungina", class: "Antifúngico (Equinocandina)", normalDose: "Loading 200 mg IV, depois 100 mg 1×/dia",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "Sem ajuste renal" }],
    rrtDose: "Sem ajuste.", notes: "Candidémia e candidiase invasiva. Sem ajuste hepático/renal." },
  { name: "Caspofungina", class: "Antifúngico (Equinocandina)", normalDose: "Loading 70 mg IV, depois 50 mg 1×/dia",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "Sem ajuste renal. Child-Pugh B: 35 mg/dia." }],
    rrtDose: "Sem ajuste.", notes: "Alternativa à anidulafungina. Ajustar em IH moderada." },
  { name: "Anfotericina B Lipossómica", class: "Antifúngico (Polieno)", normalDose: "3–5 mg/kg IV 1×/dia",
    adjustments: [{ clCrRange: "Qualquer", min: 0, max: 999, dose: "3–5 mg/kg 1×/dia — Sem ajuste" }],
    rrtDose: "Sem ajuste. Monitorizar K+ e Mg2+.", notes: "Fungos filamentosos, Cryptococcus. Nefrotóxica (monitorizar)." },
];

/* ═══════════════════════════════════════════════════════════
   EMPIRIC ANTIBIOTIC GUIDE BY INFECTION SITE
   ═══════════════════════════════════════════════════════════ */

interface EmpiricRegimen {
  site: string;
  category: string;
  scenarios: {
    condition: string;
    firstLine: string;
    alternatives: string;
    duration: string;
    notes: string;
  }[];
  reference: string;
}

const EMPIRIC_REGIMENS: EmpiricRegimen[] = [
  {
    site: "Pneumonia Comunitária (PAC)",
    category: "Respiratório",
    scenarios: [
      { condition: "PAC não grave (enfermaria)", firstLine: "Amoxicilina/Clav 1.2g IV 8/8h + Azitromicina 500mg IV 1×/dia", alternatives: "Levofloxacina 750mg IV 1×/dia (monoterapia)", duration: "5–7 dias", notes: "Reavaliar em 48–72h. De-escalar com culturas." },
      { condition: "PAC grave (UCI)", firstLine: "Ceftriaxone 2g IV 1×/dia + Azitromicina 500mg IV 1×/dia", alternatives: "Pip/Tazo 4.5g 6/6h + Levofloxacina 750mg (se risco Pseudomonas)", duration: "7 dias", notes: "Considerar Pseudomonas se: bronquiectasias, DPOC grave, antibioterapia prévia, corticoterapia." },
      { condition: "Suspeita de Legionella", firstLine: "Levofloxacina 750mg IV 1×/dia", alternatives: "Azitromicina 500mg IV 1×/dia", duration: "7–14 dias (21 se imunossuprimido)", notes: "Pedir Ag urinário de Legionella. Hiponatremia + diarreia sugestivos." },
    ],
    reference: "IDSA/ATS 2019 · ERS/ESICM 2023",
  },
  {
    site: "Pneumonia Associada ao Ventilador (PAV)",
    category: "Respiratório",
    scenarios: [
      { condition: "PAV precoce (< 5 dias), sem FR para MDR", firstLine: "Pip/Tazo 4.5g IV 6/6h (perf. 4h)", alternatives: "Cefepime 2g IV 8/8h ou Meropenem 1g 8/8h", duration: "7 dias", notes: "Monitorizar procalcitonina para guiar duração." },
      { condition: "PAV tardia ou FR para MDR", firstLine: "Meropenem 2g IV 8/8h (perf. 3h) + Amicacina 25mg/kg 1×/dia ± Vancomicina/Linezolida (se MRSA)", alternatives: "Pip/Tazo + Cipro + cobertura MRSA", duration: "7 dias (ajustar com culturas)", notes: "FR MDR: ATB nos últimos 90d, internamento > 5d, choque séptico, TSFR, colonização conhecida." },
    ],
    reference: "IDSA/ATS 2016 · ESCMID 2017",
  },
  {
    site: "Infeção Urinária (ITU)",
    category: "Urológico",
    scenarios: [
      { condition: "Cistite não complicada", firstLine: "Nitrofurantoína 100mg PO 6/6h × 5d", alternatives: "Fosfomicina 3g PO dose única ou TMP/SMX 160/800mg 12/12h × 3d", duration: "3–5 dias", notes: "Evitar fluoroquinolonas em ITU baixa." },
      { condition: "Pielonefrite / ITU complicada", firstLine: "Ceftriaxone 2g IV 1×/dia", alternatives: "Pip/Tazo 4.5g 6/6h ou Meropenem (se ESBL)", duration: "7–14 dias", notes: "Urocultura obrigatória. Drenar coleções/obstruções." },
      { condition: "ITU associada a cateter (CAUTI)", firstLine: "Cefepime 2g IV 8/8h (se Pseudomonas possível)", alternatives: "Pip/Tazo ou Meropenem (se MDR)", duration: "7 dias (remover/trocar algália)", notes: "Não tratar bacteriúria assintomática. Remover algália se possível." },
    ],
    reference: "IDSA 2010 · EAU 2023",
  },
  {
    site: "Infeção Intra-abdominal (IIA)",
    category: "Abdominal",
    scenarios: [
      { condition: "IIA comunitária (não complicada)", firstLine: "Amoxicilina/Clav 1.2g IV 8/8h", alternatives: "Ceftriaxone 2g + Metronidazol 500mg 8/8h", duration: "4–7 dias (controlo de foco adequado: 4 dias)", notes: "Controlo de foco cirúrgico é prioritário." },
      { condition: "IIA complicada / nosocomial", firstLine: "Pip/Tazo 4.5g IV 6/6h (perf. 4h)", alternatives: "Meropenem 1g 8/8h (se risco ESBL/MDR)", duration: "4–7 dias (se controlo de foco adequado)", notes: "Duração curta (4d) se drenagem eficaz (STOP-IT trial)." },
      { condition: "Peritonite terciária / MDR", firstLine: "Meropenem 2g 8/8h ± Vancomicina ± Anidulafungina", alternatives: "Ceftazidima/Avibactam (se KPC)", duration: "Individualizar", notes: "Culturas de líquido peritoneal essenciais. Considerar fungos." },
    ],
    reference: "SIS/IDSA 2017 · WSES 2021",
  },
  {
    site: "Bacteriemia / Sépsis sem foco",
    category: "Sistémica",
    scenarios: [
      { condition: "Sépsis comunitária sem foco evidente", firstLine: "Pip/Tazo 4.5g IV 6/6h + Vancomicina (se cateter ou MRSA)", alternatives: "Meropenem 1g 8/8h + Vancomicina", duration: "7–14 dias (conforme foco)", notes: "Hemoculturas × 2 (periférica + CVC). Procalcitonina seriada." },
      { condition: "Bacteriemia associada a CVC", firstLine: "Vancomicina 15–20mg/kg 12/12h ± Pip/Tazo ou Meropenem (se Gram-neg)", alternatives: "Daptomicina 8–10mg/kg (se MRSA + vancomicina MIC > 1)", duration: "Remover CVC. 5–7d (S. coag-neg), 14d (S. aureus), 4–6 sem (endocardite)", notes: "S. aureus: SEMPRE ecocardiograma (ETE). Risco de endocardite." },
    ],
    reference: "Surviving Sepsis Campaign 2021 · IDSA 2009",
  },
  {
    site: "Meningite Bacteriana",
    category: "Neurológico",
    scenarios: [
      { condition: "Empírica (comunitária)", firstLine: "Ceftriaxone 2g IV 12/12h + Vancomicina 15–20mg/kg 8/8–12/12h + Dexametasona 0.15mg/kg 6/6h × 4d", alternatives: "Meropenem 2g 8/8h (se alergia cefalosporinas)", duration: "7–14d (conforme agente)", notes: "Dexametasona ANTES ou com 1ª dose de ATB. LCR obrigatório." },
      { condition: "Pós-neurocirúrgica / nosocomial", firstLine: "Meropenem 2g IV 8/8h + Vancomicina", alternatives: "Cefepime 2g 8/8h + Vancomicina", duration: "10–21 dias", notes: "Considerar colistina intratecal se Gram-neg MDR." },
    ],
    reference: "IDSA 2004 · ESCMID 2016",
  },
  {
    site: "Pele e Tecidos Moles",
    category: "Tecidos Moles",
    scenarios: [
      { condition: "Celulite não purulenta", firstLine: "Flucloxacilina 2g IV 6/6h", alternatives: "Cefazolina 2g 8/8h ou Clindamicina 600mg 8/8h", duration: "5–7 dias", notes: "Se melhoria clínica → switch PO." },
      { condition: "Celulite purulenta / abcesso", firstLine: "Flucloxacilina 2g 6/6h + Drenagem", alternatives: "Vancomicina ou Daptomicina (se MRSA)", duration: "5–10 dias", notes: "Drenagem é a base do tratamento." },
      { condition: "Fasceíte necrosante", firstLine: "Meropenem 2g 8/8h + Clindamicina 900mg 8/8h + Vancomicina", alternatives: "Pip/Tazo + Clindamicina + Vancomicina", duration: "Até resolução cirúrgica + clínica", notes: "EMERGÊNCIA CIRÚRGICA. Clindamicina inibe toxinas. Desbridamento agressivo." },
    ],
    reference: "IDSA 2014 · WSES 2018",
  },
  {
    site: "Endocardite Infecciosa",
    category: "Cardiovascular",
    scenarios: [
      { condition: "Válvula nativa — empírica", firstLine: "Ampicilina 2g IV 4/4h + Flucloxacilina 2g 6/6h + Gentamicina 3mg/kg 1×/dia", alternatives: "Vancomicina 15–20mg/kg 12/12h + Gentamicina (se alergia)", duration: "4–6 semanas (Genta: 2 semanas)", notes: "Hemoculturas × 3 antes de ATB. ETE precoce." },
      { condition: "Válvula protésica — empírica", firstLine: "Vancomicina 15–20mg/kg 12/12h + Gentamicina 3mg/kg 1×/dia + Rifampicina 600mg 12/12h", alternatives: "Daptomicina se alergia", duration: "≥ 6 semanas", notes: "Cirurgia precoce se: IC, abcesso, embolização, vegetação > 10mm." },
    ],
    reference: "ESC 2023 · AHA 2015",
  },
  {
    site: "Candidémia / Candidiase Invasiva",
    category: "Fúngica",
    scenarios: [
      { condition: "Candidémia empírica", firstLine: "Anidulafungina 200mg loading, depois 100mg 1×/dia", alternatives: "Caspofungina 70mg loading, depois 50mg/dia ou Fluconazol 800mg loading + 400mg/dia (se não-grave e sem azol prévio)", duration: "14 dias após 1ª hemocultura negativa", notes: "Remover CVC. Fundoscopia. Repetir hemoculturas 48/48h até negativas." },
      { condition: "Candida resistente ao fluconazol", firstLine: "Anidulafungina ou Caspofungina", alternatives: "Anfotericina B lipossómica 3–5mg/kg/dia", duration: "Individualizar", notes: "C. glabrata e C. krusei: resistência intrínseca ao fluconazol." },
    ],
    reference: "IDSA 2016 · ESCMID 2012",
  },
];

/* ═══════════════════════════════════════════════════════════
   MDR COLONIZATION — MRSA & KPC
   ═══════════════════════════════════════════════════════════ */

interface MDROrganism {
  id: string;
  name: string;
  fullName: string;
  resistanceMechanism: string;
  mechanismDetail: string;
  clinicalImpact: string;
  decolonization: string;
  treatmentOptions: {
    indication: string;
    firstLine: string;
    alternatives: string;
    notes: string;
  }[];
  precautions: string;
}

const MDR_ORGANISMS: MDROrganism[] = [
  {
    id: "mrsa",
    name: "MRSA",
    fullName: "Staphylococcus aureus resistente à meticilina",
    resistanceMechanism: "Gene mecA → PBP2a alterada",
    mechanismDetail: "O gene mecA (localizado na cassete cromossómica SCCmec) codifica a PBP2a (Penicillin-Binding Protein 2a), uma transpeptidase com baixa afinidade para todos os β-lactâmicos. Isto confere resistência cruzada a TODAS as penicilinas, cefalosporinas e carbapenemos. A PBP2a mantém a capacidade de sintetizar a parede celular mesmo na presença destes antibióticos.",
    clinicalImpact: "Prevalência elevada em UCI. Associado a bacteriemias de CVC, pneumonia (PAV), infeções de pele/tecidos moles e endocardite. Mortalidade 20–40% na bacteriemia por MRSA.",
    decolonization: "Mupirocina nasal 2% 12/12h × 5 dias + banho com clorexidina 2% diário × 5 dias. Reavaliar zaragatoas a 48h pós-conclusão.",
    treatmentOptions: [
      { indication: "Bacteriemia / Endocardite", firstLine: "Vancomicina 15–20 mg/kg IV 12/12h (AUC/MIC 400–600)", alternatives: "Daptomicina 8–10 mg/kg IV 1×/dia (se MIC vancomicina ≥ 1.5 ou falha)", notes: "S. aureus bacteriemia: SEMPRE ETE + repetir hemoculturas 48/48h. Mín. 14 dias (sem complicações), 4–6 sem (endocardite)." },
      { indication: "Pneumonia (PAV/HAP)", firstLine: "Vancomicina 15–20 mg/kg 12/12h (vale 15–20)", alternatives: "Linezolida 600 mg 12/12h (melhor penetração pulmonar)", notes: "Linezolida superior à vancomicina em termos de penetração pulmonar (estudos ZEPHyR). Considerar se MIC vancomicina ≥ 1.5." },
      { indication: "Pele / Tecidos Moles (SSTI)", firstLine: "Vancomicina IV (grave) ou TMP/SMX + Rifampicina PO (ligeiro-moderado)", alternatives: "Daptomicina, Linezolida, Ceftarolina", notes: "Drenagem de abcessos é essencial. SSTI ligeira: doxiciclina ou TMP/SMX PO podem ser suficientes." },
      { indication: "Meningite", firstLine: "Vancomicina 15–20 mg/kg 8/8h (dose elevada para penetração SNC)", alternatives: "Linezolida 600 mg 12/12h ou TMP/SMX IV", notes: "Daptomicina NÃO penetra SNC. Considerar vancomicina intratecal em casos refratários." },
      { indication: "Infeção osteoarticular / Prótese", firstLine: "Vancomicina IV + Rifampicina 600 mg/dia PO", alternatives: "Daptomicina + Rifampicina", notes: "Rifampicina essencial para atividade em biofilme. Nunca usar em monoterapia (resistência rápida)." },
    ],
    precautions: "Isolamento de contacto. EPI: bata + luvas. Quarto individual ou coorte. Equipamento dedicado.",
  },
  {
    id: "kpc",
    name: "KPC",
    fullName: "Klebsiella pneumoniae produtora de carbapenemase (KPC)",
    resistanceMechanism: "Gene blaKPC → Carbapenemase classe A de Ambler",
    mechanismDetail: "O gene blaKPC (geralmente em plasmídeo) codifica uma serina-β-lactamase de classe A que hidrolisa TODOS os β-lactâmicos incluindo carbapenemos. É transferível horizontalmente entre espécies (Klebsiella, E. coli, Enterobacter, etc.). Frequentemente co-localizado com genes de resistência a aminoglicosídeos, fluoroquinolonas e TMP/SMX, resultando em perfis extensivamente resistentes (XDR).",
    clinicalImpact: "Mortalidade 40–70% em bacteriemia. Opções terapêuticas muito limitadas. Risco de disseminação nosocomial. Associado a UCI, uso prévio de carbapenemos, internamento prolongado e TSFR.",
    decolonization: "Sem protocolo de descolonização eficaz estabelecido. Rastreio com zaragatoa retal em doentes de risco à admissão. Isolamento de contacto rigoroso.",
    treatmentOptions: [
      { indication: "Infeção urinária (ITU)", firstLine: "Ceftazidima/Avibactam 2.5g IV 8/8h", alternatives: "Meropenem/Vaborbactam 4g 8/8h ou Colistina (se sem alternativas)", notes: "Se MIC meropenem ≤ 8: meropenem em dose elevada (2g 8/8h, perfusão 3h) pode ser opção em combinação." },
      { indication: "Bacteriemia / Sépsis", firstLine: "Ceftazidima/Avibactam 2.5g IV 8/8h (perf. 2h)", alternatives: "Meropenem/Vaborbactam 4g 8/8h (perf. 3h) ou Imipenem/Relebactam", notes: "Terapêutica combinada discutível. Evidência favorece Caz/Avi em monoterapia (CRACKLE-2). Se resistência a Caz/Avi: Ceftazidima/Avibactam + Aztreonam." },
      { indication: "Pneumonia (PAV/HAP)", firstLine: "Ceftazidima/Avibactam 2.5g IV 8/8h", alternatives: "Meropenem/Vaborbactam ou Colistina IV + nebulizada", notes: "Considerar Colistina nebulizada adjuvante. TDM de colistina se disponível." },
      { indication: "IIA / Peritonite", firstLine: "Ceftazidima/Avibactam 2.5g 8/8h ± Metronidazol 500mg 8/8h", alternatives: "Meropenem/Vaborbactam + Metronidazol", notes: "Controlo de foco cirúrgico é essencial." },
      { indication: "Infeção com resistência a Caz/Avi", firstLine: "Ceftazidima/Avibactam + Aztreonam (sinergia)", alternatives: "Colistina 9MUI loading + 4.5MUI 12/12h ± Meropenem em perfusão ± Amicacina", notes: "Situação de último recurso. Associar ≥ 2 agentes ativos in vitro. Pedir sensibilidades alargadas." },
    ],
    precautions: "Isolamento de contacto ESTRITO. Quarto individual obrigatório. Rastreio de contactos. Notificação ao CCI. Equipamento dedicado. Limpeza terminal do quarto.",
  },
  {
    id: "esbl",
    name: "ESBL",
    fullName: "Enterobacteriaceae produtoras de β-lactamases de espectro alargado",
    resistanceMechanism: "Genes blaCTX-M, blaSHV, blaTEM → β-lactamases de espectro alargado",
    mechanismDetail: "As ESBLs são enzimas plasmídicas (mais frequentemente CTX-M-15) que hidrolisam cefalosporinas de 3ª e 4ª geração e aztreonam, mas NÃO carbapenemos. São inibidas por ácido clavulânico, tazobactam e avibactam. Frequentemente co-resistência a fluoroquinolonas, aminoglicosídeos e TMP/SMX.",
    clinicalImpact: "Prevalência crescente, especialmente E. coli e K. pneumoniae. Fator de risco para progressão a KPC. Associada a ITU complicada, bacteriemias e IIA.",
    decolonization: "Sem protocolo estabelecido. Medidas de precaução de contacto variáveis conforme instituição.",
    treatmentOptions: [
      { indication: "ITU não complicada", firstLine: "Nitrofurantoína 100mg PO 6/6h ou Fosfomicina 3g PO", alternatives: "Ertapenem 1g IV 1×/dia (se necessário IV)", notes: "Evitar cefalosporinas 3ª geração mesmo se sensível in vitro (efeito inóculo)." },
      { indication: "Infeção grave (bacteriemia/sépsis)", firstLine: "Meropenem 1–2g IV 8/8h (perf. 3h)", alternatives: "Ertapenem 1g 1×/dia (se sem Pseudomonas), Pip/Tazo 4.5g 6/6h (se MIC ≤ 4 e não-grave)", notes: "MERINO trial: Meropenem superior a Pip/Tazo na bacteriemia por ESBL. Pip/Tazo aceitável em ITU com controlo de foco." },
      { indication: "IIA", firstLine: "Ertapenem 1g 1×/dia (se comunitária)", alternatives: "Meropenem (se nosocomial/grave)", notes: "Ertapenem poupa espectro anti-Pseudomonas." },
    ],
    precautions: "Precauções de contacto. Higiene das mãos reforçada. Evitar uso desnecessário de cefalosporinas 3ª geração (pressão seletiva).",
  },
  {
    id: "vre",
    name: "VRE",
    fullName: "Enterococcus resistente à vancomicina",
    resistanceMechanism: "Genes vanA/vanB → alteração do alvo D-Ala-D-Ala",
    mechanismDetail: "O gene vanA (mais comum) altera o terminal D-Ala-D-Ala do peptidoglicano para D-Ala-D-Lac, diminuindo dramaticamente a afinidade da vancomicina pelo seu alvo. O vanA confere resistência de alto nível à vancomicina E teicoplanina. O vanB confere resistência apenas à vancomicina.",
    clinicalImpact: "Prevalência crescente em UCI. E. faecium mais frequente que E. faecalis. Associado a bacteriemias, IIA e ITU em doentes imunocomprometidos. Mortalidade 30–50% em bacteriemia.",
    decolonization: "Sem protocolo eficaz. Rastreio retal em doentes de risco.",
    treatmentOptions: [
      { indication: "Bacteriemia", firstLine: "Linezolida 600 mg IV/PO 12/12h", alternatives: "Daptomicina 8–12 mg/kg IV 1×/dia", notes: "Linezolida: trombocitopenia (monitorizar plaquetas). Daptomicina: dose elevada para Enterococcus." },
      { indication: "ITU", firstLine: "Linezolida 600 mg PO 12/12h", alternatives: "Nitrofurantoína ou Fosfomicina (se E. faecalis)", notes: "Muitos VRE são sensíveis a nitrofurantoína e fosfomicina in vitro." },
      { indication: "Endocardite", firstLine: "Daptomicina 8–12 mg/kg + Ampicilina (se sinergismo)", alternatives: "Linezolida (se sem alternativa)", notes: "Consultar infeciologia. Cirurgia frequentemente necessária." },
    ],
    precautions: "Isolamento de contacto. Quarto individual ou coorte. Rastreio de contactos.",
  },
  {
    id: "acinetobacter",
    name: "Acinetobacter XDR",
    fullName: "Acinetobacter baumannii extensivamente resistente",
    resistanceMechanism: "Múltiplos: OXA-carbapenemases + Porinas + Bombas de efluxo",
    mechanismDetail: "Resistência multifatorial: (1) Carbapenemases OXA (OXA-23, OXA-24, OXA-58) — classe D de Ambler — hidrolisam carbapenemos fracamente mas eficazmente; (2) Perda de porinas (CarO) reduz entrada de antibióticos; (3) Bombas de efluxo (AdeABC) expulsam múltiplos antibióticos. A combinação resulta em resistência a quase todos os β-lactâmicos, aminoglicosídeos e fluoroquinolonas.",
    clinicalImpact: "Causa major de PAV em UCI. Mortalidade 40–60%. Sobrevive em superfícies por semanas. Surtos nosocomiais frequentes.",
    decolonization: "Limpeza ambiental intensificada. Clorexidina banhos. Sem descolonização individual eficaz.",
    treatmentOptions: [
      { indication: "PAV / Infeção grave", firstLine: "Colistina 9MUI IV loading + 4.5MUI 12/12h + Meropenem 2g 8/8h (perf. 3h)", alternatives: "Colistina + Ampicilina/Sulbactam 9g/dia (se sensível) ou Colistina + Tigeciclina", notes: "Colistina nebulizada adjuvante (2–4 MUI 8/8h) na PAV. Combinação sempre recomendada." },
      { indication: "ITU", firstLine: "Colistina IV (se sensível)", alternatives: "Ampicilina/Sulbactam (dose elevada)", notes: "Monitorizar função renal. Colistina intravesical pode ser considerada." },
    ],
    precautions: "Isolamento de contacto ESTRITO. Limpeza terminal. Descontaminação ambiental. Notificação CCI.",
  },
  {
    id: "pseudomonas",
    name: "Pseudomonas MDR",
    fullName: "Pseudomonas aeruginosa multirresistente",
    resistanceMechanism: "Múltiplos: AmpC cromossómica + Bombas efluxo + Perda OprD + Metalo-β-lactamases",
    mechanismDetail: "A resistência em Pseudomonas é multifatorial e cumulativa: (1) AmpC cromossómica induzível — hidrólise de cefalosporinas (exceto cefepime/ceftolozano); (2) Perda da porina OprD — principal via de entrada dos carbapenemos (sobretudo imipenem); (3) Bombas de efluxo (MexAB-OprM, MexXY-OprM) — expulsam β-lactâmicos, fluoroquinolonas e aminoglicosídeos; (4) Metalo-β-lactamases adquiridas (VIM, IMP, NDM) — hidrolisam todos os β-lactâmicos EXCETO aztreonam. A combinação de mecanismos resulta em fenótipos DTR (difficult-to-treat resistance).",
    clinicalImpact: "Principal Gram-negativo não-fermentador em UCI. Causa frequente de PAV, bacteriemia associada a CVC, ITU complicada e infeção de ferida cirúrgica. Mortalidade 30–50% em bacteriemia. Formação de biofilme dificulta erradicação.",
    decolonization: "Sem protocolo de descolonização eficaz. Rastreio respiratório e retal em UCI com surtos. Controlo ambiental (água, lavatórios, sifões). Reforço da higiene das mãos.",
    treatmentOptions: [
      { indication: "PAV / Pneumonia nosocomial", firstLine: "Ceftolozano/Tazobactam 3g IV 8/8h (perf. 1h) — dose pneumonia", alternatives: "Cefepime 2g 8/8h (se sensível) ou Pip/Tazo 4.5g 6/6h (perf. 4h, se MIC ≤ 16)", notes: "Se MDR: Ceftolozano/Tazobactam é a opção com melhor atividade anti-Pseudomonas. Considerar Colistina nebulizada adjuvante." },
      { indication: "Bacteriemia / Sépsis", firstLine: "Ceftolozano/Tazobactam 1.5g IV 8/8h OU Cefepime 2g 8/8h (conforme TSA)", alternatives: "Meropenem 2g 8/8h (perf. 3h) se sensível OU Ceftazidima/Avibactam 2.5g 8/8h", notes: "Terapêutica combinada inicial (β-lactâmico + aminoglicosídeo) recomendada em sépsis grave. De-escalar para monoterapia com TSA." },
      { indication: "ITU complicada", firstLine: "Ceftolozano/Tazobactam 1.5g IV 8/8h", alternatives: "Ciprofloxacina 400mg IV 8/8h (se sensível) ou Cefepime 2g 8/8h", notes: "Fluoroquinolonas se sensível: boa concentração urinária. Drenar obstruções." },
      { indication: "DTR (Difficult-to-Treat Resistance)", firstLine: "Ceftolozano/Tazobactam 3g 8/8h (se sensível)", alternatives: "Ceftazidima/Avibactam + Aztreonam (se MBL) OU Colistina 9MUI loading + 4.5MUI 12/12h + Meropenem (se pan-R)", notes: "DTR = resistência a TODOS: Pip/Tazo, Cefepime, Meropenem, Fluoroquinolonas. Consultar infeciologia. Pedir sensibilidade a Ceftolozano/Tazobactam e Colistina. Associar ≥ 2 agentes." },
      { indication: "Infeção osteoarticular / Biofilme", firstLine: "Cefepime 2g 8/8h + Ciprofloxacina 400mg 8/8h (combinação anti-biofilme)", alternatives: "Ceftolozano/Tazobactam + Ciprofloxacina", notes: "Ciprofloxacina tem penetração óssea e atividade anti-biofilme. Tratamento prolongado (6–12 semanas). Considerar desbridamento." },
    ],
    precautions: "Precauções de contacto. Atenção a reservatórios ambientais (água, sifões, nebulizadores). Equipamento dedicado. Coorte de doentes colonizados.",
  },
  {
    id: "stenotrophomonas",
    name: "S. maltophilia",
    fullName: "Stenotrophomonas maltophilia",
    resistanceMechanism: "Resistência intrínseca: Metalo-β-lactamases L1/L2 + Bombas de efluxo SmeDEF",
    mechanismDetail: "Stenotrophomonas possui resistência INTRÍNSECA (cromossómica, não adquirida) a carbapenemos e aminoglicosídeos: (1) L1 — metalo-β-lactamase (classe B de Ambler) que hidrolisa carbapenemos e cefalosporinas; (2) L2 — cefalosporinase (classe A) que hidrolisa cefalosporinas e é inibida por ácido clavulânico; (3) Bombas de efluxo (SmeDEF, SmeABC) conferem resistência a fluoroquinolonas e tetraciclinas; (4) Baixa permeabilidade da membrana externa. O resultado é resistência natural a carbapenemos, aminoglicosídeos e muitas cefalosporinas — limitando gravemente as opções terapêuticas.",
    clinicalImpact: "Patogénico oportunista em UCI. Frequente em doentes com: exposição prévia a carbapenemos, ventilação mecânica prolongada, neutropenia, malignidade, CVC de longa duração. Causa PAV, bacteriemia e infeção de pele. Mortalidade 20–40%. Frequentemente colonizante — distinguir colonização de infeção.",
    decolonization: "Não aplicável (ubiquitário ambiental). Foco no controlo de exposição a carbapenemos (pressão seletiva) e remoção de dispositivos invasivos.",
    treatmentOptions: [
      { indication: "Infeção ligeira-moderada (monoterapia)", firstLine: "TMP/SMX (Cotrimoxazol) 15 mg/kg/dia TMP IV dividido 6/6–8/8h", alternatives: "Levofloxacina 750 mg IV 1×/dia", notes: "TMP/SMX é o gold-standard. Sensibilidade geralmente > 90%. Monitorizar K+ e função medular." },
      { indication: "Infeção grave / Bacteriemia", firstLine: "TMP/SMX 15 mg/kg/dia TMP IV 6/6h + Levofloxacina 750 mg 1×/dia", alternatives: "TMP/SMX + Ceftazidima 2g 8/8h (se sensível) ou TMP/SMX + Minociclina 200 mg IV loading, depois 100 mg 12/12h", notes: "Combinação recomendada em infeção grave. Minociclina tem boa atividade (alternativa a TMP/SMX se alergia)." },
      { indication: "Resistência a TMP/SMX", firstLine: "Levofloxacina 750 mg IV 1×/dia + Minociclina 100 mg IV 12/12h", alternatives: "Ceftazidima 2g 8/8h (se sensível) ± Levofloxacina OU Colistina (último recurso — atividade variável)", notes: "Resistência a TMP/SMX em aumento (5–10%). Pedir sensibilidades alargadas incluindo minociclina e ceftazidima. Tigeciclina tem atividade in vitro mas dados clínicos limitados." },
      { indication: "PAV", firstLine: "TMP/SMX IV dose elevada + Levofloxacina 750 mg 1×/dia", alternatives: "TMP/SMX + Colistina nebulizada 2–4 MUI 8/8h", notes: "Distinguir colonização respiratória de infeção verdadeira (clínica + radiologia + culturas quantitativas). Pode não necessitar tratamento se colonizante." },
    ],
    precautions: "Precauções standard (não necessita isolamento de contacto na maioria das instituições). Evitar uso desnecessário de carbapenemos (fator de risco major para seleção de Stenotrophomonas).",
  },
  {
    id: "ndm_mbl",
    name: "NDM / MBL",
    fullName: "Enterobacterales produtoras de Metalo-β-lactamases (NDM, VIM, IMP)",
    resistanceMechanism: "Genes blaNDM, blaVIM, blaIMP → Metalo-β-lactamases (Classe B de Ambler)",
    mechanismDetail: "As Metalo-β-lactamases (MBLs) pertencem à Classe B de Ambler e requerem zinco (Zn²⁺) como cofator. Hidrolisam TODOS os β-lactâmicos (penicilinas, cefalosporinas, carbapenemos) EXCETO o aztreonam. Não são inibidas por ácido clavulânico, tazobactam ou avibactam. Os subtipos mais relevantes: (1) NDM (New Delhi Metallo-β-lactamase) — o mais disseminado globalmente, frequentemente em plasmídeos IncX3/IncFII, associado a E. coli, K. pneumoniae e Acinetobacter; (2) VIM (Verona Integron-encoded MBL) — predominante na Europa do Sul e associado a Pseudomonas e Enterobacterales; (3) IMP (Imipenemase) — mais frequente no Sudeste Asiático e Japão. Os genes MBL estão frequentemente em integrões de classe 1, co-localizados com múltiplos genes de resistência (aminoglicosídeos, fluoroquinolonas, sulfonamidas), resultando em fenótipos pan-resistentes.",
    clinicalImpact: "Emergência global. NDM é a MBL mais prevalente mundialmente, com disseminação comunitária em regiões endémicas (Subcontinente Indiano, Balcãs). Mortalidade 40–70% em bacteriemias. Opções terapêuticas extremamente limitadas. Risco de pandemia silenciosa por transferência horizontal inter-espécies.",
    decolonization: "Sem protocolo eficaz. Rastreio retal obrigatório em doentes de risco (viajantes, transferências internacionais). Isolamento de contacto rigoroso.",
    treatmentOptions: [
      { indication: "Infeção grave / Bacteriemia", firstLine: "Ceftazidima/Avibactam 2.5g 8/8h + Aztreonam 2g 6/6h (sinergia)", alternatives: "Colistina 9MUI loading + 4.5MUI 12/12h + Meropenem 2g 8/8h (perf. 3h) + Amicacina (se sensível)", notes: "A sinergia Caz/Avi + Aztreonam é a estratégia chave: Avibactam protege o aztreonam de outras β-lactamases, enquanto o aztreonam é naturalmente estável face às MBLs. Evidência crescente (estudos observacionais e REVISIT-BL2)." },
      { indication: "ITU", firstLine: "Ceftazidima/Avibactam + Aztreonam", alternatives: "Colistina IV ou Aminoglicosídeo (se sensível in vitro)", notes: "Para ITU baixa: fosfomicina PO pode ser opção se sensível. Drenar obstruções." },
      { indication: "Pneumonia (PAV)", firstLine: "Ceftazidima/Avibactam + Aztreonam ± Colistina nebulizada", alternatives: "Colistina IV + nebulizada + Meropenem perfusão prolongada", notes: "Associar sempre Colistina nebulizada na PAV por MBL. TDM de colistina." },
      { indication: "Novos agentes (quando disponíveis)", firstLine: "Cefiderocol 2g IV 8/8h (perf. 3h) — sideróforo cefalosporina", alternatives: "Aztreonam/Avibactam (em desenvolvimento)", notes: "Cefiderocol é estável face a MBLs, KPC e OXA. Aprovado para ITU complicada e HAP/VAP. Dados de mortalidade controversos (CREDIBLE-CR)." },
    ],
    precautions: "Isolamento de contacto ESTRITO. Quarto individual obrigatório. Rastreio de contactos com zaragatoa retal. Notificação obrigatória ao CCI e autoridades de saúde pública. Equipamento dedicado. Limpeza terminal.",
  },
  {
    id: "oxa48",
    name: "OXA-48-like",
    fullName: "Enterobacterales produtoras de OXA-48 e variantes (OXA-181, OXA-232, OXA-244)",
    resistanceMechanism: "Genes blaOXA-48 → Carbapenemases classe D de Ambler (oxacilinases)",
    mechanismDetail: "As OXA-48-like são serina-carbapenemases de Classe D que hidrolisam penicilinas e carbapenemos (sobretudo imipenem e ertapenem), mas com atividade FRACA contra cefalosporinas de espectro alargado. Isto significa que isolados OXA-48 podem parecer sensíveis a cefalosporinas 3ª G e carbapenemos no antibiograma (MICs baixos de meropenem), mascarando a resistência — o que as torna extremamente difíceis de detetar fenotipicamente. Variantes: OXA-181 e OXA-232 (mais potentes contra carbapenemos), OXA-244 (prevalente na Europa). Frequentemente em plasmídeos IncL/M, com transferência horizontal eficiente. Quando co-produzem CTX-M (ESBL), tornam-se resistentes a carbapenemos E cefalosporinas.",
    clinicalImpact: "Deteção difícil — o 'camaleão das carbapenemases'. MICs de carbapenemos podem estar no limiar de sensibilidade, levando a falha terapêutica se não detetada por métodos moleculares. Prevalência crescente na Europa (Turquia, Norte de África, França, Espanha, Portugal). Mortalidade 30–50% em bacteriemia.",
    decolonization: "Sem protocolo eficaz. Rastreio retal com testes moleculares (PCR) — os métodos fenotípicos podem falhar na deteção.",
    treatmentOptions: [
      { indication: "Infeção grave / Bacteriemia", firstLine: "Ceftazidima/Avibactam 2.5g IV 8/8h (perf. 2h)", alternatives: "Meropenem/Vaborbactam 4g 8/8h OU Imipenem/Relebactam 1.25g 6/6h", notes: "Avibactam inibe OXA-48. Caz/Avi é a 1ª escolha. Se co-produção MBL + OXA-48: Caz/Avi + Aztreonam." },
      { indication: "ITU", firstLine: "Ceftazidima/Avibactam 2.5g 8/8h", alternatives: "Aminoglicosídeo (se sensível) ou Fosfomicina IV (se disponível)", notes: "Meropenem pode funcionar se MIC ≤ 8 mg/L com perfusão prolongada, mas preferir novos agentes." },
      { indication: "Co-produção OXA-48 + MBL", firstLine: "Ceftazidima/Avibactam + Aztreonam (sinergia)", alternatives: "Cefiderocol 2g 8/8h ou Colistina + Meropenem", notes: "Situação de extrema resistência. Consultar infeciologia. Pedir PCR para todos os genes de carbapenemase." },
      { indication: "OXA-48 com MIC baixo de meropenem (< 2)", firstLine: "Meropenem 2g IV 8/8h (perf. 3h) — dose maximizada", alternatives: "Ceftazidima/Avibactam (preferível se disponível)", notes: "MIC baixo NÃO exclui carbapenemase. Risco de emergência de resistência durante tratamento com meropenem em monoterapia." },
    ],
    precautions: "Isolamento de contacto. Teste molecular (PCR) obrigatório — antibiograma fenotípico insuficiente. Rastreio de contactos. Notificação CCI.",
  },
  {
    id: "ampc_plasmidic",
    name: "AmpC (plasmídica)",
    fullName: "Enterobacterales com AmpC plasmídica (CMY-2, DHA, FOX, MOX, ACC)",
    resistanceMechanism: "Genes blaCMY, blaDHA, blaFOX → Cefalosporinases classe C de Ambler (plasmídicas)",
    mechanismDetail: "As β-lactamases AmpC (Classe C de Ambler) hidrolisam cefalosporinas de 1ª–3ª geração, cefamicinas (cefoxitina) e aztreonam, mas NÃO carbapenemos. Existem duas formas: (1) AmpC cromossómica induzível (Enterobacter, Citrobacter, Serratia, Morganella — grupo 'ESCPM') — desrepressão por mutação constitutiva após exposição a cefalosporinas 3ª G; (2) AmpC plasmídica (CMY-2 mais frequente) — transferível para E. coli e Klebsiella que normalmente não possuem AmpC. Caraterística chave: NÃO são inibidas por ácido clavulânico ou tazobactam (ao contrário das ESBLs), mas SÃO inibidas por cloxacilina, avibactam e ácido borónico (útil para diagnóstico). Resistência a cefoxitina é o marcador fenotípico chave.",
    clinicalImpact: "Prevalência subestimada. Grupo ESCPM: risco de 20–40% de desrepressão de AmpC durante tratamento com cefalosporinas 3ª G → falha terapêutica. Associada a ITU complicada, IIA e bacteriemia nosocomial. Frequentemente confundida com ESBL nos testes fenotípicos.",
    decolonization: "Não aplicável como medida isolada. Evitar exposição a cefalosporinas 3ª G em doentes colonizados por ESCPM.",
    treatmentOptions: [
      { indication: "Enterobacter/Citrobacter/Serratia (ESCPM) — infeção não grave", firstLine: "Cefepime 2g IV 8/8h (estável face a AmpC)", alternatives: "Pip/Tazo 4.5g 6/6h (perf. 4h) — se MIC ≤ 4", notes: "EVITAR cefalosporinas 3ª G (ceftriaxone, ceftazidima) mesmo se sensíveis in vitro — risco de emergência de mutantes desreprimidos durante tratamento." },
      { indication: "Infeção grave / Bacteriemia", firstLine: "Meropenem 1g IV 8/8h (perf. 3h)", alternatives: "Cefepime 2g 8/8h (se sensível e sem choque)", notes: "Meropenem preferido em infeção grave. Cefepime aceitável se MIC ≤ 2 e estabilidade clínica. Estudo MERINO-2 em curso." },
      { indication: "AmpC plasmídica (E. coli/Klebsiella)", firstLine: "Cefepime 2g 8/8h OU Ertapenem 1g 1×/dia", alternatives: "Meropenem (se grave)", notes: "Risco de desrepressão menor que AmpC cromossómica, mas prudência mantida. Cefepime é a melhor opção não-carbapenemo." },
      { indication: "ITU não complicada", firstLine: "Nitrofurantoína 100mg 6/6h ou Fosfomicina 3g PO", alternatives: "Ciprofloxacina (se sensível)", notes: "Evitar cefalosporinas 3ª G. Opções PO são geralmente eficazes." },
    ],
    precautions: "Precauções standard. Alerta para o grupo ESCPM: nunca tratar com cefalosporinas 3ª geração em monoterapia mesmo se sensível in vitro.",
  },
  {
    id: "mcr_colistin",
    name: "MCR (Colistina-R)",
    fullName: "Enterobacterales com resistência plasmídica à colistina (mcr-1 a mcr-10)",
    resistanceMechanism: "Genes mcr → Fosfoetanolamina transferase → Modificação do Lípido A",
    mechanismDetail: "Os genes mcr (mobile colistin resistance) codificam enzimas fosfoetanolamina transferases que modificam o lípido A do lipopolissacarídeo (LPS) bacteriano, adicionando fosfoetanolamina ao grupo 4'-fosfato. Isto reduz a carga negativa da membrana externa, diminuindo a afinidade eletrostática da colistina (catiónica) pelo seu alvo. mcr-1 (o mais prevalente) foi descrito em 2015 em E. coli de origem animal e humana na China. Localizado em plasmídeos transferíveis (IncI2, IncX4, IncHI2), permitindo disseminação horizontal rápida. Já identificados mcr-1 a mcr-10, com mcr-1 e mcr-3 como os mais comuns. A preocupação major: se mcr se combinar com NDM ou KPC → organismos verdadeiramente pan-resistentes.",
    clinicalImpact: "Ameaça global à última linha de defesa contra Gram-negativos MDR. Prevalência crescente em isolados comunitários (cadeia alimentar) e nosocomiais. Quando presente em KPC ou NDM produtores, elimina a colistina como opção terapêutica, resultando em fenótipos virtualmente pan-resistentes. MIC colistina geralmente 4–8 mg/L (resistência de baixo nível).",
    decolonization: "Sem protocolo. Vigilância epidemiológica. Redução do uso de colistina na veterinária (One Health).",
    treatmentOptions: [
      { indication: "CRE + mcr (sem MBL)", firstLine: "Ceftazidima/Avibactam 2.5g 8/8h", alternatives: "Meropenem/Vaborbactam 4g 8/8h ou Imipenem/Relebactam", notes: "A colistina está comprometida. Priorizar novos β-lactâmicos/inibidores. Pedir TSA alargado." },
      { indication: "MBL + mcr (pan-resistente)", firstLine: "Ceftazidima/Avibactam + Aztreonam (sinergia)", alternatives: "Cefiderocol 2g 8/8h ± Fosfomicina IV", notes: "Situação de extrema gravidade. Sem colistina como backup. Consultar infeciologia urgente. Considerar combinações ≥ 3 agentes." },
      { indication: "ITU com mcr isolado (sem CRE)", firstLine: "Carbapenemo habitual (se Enterobacterales sensíveis)", alternatives: "Fosfomicina, Nitrofurantoína (se ITU baixa)", notes: "Se o único mecanismo é mcr (sem KPC/MBL), os carbapenemos mantêm-se ativos. O impacto é a perda da colistina como backup." },
    ],
    precautions: "Precauções de contacto se co-produção com carbapenemases. Notificação epidemiológica. Rastreio molecular específico (PCR mcr). Vigilância One Health.",
  },
  {
    id: "crab",
    name: "CRAB",
    fullName: "Acinetobacter baumannii resistente a carbapenemos (CRAB)",
    resistanceMechanism: "OXA-23/24/58/72 + ISAba1 + Perda porinas + Bombas efluxo AdeABC",
    mechanismDetail: "O CRAB combina múltiplos mecanismos: (1) Carbapenemases OXA intrínsecas — OXA-51/66 (cromossómica, naturalmente presente) cuja expressão aumenta 10–20× quando o elemento de inserção ISAba1 se posiciona a montante (promotor forte); (2) OXA adquiridas — OXA-23 (a mais prevalente globalmente, >80% dos CRAB), OXA-24/40, OXA-58, OXA-72, todas em plasmídeos ou integrões; (3) Perda da porina CarO — reduz entrada de carbapenemos; (4) Sobreexpressão de bombas de efluxo AdeABC (RND family) — expulsa β-lactâmicos, aminoglicosídeos, fluoroquinolonas e tigeciclina; (5) Raramente: MBLs adquiridas (NDM, VIM). A classe D (OXA) é a base da resistência em Acinetobacter, ao contrário das Enterobacterales onde predominam classe A (KPC) e B (MBLs).",
    clinicalImpact: "Prioridade 1 da OMS (2024) para I&D de novos antibióticos. Causa major de PAV em UCI com mortalidade atribuível de 40–60%. Sobrevivência em superfícies secas > 5 meses. Capacidade de formar biofilme. Surtos nosocomiais devastadores.",
    decolonization: "Limpeza terminal com peróxido de hidrogénio vaporizado ou UV-C. Banhos diários com clorexidina 2%. Descolonização digestiva seletiva (SDD) controversa.",
    treatmentOptions: [
      { indication: "PAV / Infeção grave", firstLine: "Sulbactam em dose elevada: Ampicilina/Sulbactam 9g IV 8/8h (perf. 4h) — sulbactam tem atividade intrínseca contra Acinetobacter", alternatives: "Colistina 9MUI loading + 4.5MUI 12/12h + Meropenem 2g 8/8h (perf. 3h)", notes: "AIDA trial: Colistina monoterapia = Colistina + Meropenem. Sulbactam em dose elevada é alternativa promissora. Considerar Colistina nebulizada adjuvante na PAV." },
      { indication: "Novos agentes", firstLine: "Sulbactam/Durlobactam 1g/1g IV 6/6h (perf. 3h) — aprovado FDA 2023", alternatives: "Cefiderocol 2g 8/8h (perf. 3h)", notes: "Sulbactam/Durlobactam (Xacduro®): estudo ATTACK — superioridade sobre colistina. Durlobactam inibe OXA e outras β-lactamases. Cefiderocol: sideróforo estável face a OXA e MBL, mas dados de mortalidade mistos." },
      { indication: "ITU / Infeção menos grave", firstLine: "Ampicilina/Sulbactam dose elevada", alternatives: "Colistina IV ou TMP/SMX (se sensível — raro)", notes: "Tigeciclina NÃO recomendada em bacteriemia (baixas concentrações séricas) nem ITU (baixa excreção urinária)." },
    ],
    precautions: "Isolamento de contacto ESTRITO. Quarto individual. Limpeza terminal obrigatória. Rastreio de contactos (axilar/rectal/respiratório). Notificação CCI.",
  },
  {
    id: "crpa",
    name: "CRPA / DTR-PA",
    fullName: "Pseudomonas aeruginosa resistente a carbapenemos / Difficult-to-Treat Resistance",
    resistanceMechanism: "Perda OprD + AmpC desreprimida + Bombas efluxo (MexAB/XY) ± MBLs adquiridas",
    mechanismDetail: "A resistência aos carbapenemos em P. aeruginosa é maioritariamente NÃO enzimática (ao contrário das Enterobacterales): (1) Perda/mutação da porina OprD — canal específico de entrada do imipenem e meropenem (mecanismo mais frequente); (2) Sobreexpressão de bombas de efluxo: MexAB-OprM (expulsa meropenem, fluoroquinolonas, β-lactâmicos), MexXY-OprM (aminoglicosídeos, cefepime), MexCD-OprJ (fluoroquinolonas); (3) AmpC cromossómica desreprimida — hidrolisa cefalosporinas; (4) MBLs adquiridas (VIM, IMP, NDM — menos frequente que em Enterobacterales, ~5–15% dos CRPA na Europa); (5) GES-type carbapenemases (classe A, raras). DTR-Pseudomonas = resistente a TODOS: piperacilina/tazobactam, ceftazidima, cefepime, aztreonam, meropenem, imipenem, ciprofloxacina, levofloxacina.",
    clinicalImpact: "CRPA: 2ª prioridade OMS. DTR-PA representa 10–20% dos isolados de Pseudomonas em UCI europeias. Mortalidade 30–50% em bacteriemia. Rápida emergência de resistência durante tratamento (mutações em porinas/efluxo em 48–72h).",
    decolonization: "Sem protocolo eficaz. Controlo ambiental (sifões, água). Descontaminação digestiva seletiva controversa.",
    treatmentOptions: [
      { indication: "CRPA sem MBL", firstLine: "Ceftolozano/Tazobactam 3g 8/8h (PAV) ou 1.5g 8/8h (outras)", alternatives: "Ceftazidima/Avibactam 2.5g 8/8h ou Imipenem/Relebactam 1.25g 6/6h", notes: "Ceftolozano/Tazobactam: melhor atividade anti-Pseudomonas entre os novos agentes. Estável face a AmpC e bombas de efluxo. Sem atividade se MBL presente." },
      { indication: "CRPA com MBL (VIM/IMP/NDM)", firstLine: "Ceftazidima/Avibactam + Aztreonam (sinergia)", alternatives: "Cefiderocol 2g 8/8h ou Colistina 4.5MUI 12/12h + Meropenem perfusão", notes: "MBL elimina atividade de Ceftolozano/Tazobactam e Imipenem/Relebactam. A sinergia Caz/Avi+Aztreonam mantém-se." },
      { indication: "DTR-PA (pan-resistente exceto colistina)", firstLine: "Colistina 9MUI loading + 4.5MUI 12/12h + agente com melhor MIC (mesmo se R)", alternatives: "Cefiderocol ± Colistina nebulizada (se PAV)", notes: "Em DTR, usar combinação de ≥ 2 agentes com os MICs mais baixos, mesmo acima do breakpoint. Consultar infeciologia. Considerar nebulização adjuvante." },
    ],
    precautions: "Isolamento de contacto. Vigilância ambiental (sifões, água). Coorte de doentes. Equipamento dedicado.",
  },
  {
    id: "cre_other",
    name: "CRE (outros)",
    fullName: "Enterobacterales resistentes a carbapenemos — outros mecanismos",
    resistanceMechanism: "Perda porinas (OmpK35/36) + AmpC/ESBL hiperexpressas OU carbapenemases raras (GES, IMI, SME)",
    mechanismDetail: "Nem toda CRE produz carbapenemases. Mecanismos não-enzimáticos: (1) Perda de porinas OmpK35 e/ou OmpK36 em Klebsiella — reduz permeabilidade aos carbapenemos; (2) Combinação de ESBL ou AmpC hiperexpressa + perda de porinas → MIC de carbapenemos no limiar (4–8 mg/L). Carbapenemases raras: (3) GES-5/6 (classe A) — hidrolisam carbapenemos fracamente; (4) IMI/NMC (classe A, cromossómicas) — raras em Enterobacter cloacae; (5) SME (classe A) — exclusiva de Serratia marcescens. A distinção enzimática vs não-enzimática é crítica: CRE sem carbapenemase pode responder a meropenem em dose maximizada, enquanto CRE com carbapenemase geralmente não.",
    clinicalImpact: "CRE não-produtora de carbapenemase: ~30–40% de todas as CRE em algumas séries. Melhor prognóstico que CRE com carbapenemase. Fundamental: teste molecular para deteção de carbapenemases (PCR) em todos os CRE.",
    decolonization: "Rastreio retal em UCI. Isolamento de contacto.",
    treatmentOptions: [
      { indication: "CRE sem carbapenemase (MIC meropenem ≤ 8)", firstLine: "Meropenem 2g IV 8/8h (perf. 3h) — dose maximizada", alternatives: "Ertapenem 1g 1×/dia + Meropenem (duplo-carbapenemo — controverso)", notes: "Se MIC meropenem ≤ 8, perfusão prolongada pode atingir PK/PD target. PCR negativa para KPC/NDM/OXA-48 reforça esta abordagem." },
      { indication: "CRE com GES-5", firstLine: "Ceftazidima/Avibactam 2.5g 8/8h", alternatives: "Meropenem/Vaborbactam", notes: "GES é inibida por avibactam (classe A). Caz/Avi é eficaz." },
      { indication: "CRE — tipo desconhecido (aguardar PCR)", firstLine: "Ceftazidima/Avibactam 2.5g 8/8h (cobre KPC, OXA-48, GES)", alternatives: "Meropenem/Vaborbactam (cobre KPC, não OXA-48)", notes: "Se PCR revelar MBL (NDM/VIM): ADICIONAR Aztreonam ao Caz/Avi. Pedir SEMPRE PCR de carbapenemases em qualquer CRE." },
    ],
    precautions: "Isolamento de contacto. PCR de carbapenemases obrigatória em todos os CRE. Notificação CCI.",
  },
  {
    id: "mrse",
    name: "MRSE",
    fullName: "Staphylococcus epidermidis resistente à meticilina (e outros CoNS)",
    resistanceMechanism: "Gene mecA → PBP2a (idêntico ao MRSA) + Biofilme (gene icaADBC)",
    mechanismDetail: "MRSE partilha o mesmo mecanismo de resistência do MRSA (gene mecA em SCCmec, codificando PBP2a). Contudo, MRSE/CoNS possuem caraterísticas adicionais: (1) Formação de biofilme robusto mediado por polissacarídeo PIA (codificado por icaADBC) — aderência a dispositivos médicos; (2) Prevalência extremamente alta de mecA em CoNS (>75–90% em UCI); (3) Frequentemente multi-resistentes (fluoroquinolonas, aminoglicosídeos, macrólidos); (4) Heterorresistência — subpopulações com MIC variável dentro do mesmo isolado; (5) Transferência horizontal de SCCmec entre CoNS e S. aureus — reservatório genético.",
    clinicalImpact: "Causa mais frequente de bacteriemia associada a CVC e infeção de dispositivos (próteses, pacemakers, derivações ventriculares). Frequentemente contaminante de hemoculturas — distinguir infeção verdadeira (≥ 2 hemoculturas positivas, sinais clínicos). Mortalidade 5–15% em bacteriemia verdadeira.",
    decolonization: "Não aplicável rotineiramente. Prevenção centrada em técnica asséptica de inserção de CVC e bundles de manutenção.",
    treatmentOptions: [
      { indication: "Bacteriemia associada a CVC", firstLine: "Vancomicina 15–20 mg/kg 12/12h + Remoção de CVC", alternatives: "Daptomicina 6 mg/kg 1×/dia ou Linezolida 600mg 12/12h", notes: "Remoção do CVC é o passo mais importante. Se contaminante (1 hemocultura): não tratar. Se verdadeira: mín. 5–7 dias após remoção do CVC." },
      { indication: "Infeção de prótese / Dispositivo", firstLine: "Vancomicina + Rifampicina 300mg PO 12/12h (anti-biofilme)", alternatives: "Daptomicina + Rifampicina", notes: "Rifampicina essencial para penetração em biofilme. Nunca em monoterapia. Considerar remoção/troca do dispositivo." },
      { indication: "Endocardite (válvula protésica)", firstLine: "Vancomicina 15–20mg/kg 12/12h + Rifampicina 300mg 8/8h + Gentamicina 3mg/kg 1×/dia (2 sem)", alternatives: "Daptomicina + Rifampicina", notes: "6 semanas mínimo. Cirurgia frequentemente necessária. ETE obrigatório." },
    ],
    precautions: "Precauções standard. Bundles de CVC. Técnica asséptica rigorosa.",
  },
  {
    id: "enterobacter_ampc",
    name: "ESCPM (AmpC)",
    fullName: "Enterobacter cloacae, Serratia, Citrobacter freundii, Providencia, Morganella (grupo ESCPM/SPACE)",
    resistanceMechanism: "AmpC cromossómica induzível → Desrepressão mutacional → Resistência a cefalosporinas 3ª G",
    mechanismDetail: "Os organismos ESCPM (anteriormente SPACE/SPICE) possuem uma AmpC cromossómica naturalmente regulada: (1) Em estado basal, AmpC é reprimida pelo regulador AmpR; (2) Exposição a β-lactâmicos (especialmente cefalosporinas 3ª G e imipenem como indutor) ativa transientemente AmpC via via AmpR-AmpD; (3) Mutações em ampD ou ampR podem tornar a expressão CONSTITUTIVA (desrepressão permanente) → resistência de alto nível a cefalosporinas 3ª G que emerge DURANTE o tratamento (taxa de 20–40% para Enterobacter); (4) A desrepressão ocorre por seleção de mutantes pré-existentes, não por transferência horizontal. Cefalosporinas mais estáveis: cefepime (substrato fraco de AmpC) e carbapenemos (não afetados).",
    clinicalImpact: "Risco major: tratamento inicial com ceftriaxone/ceftazidima aparentemente eficaz → emergência de resistência ao 3º–5º dia → deterioração clínica. Até 19–40% de risco de desrepressão durante tratamento de Enterobacter com cefalosporinas 3ª G.",
    decolonization: "Não aplicável. Educação da equipa sobre o risco de cefalosporinas 3ª G nestes organismos.",
    treatmentOptions: [
      { indication: "Infeção não grave", firstLine: "Cefepime 2g IV 8/8h", alternatives: "Ciprofloxacina 400mg IV 8/8h (se sensível) ou TMP/SMX", notes: "EVITAR ABSOLUTAMENTE ceftriaxone, ceftazidima, cefotaxima — mesmo se sensível no TSA inicial. Risco de falha por desrepressão." },
      { indication: "Infeção grave / Bacteriemia", firstLine: "Meropenem 1–2g IV 8/8h (perf. 3h)", alternatives: "Cefepime 2g 8/8h (se MIC ≤ 2 e clinicamente estável)", notes: "Carbapenemos são a escolha mais segura em bacteriemia por ESCPM. Pip/Tazo: dados insuficientes e risco de efeito inóculo." },
      { indication: "ITU", firstLine: "Ciprofloxacina 400mg IV 8/8h ou 500mg PO 12/12h (se sensível)", alternatives: "Cefepime IV ou TMP/SMX PO", notes: "Para ITU baixa, fluoroquinolonas PO são aceitáveis se sensíveis. Fosfomicina: dados limitados para ESCPM." },
    ],
    precautions: "Precauções standard. Alerta farmacêutico obrigatório para ESCPM: bloquear cefalosporinas 3ª G na prescrição eletrónica.",
  },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

/* ── Active infection entry ── */
interface ActiveInfection {
  id: string;
  agent: string;
  location: string;
  type: "infection" | "colonization";
  sensitivity: string;
  antibiotic: string;
  startDate: string;
  notes: string;
}

const AGENT_CATEGORIES: { label: string; emoji: string; agents: string[] }[] = [
  {
    label: "Bactérias Gram-negativas",
    emoji: "🔴",
    agents: [
      "A. baumannii", "A. baumannii MDR", "Burkholderia cepacia", "Citrobacter freundii",
      "Citrobacter koseri", "E. coli", "E. coli ESBL+", "Enterobacter cloacae",
      "Enterobacter cloacae AmpC", "H. influenzae", "K. oxytoca", "K. pneumoniae",
      "K. pneumoniae KPC", "K. pneumoniae NDM/MBL", "K. pneumoniae OXA-48",
      "Moraxella catarrhalis", "Morganella morganii", "Neisseria meningitidis",
      "P. aeruginosa", "P. aeruginosa MDR", "P. aeruginosa XDR", "Proteus mirabilis",
      "Proteus vulgaris", "Providencia stuartii", "S. maltophilia", "Salmonella spp.",
      "Serratia marcescens",
    ],
  },
  {
    label: "Bactérias Gram-positivas",
    emoji: "🔵",
    agents: [
      "Enterococcus faecalis", "Enterococcus faecium", "Enterococcus faecium (VRE)",
      "S. agalactiae (Grupo B)", "S. aureus (MRSA)", "S. aureus (MSSA)",
      "S. epidermidis", "S. epidermidis MR", "S. haemolyticus", "S. hominis",
      "S. lugdunensis", "S. pneumoniae", "S. pyogenes (Grupo A)",
      "Streptococcus anginosus", "Streptococcus grupo viridans",
    ],
  },
  {
    label: "Anaeróbios",
    emoji: "⚫",
    agents: [
      "B. fragilis", "C. difficile", "Clostridium perfringens",
      "Fusobacterium spp.", "Peptostreptococcus spp.", "Prevotella spp.",
    ],
  },
  {
    label: "Atípicos / Intracelulares",
    emoji: "🟠",
    agents: [
      "Chlamydophila pneumoniae", "Coxiella burnetii", "Legionella pneumophila",
      "Mycoplasma pneumoniae", "Rickettsia spp.",
    ],
  },
  {
    label: "Micobactérias",
    emoji: "🟤",
    agents: [
      "M. abscessus", "M. avium complex (MAC)", "M. tuberculosis",
    ],
  },
  {
    label: "Fungos",
    emoji: "🟢",
    agents: [
      "Aspergillus fumigatus", "Aspergillus niger", "Aspergillus spp.",
      "C. albicans", "C. auris", "C. glabrata", "C. krusei", "C. parapsilosis",
      "C. tropicalis", "Cryptococcus neoformans", "Mucor/Rhizopus spp.",
      "Pneumocystis jirovecii",
    ],
  },
  {
    label: "Vírus",
    emoji: "🟣",
    agents: [
      "Adenovírus", "CMV", "EBV", "HSV", "Influenza A", "Influenza B",
      "SARS-CoV-2", "VZV",
    ],
  },
  {
    label: "Parasitas",
    emoji: "🟡",
    agents: [
      "Plasmodium spp.", "Strongyloides stercoralis", "Toxoplasma gondii",
    ],
  },
];

const ALL_AGENTS_FLAT = AGENT_CATEGORIES.flatMap(c => c.agents).concat("Outro");

const COMMON_LOCATIONS = [
  "Sangue (Bacteriemia)", "Pulmão (PAV/PAC)", "Urina (ITU)", "Abdómen (Peritonite)",
  "Pele/Tecidos moles", "SNC (Meningite)", "Osso/Articulação", "Cateter (CLABSI)",
  "Ferida cirúrgica", "Endocardite", "Empiema", "Sinusite", "Mediastinite",
  "Prótese/Implante", "Nasal", "Rectal", "Axilar", "Expetoração", "Outro",
];

const InfecaoTab = () => {
  const { clCr, clCrStage, onRRT, rrtType, pesoAtual, albumina } = usePatient();
  const peso = parseFloat(pesoAtual) || 0;
  const alb = parseFloat(albumina) || 0;

  const [selectedColonizations, setSelectedColonizations] = usePersistedState<string[]>("infecao-colonizations", []);
  const [selectedInfectionSite, setSelectedInfectionSite] = usePersistedState<string | null>("infecao-site", null);
  const [activeInfections, setActiveInfections] = usePersistedState<ActiveInfection[]>("infecao-activeInfections", []);

  const addInfection = (type: "infection" | "colonization") => {
    const newEntry: ActiveInfection = {
      id: Date.now().toString(),
      agent: "",
      location: "",
      type,
      sensitivity: "",
      antibiotic: "",
      startDate: "",
      notes: "",
    };
    setActiveInfections(prev => [...prev, newEntry]);
  };

  const updateInfection = (id: string, field: keyof ActiveInfection, value: string) => {
    setActiveInfections(prev => prev.map(inf => inf.id === id ? { ...inf, [field]: value } : inf));
  };

  const removeInfection = (id: string) => {
    setActiveInfections(prev => prev.filter(inf => inf.id !== id));
  };

  const toggleColonization = (id: string) => {
    setSelectedColonizations(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const getDose = (drug: AntibioticDrug): string => {
    if (onRRT) return drug.rrtDose;
    if (clCr === null) return drug.normalDose;
    const adj = drug.adjustments.find(a => clCr >= a.min && clCr < a.max);
    return adj?.dose ?? drug.normalDose;
  };

  const grouped = useMemo(() => {
    const groups: Record<string, AntibioticDrug[]> = {};
    ANTIBIOTICS.forEach(d => {
      if (!groups[d.class]) groups[d.class] = [];
      groups[d.class].push(d);
    });
    return groups;
  }, []);

  const infectionCategories = useMemo(() => {
    const cats: Record<string, EmpiricRegimen[]> = {};
    EMPIRIC_REGIMENS.forEach(r => {
      if (!cats[r.category]) cats[r.category] = [];
      cats[r.category].push(r);
    });
    return cats;
  }, []);

  const activeColonizations = MDR_ORGANISMS.filter(o => selectedColonizations.includes(o.id));

  const infections = activeInfections.filter(i => i.type === "infection");
  const colonizationEntries = activeInfections.filter(i => i.type === "colonization");

  return (
    <div className="space-y-4">
      <SectionDivider title="Exame Físico" />
      <ExamChecklist storageKey="infecao" title="Sinais / Sintomas Infeciosos" categories={INFEC_EXAM} />

      <SectionDivider title="Registo de Infeções" />

      {/* ═══ INFEÇÕES ATIVAS & COLONIZAÇÕES IDENTIFICADAS ═══ */}
      <CollapsibleSection
        title="Infeções Ativas & Agentes Identificados"
        
        badge={activeInfections.length > 0 ? `${infections.length} infeção(ões) · ${colonizationEntries.length} colonização(ões)` : undefined}
        info={<InfoTooltip interpretation="Registe infeções ativas documentadas e colonizações com agente, localização, sensibilidade e ATB em curso. Os dados são incluídos no Resumo para Passagem de Turno." />}
      >
        {/* Add buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => addInfection("infection")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-destructive/15 text-destructive border border-destructive/25 hover:bg-destructive/25 transition-all"
          >
            <span className="text-sm">+</span> Infeção Ativa
          </button>
          <button
            onClick={() => addInfection("colonization")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-warning/15 text-warning border border-warning/25 hover:bg-warning/25 transition-all"
          >
            <span className="text-sm">+</span> Colonização
          </button>
        </div>

        {activeInfections.length === 0 && (
          <Interpretation status="normal" text="Sem infeções ativas ou colonizações registadas. Use os botões acima para adicionar." />
        )}

        {/* List entries */}
        <div className="space-y-3">
          {activeInfections.map((inf) => (
            <div
              key={inf.id}
              className={`rounded-xl border overflow-hidden ${
                inf.type === "infection"
                  ? "border-destructive/25 bg-destructive/5"
                  : "border-warning/25 bg-warning/5"
              }`}
            >
              {/* Header */}
              <div className={`px-3 py-2 flex items-center justify-between ${
                inf.type === "infection" ? "bg-destructive/10 border-b border-destructive/20" : "bg-warning/10 border-b border-warning/20"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${inf.type === "infection" ? "text-destructive" : "text-warning"}`}>
                    {inf.type === "infection" ? "🔴 INFEÇÃO ATIVA" : "🟡 COLONIZAÇÃO"}
                  </span>
                  {inf.agent && (
                    <span className="text-[10px] font-mono text-foreground bg-background/50 px-1.5 py-0.5 rounded">
                      {inf.agent}
                    </span>
                  )}
                  {inf.location && (
                    <span className="text-[9px] text-muted-foreground">— {inf.location}</span>
                  )}
                </div>
                <button
                  onClick={() => removeInfection(inf.id)}
                  className="text-muted-foreground hover:text-destructive text-xs p-1 transition-colors"
                  title="Remover"
                >✕</button>
              </div>

              {/* Fields */}
              <div className="p-3 space-y-2.5">
                {/* Agent */}
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Agente</label>
                  <details className="group">
                    <summary className="px-2 py-1 rounded text-[9px] font-medium bg-muted/40 text-muted-foreground border border-border cursor-pointer hover:border-primary/20 inline-block mb-1">
                      {inf.agent && inf.agent !== "Outro" ? `✓ ${inf.agent}` : "Selecionar agente..."}
                    </summary>
                    <div className="mt-1 space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg p-2 bg-background">
                      {AGENT_CATEGORIES.map(cat => (
                        <div key={cat.label}>
                          <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{cat.emoji} {cat.label}</div>
                          <div className="flex flex-wrap gap-0.5">
                            {cat.agents.map(agent => (
                              <button
                                key={agent}
                                onClick={() => updateInfection(inf.id, "agent", agent)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all border ${
                                  inf.agent === agent
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-muted/40 text-muted-foreground border-border hover:border-primary/20"
                                }`}
                              >{agent}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => updateInfection(inf.id, "agent", "Outro")}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all border ${
                          inf.agent === "Outro"
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-muted/40 text-muted-foreground border-border hover:border-primary/20"
                        }`}
                      >Outro</button>
                    </div>
                  </details>
                  {inf.agent === "Outro" && (
                    <input
                      type="text"
                      placeholder="Especifique o agente..."
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
                      onChange={(e) => updateInfection(inf.id, "agent", e.target.value || "Outro")}
                    />
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Localização</label>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_LOCATIONS.map(loc => (
                      <button
                        key={loc}
                        onClick={() => updateInfection(inf.id, "location", loc)}
                        className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all border ${
                          inf.location === loc
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-muted/40 text-muted-foreground border-border hover:border-primary/20"
                        }`}
                      >{loc}</button>
                    ))}
                  </div>
                </div>

                {/* Sensitivity + Antibiotic + Date row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Sensibilidade / TSA</label>
                    <input
                      type="text"
                      value={inf.sensitivity}
                      onChange={(e) => updateInfection(inf.id, "sensitivity", e.target.value)}
                      placeholder="Ex: S meropenem, R ceftriaxone"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">ATB em Curso</label>
                    <input
                      type="text"
                      value={inf.antibiotic}
                      onChange={(e) => updateInfection(inf.id, "antibiotic", e.target.value)}
                      placeholder="Ex: Meropenem 2g 8/8h"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Início / Dia</label>
                    <input
                      type="text"
                      value={inf.startDate}
                      onChange={(e) => updateInfection(inf.id, "startDate", e.target.value)}
                      placeholder="Ex: D3, 05/03"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Notas</label>
                  <input
                    type="text"
                    value={inf.notes}
                    onChange={(e) => updateInfection(inf.id, "notes", e.target.value)}
                    placeholder="Ex: Hemocultura positiva D2, de-escalar se TSA..."
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <SectionDivider title="Colonizações & Resistências" />

      {/* ═══ COLONIZAÇÕES MDR ═══ */}
      <CollapsibleSection
        title="Colonizações / Resistências"
        
        badge={selectedColonizations.length > 0 ? `${selectedColonizations.length} ativa(s)` : undefined}
        info={<InfoTooltip interpretation="Selecione colonizações conhecidas. Ajusta recomendações de ATB empírico e exibe mecanismos de resistência." />}
      >
        <p className="text-[10px] text-muted-foreground mb-3">Selecione as colonizações / microrganismos multirresistentes identificados:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {MDR_ORGANISMS.map(org => (
            <button
              key={org.id}
              onClick={() => toggleColonization(org.id)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedColonizations.includes(org.id)
                  ? "bg-destructive/10 border-destructive/30 ring-1 ring-destructive/20"
                  : "bg-muted/30 border-border hover:border-primary/20"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${selectedColonizations.includes(org.id) ? "bg-destructive" : "bg-muted-foreground/30"}`} />
                <span className={`text-[11px] font-bold ${selectedColonizations.includes(org.id) ? "text-destructive" : "text-foreground"}`}>
                  {org.name}
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">{org.fullName}</p>
            </button>
          ))}
        </div>

        {/* Detail for each selected colonization */}
        {activeColonizations.map(org => (
          <div key={org.id} className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 overflow-hidden">
            <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-destructive">🦠 {org.name}</span>
                <span className="text-[9px] text-destructive/70">— {org.fullName}</span>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Resistance mechanism */}
              <div>
                <h5 className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  🔬 Mecanismo de Resistência
                  <span className="text-[9px] font-mono text-destructive/80 bg-destructive/10 px-1.5 py-0.5 rounded">{org.resistanceMechanism}</span>
                </h5>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{org.mechanismDetail}</p>
              </div>

              {/* Clinical impact */}
              <div className="bg-warning/10 rounded-lg p-2 border border-warning/20">
                <h5 className="text-[10px] font-bold text-warning mb-1">⚠️ Impacto Clínico</h5>
                <p className="text-[10px] text-muted-foreground">{org.clinicalImpact}</p>
              </div>

              {/* Decolonization */}
              <div className="bg-primary/5 rounded-lg p-2 border border-primary/15">
                <h5 className="text-[10px] font-bold text-primary mb-1">🧹 Descolonização</h5>
                <p className="text-[10px] text-muted-foreground">{org.decolonization}</p>
              </div>

              {/* Treatment by indication */}
              <div>
                <h5 className="text-[10px] font-bold text-foreground mb-2">💊 Terapêutica por Indicação</h5>
                <div className="space-y-2">
                  {org.treatmentOptions.map((opt, i) => (
                    <div key={i} className="rounded-lg border border-border bg-background p-2.5">
                      <span className="text-[10px] font-semibold text-primary block mb-1.5">{opt.indication}</span>
                      <div className="space-y-1">
                        <div className="flex gap-1.5">
                          <span className="text-[9px] font-semibold text-foreground shrink-0 mt-0.5">1ª Linha:</span>
                          <span className="text-[10px] font-mono text-primary">{opt.firstLine}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-[9px] font-semibold text-muted-foreground shrink-0 mt-0.5">Alt:</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{opt.alternatives}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground italic mt-1 border-t border-border/50 pt-1">{opt.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Precautions */}
              <div className="bg-destructive/10 rounded-lg p-2 border border-destructive/20">
                <h5 className="text-[10px] font-bold text-destructive mb-1">🛡️ Precauções de Isolamento</h5>
                <p className="text-[10px] text-muted-foreground">{org.precautions}</p>
              </div>
            </div>
          </div>
        ))}

        {selectedColonizations.length === 0 && (
          <Interpretation status="normal" text="Sem colonizações MDR selecionadas." />
        )}
      </CollapsibleSection>

      {/* ═══ ANTIBIOTERAPIA EMPÍRICA POR FOCO ═══ */}
      <CollapsibleSection
        title="Antibioterapia Empírica por Foco"
        info={<InfoTooltip
          interpretation="Recomendações empíricas baseadas em guidelines internacionais (IDSA, ESCMID, SSC). Ajustar conforme epidemiologia local e antibiograma."
          reference="IDSA · ESCMID · Surviving Sepsis Campaign 2021"
        />}
      >
        {/* Site selector */}
        <div className="space-y-1.5 mb-4">
          {Object.entries(infectionCategories).map(([category, regimens]) => (
            <div key={category}>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{category}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {regimens.map(r => (
                  <button
                    key={r.site}
                    onClick={() => setSelectedInfectionSite(prev => prev === r.site ? null : r.site)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                      selectedInfectionSite === r.site
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-muted/30 text-muted-foreground border-border hover:border-primary/20"
                    }`}
                  >
                    {r.site}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Selected regimen details */}
        {selectedInfectionSite && (() => {
          const regimen = EMPIRIC_REGIMENS.find(r => r.site === selectedInfectionSite);
          if (!regimen) return null;

          // Check if any colonization affects the recommendation
          const hasMRSA = selectedColonizations.includes("mrsa");
          const hasKPC = selectedColonizations.includes("kpc");
          const hasESBL = selectedColonizations.includes("esbl");
          const hasPseudomonas = selectedColonizations.includes("pseudomonas");
          const hasStenotro = selectedColonizations.includes("stenotrophomonas");
          const hasMBL = selectedColonizations.includes("ndm_mbl");
          const hasOXA48 = selectedColonizations.includes("oxa48");
          const hasAmpC = selectedColonizations.includes("ampc_plasmidic") || selectedColonizations.includes("enterobacter_ampc");
          const hasMCR = selectedColonizations.includes("mcr_colistin");
          const hasCRAB = selectedColonizations.includes("crab");
          const hasCRPA = selectedColonizations.includes("crpa");

          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-xs font-bold text-foreground">{regimen.site}</h4>
                <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{regimen.reference}</span>
              </div>

              {/* MDR warnings */}
              {hasMRSA && (
                <AlertBanner text="⚠️ MRSA colonizado — Adicionar cobertura anti-MRSA (Vancomicina ou Linezolida) ao esquema empírico." />
              )}
              {hasKPC && (
                <AlertBanner text="🚨 KPC colonizado — Considerar Ceftazidima/Avibactam ou Meropenem/Vaborbactam em vez de carbapenemos standard." />
              )}
              {hasESBL && (
                <AlertBanner text="⚠️ ESBL colonizado — Evitar cefalosporinas 3ª geração. Considerar carbapenemos para infeções graves." />
              )}
              {hasPseudomonas && (
                <AlertBanner text="⚠️ Pseudomonas MDR — Considerar Ceftolozano/Tazobactam ou Cefepime (conforme TSA). Evitar monoterapia empírica." />
              )}
              {hasStenotro && (
                <AlertBanner text="⚠️ S. maltophilia — TMP/SMX é 1ª linha. EVITAR carbapenemos (resistência intrínseca e pressão seletiva)." />
              )}
              {hasMBL && (
                <AlertBanner text="🚨 MBL (NDM/VIM/IMP) — Caz/Avi + Aztreonam (sinergia). Carbapenemos e Ceftolozano/Tazobactam INEFICAZES." />
              )}
              {hasOXA48 && (
                <AlertBanner text="⚠️ OXA-48-like — Caz/Avi é 1ª linha. MICs de meropenem podem parecer baixos — NÃO confiar apenas no antibiograma fenotípico." />
              )}
              {hasAmpC && (
                <AlertBanner text="⚠️ AmpC / ESCPM — EVITAR cefalosporinas 3ª G (risco de desrepressão). Preferir Cefepime ou Meropenem." />
              )}
              {hasMCR && (
                <AlertBanner text="🚨 MCR (Colistina-R) — Colistina comprometida como backup. Se co-produção com carbapenemase: opções extremamente limitadas." />
              )}
              {hasCRAB && (
                <AlertBanner text="🚨 CRAB — Sulbactam dose elevada ou Colistina + Meropenem. Considerar Sulbactam/Durlobactam ou Cefiderocol." />
              )}
              {hasCRPA && (
                <AlertBanner text="🚨 CRPA/DTR-PA — Se sem MBL: Ceftolozano/Tazobactam. Se MBL: Caz/Avi + Aztreonam. Se DTR: Colistina + combinação." />
              )}

              {regimen.scenarios.map((sc, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
                  <span className="text-[11px] font-semibold text-foreground block mb-2 pb-1.5 border-b border-border">
                    {sc.condition}
                  </span>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[9px] font-bold text-primary">1ª Linha</span>
                      <p className="text-[11px] font-mono text-primary">{sc.firstLine}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground">Alternativas</span>
                      <p className="text-[10px] font-mono text-muted-foreground">{sc.alternatives}</p>
                    </div>
                    <div className="flex gap-4 mt-1.5">
                      <div>
                        <span className="text-[9px] font-bold text-foreground">Duração</span>
                        <p className="text-[10px] font-mono text-foreground">{sc.duration}</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground italic border-t border-border/50 pt-1.5 mt-1.5">{sc.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {!selectedInfectionSite && (
          <Interpretation status="warning" text="Selecione um foco infecioso para ver as recomendações empíricas." />
        )}
      </CollapsibleSection>

      {/* ═══ ANTIBIÓTICOS — AJUSTE RENAL ═══ */}
      <CollapsibleSection
        title="Antibióticos — Ajuste à Função Renal"
        info={<InfoTooltip interpretation="Doses ajustam automaticamente ao ClCr e TSFR." />}
      >
        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 border border-border mb-3">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">ClCr</span>
            <span className={`font-mono font-medium ${clCr !== null && clCr < 30 ? "text-destructive" : "text-foreground"}`}>
              {clCr !== null ? `${clCr.toFixed(1)} mL/min — ${clCrStage}` : "— (preencha Geral)"}
            </span>
          </div>
          {onRRT && (
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">TSFR</span>
              <span className="font-mono text-primary">{rrtType}</span>
            </div>
          )}
        </div>

        {(onRRT || (clCr !== null && clCr < 60)) && (
          <AlertBanner text={onRRT ? "⚠️ TSFR ativa — doses para CVVH/HD." : `⚠️ Ajuste renal (ClCr ${clCr?.toFixed(0)}).`} />
        )}
        {alb > 0 && alb < 4.0 && <AlertBanner text={`Albúmina ${alb.toFixed(1)} — Pode afetar ligação proteica.`} />}
        {clCr === null && !onRRT && <Interpretation text="Preencha creatinina, idade e peso na aba Geral." status="warning" />}

        {Object.entries(grouped).map(([className, drugs]) => (
          <div key={className} className="mt-3">
            <h4 className="text-xs font-semibold text-primary mb-2">{className}</h4>
            <div className="space-y-2">
              {drugs.map((drug) => {
                const dose = getDose(drug);
                const isAdjusted = dose !== drug.normalDose;
                const displayDose = peso > 0 ? dose.replace(/(\d+(?:\.\d+)?)\s*mg\/kg/g, (_match, d) => {
                  const total = (parseFloat(d) * peso).toFixed(0);
                  return `${d} mg/kg (${total} mg)`;
                }) : dose;

                return (
                  <div key={drug.name} className={`rounded-lg border p-2.5 ${isAdjusted ? "border-warning/30 bg-warning/5" : "border-border bg-muted/30"}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-foreground">{drug.name}</span>
                      <span className={`text-[10px] font-mono ${isAdjusted ? "text-warning" : "text-primary"}`}>
                        {isAdjusted ? (onRRT ? "🔄 TSFR" : "⚠️ AJUSTADO") : "✓"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-primary mt-1">{displayDose}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{drug.notes}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CollapsibleSection>

    </div>
  );
};

export default InfecaoTab;
