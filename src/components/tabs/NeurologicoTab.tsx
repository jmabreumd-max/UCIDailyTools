import { useState, useMemo, useEffect } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { usePatient } from "@/contexts/PatientContext";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import InfoTooltip from "../InfoTooltip";
import AlertBanner from "../AlertBanner";
import UniversalInfusionConverter from "../UniversalInfusionConverter";
import ExamChecklist from "../ExamChecklist";
import DrugInteractions from "../DrugInteractions";
import SectionDivider from "../SectionDivider";

const NEURO_EXAM: { category: string; items: string[] }[] = [
  { category: "Estado de Consciência", items: ["Alerta", "Sonolento", "Estuporoso", "Coma", "Confuso", "Desorientado", "Agitado"] },
  { category: "Pupilas", items: ["Isocóricas", "Anisocóricas", "Midríase", "Miose", "Arreativas", "Fotorreativas"] },
  { category: "Pares Cranianos", items: ["Desvio do olhar", "Ptose", "Anisocoria", "Paralisia facial central", "Paralisia facial periférica", "Reflexo corneal ausente", "Reflexo nauseoso ausente", "Disfagia"] },
  { category: "Motor", items: ["Hemiparésia D", "Hemiparésia E", "Tetraparésia", "Paraparésia", "Plegia", "Hipertonia", "Hipotonia", "Flacidez", "Espasticidade", "Clónus", "Mioclonias"] },
  { category: "Reflexos", items: ["Babinski +", "Hiperreflexia", "Hiporreflexia", "Arreflexia"] },
  { category: "Sensibilidade", items: ["Hipoestesia", "Parestesias", "Dor neuropática"] },
  { category: "Sinais Meníngeos", items: ["Rigidez da nuca", "Kernig +", "Brudzinski +"] },
  { category: "Outros", items: ["Convulsões", "Tremor", "Fasciculações", "Afasia", "Disartria", "Nistagmo"] },
];

// Glasgow
const GCS_EYE = [
  { score: 4, label: "Espontânea" }, { score: 3, label: "À voz" },
  { score: 2, label: "À dor" }, { score: 1, label: "Nenhuma" },
];
const GCS_VERBAL = [
  { score: 5, label: "Orientada" }, { score: 4, label: "Confusa" },
  { score: 3, label: "Inapropriada" }, { score: 2, label: "Incompreensível" }, { score: 1, label: "Nenhuma" },
];
const GCS_MOTOR = [
  { score: 6, label: "Obedece" }, { score: 5, label: "Localiza dor" },
  { score: 4, label: "Flexão normal" }, { score: 3, label: "Flexão anormal" },
  { score: 2, label: "Extensão" }, { score: 1, label: "Nenhuma" },
];

const RASS_LEVELS = [
  { value: 4, label: "+4 Combativo", desc: "Violento, perigo para a equipa" },
  { value: 3, label: "+3 Muito agitado", desc: "Puxa/remove tubos, agressivo" },
  { value: 2, label: "+2 Agitado", desc: "Movimentos frequentes sem propósito" },
  { value: 1, label: "+1 Inquieto", desc: "Ansioso, movimentos não agressivos" },
  { value: 0, label: " 0 Alerta e calmo", desc: "Alerta espontaneamente" },
  { value: -1, label: "-1 Sonolento", desc: "Desperta à voz (>10s)" },
  { value: -2, label: "-2 Sedação leve", desc: "Desperta brevemente à voz (<10s)" },
  { value: -3, label: "-3 Sedação moderada", desc: "Movimento à voz, sem contacto visual" },
  { value: -4, label: "-4 Sedação profunda", desc: "Sem resposta à voz; movimento à estimulação" },
  { value: -5, label: "-5 Não despertável", desc: "Sem resposta" },
];

const BPS_FACE = [
  { score: 1, label: "Relaxada" }, { score: 2, label: "Parcialmente contraída" },
  { score: 3, label: "Totalmente contraída" }, { score: 4, label: "Grimace" },
];
const BPS_LIMBS = [
  { score: 1, label: "Sem movimento" }, { score: 2, label: "Parcialmente fletidos" },
  { score: 3, label: "Totalmente fletidos" }, { score: 4, label: "Permanentemente retraídos" },
];
const BPS_VENT = [
  { score: 1, label: "Tolera ventilação" }, { score: 2, label: "Tosse ocasional" },
  { score: 3, label: "Luta contra ventilador" }, { score: 4, label: "Impossível ventilar" },
];

const MRC_GROUPS = [
  { name: "Abdução do ombro", side: "D" }, { name: "Abdução do ombro", side: "E" },
  { name: "Flexão do cotovelo", side: "D" }, { name: "Flexão do cotovelo", side: "E" },
  { name: "Extensão do punho", side: "D" }, { name: "Extensão do punho", side: "E" },
  { name: "Flexão da anca", side: "D" }, { name: "Flexão da anca", side: "E" },
  { name: "Extensão do joelho", side: "D" }, { name: "Extensão do joelho", side: "E" },
  { name: "Dorsiflexão do pé", side: "D" }, { name: "Dorsiflexão do pé", side: "E" },
];

const IOT_DRUGS = [
  { name: "Etomidato", doseRange: "0.2–0.3", unit: "mg/kg", min: 0.2, max: 0.3, notes: "Estabilidade hemodinâmica. Inibição suprarrenal." },
  { name: "Propofol", doseRange: "1.5–2.5", unit: "mg/kg", min: 1.5, max: 2.5, notes: "Hipotensão. Evitar em choque." },
  { name: "Quetamina", doseRange: "1–2", unit: "mg/kg", min: 1, max: 2, notes: "Preserva hemodinâmica. Broncodilatador." },
  { name: "Midazolam", doseRange: "0.1–0.3", unit: "mg/kg", min: 0.1, max: 0.3, notes: "Associar opióide." },
  { name: "Suxametónio", doseRange: "1–1.5", unit: "mg/kg", min: 1, max: 1.5, notes: "CI: hipercaliemia, queimados >24h." },
  { name: "Rocurónio", doseRange: "0.6–1.2", unit: "mg/kg", min: 0.6, max: 1.2, notes: "Reversão: sugamadex." },
  { name: "Fentanil", doseRange: "1–3", unit: "mcg/kg", min: 1, max: 3, notes: "Rigidez torácica em bólus rápido." },
];

