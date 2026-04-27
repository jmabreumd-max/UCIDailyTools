import { useState, useMemo, useEffect } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { usePatient } from "@/contexts/PatientContext";
import CalcField from "../CalcField";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import InfoTooltip from "../InfoTooltip";
import AlertBanner from "../AlertBanner";
import UniversalInfusionConverter from "../UniversalInfusionConverter";
import CollapsibleSection from "../CollapsibleSection";
import ExamChecklist from "../ExamChecklist";
import SectionDivider from "../SectionDivider";
import DrugInteractions from "../DrugInteractions";

const CV_EXAM: { category: string; items: string[] }[] = [
  { category: "Inspeção", items: ["Palidez", "Cianose periférica", "Livedo reticularis", "Mottling", "Edema periférico", "Ingurgitamento jugular", "Refluxo hepatojugular"] },
  { category: "Palpação", items: ["Pulsos periféricos presentes", "Pulsos fracos/filiformes", "Pulsos assimétricos", "Extremidades frias", "TRC > 3s", "TRC normal", "Hepatomegalia"] },
  { category: "Auscultação Cardíaca", items: ["S1/S2 normais", "S3 (galope)", "S4", "Sopro sistólico", "Sopro diastólico", "Atrito pericárdico", "Abafamento de sons"] },
  { category: "Ritmo", items: ["Ritmo regular", "Arritmia", "Fibrilhação auricular", "Taquicardia", "Bradicardia", "Extra-sístoles"] },
  { category: "Sinais de Choque", items: ["Hipotensão", "Taquicardia", "Oligúria", "Alteração consciência", "Lactato elevado", "Pele marmórea", "Extremidades frias"] },
  { category: "Acessos Vasculares", items: ["CVC jugular", "CVC subclávia", "CVC femoral", "Linha arterial radial", "Linha arterial femoral", "PICC", "Sinais de infeção do cateter"] },
];

const SCAI_STAGES = [
  { stage: "A", label: "At Risk", desc: "Sem sinais. Fatores de risco." },
  { stage: "B", label: "Beginning", desc: "Hipotensão OU taquicardia. Sem hipoperfusão." },
  { stage: "C", label: "Classic", desc: "Hipoperfusão. Necessita intervenção." },
  { stage: "D", label: "Deteriorating", desc: "Escalada de suporte. Falha terapêutica." },
  { stage: "E", label: "Extremis", desc: "Refratário. PCR iminente. MCS/ECMO." },
];

const HEMORRHAGIC_CLASSES = [
  { cl: "I", loss: "< 750 mL (< 15%)", fc: "< 100", pa: "Normal", fr: "14–20", du: "> 30 mL/h", gcs: "14–15", desc: "Cristalóide." },
  { cl: "II", loss: "750–1500 mL (15–30%)", fc: "100–120", pa: "Normal", fr: "20–30", du: "20–30 mL/h", gcs: "13–14", desc: "Cristalóide ± CE." },
  { cl: "III", loss: "1500–2000 mL (30–40%)", fc: "120–140", pa: "↓↓", fr: "30–40", du: "5–15 mL/h", gcs: "8–12", desc: "Cristalóide + CE + PFC + Plaq." },
  { cl: "IV", loss: "> 2000 mL (> 40%)", fc: "> 140", pa: "↓↓↓", fr: "> 40", du: "Anúria", gcs: "< 8", desc: "Protocolo de transfusão maciça." },
];

