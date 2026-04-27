import { useState, useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { usePatient } from "@/contexts/PatientContext";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import InfoTooltip from "../InfoTooltip";
import AlertBanner from "../AlertBanner";
import CollapsibleSection from "../CollapsibleSection";
import ExamChecklist from "../ExamChecklist";
import SectionDivider from "../SectionDivider";

const GI_EXAM: { category: string; items: string[] }[] = [
  { category: "Inspeção", items: ["Abdómen distendido", "Abdómen plano", "Abdómen escavado", "Icterícia", "Circulação colateral", "Estomas", "Ferida cirúrgica"] },
  { category: "Auscultação", items: ["RHA presentes", "RHA aumentados", "RHA diminuídos", "RHA ausentes", "Sopro abdominal"] },
  { category: "Palpação", items: ["Abdómen mole", "Defesa voluntária", "Defesa involuntária", "Dor à palpação", "Peritonismo", "Hepatomegália", "Esplenomegália", "Massa palpável", "Murphy +", "McBurney +", "Blumberg +"] },
  { category: "Percussão", items: ["Timpanismo", "Macicez", "Ascite (onda líquida)", "Sinal de Shifting dullness"] },
  { category: "Trânsito", items: ["Dejecções normais", "Diarreia", "Obstipação", "Melenas", "Hematoquézias", "Esteatorreia", "Íleo paralítico"] },
  { category: "Sondas / Drenos", items: ["SNG em drenagem", "SNG em alimentação", "Débito SNG bilioso", "Débito SNG hemático", "Resíduo gástrico elevado", "Dreno abdominal", "PEG"] },
  { category: "Nutrição", items: ["Tolerando dieta enteral", "Intolerância NE", "NP em curso", "Jejum", "Síndrome realimentação"] },
];

/* ── Nutrition Products Database ── */
interface NutritionProduct {
  name: string;
  volume: number;
  kcalPerMl: number;
  protPerMl: number;
  kcal: number;
  protein: number;
  category: "enteral" | "supplement" | "powder";
  indication: string;
  details: string;
}

const PRODUCTS: NutritionProduct[] = [
  // Enteral Normal/Fibra
  { name: "Nutrison 1.0", volume: 500, kcalPerMl: 1.0, protPerMl: 0.04, kcal: 500, protein: 20, category: "enteral", indication: "S/ restrições metabólicas.", details: "1.0 kcal/mL · 40g prot / L" },
  { name: "Nutrison Multi Fibre", volume: 500, kcalPerMl: 1.0, protPerMl: 0.04, kcal: 500, protein: 20, category: "enteral", indication: "Trânsito intestinal regular (fibra).", details: "1.0 kcal/mL · 40g prot / L" },
  { name: "Fresubin Original Fibre", volume: 500, kcalPerMl: 1.0, protPerMl: 0.038, kcal: 500, protein: 19, category: "enteral", indication: "Standard com fibra.", details: "1.0 kcal/mL · 38g prot / L" },
  { name: "Jevity 1.0", volume: 500, kcalPerMl: 1.06, protPerMl: 0.044, kcal: 530, protein: 22, category: "enteral", indication: "Isocalórico com fibra.", details: "1.06 kcal/mL · 44g prot / L" },

  // Enteral Hiperproteico/Hipercalórico
  { name: "Nutrison Protein Plus", volume: 500, kcalPerMl: 1.25, protPerMl: 0.063, kcal: 625, protein: 31.5, category: "enteral", indication: "Doente crítico c/ necs. aumentadas.", details: "1.25 kcal/mL · 63g prot / L" },
  { name: "Fresubin 2 kcal HP", volume: 500, kcalPerMl: 2.0, protPerMl: 0.1, kcal: 1000, protein: 50, category: "enteral", indication: "Restrição hídrica severa. Alto HP.", details: "2.0 kcal/mL · 100g prot / L" },
  { name: "Nutrison Energy Multi Fibre", volume: 500, kcalPerMl: 1.5, protPerMl: 0.06, kcal: 750, protein: 30, category: "enteral", indication: "Hipercalórico c/ fibra.", details: "1.5 kcal/mL · 60g prot / L" },

  // Enteral Específico
  { name: "Nutrison Adv. Diason", volume: 500, kcalPerMl: 1.03, protPerMl: 0.043, kcal: 515, protein: 21.5, category: "enteral", indication: "Diabético / hiperglicemia de stress.", details: "1.03 kcal/mL · 43g prot / L" },
  { name: "Glucerna 1.2", volume: 500, kcalPerMl: 1.2, protPerMl: 0.06, kcal: 600, protein: 30, category: "enteral", indication: "Diabético. Baixo índice glicémico.", details: "1.2 kcal/mL · 60g prot / L" },
  { name: "Peptamen AF", volume: 500, kcalPerMl: 1.2, protPerMl: 0.076, kcal: 600, protein: 38, category: "enteral", indication: "Malabsorção / S. intest curto.", details: "1.2 kcal/mL · 76g prot / L" },
  { name: "Novasource Renal", volume: 500, kcalPerMl: 2.0, protPerMl: 0.074, kcal: 1000, protein: 37, category: "enteral", indication: "Renal em TSFR/HD. Restrição hídrica.", details: "2.0 kcal/mL · 74g prot / L" },

  // Suplementos (ONS)
  { name: "Fresubin Protein Energy", volume: 200, kcalPerMl: 1.5, protPerMl: 0.1, kcal: 300, protein: 20, category: "supplement", indication: "Suplemento hipercalórico/proteico.", details: "1.5 kcal/mL · 20g prot/frasco" },
  { name: "Fortimel Energy", volume: 200, kcalPerMl: 1.5, protPerMl: 0.06, kcal: 300, protein: 12, category: "supplement", indication: "Suplemento hipercalórico.", details: "1.5 kcal/mL · 12g prot/frasco" },
  { name: "Fortimel Compact Protein", volume: 125, kcalPerMl: 2.4, protPerMl: 0.144, kcal: 300, protein: 18, category: "supplement", indication: "Alta densidade p/ baixa tolerância.", details: "2.4 kcal/mL · 18g prot/frasco" },
  { name: "Cubitan", volume: 200, kcalPerMl: 1.25, protPerMl: 0.1, kcal: 250, protein: 20, category: "supplement", indication: "Úlceras de pressão (Arginina/Vit C).", details: "1.25 kcal/mL · 20g prot/frasco" },

  // Módulos (Pó)
  { name: "Protifar (colher 2.5g)", volume: 0, kcalPerMl: 0, protPerMl: 0, kcal: 9, protein: 2.2, category: "powder", indication: "Módulo proteico puro (88%).", details: "9 kcal · 2.2g prot / colher" },
  { name: "Resource Proteina (colher 5g)", volume: 0, kcalPerMl: 0, protPerMl: 0, kcal: 18, protein: 4.5, category: "powder", indication: "Módulo proteico biológico.", details: "18 kcal · 4.5g prot / colher" },
  { name: "Fantomalt (colher 5g)", volume: 0, kcalPerMl: 0, protPerMl: 0, kcal: 19, protein: 0, category: "powder", indication: "Módulo calórico (maltodextrina).", details: "19 kcal · 0g prot / colher" },
];

// Glucose IV solutions
const DEXTROSE_SOLUTIONS = [
  { name: "Soro Glicosado 5%", kcalPerMl: 0.17, concentration: "50 g/L" },
  { name: "Soro Glicosado 10%", kcalPerMl: 0.34, concentration: "100 g/L" },
  { name: "Soro Glicosado 30%", kcalPerMl: 1.02, concentration: "300 g/L" },
];

// Stress ulcer prophylaxis
const SUP_INDICATIONS = [
  { indication: "Ventilação mecânica > 48h", risk: "Alto" },
  { indication: "Coagulopatia (plaq < 50k, INR > 1.5, aPTT > 2× controlo)", risk: "Alto" },
  { indication: "Choque / vasopressores", risk: "Alto" },
  { indication: "Queimados > 35% SCT", risk: "Alto" },
  { indication: "TCE / LMA / Politrauma", risk: "Alto" },
  { indication: "História de HDA ou úlcera péptica", risk: "Moderado" },
  { indication: "Corticoterapia em altas doses", risk: "Moderado" },
  { indication: "Nutrição enteral plena", risk: "Baixo — pode dispensar profilaxia" },
];

const SUP_DRUGS = [
  { name: "Omeprazol", dose: "40 mg IV 1×/dia ou 20 mg PO 1×/dia", notes: "IBP preferido. Evitar > 14 dias (risco C. diff)." },
  { name: "Pantoprazol", dose: "40 mg IV 1×/dia", notes: "Alternativa ao omeprazol." },
  { name: "Esomeprazol", dose: "20–40 mg IV 1×/dia", notes: "Sem ajuste renal." },
  { name: "Ranitidina", dose: "50 mg IV 8/8h ou 150 mg PO 12/12h", notes: "Anti-H2. Ajustar em IR. Menor eficácia que IBP." },
  { name: "Sucralfato", dose: "1g PO 6/6h", notes: "Citoprotetor. Sem absorção sistémica. CI se sonda fina." },
];

const DigestivoTab = () => {
  const {
    pesoAtual, pesoIdeal, pesoAjustado, propofolRateMlH, setPropofolRateMlH,
    weightReference, setWeightReference, albumina, setAlbumina, bilirrubina, setBilirrubina,
  } = usePatient();
  const pa = parseFloat(pesoAtual) || 0;

  const [metaCal, setMetaCal] = usePersistedState("digest-metaCal", "25");
  const [metaProt, setMetaProt] = usePersistedState("digest-metaProt", "1.5");
  const [albSoro, setAlbSoro] = usePersistedState("digest-albSoro", "");
  const [albAscite, setAlbAscite] = usePersistedState("digest-albAscite", "");

  const [selectedEnteral, setSelectedEnteral] = usePersistedState("digest-selEnteral", 0);
  const [enteralRate, setEnteralRate] = usePersistedState("digest-enteralRate", "");
  const [enteralHours, setEnteralHours] = usePersistedState("digest-enteralHours", "24");

  const [suppQuantities, setSuppQuantities] = usePersistedState<number[]>("digest-suppQty", PRODUCTS.map(() => 0));
  const setSuppQty = (idx: number, val: number) => {
    const next = [...suppQuantities]; next[idx] = Math.max(0, val); setSuppQuantities(next);
  };

  // Dextrose
  const [dextroseIdx, setDextroseIdx] = usePersistedState("digest-dexIdx", 0);
  const [dextroseRate, setDextroseRate] = usePersistedState("digest-dexRate", "");

  const bili = parseFloat(bilirrubina) || 0;

  const pesoUsado = useMemo(() => {
    if (weightReference === "atual") return pa || null;
    if (weightReference === "ajustado") return pesoAjustado;
    return pesoIdeal;
  }, [weightReference, pa, pesoIdeal, pesoAjustado]);

  const propofolKcal = useMemo(() => {
    const rate = parseFloat(propofolRateMlH);
    return rate ? rate * 24 * 1.1 : null;
  }, [propofolRateMlH]);

  const dextroseKcal = useMemo(() => {
    const rate = parseFloat(dextroseRate);
    if (!rate) return null;
    return rate * 24 * DEXTROSE_SOLUTIONS[dextroseIdx].kcalPerMl;
  }, [dextroseRate, dextroseIdx]);

  const mc = parseFloat(metaCal) || 25;
  const mp = parseFloat(metaProt) || 1.5;
  const calTotal = pesoUsado ? pesoUsado * mc : null;
  const calLiquida = calTotal !== null ? calTotal - (propofolKcal || 0) - (dextroseKcal || 0) : null;
  const protTotal = pesoUsado ? pesoUsado * mp : null;
  const targetKcal = calLiquida ?? calTotal ?? 0;
  const targetProt = protTotal ?? 0;

  const enteralProduct = PRODUCTS[selectedEnteral];
  const rateVal = parseFloat(enteralRate) || 0;
  const hoursVal = parseFloat(enteralHours) || 24;
  const enteralVolDay = rateVal * hoursVal;
  const enteralKcalDay = enteralVolDay * enteralProduct.kcalPerMl;
  const enteralProtDay = enteralVolDay * enteralProduct.protPerMl;

  const suggestedRateCal = useMemo(() => {
    if (!targetKcal || !enteralProduct.kcalPerMl || !hoursVal) return null;
    return targetKcal / (enteralProduct.kcalPerMl * hoursVal);
  }, [targetKcal, enteralProduct.kcalPerMl, hoursVal]);

  const suggestedRateProt = useMemo(() => {
    if (!targetProt || !enteralProduct.protPerMl || !hoursVal) return null;
    return targetProt / (enteralProduct.protPerMl * hoursVal);
  }, [targetProt, enteralProduct.protPerMl, hoursVal]);

  const suggestedRate = useMemo(() => {
    if (!suggestedRateCal) return null;
    return suggestedRateCal;
  }, [suggestedRateCal]);

  const suppPlanned = useMemo(() => {
    let kcal = 0, prot = 0;
    suppQuantities.forEach((q, i) => {
      if (typeof q === 'number' && PRODUCTS[i] && PRODUCTS[i].category !== "enteral") { 
        kcal += q * PRODUCTS[i].kcal; 
        prot += q * PRODUCTS[i].protein; 
      }
    });
    return { kcal, prot };
  }, [suppQuantities]);

  const totalKcal = enteralKcalDay + suppPlanned.kcal;
  const totalProt = enteralProtDay + suppPlanned.prot;
  const diffKcal = totalKcal - targetKcal;
  const diffProt = totalProt - targetProt;

  const gasa = useMemo(() => {
    const s = parseFloat(albSoro); const a = parseFloat(albAscite);
    return s && a ? s - a : null;
  }, [albSoro, albAscite]);

  const albAlert = albumina && parseFloat(albumina) < 4.0;

  return (
    <div className="space-y-4">
      <SectionDivider title="Exame Físico" />
      <ExamChecklist storageKey="digest" title="Exame Abdominal / GI" categories={GI_EXAM} />

      <SectionDivider title="Monitorização Hepática" />

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Bilirrubina */}
        <CollapsibleSection title="Bilirrubina"
          info={<InfoTooltip reference="Normal: < 1.2 mg/dL" interpretation="Partilhada com SOFA e Child-Pugh. > 2: icterícia. > 6: disfunção hepática significativa." />}>
          <CalcField label="Bilirrubina" value={bilirrubina} onChange={setBilirrubina} unit="mg/dL" />
          {bili > 0 && (
            <Interpretation status={bili >= 6 ? "danger" : bili >= 2 ? "warning" : "normal"}
              text={bili >= 6 ? `Disfunção hepática.`
                : bili >= 2 ? `Icterícia.`
                : `Normal.`} />
          )}
        </CollapsibleSection>

        {/* Albumina */}
        <CollapsibleSection title="Albumina"
          info={<InfoTooltip reference="Normal: 3.5–5.0 g/dL" interpretation="Alb < 4.0 → correção fenitoína. < 3.5: hipoalbuminemia." />}>
          <CalcField label="Albumina" value={albumina} onChange={setAlbumina} unit="g/dL" />
          {albAlert && <AlertBanner text={`< 4.0 — Correção FTO.`} level="warning" />}
        </CollapsibleSection>
      </div>

      {/* Stress Ulcer Prophylaxis */}
      <CollapsibleSection title="Profilaxia Úlcera de Stress"
        info={<InfoTooltip interpretation="Indicada em doentes críticos com fatores de risco. Suspender quando tolerar nutrição enteral plena." />}>
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Indicações</p>
        <div className="space-y-1 mb-3">
          {SUP_INDICATIONS.map((ind, i) => (
            <div key={i} className="flex justify-between items-center bg-muted/30 rounded px-2.5 py-1.5 border border-border">
              <span className="text-[10px] text-foreground">{ind.indication}</span>
              <span className={`text-[9px] font-mono ${ind.risk === "Alto" ? "text-destructive" : ind.risk === "Moderado" ? "text-warning" : "text-primary"}`}>{ind.risk}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Fármacos</p>
        <div className="space-y-1.5">
          {SUP_DRUGS.map((drug) => (
            <div key={drug.name} className="bg-muted/20 rounded-lg p-2.5 border border-border">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-foreground">{drug.name}</span>
              </div>
              <p className="text-[10px] font-mono text-primary mt-0.5">{drug.dose}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{drug.notes}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>
      <SectionDivider title="Nutrição" />

      {/* Metas */}
      <CollapsibleSection title="Metas Nutricionais"
        info={<InfoTooltip reference="ESPEN/ASPEN" interpretation="25–30 kcal/kg/dia · 1.2–2.0 g prot/kg/dia" />}>
        <div className="mb-3">
          <span className="calc-label">Peso de referência</span>
          <div className="flex gap-1.5">
            {(["ideal", "ajustado", "atual"] as const).map((opt) => {
              const val = opt === "ideal" ? pesoIdeal : opt === "ajustado" ? pesoAjustado : pa || null;
              return (
                <button key={opt} onClick={() => setWeightReference(opt)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${weightReference === opt ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
                  {opt === "ideal" ? "Ideal" : opt === "ajustado" ? "Ajustado" : "Atual"}{val ? ` (${val.toFixed(1)})` : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2">
          <CalcField label="kcal/kg/dia" value={metaCal} onChange={setMetaCal} unit="kcal/kg" />
          <CalcField label="Proteína/kg/dia" value={metaProt} onChange={setMetaProt} unit="g/kg" />
        </div>
        <p className="text-[9px] text-muted-foreground font-mono mb-3">Agudo D1-D3: 15–20 · Estável: 25–30 kcal/kg</p>

        {/* Propofol */}
        <div className="bg-muted/50 rounded-lg p-2.5 border border-border mb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">Propofol (1.1 kcal/mL)</span>
            <div className="flex items-center gap-1.5">
              <input type="number" value={propofolRateMlH} onChange={(e) => setPropofolRateMlH(e.target.value)}
                placeholder="0" className="calc-input w-20 text-right text-[11px] py-1 px-2" />
              <span className="text-[10px] text-muted-foreground">mL/h</span>
            </div>
          </div>
          {propofolKcal !== null && propofolKcal > 0 && (
            <p className="text-[10px] text-warning font-mono mt-1">⚡ {propofolKcal.toFixed(0)} kcal/dia a subtrair</p>
          )}
        </div>

        {/* Dextrose */}
        <div className="bg-muted/50 rounded-lg p-2.5 border border-border mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] text-muted-foreground">Soro Glicosado</span>
            <InfoTooltip interpretation="Calorias do soro glicosado a subtrair." />
          </div>
          <div className="flex gap-2 mb-1.5">
            {DEXTROSE_SOLUTIONS.map((sol, i) => (
              <button key={sol.name} onClick={() => setDextroseIdx(i)}
                className={`flex-1 py-1 rounded text-[10px] font-semibold transition-all ${dextroseIdx === i ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
                {sol.name.replace("Soro Glicosado ", "SG ")}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <input type="number" value={dextroseRate} onChange={(e) => setDextroseRate(e.target.value)}
              placeholder="0" className="calc-input w-20 text-right text-[11px] py-1 px-2" />
            <span className="text-[10px] text-muted-foreground">mL/h</span>
          </div>
          {dextroseKcal !== null && dextroseKcal > 0 && (
            <p className="text-[10px] text-warning font-mono mt-1">⚡ {dextroseKcal.toFixed(0)} kcal/dia</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CalcResult label="Meta Calórica" value={calTotal?.toFixed(0) ?? null} unit="kcal" />
          <CalcResult label="Meta Líquida" value={calLiquida?.toFixed(0) ?? null} unit="kcal" status={calLiquida !== null && calLiquida < 0 ? "danger" : "normal"} />
        </div>
        <CalcResult label="Meta Proteica" value={protTotal?.toFixed(0) ?? null} unit="g" />
        
        {calLiquida !== null && (
          <div className="mt-2">
            <Interpretation 
              text={`A meta "Líquida" subtrai as calorias não-nutricionais (Propofol: ${propofolKcal?.toFixed(0)??0} kcal; Glucosados: ${dextroseKcal?.toFixed(0)??0} kcal).${calLiquida < 0 ? " Alerta: Excesso calórico por vias não enterais/parenterais!" : ""}`}
              status={calLiquida < 0 ? "danger" : "normal"} 
            />
          </div>
        )}
      </CollapsibleSection>

      {/* Enteral */}
      <CollapsibleSection title="① Nutrição Enteral"
        info={<InfoTooltip interpretation="Selecione fórmula e defina ritmo." />}>
        <div className="space-y-2 mb-3">
          {PRODUCTS.map((p, i) => p.category === "enteral" && (
            <button key={i} onClick={() => setSelectedEnteral(i)}
              className={`w-full text-left rounded-lg p-2.5 border transition-all ${selectedEnteral === i ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${selectedEnteral === i ? "bg-primary" : "bg-muted-foreground/30"}`} />
                <span className="text-[11px] font-semibold text-foreground">{p.name}</span>
              </div>
              <p className="text-[9px] text-muted-foreground font-mono mt-0.5 ml-3.5">{p.details}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <CalcField label="Ritmo" value={enteralRate} onChange={setEnteralRate} unit="mL/h" placeholder="ex: 42" />
          <CalcField label="Horas/dia" value={enteralHours} onChange={setEnteralHours} unit="h" />
        </div>

        {suggestedRate !== null && targetKcal > 0 && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 mb-3 space-y-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Sugestão para Meta Calórica
            </p>
            <div className="flex justify-between items-center mt-1">
              <span className="font-mono text-primary font-bold text-xs">{suggestedRate.toFixed(1)} mL/h</span>
              {rateVal !== Math.ceil(suggestedRate) && (
                <button onClick={() => setEnteralRate(Math.ceil(suggestedRate).toString())}
                  className="text-[9px] font-bold bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90">
                  Aplicar {Math.ceil(suggestedRate)} mL/h
                </button>
              )}
            </div>
          </div>
        )}

        {rateVal > 0 && (
          <div className="bg-muted/50 rounded-lg p-2.5 border border-border space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Volume</span>
              <span className="font-mono text-foreground">{enteralVolDay.toFixed(0)} mL/dia</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Calorias</span>
              <span className="font-mono text-foreground">{enteralKcalDay.toFixed(0)} kcal</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Proteína</span>
              <span className="font-mono text-foreground">{enteralProtDay.toFixed(1)} g</span>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Supplements */}
      <CollapsibleSection title="② Suplementos & Módulos"
        info={<InfoTooltip interpretation="Cobrir défice restante após enteral." />}>
        <div className="space-y-2 mb-3">
          {PRODUCTS.map((p, i) => (p.category === "supplement" || p.category === "powder") && (
            <div key={i} className="bg-muted/20 rounded-lg p-2.5 border border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-foreground">{p.name}</span>
                  <p className="text-[9px] text-muted-foreground font-mono">{p.details}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setSuppQty(i, suppQuantities[i] - 1)} className="w-6 h-6 rounded bg-muted border border-border text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">−</button>
                  <span className="w-6 text-center text-xs font-mono font-semibold text-foreground">{suppQuantities[i]}</span>
                  <button onClick={() => setSuppQty(i, suppQuantities[i] + 1)} className="w-6 h-6 rounded bg-muted border border-border text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Balanço Final */}
      <CollapsibleSection title="Balanço Final">
        <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Enteral</span>
            <span className="font-mono text-foreground">{enteralKcalDay.toFixed(0)} kcal · {enteralProtDay.toFixed(1)}g</span>
          </div>
          {suppPlanned.kcal > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Supl. / Módulos</span>
              <span className="font-mono text-foreground">{suppPlanned.kcal.toFixed(0)} kcal · {suppPlanned.prot.toFixed(1)}g</span>
            </div>
          )}
          {propofolKcal !== null && propofolKcal > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-warning">Propofol</span>
              <span className="font-mono text-warning">−{propofolKcal.toFixed(0)} kcal</span>
            </div>
          )}
          {dextroseKcal !== null && dextroseKcal > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-warning">Soro Glicosado</span>
              <span className="font-mono text-warning">−{dextroseKcal.toFixed(0)} kcal</span>
            </div>
          )}
          <div className="border-t border-border pt-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-foreground">Total Planeado</span>
              <span className="font-mono font-semibold text-foreground">{totalKcal.toFixed(0)} kcal · {totalProt.toFixed(1)}g</span>
            </div>
          </div>
          <div className="border-t border-border pt-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-muted-foreground">Diferença Calórica</span>
              <span className={`font-mono font-semibold ${Math.abs(diffKcal) < 50 ? "text-primary" : diffKcal < 0 ? "text-warning" : "text-destructive"}`}>
                {diffKcal >= 0 ? "+" : ""}{diffKcal.toFixed(0)} kcal
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-muted-foreground">Diferença Proteica</span>
              <span className={`font-mono font-semibold ${Math.abs(diffProt) < 5 ? "text-primary" : diffProt < 0 ? "text-warning" : "text-destructive"}`}>
                {diffProt >= 0 ? "+" : ""}{diffProt.toFixed(1)} g
              </span>
            </div>
          </div>
        </div>
        {diffKcal < -100 && targetKcal > 0 && <Interpretation status="warning" text={`Défice ${Math.abs(diffKcal).toFixed(0)} kcal.`} />}
        {diffProt < -10 && targetProt > 0 && <Interpretation status="warning" text={`Défice proteico ${Math.abs(diffProt).toFixed(1)}g.`} />}
        {totalKcal > 0 && Math.abs(diffKcal) <= 100 && Math.abs(diffProt) <= 10 && <Interpretation status="normal" text="Plano nutricional adequado." />}
      </CollapsibleSection>

      {/* GASA */}
      <CollapsibleSection title="GASA"
        info={<InfoTooltip formula="Alb Soro − Alb Ascite" reference="≥ 1.1: Hipertensão portal" />}>
        <div className="grid grid-cols-2 gap-3">
          <CalcField label="Alb. Soro" value={albSoro} onChange={setAlbSoro} unit="g/dL" />
          <CalcField label="Alb. Ascite" value={albAscite} onChange={setAlbAscite} unit="g/dL" />
        </div>
        {gasa !== null && (
          <>
            <CalcResult label="GASA" value={gasa.toFixed(2)} unit="g/dL" status={gasa >= 1.1 ? "normal" : "warning"} />
            <Interpretation status={gasa >= 1.1 ? "normal" : "warning"}
              text={gasa >= 1.1 ? `${gasa.toFixed(2)} — Hipertensão Portal.` : `${gasa.toFixed(2)} — Não-portal.`} />
          </>
        )}
      </CollapsibleSection>

    </div>
  );
};

export default DigestivoTab;