const SEDATION_INFUSIONS = [
  { name: "Fentanil", concentrations: [{ label: "500 mcg / 50 mL (10 mcg/mL)", mgPerMl: 0.01 }], doseUnit: "mcg/kg/h" as const, doseRange: "0.5–3", notes: "Analgesia pura. 1ª linha.", rassGuide: "BPS ≤ 4: manter | BPS 5–6: ↑ 0.5 mcg/kg/h | BPS ≥ 7: bólus + ↑" },
  { name: "Remifentanil", concentrations: [{ label: "5 mg / 50 mL (100 mcg/mL)", mgPerMl: 0.1 }], doseUnit: "mcg/kg/min" as const, doseRange: "0.05–0.25", notes: "Sem acúmulo. Hiperalgesia. Desmame rápido.", rassGuide: "RASS 0 a -1: 0.05–0.1 | RASS -2: 0.1–0.15 | RASS -3 a -4: 0.15–0.25" },
  { name: "Sufentanil", concentrations: [{ label: "250 mcg / 50 mL (5 mcg/mL)", mgPerMl: 0.005 }], doseUnit: "mcg/kg/h" as const, doseRange: "0.1–0.5", notes: "Metabolismo hepático. Longa semi-vida.", rassGuide: "Ajustar dose para atingir BPS ≤ 4." },
  { name: "Midazolam", concentrations: [{ label: "50 mg / 50 mL (1 mg/mL)", mgPerMl: 1 }], doseUnit: "mg/kg/h" as const, doseRange: "0.02–0.1", notes: "Metabolito ativo (IR). ↑ Delirium.", rassGuide: "RASS -1 a -2: 0.02–0.04 | RASS -3: 0.04–0.06 | RASS -4 a -5: 0.06–0.1" },
  { name: "Propofol", concentrations: [{ label: "2% (20 mg/mL)", mgPerMl: 20 }, { label: "1% (10 mg/mL)", mgPerMl: 10 }], doseUnit: "mg/kg/h" as const, doseRange: "0.5–4", notes: "PRIS se > 5 mg/kg/h > 48h. 1.1 kcal/mL. (1% preferencial para bolus)", rassGuide: "RASS 0 a -1: 0.5–1.5 | RASS -2: 1.5–2.5 | RASS -3 a -4: 2.5–4.0" },
  { name: "Dexmedetomidina", concentrations: [{ label: "400 mcg / 100 mL (4 mcg/mL)", mgPerMl: 0.004 }], doseUnit: "mcg/kg/h" as const, doseRange: "0.2–1.4", notes: "Sem depressão respiratória. Anti-delirium. Bradicardia.", rassGuide: "RASS 0 a -1: 0.2–0.5 | RASS -2: 0.5–1.0 | RASS -3: 1.0–1.4" },
  { name: "Cetamina", concentrations: [{ label: "50 mg/mL", mgPerMl: 50 }, { label: "10 mg/mL", mgPerMl: 10 }], doseUnit: "mg/kg/h" as const, doseRange: "0.1–0.5", notes: "Subdissociativa: analgesia + broncodilatação.", rassGuide: "Analgesia: 0.1–0.2 | Sedação: 0.2–0.3 | Dissociativa: 0.3–0.5" },
  { name: "Tiopental", concentrations: [{ label: "1g / 50 mL (20 mg/mL)", mgPerMl: 20 }], doseUnit: "mg/kg/h" as const, doseRange: "2–4", notes: "Coma barbitúrico no TCE. Muito depressor miocárdio.", rassGuide: "Titular p/ Burst Suppression (EEG)" },
  { name: "Atracúrio", concentrations: [{ label: "500 mg / 50 mL (10 mg/mL)", mgPerMl: 10 }], doseUnit: "mg/kg/h" as const, doseRange: "0.3–0.6", notes: "Libertação histamina.", rassGuide: "TOF 1–2/4: manter | TOF 0/4: ↓ dose" },
  { name: "Cisatracúrio", concentrations: [{ label: "2 mg/mL", mgPerMl: 2 }, { label: "5 mg/mL", mgPerMl: 5 }], doseUnit: "mcg/kg/min" as const, doseRange: "1–3", notes: "Degradação Hofmann. Preferível em IR/IH.", rassGuide: "TOF 1–2/4: manter | TOF 0/4: ↓ dose" },
  { name: "Rocurónio", concentrations: [{ label: "10 mg/mL", mgPerMl: 10 }], doseUnit: "mg/kg/h" as const, doseRange: "0.3–0.6", notes: "Monitorizar TOF q4h. Sugamadex.", rassGuide: "TOF 1–2/4: manter | TOF 0/4: ↓ ou suspender" },
];

const ANTICONVULSANTS = [
  { name: "Fenitoína", loadingDose: "15–20 mg/kg IV (máx 50 mg/min)", maintenanceDose: "5 mg/kg/dia 8/8h", levels: "10–20 mg/L", notes: "Corrigir se Alb < 4.0. Arritmias IV rápido." },
  { name: "Ác. Valpróico", loadingDose: "20–40 mg/kg IV", maintenanceDose: "10–15 mg/kg/dia 8/8h", levels: "50–100 mg/L", notes: "CI: hepatopatia. Trombocitopenia." },
  { name: "Levetiracetam", loadingDose: "1000–3000 mg IV", maintenanceDose: "500–1500 mg 12/12h", levels: "12–46 mg/L", notes: "Ajustar a IR. Seguro." },
  { name: "Perampanel", loadingDose: "N/A (PO)", maintenanceDose: "2–12 mg/dia", levels: "—", notes: "Antagonista AMPA. Sem IV." },
];