const VASOACTIVE_DRUGS = [
  { name: "Noradrenalina", concentrations: [{ label: "10 mg / 50 mL (0.2 mg/mL)", mgPerMl: 0.2 }], doseUnit: "mcg/kg/min", doseRange: "0.05–1.0", needsWeight: true, desc: "Vasopressor α1 1ª linha no choque séptico." },
  { name: "Vasopressina", concentrations: [{ label: "20 U / 100 mL (0.2 U/mL)", mgPerMl: 0.2 }], doseUnit: "U/h", doseRange: "0.5–2.4", needsWeight: false, desc: "Adjuvante à NA. Dose fixa." },
  { name: "Dobutamina", concentrations: [{ label: "250 mg / 250 mL (1 mg/mL)", mgPerMl: 1 }], doseUnit: "mcg/kg/min", doseRange: "2.5–20", needsWeight: true, desc: "Inotrópico β1. ↑ DC." },
  { name: "Adrenalina", concentrations: [{ label: "4 mg / 250 mL", mgPerMl: 4 / 254 }, { label: "8 mg / 250 mL", mgPerMl: 8 / 254 }], doseUnit: "mcg/kg/min", doseRange: "0.01–0.5", needsWeight: true, desc: "α + β1 + β2. Inotrópico potente." },
  { name: "Milrinona", concentrations: [{ label: "20 mg / 200 mL (0.1 mg/mL)", mgPerMl: 0.1 }], doseUnit: "mcg/kg/min", doseRange: "0.125–0.75", needsWeight: true, desc: "Inibidor PDE-3. Inodilatador." },
  { name: "Labetalol", concentrations: [{ label: "200 mg / 200 mL (1 mg/mL)", mgPerMl: 1 }], doseUnit: "mg/h", doseRange: "0.5–2", needsWeight: false, desc: "α1 + β bloqueador. Emergência hipertensiva." },
];

const RESP_DIAGNOSES = [
  { label: "Pneumonia viral", score: 3 },
  { label: "Pneumonia bacteriana", score: 3 },
  { label: "Asma", score: 11 },
  { label: "Trauma / Queimadura", score: 3 },
  { label: "Aspiração", score: 5 },
  { label: "Outro IRA aguda", score: 1 },
  { label: "SDRA não-pulmonar", score: 0 },
  { label: "Falência respiratória crónica", score: -3 },
];

