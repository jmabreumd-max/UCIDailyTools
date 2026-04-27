import { useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { usePatient } from "@/contexts/PatientContext";
import SectionDivider from "../SectionDivider";
import CollapsibleSection from "../CollapsibleSection";
import InfoTooltip from "../InfoTooltip";
import DrugInteractions from "../DrugInteractions";
import { Search, Calculator, AlertCircle } from "lucide-react";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import DrugInfusionCalc from "../calculators/DrugInfusionCalc";

interface DrugInfo {
  name: string;
  category: string;
  dose: string;
  renal: string;
  hepatic: string;
  rrt: string;
  albumin: string;
  notes: string;
  mgPerKg?: number[];
}

import { DRUGS_DATA as EXTRA_DRUGS } from "../../data/drugsData";

const PersonalizedDose = ({ drug }: { drug: DrugInfo }) => {
  const { pesoAtual, creatinina, onRRT, bilirrubina, inr } = usePatient();
  const peso = parseFloat(pesoAtual);
  
  if (!peso) return null;

  const creatinineVal = parseFloat(creatinina);
  const biliVal = parseFloat(bilirrubina);
  const inrVal = parseFloat(inr);

  const isRenalImpaired = onRRT || (creatinineVal && creatinineVal > 1.5);
  const isHepaticImpaired = (biliVal && biliVal > 2.0) || (inrVal && inrVal > 1.5);

  let personalized = null;
  const alerts = [];

  // Parse conventional doses or have specific rules per drug name for demonstration based on requirements
  if (drug.name === "Vancomicina") {
    const attackDose = typeof drug.mgPerKg !== 'undefined' ? `${Math.round(peso * 25)}–${Math.round(peso * 30)} mg` : `${Math.round(peso * 25)}–${Math.round(peso * 30)} mg`;
    const maintDose = `${Math.round(peso * 15)}–${Math.round(peso * 20)} mg`;
    personalized = `Ataque: ${attackDose} IV. Manutenção: ${maintDose} 12/12h (ou 8/8h se n/ grave).`;
    if (isRenalImpaired) alerts.push("Alerta LRA/RRT: Ajustar frequência (ex: apenas a cada 24h ou 48h dependendo de níveis) ou pós-HD.");
  } else if (drug.name.includes("Piperacilina")) {
    personalized = `Dose típica não depende puramente do peso (baseada em posologia fixa de 4.5g).`;
    if (isRenalImpaired) alerts.push("Alerta LRA/RRT: Reduzir para 2.25g 6/6h ou 4.5g 8/8h conforme técnica e ClCr.");
  } else if (drug.name === "Fenitoína") {
    const min = peso * 15;
    const max = peso * 20;
    personalized = `Ataque: ${min} a ${max} mg IV.`;
    if (isHepaticImpaired) alerts.push("Alerta Hepatopatia: Reduzir dose e monitorizar muito rigorosamente.");
  } else if (drug.name === "Ácido Valpróico") {
    const min = peso * 15;
    const max = peso * 20;
    personalized = `Ataque: ${min} a ${max} mg IV. Manutenção: ${peso} a ${peso * 2} mg/h em perfusão.`;
    if (isHepaticImpaired) alerts.push("Contra-indicado/Atenção: Fortemente hepatotóxico. Avaliar suspensão em falência hepática grave.");
  } else if (drug.name === "Propofol" || drug.name === "Midazolam" || drug.name === "Fentanil" || drug.name.includes("Adrenalina") || drug.name === "Noradrenalina" || drug.name === "Atracúrio") {    
    // For infusions handled primarily by formulas, tell them to use perfusions table.
    personalized = `Calculada acima em 'Cálculos de Perfusão'. O peso será usado para calcular as taxas ideais de bomba de perfusão contínua.`;
  } else {
    // Attempt basic parsing: "XX mg/kg"
    const match = drug.dose.match(/([0-9.]+)\s?[-a]\s?([0-9.]+)\s?mg\/kg/);
    if (match) {
      const min = Math.round(peso * parseFloat(match[1]));
      const max = Math.round(peso * parseFloat(match[2]));
      personalized = `Dose calculada (peso: ${peso}kg): ${min} a ${max} mg`;
    } else {
      const matchSingle = drug.dose.match(/([0-9.]+)\s?mg\/kg/);
      if (matchSingle) {
        const val = Math.round(peso * parseFloat(matchSingle[1]));
        personalized = `Dose calculada (peso: ${peso}kg): ${val} mg`;
      }
    }
  }

  if (!personalized && alerts.length === 0 && (isRenalImpaired || isHepaticImpaired)) {
    if (isRenalImpaired) alerts.push("Alerta LRA/RRT: Verificar necessidade de ajuste na seção LRA.");
    if (isHepaticImpaired) alerts.push("Alerta Hepatopatia: Verificar necessidade de ajuste na seção Disfunção Hepática.");
  }

  if (!personalized && alerts.length === 0) return null;

  return (
    <div className="mt-2 bg-primary/10 border border-primary/20 rounded p-2 text-xs">
      <div className="flex items-center gap-1.5 font-bold mb-1"><Calculator className="w-3.5 h-3.5 text-primary"/> Dose Personalizada ({pesoAtual} kg)</div>
      {personalized && <p className="text-muted-foreground">{personalized}</p>}
      {alerts.map((a, i) => (
        <p key={i} className="text-destructive mt-1 flex items-start gap-1 font-medium"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {a}</p>
      ))}
    </div>
  );
}; // End of PersonalizedDose

const DRUGS_DATA: DrugInfo[] = [

  {
    name: "Vancomicina",
    category: "Infeção",
    dose: "15–20 mg/kg 8/8h ou 12/12h IV (ataque 25-30 mg/kg em doença grave)",
    renal: "Sim. Diminuir frequência/dose segundo ClCr. Manter monitorização (níveis vale/AUC).",
    hepatic: "Não é necessário ajuste.",
    rrt: "HDCI: Dar após a sessão. HDFVVC/CVVHDF: Clearance elevado, necessário aumento de dose/frequência ou perfusão contínua.",
    albumin: "Forte ligação proteica. Na hipoalbuminemia, há mais fração livre e maior Vd, necessitando maior monitorização.",
    notes: "Níveis vale (trough): 15-20 mcg/mL para infecções graves."
  },
  {
    name: "Meropenemo",
    category: "Infeção",
    dose: "1g 8/8h IV (2g 8/8h em meningite ou infeções graves Pseudomonas)",
    renal: "Ajustar se ClCr < 50 mL/min (ex: 1g 12/12h ou 500mg 8/8h). ClCr < 10: 500mg 24/24h.",
    hepatic: "Não é necessário ajuste.",
    rrt: "HDCI: 500mg 24/24h (dar pós-HD). Técnicas contínuas: 1g 12/12h ou até 8/8h.",
    albumin: "Baixa ligação proteica. Sem ajuste significativo necessário.",
    notes: "Risco de convulsões em doses elevadas com falência renal não ajustada."
  },
  {
    name: "Piperacilina-Tazobactam",
    category: "Infeção",
    dose: "4.5g 6/6h ou perfusão prolongada/contínua",
    renal: "ClCr < 40: 3.375g 6/6h. ClCr < 20: 2.25g 6/6h.",
    hepatic: "Recomenda-se precaução, mas geralmente sem ajuste obrigatório.",
    rrt: "HDCI: 2.25g 8/8h + 0.75g após HD. Técnicas contínuas: tipicamente 4.5g 8/8h ou 6/6h.",
    albumin: "Sem impacto clinicamente crítico no doente habitual.",
    notes: "Associado a nefrotoxicidade ligeira, sobretudo em combinação com Vancomicina."
  },
  {
    name: "Fluconazol",
    category: "Infeção",
    dose: "Ataque 800mg; Manutenção 400mg 24/24h",
    renal: "ClCr < 50: reduzir dose de manutenção em 50%. (Ataque mantém-se).",
    hepatic: "Usar com precaução (hepatotóxico).",
    rrt: "HDCI: dose completa (ex: 400mg) após a sessão. Técnicas contínuas: 400-800 mg 24/24h.",
    albumin: "Baixa ligação proteica, sem ajuste.",
    notes: "Interações medicamentosas frequentes (inibidor CYP450)."
  },
  {
    name: "Caspofungina",
    category: "Infeção",
    dose: "Ataque 70mg; Manutenção 50mg 24/24h (para doentes < 80kg). Se > 80kg: dt 70mg 24/24h.",
    renal: "Não necessita de ajuste.",
    hepatic: "Child-Pugh B: reduzir manutenção para 35mg 24/24h. Child-Pugh C: não estudado (precaução).",
    rrt: "Sem ajuste necessário em HD ou TRR contínua.",
    albumin: "Elevada ligação proteica. Sem recomendações práticas de alteração de dose na hipoalbuminemia.",
    notes: "Sem necessidade de suplemento pós hemodiálise."
  },
  {
    name: "Propofol",
    category: "Neuro",
    dose: "0.3 a 4.0 mg/kg/h em perfusão IV contínua",
    renal: "Não necessita de ajuste.",
    hepatic: "Não necessita de ajuste sistemático (metabolismo muito rápido).",
    rrt: "Não é extraído significativamente (alta lipofilicidade / ligação proteica).",
    albumin: "Hipoalbuminemia aumenta fração livre (↑ efeito). Usar doses menores.",
    notes: "Vigiar triglicerídeos e síndrome de infusão do propofol (PRIS) se > 4mg/kg/h > 48h."
  },
  {
    name: "Midazolam",
    category: "Neuro",
    dose: "0.02 a 0.2 mg/kg/h IV (ajustar por RASS/BIS)",
    renal: "Metabolito ativo (1-OH-midazolam) acumula na lesão renal. Preferir redução de dose ou substituição.",
    hepatic: "Cl cr de midazolam diminuído; prolonga semivida. Reduzir dose.",
    rrt: "TRR contínua pouco efeito de clearance. Acumulação previsível.",
    albumin: "Alta ligação proteica (97%). Hipoalbuminemia exige diminuição de dose.",
    notes: "No doente crítico, uso prolongado leva a forte acumulação capilar/tecidular."
  },
  {
    name: "Fentanil",
    category: "Neuro",
    dose: "0.5 a 3.0 mcg/kg/h (ou bolus 50-100 mcg)",
    renal: "Ajuste na falência grave preferencial, semivida prolongada se perfusão longa.",
    hepatic: "Metabolismo hepático. Atraso na clearance em doença grave.",
    rrt: "Não removido de forma eficaz. Evitar regimes prolongados em alta dose sem vigilância.",
    albumin: "Hipoalbuminemia <2.5 pode aumentar toxicidade/sedação devido a maior fração livre.",
    notes: "Elevada lipofilicidade. Acumula rapidamente no tecido adiposo."
  },
  {
    name: "Remifentanil",
    category: "Neuro",
    dose: "0.05 a 0.25 mcg/kg/min",
    renal: "Sem ajuste. Metabolizado por esterases plasmáticas tecidulares inespecíficas.",
    hepatic: "Sem ajuste.",
    rrt: "Clearance não dependente do rim, logo perfeitamente utilizável e sem ajuste em TRR.",
    albumin: "Sem impacto.",
    notes: "Acção ultracurta (< 10 min pós paragem). Exige transição analgésica precoce se desabituação."
  },
  {
    name: "Noradrenalina",
    category: "Cardio",
    dose: "0.05 a 1.0 (ou até +) mcg/kg/min",
    renal: "Não necessita de ajuste.",
    hepatic: "Não necessita de ajuste.",
    rrt: "Sem clearance significativa nem ajuste.",
    albumin: "Sem relevância clínica para ajuste de dose.",
    notes: "Titular por PAM. O ajuste é clínico, não farmacocinético em falências orgânicas."
  },
  {
    name: "Dobutamina",
    category: "Cardio",
    dose: "2.5 a 20 mcg/kg/min",
    renal: "Sem necessidade.",
    hepatic: "Presteza a hipotensão. Ajuste estritamente clínico (hemodinâmico).",
    rrt: "Sem remoção significativa.",
    albumin: "IRR.",
    notes: "Efeito cronotrópico importante, vigiar arritmias."
  },
  {
    name: "Levetiracetam",
    category: "Neuro",
    dose: "500 a 1500mg 12/12h IV",
    renal: "ClCr 50-79: 500-1000 mg 12/12h. ClCr 30-49: 250-750 12/12h. ClCr < 30: 250-500 12/12h.",
    hepatic: "Sem ajuste na maioria (exceção: Child-Pugh C + Lesão renal comórbida).",
    rrt: "Retirado pela HD (≈50%). Dar dose após sessão ou administrar suplementar (250-500mg). Técnicas contínuas: típicos 500-750mg 12/12h.",
    albumin: "Sem ligação significativa a proteínas plasmáticas ( < 10%).",
    notes: "Risco baixo de interações medicamentosas. Causa agitação psicomotora ocasional."
  },
  {
    name: "Fenitoína",
    category: "Neuro",
    dose: "Ataque 15-20mg/kg (ritmo <50mg/min IV). Manutenção 100mg 8/8h IV.",
    renal: "Monitorizar níveis livres (fração livre aumenta com falência renal).",
    hepatic: "Metabolismo muito dependente, saturável. Reduzir dose. Monitorizar níveis rigorosamente.",
    rrt: "Não é hemodializável (>90% lidaga a proteínas). Doses usuais.",
    albumin: "Altamente ligada à albumina (90%). Avaliar sempre fenitoína corrigida se hipoalbuminemia.",
    notes: "A toxicidade clínica corresponde aos níveis LIFRES e não aos totais. Causa bradicardia ou hipotensão na bólus perfusão rápida."
  },
  {
    name: "Ácido Valpróico",
    category: "Neuro",
    dose: "Ataque 15-20mg/kg; Seguido de perfusão 1-2 mg/kg/h ou bólus de 6/6h.",
    renal: "Aumento fracção livre pode potenciar toxidade se clearance nula e acumulação. Não exige tipico ajuste de dose empírico para insuficiência renal per se.",
    hepatic: "Extremamente hepatotóxico. Contra-indicado na falência hepática severa aguda.",
    rrt: "Não removido significativamente.",
    albumin: "Forte ligação proteica. Nível toxicidade correlaciona muito mais se albumina baixa.",
    notes: "Risco de hiperamonemia. Pancreatite. Trombocitopenia."
  },
  {
    name: "Amiodarona",
    category: "Cardio",
    dose: "Ataque 300mg em 30 min (excluir PCR onde é bolus). Manutenção 900mg/24h.",
    renal: "Não requer ajuste.",
    hepatic: "Pode carecer de ajuste em cirrose ou insuficiência aguda (via CYP3A4).",
    rrt: "Não removido por HD ou TRR contínua. Nenhuma suplementação necessária.",
    albumin: "Não resulta em ajuste rotineiro de dose na UCI.",
    notes: "Altamente lipofílica, grandíssimo volume de distribuição. Risco de hipotensão (pelo solvente) e bradicardia/QT lo."
  },
  {
    name: "Heparina Não-Fracionada (HNF)",
    category: "Hemato",
    dose: "Varia. Profilaxia: 5000 U SC 8/8h. Terapêutico: bolus 80U/kg + 18U/kg/h (titular com aPTT).",
    renal: "Sem ajuste obrigatório; perfil de clearance mais seguro do que HBPM na insuficiência renal.",
    hepatic: "Cl normal ou moderado: sem ajuste. Choque/Falência Grave: titular com aPTT, risco de menor base de AT3.",
    rrt: "Tratamento seguro e sem ajuste direto além de monitoração do APTT. Nos circuitos RRT pode ser feito como perfusão primária.",
    albumin: "Sem indicações de tabelas clínicas estandardizadas.",
    notes: "Risco de Trombocitopenia Induzida por Heparina (HIT). Titulação pela relação aPTT ratio 1.5 - 2.5."
  },
  {
    name: "Ceftriaxona",
    category: "Infeção",
    dose: "1-2g 12/12h a 24/24h (Meningite: 2g 12/12h)",
    renal: "Não necessita de ajuste per se. Se insuficiência renal E hepática crónicas e graves, máx 2g/dia.",
    hepatic: "Metabolismo parcial biliar. Sem ajuste necessário na maioria.",
    rrt: "Sem ajuste, não é dialisável. Dar a dose habitual.",
    albumin: "Elevada ligação proteica. Risco de hiperbilirrubinemia não conjugada.",
    notes: "Risco de precipitação biliar em tratamentos longos."
  },
  {
    name: "Colistina",
    category: "Infeção",
    dose: "Ataque: 9 MU. Manutenção: dependente da fórmula (ex: 4.5 MU 12/12h)",
    renal: "Ajuste obrigatório. Monitorização clínica rigorosa (nefrotóxica).",
    hepatic: "Sem ajuste.",
    rrt: "Substancialmente removida. Exige esquemas complexos para HD/HDFVVC.",
    albumin: "Sem impacto.",
    notes: "Potente agente de última linha para G- multirresistentes."
  },
  {
    name: "Dexmedetomidina",
    category: "Neuro",
    dose: "0.2 a 1.4 mcg/kg/h (evitar bolus em críticos)",
    renal: "Sem ajuste. Metabólitos podem acumular, mas s/ efeito sedativo clínico.",
    hepatic: "Metabolismo hepático extenso. Dose deve ser reduzida.",
    rrt: "Não removida (alta ligação proteica).",
    albumin: "Liga-se muito à albumina, mas clearance não sofre grande impacto prático.",
    notes: "Útil em delirium, extubação precoce. Causa bradicardia."
  },
  {
    name: "Adrenalina",
    category: "Cardio",
    dose: "0.01 a 0.5 mcg/kg/min",
    renal: "Sem ajuste.",
    hepatic: "Sem ajuste.",
    rrt: "Sem ajuste.",
    albumin: "Sem relevância clínica.",
    notes: "Efeito cronotrópico e hiperlactacidemia esperada no início da perfusão."
  },
  {
    name: "Vasopressina",
    category: "Cardio",
    dose: "0.01 a 0.04 U/min (Raro 0.06)",
    renal: "Benéfica por atuar na arteríola eferente.",
    hepatic: "Sem ajuste.",
    rrt: "Sem ajuste.",
    albumin: "Sem relevância clínica.",
    notes: "Poupador de noradrenalina. Isquémia esplâncnica e periférica."
  },
  {
    name: "Labetalol",
    category: "Cardio",
    dose: "Bolus 10-20mg. Perfusão 1 a 8 mg/min",
    renal: "Não necessita de ajuste.",
    hepatic: "Metabolismo rápido. Atinge picos maiores mas sem ajuste de tabela.",
    rrt: "Não hemodializável.",
    albumin: "Moderada. Irrelevante.",
    notes: "Eficaz em crise hipertensiva (alfa1 e beta não-seletivo)."
  },
  {
    name: "Sufentanil",
    category: "Neuro",
    dose: "0.1 a 0.5 mcg/kg/h",
    renal: "Ajuste na insuficiência renal grave não é rotineiro, mas sugere-se reduzir intervalos devido ao risco de acumulação dos metabolitos.",
    hepatic: "Reduzir dose em lesão hepática severa.",
    rrt: "Não removido significativamente.",
    albumin: "Alta ligação. Nenhuma ação sistemática.",
    notes: "Opióide µ-agonista potente (10x mais que fentanil)."
  },
  {
    name: "Atracúrio",
    category: "Vent",
    dose: "0.3 a 0.6 mg/kg/h",
    renal: "Sem ajuste. Degradação de Hofmann e hidrólise éster.",
    hepatic: "Sem ajuste.",
    rrt: "Sem ajuste.",
    albumin: "Não.",
    notes: "Liberta maior quantidade de histamina que o cisatracúrio."
  },
  {
    name: "Urapidilo",
    category: "Cardio",
    dose: "Bolus 10-50mg. Perfusão 9-30 mg/h",
    renal: "Sem dados precisos, mas seguro (metabolizados no fígado).",
    hepatic: "Reduzir perfusão até 50% em hepatopatias documentadas.",
    rrt: "Monitorizar apenas.",
    albumin: "Desconhecido a aplicação na clínica.",
    notes: "Excelente antagonista dos recetores adrenérgicos α1 pós-sinápticos."
  },
  {
    name: "Nimodipina",
    category: "Neuro",
    dose: "1 a 2 mg/h (geralmente via CVC, protegido da luz).",
    renal: "Não necessita ajuste para insuficiência.",
    hepatic: "Redução no compromisso grave.",
    rrt: "Não dialisável.",
    albumin: "Sem relevo.",
    notes: "Base da prevenção de défice isquémico tardio na hemorragia subaracnoídea."
  },
  {
    name: "Manitol",
    category: "Neuro",
    dose: "0.5 a 1.0 g/kg (bolus 20%). E.g. ~2.5 a 5 mL/kg de 20%",
    renal: "Contra-indicado em anúria.",
    hepatic: "Sem impacto.",
    rrt: "Removível (facilmente dialisável).",
    albumin: "Não aplicável.",
    notes: "Monitorizar Omsolaridade Sérica (Manter < 320 mOsm/L). Usado no pic de HIC."
  },
  {
    name: "Desmopressina",
    category: "Hemato",
    dose: "0.3 mcg/kg IV infusão lenta p/ hemorragia urémica.",
    renal: "Alvo da patologia para reverter disfunção plaquetária.",
    hepatic: "Seguro.",
    rrt: "Aplica-se muito associada a disfunção da IR.",
    albumin: "N/A.",
    notes: "Risco de Trombose ou Taquifilaxia nas 2ª e 3ª doses."
  }
];

const FarmacosTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [activeMeds, setActiveMeds] = usePersistedState<string[]>("farmacos-active", []);

  const toggleMed = (medName: string) => {
    setActiveMeds(prev => 
      prev.includes(medName) ? prev.filter(m => m !== medName) : [...prev, medName]
    );
  };

  const ALL_DRUGS = [...DRUGS_DATA, ...EXTRA_DRUGS].sort((a, b) => a.name.localeCompare(b.name));

  const filteredDrugs = ALL_DRUGS.filter((d) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(filteredDrugs.map(d => d.category)));

  return (
    <div className="space-y-4">
      <SectionDivider title="Cálculos de Perfusão" />
      <DrugInfusionCalc />

      <SectionDivider title="Interações e Fármacos Ativos" />
      <div className="calc-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Interações Medicamentosas</h3>
        <DrugInteractions />
        {activeMeds.length === 0 && <p className="text-[11px] text-muted-foreground italic mt-2">Selecione fármacos abaixo para verificar interações (os sedativos/aminas das outras abas são incluídos automaticamente).</p>}
        {activeMeds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {activeMeds.map(med => (
              <span key={med} className="inline-flex items-center gap-1 bg-primary/15 text-primary px-2 py-1 rounded text-[10px] font-semibold border border-primary/20">
                {med}
                <button onClick={() => toggleMed(med)} className="hover:text-destructive ml-1">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <SectionDivider title="Fármacos de Uso Frequente em UCI" />
      
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Pesquisar por fármaco ou classe..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
        />
      </div>

      <div className="columns-1 md:columns-2 xl:columns-3 gap-4">
        {categories.map((cat) => {
          const catDrugs = filteredDrugs.filter(d => d.category === cat);
          
          return (
            <div key={cat} className="calc-card space-y-2 mb-4 break-inside-avoid">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{cat}</h3>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-mono">
                    {catDrugs.length}
                  </span>
                </div>
              </div>
              
              {(expandedCat === cat || searchTerm.length > 2) && (
                <div className="space-y-3 mt-3">
                  {catDrugs.map((drug) => (
                    <div key={drug.name} className="border border-border rounded-lg bg-card/50 overflow-hidden">
                      <div className="bg-muted/30 px-3 py-2 border-b border-border">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-[13px] text-primary">{drug.name}</h4>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleMed(drug.name); }}
                            className={`px-2 py-1 flex items-center gap-1 rounded text-[10px] font-semibold border transition-all ${
                              activeMeds.includes(drug.name) 
                                ? "bg-primary text-primary-foreground border-primary" 
                                : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {activeMeds.includes(drug.name) ? "Ativo" : "+ Adicionar"}
                          </button>
                        </div>
                        <p className="text-[11px] text-foreground font-medium mt-1">Dose Habitual: <span className="font-normal">{drug.dose}</span></p>
                        <PersonalizedDose drug={drug} />
                      </div>
                      <div className="p-3 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="font-semibold text-muted-foreground mb-0.5 flex items-center gap-1">Lesão Renal Aguda</p>
                          <p className="text-muted-foreground leading-snug">{drug.renal}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground mb-0.5 flex items-center gap-1">Técnicas de Filação (TRR/HD)</p>
                          <p className="text-muted-foreground leading-snug">{drug.rrt}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground mb-0.5 flex items-center gap-1">Disfunção Hepática</p>
                          <p className="text-muted-foreground leading-snug">{drug.hepatic}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground mb-0.5 flex items-center gap-1">Hipoalbuminemia</p>
                          <p className="text-muted-foreground leading-snug">{drug.albumin}</p>
                        </div>
                      </div>
                      {drug.notes && (
                        <div className="px-3 py-2 bg-primary/5 text-primary border-t border-primary/10 text-[10px] italic">
                          <span>Nota:</span> {drug.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredDrugs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum fármaco encontrado para a pesquisa.
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmacosTab;