const NeurologicoTab = () => {
  const { pesoAtual, pesoReferencia, albumina, propofolRateMlH, setPropofolRateMlH, setGcsTotal: setGcsCtx, pamCardio } = usePatient();
  const peso = parseFloat(pesoAtual) || 0;
  const pesoRef = pesoReferencia || peso;

  const [gcsE, setGcsE] = usePersistedState<number | null>("neuro-gcsE", null);
  const [gcsV, setGcsV] = usePersistedState<number | null>("neuro-gcsV", null);
  const [gcsM, setGcsM] = usePersistedState<number | null>("neuro-gcsM", null);
  const gcsTotal = gcsE !== null && gcsV !== null && gcsM !== null ? gcsE + gcsV + gcsM : null;

  // Sync GCS to context for SOFA auto-calculation
  useEffect(() => { setGcsCtx(gcsTotal ?? 0); }, [gcsTotal, setGcsCtx]);

  const [rass, setRass] = usePersistedState<number | null>("neuro-rass", null);

  // CAM-ICU algorithm steps
  const [camF1, setCamF1] = usePersistedState<boolean | null>("neuro-camF1", null);
  const [camF2, setCamF2] = usePersistedState<boolean | null>("neuro-camF2", null);
  const [camF3, setCamF3] = usePersistedState<boolean | null>("neuro-camF3", null);
  const [camF4, setCamF4] = usePersistedState<boolean | null>("neuro-camF4", null);

  const camResult = useMemo(() => {
    if (camF1 === false) return "negative";
    if (camF1 === true && camF2 === false) return "negative";
    if (camF1 === true && camF2 === true) {
      if (camF3 === true) return "positive";
      if (camF4 === true) return "positive";
      if (camF3 === false && camF4 === false) return "negative";
    }
    return null;
  }, [camF1, camF2, camF3, camF4]);

  const [bpsFace, setBpsFace] = usePersistedState<number | null>("neuro-bpsFace", null);
  const [bpsLimbs, setBpsLimbs] = usePersistedState<number | null>("neuro-bpsLimbs", null);
  const [bpsVent, setBpsVent] = usePersistedState<number | null>("neuro-bpsVent", null);
  const bpsTotal = bpsFace !== null && bpsLimbs !== null && bpsVent !== null ? bpsFace + bpsLimbs + bpsVent : null;

  // Neuromonitoring
  const [pic, setPic] = usePersistedState("neuro-pic", "");
  const [bis, setBis] = usePersistedState("neuro-bis", "");
  const [nirsL, setNirsL] = usePersistedState("neuro-nirsL", "");
  const [nirsR, setNirsR] = usePersistedState("neuro-nirsR", "");

  // Lindegaard
  const [mcaVelocity, setMcaVelocity] = usePersistedState("neuro-mcaV", "");
  const [icaVelocity, setIcaVelocity] = usePersistedState("neuro-icaV", "");

  // PPC uses PAM from cardio context
  const pamVal = parseFloat(pamCardio) || 0;
  const ppc = useMemo(() => {
    const i = parseFloat(pic);
    return pamVal && !isNaN(i) && i >= 0 ? pamVal - i : null;
  }, [pamVal, pic]);

  const lindegaard = useMemo(() => {
    const mca = parseFloat(mcaVelocity); const ica = parseFloat(icaVelocity);
    if (!mca || !ica || ica <= 0) return null;
    return mca / ica;
  }, [mcaVelocity, icaVelocity]);

  // MRC
  const [mrcScores, setMrcScores] = usePersistedState<(number | null)[]>("neuro-mrc", new Array(12).fill(null));
  const mrcAllFilled = mrcScores.every(s => s !== null);
  const mrcTotal = mrcAllFilled ? (mrcScores as number[]).reduce((a, b) => a + b, 0) : null;
  const [showMRC, setShowMRC] = usePersistedState("neuro-showMRC", false);

  const [phenytoinMeasured, setPhenytoinMeasured] = usePersistedState("neuro-phenytoin", "");
  const alb = parseFloat(albumina) || 4.0;
  const phenytoinCorrected = useMemo(() => {
    const val = parseFloat(phenytoinMeasured);
    if (!val) return null;
    if (alb >= 4.0) return val;
    return val / ((0.2 * alb) + 0.1);
  }, [phenytoinMeasured, alb]);

  const [customConfigs] = usePersistedState<Record<string, {label: string, mgPerMl: number}[]>>("drug-configs-override", {});

  const activeSedationInfusions = useMemo(() => {
    return SEDATION_INFUSIONS.map(d => ({
      ...d,
      concentrations: customConfigs[d.name] || d.concentrations
    }));
  }, [customConfigs]);

  const [sedationRates, setSedationRates] = usePersistedState<string[]>("neuro-sedationRates", new Array(SEDATION_INFUSIONS.length).fill(""));
  const [expandedInfusion, setExpandedInfusion] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <SectionDivider title="Exame Físico" />
      <ExamChecklist storageKey="neuro" title="Exame Neurológico" categories={NEURO_EXAM} />

      <SectionDivider title="Avaliação Neurológica" />

      {/* Glasgow */}
      <div className="calc-card">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-semibold text-foreground">Glasgow (GCS)</h3>
          <InfoTooltip reference="3–15" interpretation="≤8: IOT indicada | 9–12: moderado | 13–15: leve." />
        </div>
        {[
          { label: "Ocular (E)", options: GCS_EYE, value: gcsE, set: setGcsE },
          { label: "Verbal (V)", options: GCS_VERBAL, value: gcsV, set: setGcsV },
          { label: "Motor (M)", options: GCS_MOTOR, value: gcsM, set: setGcsM },
        ].map(({ label, options, value, set }) => (
          <div key={label} className="mb-2">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1">{label}</p>
            <div className="flex flex-wrap gap-1">
              {options.map((opt) => (
                <button key={opt.score} onClick={() => set(opt.score)}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                    value === opt.score ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
                  }`}>{opt.score}: {opt.label}</button>
              ))}
            </div>
          </div>
        ))}
        {gcsTotal !== null && (
          <>
            <CalcResult label="GCS Total" value={`${gcsTotal} (E${gcsE}V${gcsV}M${gcsM})`} unit=""
              status={gcsTotal <= 8 ? "danger" : gcsTotal <= 12 ? "warning" : "normal"} />
            <Interpretation status={gcsTotal <= 8 ? "danger" : gcsTotal <= 12 ? "warning" : "normal"}
              text={gcsTotal <= 8 ? `GCS ${gcsTotal} — Coma. IOT indicada. TC-CE.` : gcsTotal <= 12 ? `GCS ${gcsTotal} — Moderado.` : `GCS ${gcsTotal} — Normal.`} />
          </>
        )}
      </div>

      {/* RASS */}
      <div className="calc-card">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-semibold text-foreground">RASS</h3>
          <InfoTooltip reference="-5 a +4" interpretation="Alvo habitual: 0 a -2. Avaliar antes de CAM-ICU." />
        </div>
        <div className="space-y-1">
          {RASS_LEVELS.map((level) => (
            <button key={level.value} onClick={() => setRass(level.value)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-[11px] transition-all ${
                rass === level.value
                  ? level.value > 0 ? "bg-destructive/15 text-destructive border border-destructive/25"
                    : level.value >= -2 ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-warning/15 text-warning border border-warning/25"
                  : "bg-muted/30 text-muted-foreground border border-border hover:border-primary/20"
              }`}>
              <span className="font-mono font-semibold">{level.label}</span>
              <span className="text-[10px] ml-2 opacity-75">— {level.desc}</span>
            </button>
          ))}
        </div>
        {rass !== null && (
          <Interpretation status={rass > 1 ? "danger" : rass < -3 ? "warning" : "normal"}
            text={rass > 1 ? `RASS ${rass > 0 ? "+" : ""}${rass} — Agitação. Avaliar dor, delirium, hipóxia.`
              : rass >= -2 ? `RASS ${rass > 0 ? "+" : ""}${rass} — Alvo habitual. Despertar diário.`
              : `RASS ${rass} — Sedação profunda. Protocolo de despertar.`} />
        )}
      </div>

      {/* BPS */}
      <div className="calc-card">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-semibold text-foreground">BPS — Behavioral Pain Scale</h3>
          <InfoTooltip reference="3–12" interpretation="Alvo ≤ 4. 3: sem dor | ≥9: dor intensa." />
        </div>
        {[
          { label: "Expressão Facial", options: BPS_FACE, value: bpsFace, set: setBpsFace },
          { label: "Membros Superiores", options: BPS_LIMBS, value: bpsLimbs, set: setBpsLimbs },
          { label: "Adaptação ao Ventilador", options: BPS_VENT, value: bpsVent, set: setBpsVent },
        ].map(({ label, options, value, set }) => (
          <div key={label} className="mb-2">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1">{label}</p>
            <div className="space-y-0.5">
              {options.map((opt) => (
                <button key={opt.score} onClick={() => set(opt.score)}
                  className={`w-full text-left px-2.5 py-1 rounded text-[10px] transition-all ${
                    value === opt.score ? (opt.score >= 3 ? "bg-destructive/15 text-destructive border border-destructive/25" : opt.score >= 2 ? "bg-warning/15 text-warning border border-warning/25" : "bg-primary/15 text-primary border border-primary/25")
                    : "bg-muted/30 text-muted-foreground border border-border"
                  }`}><span className="font-mono">{opt.score}:</span> {opt.label}</button>
              ))}
            </div>
          </div>
        ))}
        {bpsTotal !== null && (
          <>
            <CalcResult label="BPS Total" value={bpsTotal.toString()} unit="/12" status={bpsTotal >= 9 ? "danger" : bpsTotal >= 6 ? "warning" : "normal"} />
            <Interpretation status={bpsTotal >= 9 ? "danger" : bpsTotal >= 6 ? "warning" : "normal"}
              text={bpsTotal <= 4 ? `BPS ${bpsTotal} — Sem dor.` : bpsTotal <= 5 ? `BPS ${bpsTotal} — Dor ligeira. ↑ analgesia.` : bpsTotal <= 8 ? `BPS ${bpsTotal} — Dor moderada. Titular.` : `BPS ${bpsTotal} — Dor intensa. Bólus + ↑ perfusão.`} />
          </>
        )}
      </div>

      {/* CAM-ICU */}
      <div className="calc-card">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-semibold text-foreground">CAM-ICU — Algoritmo de Delirium</h3>
          <InfoTooltip interpretation="Confusion Assessment Method for ICU. Aplicar se RASS ≥ -3. Positivo = Delirium." />
        </div>

        {/* Pré-requisito */}
        <div className="bg-muted/30 rounded-lg p-2.5 border border-border mb-3">
          <p className="text-[10px] font-semibold text-foreground">Pré-requisito: RASS ≥ −3</p>
          <p className="text-[9px] text-muted-foreground">Se RASS −4 ou −5 → STOP. Reavaliar mais tarde. Doente não avaliável.</p>
          {rass !== null && rass < -3 && (
            <p className="text-[10px] text-destructive font-semibold mt-1">⚠️ RASS actual: {rass} — Não aplicável. Aguardar RASS ≥ −3.</p>
          )}
        </div>

        {/* Algoritmo step-by-step */}
        <div className="space-y-2 mb-3">
          {/* Feature 1 */}
          <div className="rounded-lg border border-border bg-muted/20 p-2.5">
            <p className="text-[10px] font-semibold text-primary mb-1">① Início Agudo ou Flutuação</p>
            <p className="text-[9px] text-muted-foreground mb-2">Estado mental diferente do basal? OU flutuação nas últimas 24h (GCS, RASS)?</p>
            <div className="flex gap-1.5">
              <button onClick={() => setCamF1(true)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${camF1 === true ? "bg-warning/15 text-warning border border-warning/25" : "bg-muted text-muted-foreground border border-border"}`}>Sim</button>
              <button onClick={() => setCamF1(false)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${camF1 === false ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted text-muted-foreground border border-border"}`}>Não</button>
            </div>
            {camF1 === false && <p className="text-[9px] text-primary font-semibold mt-1.5">→ STOP — CAM-ICU Negativo (sem delirium)</p>}
          </div>

          {/* Feature 2 — only if F1 positive */}
          {camF1 === true && (
            <div className="rounded-lg border border-border bg-muted/20 p-2.5">
              <p className="text-[10px] font-semibold text-primary mb-1">② Desatenção (ASE — Attention Screening Examination)</p>
              <div className="bg-muted/40 rounded p-2 border border-border mb-2">
                <p className="text-[9px] font-semibold text-foreground mb-1">Teste Auditivo (preferido):</p>
                <p className="text-[9px] text-muted-foreground">Ler ao doente: <span className="font-mono font-semibold">S A V E A H A A R T</span></p>
                <p className="text-[9px] text-muted-foreground">Instrução: "Aperte a minha mão quando ouvir a letra <strong>A</strong>"</p>
                <p className="text-[9px] text-muted-foreground mt-1">Erros = não apertar no A OU apertar noutra letra</p>
                <p className="text-[9px] font-semibold text-foreground mt-1.5">Teste Visual (alternativa):</p>
                <p className="text-[9px] text-muted-foreground">Mostrar 5 imagens → mostrar 10 imagens (5 novas + 5 repetidas) → "Já viu esta imagem antes?"</p>
              </div>
              <p className="text-[9px] text-muted-foreground mb-2">≥ 3 erros em 10 = <strong>Desatenção presente</strong></p>
              <div className="flex gap-1.5">
                <button onClick={() => setCamF2(true)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${camF2 === true ? "bg-warning/15 text-warning border border-warning/25" : "bg-muted text-muted-foreground border border-border"}`}>≥ 3 erros (Sim)</button>
                <button onClick={() => setCamF2(false)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${camF2 === false ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted text-muted-foreground border border-border"}`}>{"< 3 erros (Não)"}</button>
              </div>
              {camF2 === false && <p className="text-[9px] text-primary font-semibold mt-1.5">→ STOP — CAM-ICU Negativo (sem delirium)</p>}
            </div>
          )}

          {/* Feature 3 — only if F1 and F2 positive */}
          {camF1 === true && camF2 === true && (
            <div className="rounded-lg border border-border bg-muted/20 p-2.5">
              <p className="text-[10px] font-semibold text-primary mb-1">③ Pensamento Desorganizado</p>
              <div className="bg-muted/40 rounded p-2 border border-border mb-2">
                <p className="text-[9px] font-semibold text-foreground mb-1">Perguntas (2 sets alternados):</p>
                <p className="text-[9px] text-muted-foreground"><strong>Set A:</strong> 1) Uma pedra flutua na água? 2) Existem peixes no mar? 3) 1 kg pesa mais que 2 kg? 4) Pode-se usar um martelo para bater num prego?</p>
                <p className="text-[9px] text-muted-foreground mt-1"><strong>Set B:</strong> 1) Uma folha flutua na água? 2) Existem elefantes no mar? 3) 2 kg pesam mais que 1 kg? 4) Pode-se usar um martelo para cortar madeira?</p>
                <p className="text-[9px] text-muted-foreground mt-1"><strong>Comando:</strong> "Levante esta quantidade de dedos" (mostrar 2) → "Agora faça o mesmo com a outra mão" (sem demonstrar)</p>
              </div>
              <p className="text-[9px] text-muted-foreground mb-2">≥ 2 erros em 5 = <strong>Pensamento desorganizado</strong></p>
              <div className="flex gap-1.5">
                <button onClick={() => setCamF3(true)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${camF3 === true ? "bg-warning/15 text-warning border border-warning/25" : "bg-muted text-muted-foreground border border-border"}`}>≥ 2 erros (Sim)</button>
                <button onClick={() => setCamF3(false)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${camF3 === false ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted text-muted-foreground border border-border"}`}>{"< 2 erros (Não)"}</button>
              </div>
            </div>
          )}

          {/* Feature 4 — only if F1 and F2 positive */}
          {camF1 === true && camF2 === true && (
            <div className="rounded-lg border border-border bg-muted/20 p-2.5">
              <p className="text-[10px] font-semibold text-primary mb-1">④ Alteração do Nível de Consciência</p>
              <p className="text-[9px] text-muted-foreground mb-2">RASS actual ≠ 0 ?</p>
              <div className="flex gap-1.5">
                <button onClick={() => setCamF4(true)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${camF4 === true ? "bg-warning/15 text-warning border border-warning/25" : "bg-muted text-muted-foreground border border-border"}`}>RASS ≠ 0 (Sim)</button>
                <button onClick={() => setCamF4(false)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${camF4 === false ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted text-muted-foreground border border-border"}`}>RASS = 0 (Não)</button>
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        {camResult !== null && (
          <>
            <div className="flex gap-2 mb-2">
              <div className={`flex-1 py-2 rounded-lg text-xs font-semibold text-center ${camResult === "positive" ? "bg-destructive/15 text-destructive border border-destructive/25" : "bg-muted/30 text-muted-foreground border border-border"}`}>
                ✗ Positivo (Delirium)
              </div>
              <div className={`flex-1 py-2 rounded-lg text-xs font-semibold text-center ${camResult === "negative" ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted/30 text-muted-foreground border border-border"}`}>
                ✓ Negativo
              </div>
            </div>
            {camResult === "positive" && (
              <AlertBanner text="Delirium presente. Investigar causas reversíveis (THINK: Tóxicos, Hipóxia, Infeção, Não-farmacológicas, K⁺ e eletrólitos). Dexmedetomidina. Evitar benzodiazepinas. Mobilização precoce. Ciclo sono-vigília." level="danger" />
            )}
            {camResult === "negative" && (
              <Interpretation status="normal" text="CAM-ICU negativo — Sem delirium. Reavaliar 1×/turno." />
            )}
          </>
        )}

        {/* Quick override */}
        {camResult === null && camF1 === null && (
          <div className="border-t border-border pt-2 mt-1">
            <p className="text-[9px] text-muted-foreground mb-1.5">Ou registo rápido (sem algoritmo):</p>
            <div className="flex gap-2">
              <button onClick={() => { setCamF1(true); setCamF2(true); setCamF3(true); setCamF4(false); }}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-muted text-muted-foreground border border-border hover:border-destructive/30 transition-all">✗ Positivo</button>
              <button onClick={() => { setCamF1(false); setCamF2(null); setCamF3(null); setCamF4(null); }}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-muted text-muted-foreground border border-border hover:border-primary/30 transition-all">✓ Negativo</button>
            </div>
          </div>
        )}
      </div>

      <SectionDivider title="Neuromonitorização" />

      {/* Neuromonitoring */}
      <div className="calc-card">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-semibold text-foreground">Neuromonitorização</h3>
          <InfoTooltip interpretation="PIC: Pressão Intracraniana. PPC: Pressão de Perfusão Cerebral. BIS: Bispectral Index. NIRS: Oximetria cerebral." />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="calc-label">PAM</p>
            <div className="calc-input py-1.5 text-[11px] font-mono flex items-center justify-between">
              <span>{pamVal > 0 ? `${pamVal.toFixed(0)} mmHg` : "—"}</span>
              {!pamVal && <span className="text-[8px] text-muted-foreground">Preencher no Cardio</span>}
            </div>
            <p className="text-[8px] text-muted-foreground mt-0.5">Integrado do separador Cardio</p>
          </div>
          <div>
            <CalcField label="PIC" value={pic} onChange={(e) => setPic(e.target.value)} unit="mmHg" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Normal: &lt; 20. Alvo: &lt; 22 (BTF 2016)</p>
          </div>
        </div>

        {pic && parseFloat(pic) >= 20 && (
          <AlertBanner text={`PIC ${pic} mmHg — HIC. Cabeceira 30°, sedação, manitol/NaCl hipertónico.`} level="danger" />
        )}

        {ppc !== null && (
          <>
            <CalcResult label="PPC" value={ppc.toFixed(0)} unit="mmHg" status={ppc < 60 ? "danger" : ppc > 70 ? "normal" : "warning"} />
            <InfoTooltip formula="PAM − PIC" reference="Alvo: 60–70 mmHg" interpretation="< 60 = isquemia. > 70 = alvo TCE grave." />
            <Interpretation status={ppc < 60 ? "danger" : ppc > 70 ? "normal" : "warning"}
              text={ppc < 60 ? `PPC ${ppc.toFixed(0)} — Isquemia. ↑ PAM e/ou ↓ PIC.` : ppc <= 70 ? `PPC ${ppc.toFixed(0)} — Limítrofe.` : `PPC ${ppc.toFixed(0)} — Adequada.`} />
          </>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div>
            <CalcField label="BIS" value={bis} onChange={(e) => setBis(e.target.value)} unit="" />
            <p className="text-[8px] text-muted-foreground mt-0.5">40-60: sedação adequada</p>
          </div>
          <div>
            <CalcField label="NIRS Esq." value={nirsL} onChange={(e) => setNirsL(e.target.value)} unit="%" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Normal: 60-80%</p>
          </div>
          <div>
            <CalcField label="NIRS Dir." value={nirsR} onChange={(e) => setNirsR(e.target.value)} unit="%" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Normal: 60-80%</p>
          </div>
        </div>

        {bis && parseFloat(bis) > 0 && (
          <Interpretation status={parseFloat(bis) < 40 ? "warning" : parseFloat(bis) > 60 ? "warning" : "normal"}
            text={parseFloat(bis) < 40 ? `BIS ${bis} — Sedação excessiva. ↓ sedação.` : parseFloat(bis) <= 60 ? `BIS ${bis} — Adequado (40–60).` : parseFloat(bis) <= 80 ? `BIS ${bis} — Sedação ligeira.` : `BIS ${bis} — Desperto.`} />
        )}

        {(nirsL || nirsR) && (
          <Interpretation
            status={(parseFloat(nirsL) < 50 || parseFloat(nirsR) < 50) ? "danger" : (parseFloat(nirsL) < 60 || parseFloat(nirsR) < 60) ? "warning" : "normal"}
            text={(() => {
              const l = parseFloat(nirsL); const r = parseFloat(nirsR);
              const low = Math.min(l || 100, r || 100);
              const diff = Math.abs((l || 0) - (r || 0));
              if (low < 50) return `NIRS ${low}% — Dessaturação crítica. PAM, Hb, SaO₂, PaCO₂.`;
              if (low < 60) return `NIRS ${low}% — Dessaturação. Otimizar perfusão.`;
              if (diff > 10) return `NIRS assimétrico (Δ${diff}%) — Investigar causa unilateral.`;
              return `NIRS normal (60-80%).`;
            })()}
          />
        )}
      </div>

      {/* Lindegaard Index */}
      <div className="calc-card">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-semibold text-foreground">Índice de Lindegaard — Vasoespasmo</h3>
          <InfoTooltip
            formula="Velocidade MCA / Velocidade ICA extracraniana"
            reference="< 3: Sem vasoespasmo | 3–6: Ligeiro a moderado | > 6: Grave"
            interpretation="Doppler Transcraniano. Velocidade média da ACM (MCA) dividida pela velocidade da ACI (ICA) extracraniana. Distingue hiperemia (ratio baixo, velocidades altas) de vasoespasmo verdadeiro (ratio > 3). Monitorizar diariamente em HSA dias 3–14."
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <CalcField label="Vel. MCA (ACM)" value={mcaVelocity} onChange={(e) => setMcaVelocity(e.target.value)} unit="cm/s" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Velocidade média da Artéria Cerebral Média (DTC)</p>
          </div>
          <div>
            <CalcField label="Vel. ICA (ACI)" value={icaVelocity} onChange={(e) => setIcaVelocity(e.target.value)} unit="cm/s" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Velocidade da Artéria Carótida Interna extracraniana</p>
          </div>
        </div>

        {lindegaard !== null && (
          <>
            <CalcResult label="Índice de Lindegaard" value={lindegaard.toFixed(1)} unit=""
              status={lindegaard > 6 ? "danger" : lindegaard >= 3 ? "warning" : "normal"} />
            <Interpretation
              status={lindegaard > 6 ? "danger" : lindegaard >= 3 ? "warning" : "normal"}
              text={lindegaard < 3 ? `Lindegaard ${lindegaard.toFixed(1)} — Sem vasoespasmo. ${parseFloat(mcaVelocity) > 120 ? "Velocidades elevadas, mas ratio normal → provável hiperemia." : "Velocidades normais."}`
                : lindegaard <= 6 ? `Lindegaard ${lindegaard.toFixed(1)} — Vasoespasmo ligeiro a moderado. Nimodipina 60mg PO 4/4h. Manter euvolemia. PPC > 70. Repetir DTC 12-24h.`
                : `Lindegaard ${lindegaard.toFixed(1)} — Vasoespasmo grave. Nimodipina. Considerar terapia de resgate (induzir HTA, angioplastia). Repetir DTC 6-12h.`}
            />
          </>
        )}

        {mcaVelocity && parseFloat(mcaVelocity) > 200 && (
          <AlertBanner text={`Velocidade MCA ${mcaVelocity} cm/s — Velocidade crítica. Avaliação urgente.`} level="danger" />
        )}
      </div>

      {/* MRC */}
      <div className="calc-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground">MRC — Escala de Força</h3>
            <InfoTooltip reference="0–60" interpretation="< 48: ICU-AW. Aplicar quando cooperante (RASS ≥ -1). 6 grupos bilaterais × 0–5." />
          </div>
          <button onClick={() => setShowMRC(!showMRC)}
            className="px-2 py-1 rounded-md text-[10px] font-medium bg-muted text-muted-foreground border border-border hover:bg-primary/10 transition-all">
            {showMRC ? "Ocultar" : "Avaliar"}
          </button>
        </div>
        {showMRC && (
          <div className="space-y-2">
            {MRC_GROUPS.map((group, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-foreground min-w-0 flex-1">{group.name} ({group.side})</span>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => { const next = [...mrcScores]; next[idx] = s; setMrcScores(next); }}
                      className={`w-7 h-7 rounded text-[10px] font-mono font-semibold transition-all ${
                        mrcScores[idx] === s
                          ? s <= 2 ? "bg-destructive/20 text-destructive border border-destructive/30"
                            : s <= 3 ? "bg-warning/20 text-warning border border-warning/30"
                            : "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="bg-muted/30 rounded-lg p-2 border border-border mt-2">
              <p className="text-[9px] text-muted-foreground"><strong>Graus:</strong> 0 = sem contração · 1 = contração visível · 2 = mov. sem gravidade · 3 = contra gravidade · 4 = contra resistência · 5 = normal</p>
            </div>
          </div>
        )}
        {mrcTotal !== null ? (
          <>
            <CalcResult label="MRC Sum Score" value={mrcTotal.toString()} unit="/60" status={mrcTotal < 36 ? "danger" : mrcTotal < 48 ? "warning" : "normal"} />
            <Interpretation status={mrcTotal < 36 ? "danger" : mrcTotal < 48 ? "warning" : "normal"}
              text={mrcTotal >= 48 ? `MRC ${mrcTotal} — Força preservada.` : mrcTotal >= 36 ? `MRC ${mrcTotal} — ICU-AW. Mobilização + fisioterapia. Investigar BNM, corticóides.` : `MRC ${mrcTotal} — Fraqueza grave. CIP/CIM provável. EMG.`} />
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">Avalie todos os 12 grupos para obter o score.</p>
        )}
      </div>

      <SectionDivider title="Terapêutica" />

      {/* Drug Interactions */}
      <DrugInteractions />

      {/* IOT */}
      <div className="calc-card">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-semibold text-foreground">IOT — Indução de Sequência Rápida</h3>
          <InfoTooltip interpretation="Doses pelo peso atual. Pré-oxigenar 3-5 min. Posição rampa." />
        </div>
        {!peso && <AlertBanner text="Preencha o peso na aba Geral" />}
        {peso > 0 && (
          <div className="space-y-1.5">
            {IOT_DRUGS.map((drug) => (
              <div key={drug.name} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div>
                  <span className="text-[11px] font-semibold text-foreground">{drug.name}</span>
                  <span className="text-[9px] text-muted-foreground ml-2">{drug.notes}</span>
                </div>
                <span className="text-[11px] font-mono text-primary whitespace-nowrap ml-2">
                  {(drug.min * peso).toFixed(0)}–{(drug.max * peso).toFixed(0)} {drug.unit.replace("/kg", "")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sedation Infusions — All drugs dashboard */}
      <div className="calc-card">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-semibold text-foreground">Perfusões — Sedoanalgesia</h3>
          <InfoTooltip interpretation="Vista global de todas as perfusões. Insira mL/h para ver a dose calculada, ou expanda para converter dose → mL/h." />
        </div>
        {!pesoRef && <AlertBanner text="Preencha o peso na aba Geral" />}

        {pesoRef > 0 && (
          <div className="space-y-1.5">
            {activeSedationInfusions.map((inf, idx) => {
              const conc = inf.concentrations[0];
              const rateVal = sedationRates[idx] || "";
              const rateNum = parseFloat(rateVal);
              const isMcg = inf.doseUnit.includes("mcg");
              const isPerMin = inf.doseUnit.includes("/min");
              const isPerKg = inf.doseUnit.includes("/kg");
              const factor = isMcg ? 1000 : 1;

              let dose: number | null = null;
              if (rateNum > 0) {
                const mgPerHour = rateNum * conc.mgPerMl;
                const w = isPerKg ? pesoRef : 1;
                if (isPerMin) {
                  dose = (mgPerHour * factor) / (w * 60);
                } else {
                  dose = (mgPerHour * factor) / w;
                }
              }

              const isExpanded = expandedInfusion === idx;
              const hasValue = rateNum > 0;

              return (
                <div key={inf.name} className={`rounded-lg border px-3 py-2 transition-all ${hasValue ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpandedInfusion(isExpanded ? null : idx)} className="text-[11px] font-semibold text-foreground hover:text-primary transition-colors flex-shrink-0">
                      {inf.name}
                    </button>
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="number"
                        value={rateVal}
                        onChange={(e) => {
                          const next = [...sedationRates];
                          next[idx] = e.target.value;
                          setSedationRates(next);
                          if (inf.name === "Propofol") setPropofolRateMlH(e.target.value);
                        }}
                        placeholder="0"
                        className="calc-input py-1 text-[11px] w-20"
                      />
                      <span className="text-[9px] text-muted-foreground font-mono">mL/h</span>
                    </div>
                    {dose !== null && (
                      <span className="text-[11px] font-mono text-primary font-semibold whitespace-nowrap">
                        {dose < 0.01 ? dose.toFixed(4) : dose < 1 ? dose.toFixed(3) : dose.toFixed(1)} {inf.doseUnit}
                      </span>
                    )}
                  </div>
                  <p className="text-[8px] text-muted-foreground mt-0.5 font-mono">
                    Faixa: {inf.doseRange} {inf.doseUnit} · {conc.label}
                  </p>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-border space-y-2">
                      <UniversalInfusionConverter drugName={inf.name} concentrations={inf.concentrations} doseUnit={inf.doseUnit} doseRange={inf.doseRange}
                        onRateChange={inf.name === "Propofol" ? (mlH) => { setPropofolRateMlH(mlH.toFixed(1)); const next = [...sedationRates]; next[idx] = mlH.toFixed(1); setSedationRates(next); } : (mlH) => { const next = [...sedationRates]; next[idx] = mlH.toFixed(1); setSedationRates(next); }} />
                      <div className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                        <p className="text-[9px] text-primary font-semibold mb-0.5">Orientação</p>
                        <p className="text-[9px] text-foreground font-mono">{inf.rassGuide}</p>
                      </div>
                      <p className="text-[8px] text-muted-foreground">{inf.notes}</p>
                    </div>
                  )}

                  {inf.name === "Propofol" && hasValue && (
                    <p className="text-[9px] text-warning font-mono mt-1">⚡ {(rateNum * 1.1 * 24).toFixed(0)} kcal/dia</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Anticonvulsants */}
      <div className="calc-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Anticonvulsivantes</h3>
        {alb < 4.0 && <AlertBanner text={`Albúmina ${alb.toFixed(1)} g/dL — Correção da Fenitoína ativada.`} level="warning" />}
        <div className="space-y-1.5">
          {ANTICONVULSANTS.map((drug) => (
            <div key={drug.name} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="text-[11px] font-semibold text-foreground">{drug.name}</span>
              <div className="flex gap-4 mt-1 text-[10px] font-mono">
                <span><span className="text-muted-foreground">Loading:</span> <span className="text-primary">{drug.loadingDose}</span></span>
                <span><span className="text-muted-foreground">Manutenção:</span> <span className="text-primary">{drug.maintenanceDose}</span></span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">Nível: {drug.levels} | {drug.notes}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] font-semibold text-foreground">Fenitoína Corrigida</span>
            <InfoTooltip formula="Medida / ((0.2 × Alb) + 0.1)" reference="10–20 mg/L" />
          </div>
          <CalcField label="Fenitoína medida" value={phenytoinMeasured} onChange={(e) => setPhenytoinMeasured(e.target.value)} unit="mg/L" />
          {phenytoinCorrected !== null && (
            <>
              <CalcResult label="Corrigida" value={phenytoinCorrected.toFixed(1)} unit="mg/L"
                status={phenytoinCorrected < 10 ? "warning" : phenytoinCorrected > 20 ? "danger" : "normal"} />
              <Interpretation status={phenytoinCorrected < 10 ? "warning" : phenytoinCorrected > 20 ? "danger" : "normal"}
                text={phenytoinCorrected < 10 ? `${phenytoinCorrected.toFixed(1)} — Subterapêutico.` : phenytoinCorrected > 20 ? `${phenytoinCorrected.toFixed(1)} — Tóxico. Nistagmo, ataxia.` : `${phenytoinCorrected.toFixed(1)} — Terapêutico.`} />
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default NeurologicoTab;