const CardiovascularTab = () => {
  const { pesoAtual, altura, pesoReferencia, idade, sexo, clCr, onRRT, setPamCardio, lactato, setLactato, imc, ecmoType, setEcmoType, ecmoParams, setEcmoParams } = usePatient();
  const peso = parseFloat(pesoAtual) || 0;
  const alt = parseFloat(altura) || 0;
  const idadeVal = parseFloat(idade) || 0;
  const sc = useMemo(() => peso && alt ? Math.sqrt((peso * alt) / 3600) : null, [peso, alt]);

  const [fc, setFc] = usePersistedState("cardio-fc", "");
  const [pas, setPas] = usePersistedState("cardio-pas", "");
  const [pad, setPad] = usePersistedState("cardio-pad", "");
  const [shockType, setShockType] = usePersistedState("cardio-shockType", "");
  const [scaiStage, setScaiStage] = usePersistedState("cardio-scaiStage", "");
  const [hemClass, setHemClass] = usePersistedState("cardio-hemClass", "");

  // Echo LV
  const [lvotD, setLvotD] = usePersistedState("cardio-lvotD", "");
  const [lvotVTI, setLvotVTI] = usePersistedState("cardio-lvotVTI", "");
  const [lvef, setLvef] = usePersistedState("cardio-lvef", "");
  const [eWave, setEWave] = usePersistedState("cardio-eWave", "");
  const [aWave, setAWave] = usePersistedState("cardio-aWave", "");
  const [ePrime, setEPrime] = usePersistedState("cardio-ePrime", "");
  const [trVmax, setTrVmax] = usePersistedState("cardio-trVmax", "");

  // RV
  const [tapse, setTapse] = usePersistedState("cardio-tapse", "");
  const [sTric, setSTric] = usePersistedState("cardio-sTric", "");
  const [areaD, setAreaD] = usePersistedState("cardio-areaD", "");
  const [areaS, setAreaS] = usePersistedState("cardio-areaS", "");

  // CHA2DS2-VASc
  const [chf, setChf] = usePersistedState("cardio-chf", false);
  const [hta, setHta] = usePersistedState("cardio-hta", false);
  const [diabetes, setDiabetes] = usePersistedState("cardio-diabetes", false);
  const [strokeTIA, setStrokeTIA] = usePersistedState("cardio-strokeTIA", false);
  const [vascularDisease, setVascularDisease] = usePersistedState("cardio-vascDisease", false);

  // HAS-BLED
  const [htaUncontrolled, setHtaUncontrolled] = usePersistedState("cardio-htaUnc", false);
  const [liverAbnormal, setLiverAbnormal] = usePersistedState("cardio-liverAbn", false);
  const [bleedingHistory, setBleedingHistory] = usePersistedState("cardio-bleedHist", false);
  const [labileINR, setLabileINR] = usePersistedState("cardio-labileINR", false);
  const [drugs, setDrugs] = usePersistedState("cardio-drugs", false);
  const [alcohol, setAlcohol] = usePersistedState("cardio-alcohol", false);

  const [vasoRates, setVasoRates] = usePersistedState<string[]>("cardio-vasoRates", new Array(VASOACTIVE_DRUGS.length).fill(""));
  const [expandedVaso, setExpandedVaso] = useState<number | null>(null);
  const lac = parseFloat(lactato) || 0;

  const pam = useMemo(() => {
    const s = parseFloat(pas); const d = parseFloat(pad);
    return s && d ? (s + 2 * d) / 3 : null;
  }, [pas, pad]);

  // Sync PAM to context
  useEffect(() => {
    setPamCardio(pam !== null ? pam.toFixed(0) : "");
  }, [pam, setPamCardio]);

  const coEcho = useMemo(() => {
    const d = parseFloat(lvotD); const vti = parseFloat(lvotVTI); const f = parseFloat(fc);
    if (!d || !vti || !f) return null;
    const area = Math.PI * Math.pow(d / 2, 2);
    const sv = area * vti;
    return { co: (sv * f) / 1000, sv };
  }, [lvotD, lvotVTI, fc]);

  const ic = useMemo(() => coEcho?.co && sc ? coEcho.co / sc : null, [coEcho, sc]);

  const fac = useMemo(() => {
    const ad = parseFloat(areaD); const as2 = parseFloat(areaS);
    return ad && as2 ? ((ad - as2) / ad) * 100 : null;
  }, [areaD, areaS]);

  const eaRatio = useMemo(() => {
    const e = parseFloat(eWave); const a = parseFloat(aWave);
    return e && a ? e / a : null;
  }, [eWave, aWave]);

  const eePrimeRatio = useMemo(() => {
    const e = parseFloat(eWave); const ep = parseFloat(ePrime);
    return e && ep ? e / ep : null;
  }, [eWave, ePrime]);

  // CHA₂DS₂-VASc
  const chaScore = useMemo(() => {
    let s = 0;
    if (chf) s += 1;
    if (hta) s += 1;
    if (idadeVal >= 75) s += 2;
    else if (idadeVal >= 65) s += 1;
    if (diabetes) s += 1;
    if (strokeTIA) s += 2;
    if (vascularDisease) s += 1;
    if (sexo === "F") s += 1;
    return s;
  }, [chf, hta, idadeVal, diabetes, strokeTIA, vascularDisease, sexo]);

  // HAS-BLED
  const hasbledScore = useMemo(() => {
    let s = 0;
    if (htaUncontrolled) s += 1;
    const renalAbnormal = onRRT || (clCr !== null && clCr < 30);
    if (renalAbnormal) s += 1;
    if (liverAbnormal) s += 1;
    if (strokeTIA) s += 1;
    if (bleedingHistory) s += 1;
    if (labileINR) s += 1;
    if (idadeVal > 65) s += 1;
    if (drugs) s += 1;
    if (alcohol) s += 1;
    return s;
  }, [htaUncontrolled, onRRT, clCr, liverAbnormal, strokeTIA, bleedingHistory, labileINR, idadeVal, drugs, alcohol]);

  return (
    <div className="space-y-4">
      <SectionDivider title="Exame Físico" />
      <ExamChecklist storageKey="cardio" title="Exame Cardiovascular" categories={CV_EXAM} />

      <SectionDivider title="Hemodinâmica" />

      {/* Lactato */}
      <CollapsibleSection title="Lactato"
        info={<InfoTooltip reference="Normal: < 2 mmol/L" interpretation="Marcador de hipoperfusão. > 2: sépsis. > 4: choque." />}>
        <CalcField label="Lactato" value={lactato} onChange={setLactato} unit="mmol/L" />
        {lac > 0 && (
          <Interpretation status={lac > 4 ? "danger" : lac > 2 ? "warning" : "normal"}
            text={lac > 4 ? `Lactato ${lac.toFixed(1)} — Hiperlactatemia grave. Avaliar perfusão.`
              : lac > 2 ? `Lactato ${lac.toFixed(1)} — Elevado. Monitorizar tendência.`
              : `Lactato ${lac.toFixed(1)} — Normal.`} />
        )}
      </CollapsibleSection>

      {/* Hemodynamics */}
      <CollapsibleSection title="Hemodinâmica" badge={pam !== null ? `PAM ${pam.toFixed(0)}` : undefined}
        info={<InfoTooltip formula="PAM = (PAS + 2×PAD) / 3" reference="Alvo ≥ 65 mmHg" />}>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <CalcField label="FC" value={fc} onChange={setFc} unit="bpm" />
          <CalcField label="PAS" value={pas} onChange={setPas} unit="mmHg" />
          <CalcField label="PAD" value={pad} onChange={setPad} unit="mmHg" />
        </div>
        {pam !== null && (
          <>
            <CalcResult label="PAM" value={pam.toFixed(0)} unit="mmHg" status={pam < 65 ? "danger" : pam > 100 ? "warning" : "normal"} />
            {pam < 65 && <AlertBanner text="PAM < 65 — Hipoperfusão." level="danger" />}
          </>
        )}
      </CollapsibleSection>

      {/* Shock */}
      <CollapsibleSection title="Tipo de Choque"
        info={<InfoTooltip interpretation="Classificação do tipo de choque e escala de gravidade associada." />}>
        <select value={shockType} onChange={(e) => setShockType(e.target.value)} className="calc-input py-1.5 text-[11px] mb-3">
          <option value="">Selecionar...</option>
          <option value="septico">Séptico (Distributivo)</option>
          <option value="cardiogenico">Cardiogénico</option>
          <option value="hipovolemico">Hipovolémico / Hemorrágico</option>
          <option value="obstrutivo">Obstrutivo</option>
        </select>

        {shockType === "septico" && (
          <div className="space-y-2">
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
              <p className="text-[10px] font-semibold text-foreground mb-1">Choque Séptico (Sepsis-3)</p>
              <p className="text-[9px] text-muted-foreground">PAM ≥ 65 com vasopressor + Lactato &gt; 2 apesar de ressuscitação.</p>
            </div>
            <Interpretation status="normal" text="1ª linha: Noradrenalina. Se IC ↓: + Dobutamina." />
          </div>
        )}

        {shockType === "cardiogenico" && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1">Classificação SCAI</p>
            {SCAI_STAGES.map((s) => (
              <button key={s.stage} onClick={() => setScaiStage(s.stage)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-[11px] transition-all ${
                  scaiStage === s.stage ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted/30 text-muted-foreground border border-border"
                }`}><span className="font-semibold">{s.stage}:</span> {s.label} — {s.desc}</button>
            ))}
          </div>
        )}

        {shockType === "hipovolemico" && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1">Classes Hemorrágicas (ATLS)</p>
            {HEMORRHAGIC_CLASSES.map((c) => (
              <button key={c.cl} onClick={() => setHemClass(c.cl)}
                className={`w-full text-left px-3 py-2 rounded-md text-[10px] transition-all ${
                  hemClass === c.cl ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted/30 text-muted-foreground border border-border"
                }`}>
                <div className="font-semibold">Classe {c.cl}: {c.loss}</div>
                <div className="font-mono text-[9px] mt-0.5">FC {c.fc} · PA {c.pa} · FR {c.fr}</div>
              </button>
            ))}
          </div>
        )}

        {shockType === "obstrutivo" && (
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border space-y-1">
            <p className="text-[10px] font-semibold text-foreground">Causas</p>
            <p className="text-[9px] text-muted-foreground">• TEP maciço • Tamponamento • Pneumotórax hipertensivo • Auto-PEEP</p>
          </div>
        )}
      </CollapsibleSection>
      <SectionDivider title="Ecocardiografia" />

      {/* Echo LV */}
      <CollapsibleSection title="Ecocardiografia — VE"
        info={<InfoTooltip interpretation="Função sistólica e diastólica do ventrículo esquerdo." />}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <CalcField label="LVOT Ø" value={lvotD} onChange={setLvotD} unit="cm" />
          <CalcField label="LVOT VTI" value={lvotVTI} onChange={setLvotVTI} unit="cm" />
          <CalcField label="FEVE" value={lvef} onChange={setLvef} unit="%" />
          <CalcField label="FC" value={fc} onChange={setFc} unit="bpm" />
        </div>
        {coEcho && (
          <>
            <CalcResult label="Débito Cardíaco" value={coEcho.co.toFixed(1)} unit="L/min" status={coEcho.co < 4 ? "warning" : "normal"} />
            {ic && <CalcResult label="Índice Cardíaco" value={ic.toFixed(1)} unit="L/min/m²" status={ic < 2.2 ? "danger" : "normal"} />}
          </>
        )}
        <div className="mt-3">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2">Função Diastólica</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <CalcField label="E" value={eWave} onChange={setEWave} unit="cm/s" />
            <CalcField label="A" value={aWave} onChange={setAWave} unit="cm/s" />
            <CalcField label="e'" value={ePrime} onChange={setEPrime} unit="cm/s" />
            <CalcField label="TR Vmáx" value={trVmax} onChange={setTrVmax} unit="m/s" />
          </div>
          {eaRatio && <CalcResult label="E/A" value={eaRatio.toFixed(2)} unit="" />}
          {eePrimeRatio && (
            <>
              <CalcResult label="E/e'" value={eePrimeRatio.toFixed(1)} unit="" status={eePrimeRatio > 14 ? "danger" : eePrimeRatio > 10 ? "warning" : "normal"} />
              <Interpretation status={eePrimeRatio > 14 ? "danger" : eePrimeRatio > 10 ? "warning" : "normal"}
                text={eePrimeRatio > 14 ? `E/e' ${eePrimeRatio.toFixed(1)} — ↑↑ Pressões enchimento.` : eePrimeRatio > 10 ? "Zona cinzenta." : "Normal."} />
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* Echo RV */}
      <CollapsibleSection title="Ecocardiografia — VD"
        info={<InfoTooltip interpretation="Avaliação da função sistólica do ventrículo direito." />}>
        <div className="grid grid-cols-2 gap-2">
          <CalcField label="TAPSE" value={tapse} onChange={setTapse} unit="mm" />
          <CalcField label="S' Tricúspide" value={sTric} onChange={setSTric} unit="cm/s" />
          <CalcField label="Área VD (diástole)" value={areaD} onChange={setAreaD} unit="cm²" />
          <CalcField label="Área VD (sístole)" value={areaS} onChange={setAreaS} unit="cm²" />
        </div>
        {tapse && (
          <Interpretation status={parseFloat(tapse) < 17 ? "danger" : "normal"}
            text={parseFloat(tapse) < 17 ? `TAPSE ${tapse} mm — Disfunção VD.` : `TAPSE ${tapse} mm — Normal (≥ 17).`} />
        )}
        {sTric && (
          <Interpretation status={parseFloat(sTric) < 9.5 ? "danger" : "normal"}
            text={parseFloat(sTric) < 9.5 ? `S' ${sTric} — Disfunção VD.` : `S' ${sTric} — Normal (≥ 9.5).`} />
        )}
        {fac !== null && (
          <CalcResult label="FAC" value={fac.toFixed(1)} unit="%" status={fac < 35 ? "danger" : "normal"} />
        )}
      </CollapsibleSection>
      <SectionDivider title="Scores de Risco" />

      {/* CHA₂DS₂-VASc */}
      <CollapsibleSection title="CHA₂DS₂-VASc — Risco AVC na FA" badge={`${chaScore} pts`}
        info={<InfoTooltip reference="Lip et al. Chest 2010" interpretation="≥ 2 (♂) ou ≥ 3 (♀): anticoagular." />}>
        <div className="space-y-1.5 mb-3">
          {[
            { label: "C — Insuficiência Cardíaca", val: chf, set: setChf, pts: 1 },
            { label: "H — Hipertensão", val: hta, set: setHta, pts: 1 },
            { label: "D — Diabetes", val: diabetes, set: setDiabetes, pts: 1 },
            { label: "S₂ — AVC / AIT prévio", val: strokeTIA, set: setStrokeTIA, pts: 2 },
            { label: "V — Doença vascular", val: vascularDisease, set: setVascularDisease, pts: 1 },
          ].map(item => (
            <button key={item.label} onClick={() => item.set(!item.val)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-[11px] transition-all flex justify-between ${
                item.val ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted/30 text-muted-foreground border border-border"
              }`}>
              <span>{item.label}</span>
              <span className="font-mono">+{item.pts}</span>
            </button>
          ))}
          <div className="px-3 py-1.5 rounded-md text-[11px] bg-muted/50 border border-border text-muted-foreground flex justify-between">
            <span>Idade ({idadeVal > 0 ? idadeVal : "—"} anos)</span>
            <span className="font-mono text-primary">{idadeVal >= 75 ? "+2" : idadeVal >= 65 ? "+1" : "+0"}</span>
          </div>
          <div className="px-3 py-1.5 rounded-md text-[11px] bg-muted/50 border border-border text-muted-foreground flex justify-between">
            <span>Sexo: {sexo === "F" ? "Feminino" : "Masculino"}</span>
            <span className="font-mono text-primary">{sexo === "F" ? "+1" : "+0"}</span>
          </div>
        </div>
        <CalcResult label="CHA₂DS₂-VASc" value={chaScore.toString()} unit="pontos" status={chaScore >= 2 ? "danger" : chaScore >= 1 ? "warning" : "normal"} />
        <Interpretation status={chaScore >= 2 ? "danger" : chaScore >= 1 ? "warning" : "normal"}
          text={chaScore === 0 ? "Risco baixo. Sem anticoagulação." : chaScore >= 2 ? `Score ${chaScore} — Anticoagulação recomendada.` : "Risco baixo-moderado."} />
      </CollapsibleSection>

      {/* HAS-BLED */}
      <CollapsibleSection title="HAS-BLED — Risco Hemorrágico" badge={`${hasbledScore} pts`}
        info={<InfoTooltip reference="Pisters et al. Chest 2010" interpretation="≥ 3: alto risco. Não contraindica anticoagulação mas exige vigilância." />}>
        <div className="space-y-1.5 mb-3">
          {[
            { label: "H — HTA não controlada (PAS > 160)", val: htaUncontrolled, set: setHtaUncontrolled },
            { label: "A — Função hepática anormal", val: liverAbnormal, set: setLiverAbnormal },
            { label: "S — AVC prévio", val: strokeTIA, set: setStrokeTIA },
            { label: "B — História hemorrágica", val: bleedingHistory, set: setBleedingHistory },
            { label: "L — INR lábil (TTR < 60%)", val: labileINR, set: setLabileINR },
            { label: "D — Fármacos (AAS, AINEs)", val: drugs, set: setDrugs },
            { label: "D — Álcool", val: alcohol, set: setAlcohol },
          ].map(item => (
            <button key={item.label} onClick={() => item.set(!item.val)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-[11px] transition-all flex justify-between ${
                item.val ? "bg-warning/15 text-warning border border-warning/25" : "bg-muted/30 text-muted-foreground border border-border"
              }`}>
              <span>{item.label}</span>
              <span className="font-mono">+1</span>
            </button>
          ))}
          <div className="px-3 py-1.5 rounded-md text-[11px] bg-muted/50 border border-border text-muted-foreground flex justify-between">
            <span>Função renal {clCr !== null ? `(ClCr ${clCr.toFixed(0)})` : ""}</span>
            <span className="font-mono text-primary">{onRRT || (clCr !== null && clCr < 30) ? "+1" : "+0"}</span>
          </div>
          <div className="px-3 py-1.5 rounded-md text-[11px] bg-muted/50 border border-border text-muted-foreground flex justify-between">
            <span>Idade (&gt; 65 anos)</span>
            <span className="font-mono text-primary">{idadeVal > 65 ? "+1" : "+0"}</span>
          </div>
        </div>
        <CalcResult label="HAS-BLED" value={hasbledScore.toString()} unit="pontos" status={hasbledScore >= 3 ? "danger" : "normal"} />
        <Interpretation status={hasbledScore >= 3 ? "danger" : "normal"}
          text={hasbledScore >= 3 ? `Score ${hasbledScore} — Alto risco hemorrágico. Vigilância.` : "Baixo risco hemorrágico."} />
      </CollapsibleSection>
      <SectionDivider title="Suporte Mecânico" />

      {/* ECMO */}
      <CollapsibleSection title="ECMO" badge={ecmoType || undefined}
        info={<InfoTooltip interpretation="Suporte circulatório/respiratório extracorporal. VV: falência respiratória. VA: falência cardíaca/cardiorespiratória. Parâmetros aqui alimentam os scores RESP, PRESERVE e SAVE no label Prognóstico." />}>
        <div className="flex gap-2 mb-3">
          {(["", "VV", "VA"] as const).map((type) => (
            <button key={type} onClick={() => setEcmoType(type)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                ecmoType === type ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
              }`}>{type || "Sem ECMO"}</button>
          ))}
        </div>

        {ecmoType === "VV" && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">ECMO VV — Parâmetros para RESP/PRESERVE</p>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold mb-1">Diagnóstico</p>
              <div className="space-y-1">
                {RESP_DIAGNOSES.map((d) => (
                  <button key={d.label} onClick={() => setEcmoParams({ ...ecmoParams, diagnosis: d.label })}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-[10px] transition-all flex justify-between ${
                      ecmoParams.diagnosis === d.label ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted/30 text-muted-foreground border border-border"
                    }`}>
                    <span>{d.label}</span>
                    <span className="font-mono">{d.score >= 0 ? "+" : ""}{d.score}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CalcField label="VM pré-ECMO (dias)" value={ecmoParams.mvDays} onChange={(v) => setEcmoParams({ ...ecmoParams, mvDays: v })} unit="dias" />
              <CalcField label="PaCO₂ pré-ECMO" value={ecmoParams.paco2} onChange={(v) => setEcmoParams({ ...ecmoParams, paco2: v })} unit="mmHg" />
              <CalcField label="PIP pré-ECMO" value={ecmoParams.pip} onChange={(v) => setEcmoParams({ ...ecmoParams, pip: v })} unit="cmH₂O" />
              <CalcField label="PEEP pré-ECMO" value={ecmoParams.peep} onChange={(v) => setEcmoParams({ ...ecmoParams, peep: v })} unit="cmH₂O" />
            </div>
            <div className="space-y-1">
              {[
                { label: "Imunodeprimido", key: "immunocompromised" as const },
                { label: "Disfunção SNC pré-ECMO", key: "cnsFailure" as const },
                { label: "Falência orgânica não-pulmonar aguda", key: "acuteNonPulm" as const },
                { label: "BNM pré-ECMO", key: "nmba" as const },
                { label: "NO pré-ECMO", key: "no" as const },
                { label: "Perfusão HCO₃ pré-ECMO", key: "hco3Infusion" as const },
                { label: "PCR pré-ECMO", key: "cardiacArrest" as const },
              ].map((item) => (
                <button key={item.key} onClick={() => setEcmoParams({ ...ecmoParams, [item.key]: !ecmoParams[item.key] })}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-[10px] transition-all ${
                    ecmoParams[item.key] ? "bg-warning/15 text-warning border border-warning/25" : "bg-muted/30 text-muted-foreground border border-border"
                  }`}>{item.label}</button>
              ))}
            </div>
          </div>
        )}

        {ecmoType === "VA" && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">ECMO VA — Parâmetros para SAVE</p>
            <div className="grid grid-cols-2 gap-2">
              <CalcField label="PAD pré-ECMO" value={ecmoParams.diastolicBP} onChange={(v) => setEcmoParams({ ...ecmoParams, diastolicBP: v })} unit="mmHg" />
              <CalcField label="HCO₃" value={ecmoParams.hco3} onChange={(v) => setEcmoParams({ ...ecmoParams, hco3: v })} unit="mmol/L" />
              <CalcField label="PIP pré-ECMO" value={ecmoParams.peakInspPressure} onChange={(v) => setEcmoParams({ ...ecmoParams, peakInspPressure: v })} unit="cmH₂O" />
              <CalcField label="Horas intubação pré-ECMO" value={ecmoParams.intubationHours} onChange={(v) => setEcmoParams({ ...ecmoParams, intubationHours: v })} unit="h" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold mb-1">Falências orgânicas agudas pré-ECMO</p>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((n) => (
                  <button key={n} onClick={() => setEcmoParams({ ...ecmoParams, acuteOrganFailure: n })}
                    className={`flex-1 py-1.5 rounded text-[11px] font-mono font-semibold transition-all ${
                      ecmoParams.acuteOrganFailure === n ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
                    }`}>{n}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              {[
                { label: "Miocardite", key: "myocarditis" as const },
                { label: "TV/FV refratária", key: "refractoryVT" as const },
                { label: "Pós-transplante cardíaco", key: "postTransplant" as const },
                { label: "Cardiopatia congénita", key: "congenitalHD" as const },
                { label: "PCR pré-ECMO", key: "cardiacArrest" as const },
              ].map((item) => (
                <button key={item.key} onClick={() => setEcmoParams({ ...ecmoParams, [item.key]: !ecmoParams[item.key] })}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-[10px] transition-all ${
                    ecmoParams[item.key] ? "bg-warning/15 text-warning border border-warning/25" : "bg-muted/30 text-muted-foreground border border-border"
                  }`}>{item.label}</button>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      <SectionDivider title="Vasopressores e Inotrópicos" />

      {/* Drug Interactions */}
      <DrugInteractions />

      {/* Vasopressors Dashboard */}
      <div className="calc-card">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-semibold text-foreground">Perfusões — Vasopressores & Inotrópicos</h3>
          <InfoTooltip interpretation="Vista global. Insira mL/h para ver a dose, ou expanda para converter dose → mL/h." />
        </div>

        {!pesoReferencia && <AlertBanner text="Preencha o peso na aba Geral para cálculo de doses/kg" level="warning" />}

        <div className="space-y-1.5">
          {VASOACTIVE_DRUGS.map((drug, idx) => {
            const conc = drug.concentrations[0];
            const rateVal = vasoRates[idx] || "";
            const rateNum = parseFloat(rateVal);
            const isMcg = drug.doseUnit.includes("mcg");
            const isPerMin = drug.doseUnit.includes("/min");
            const isPerKg = drug.doseUnit.includes("/kg");
            const factor = isMcg ? 1000 : 1;
            const w = isPerKg ? (pesoReferencia || peso) : 1;

            let dose: number | null = null;
            if (rateNum > 0 && (w > 0 || !isPerKg)) {
              const mgPerHour = rateNum * conc.mgPerMl;
              if (isPerMin) {
                dose = (mgPerHour * factor) / (w * 60);
              } else {
                dose = (mgPerHour * factor) / w;
              }
            }

            const isExpanded = expandedVaso === idx;
            const hasValue = rateNum > 0;

            return (
              <div key={drug.name} className={`rounded-lg border px-3 py-2 transition-all ${hasValue ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/20"}`}>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandedVaso(isExpanded ? null : idx)} className="text-[11px] font-semibold text-foreground hover:text-primary transition-colors flex-shrink-0">
                    {drug.name}
                  </button>
                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      type="number"
                      value={rateVal}
                      onChange={(e) => {
                        const next = [...vasoRates];
                        next[idx] = e.target.value;
                        setVasoRates(next);
                      }}
                      placeholder="0"
                      className="calc-input py-1 text-[11px] w-20"
                    />
                    <span className="text-[9px] text-muted-foreground font-mono">mL/h</span>
                  </div>
                  {dose !== null && (
                    <span className={`text-[11px] font-mono font-semibold whitespace-nowrap ${hasValue ? "text-destructive" : "text-primary"}`}>
                      {dose < 0.01 ? dose.toFixed(4) : dose < 1 ? dose.toFixed(3) : dose.toFixed(1)} {drug.doseUnit}
                    </span>
                  )}
                </div>
                <p className="text-[8px] text-muted-foreground mt-0.5 font-mono">
                  Faixa: {drug.doseRange} {drug.doseUnit} · {conc.label}
                </p>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-border space-y-2">
                    <UniversalInfusionConverter
                      drugName={drug.name}
                      concentrations={drug.concentrations}
                      doseUnit={drug.doseUnit}
                      doseRange={drug.doseRange}
                      needsWeight={drug.needsWeight}
                      onRateChange={(mlH) => { const next = [...vasoRates]; next[idx] = mlH.toFixed(1); setVasoRates(next); }}
                    />
                    <p className="text-[9px] text-foreground">{drug.desc}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default CardiovascularTab;
