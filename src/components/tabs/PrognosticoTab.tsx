import { useState, useMemo, useEffect } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { usePatient } from "@/contexts/PatientContext";
import CalcResult from "../CalcResult";
import Interpretation from "../Interpretation";
import InfoTooltip from "../InfoTooltip";
import CollapsibleSection from "../CollapsibleSection";
import SectionDivider from "../SectionDivider";

/* ── SOFA ── */
const SOFA_RESP = [
  { label: "≥ 400", score: 0 }, { label: "300–399", score: 1 }, { label: "200–299", score: 2 },
  { label: "100–199 c/ VM", score: 3 }, { label: "< 100 c/ VM", score: 4 },
];
const SOFA_COAG = [
  { label: "≥ 150", score: 0 }, { label: "100–149", score: 1 }, { label: "50–99", score: 2 },
  { label: "20–49", score: 3 }, { label: "< 20", score: 4 },
];
const SOFA_HEPAT = [
  { label: "< 1.2", score: 0 }, { label: "1.2–1.9", score: 1 }, { label: "2.0–5.9", score: 2 },
  { label: "6.0–11.9", score: 3 }, { label: "≥ 12", score: 4 },
];
const SOFA_CV = [
  { label: "PAM ≥ 70", score: 0 }, { label: "PAM < 70", score: 1 }, { label: "Dopa ≤ 5 ou Dobuta", score: 2 },
  { label: "Dopa > 5 ou NA/Adr ≤ 0.1", score: 3 }, { label: "Dopa > 15 ou NA/Adr > 0.1", score: 4 },
];
const SOFA_NEURO = [
  { label: "GCS 15", score: 0 }, { label: "GCS 13–14", score: 1 }, { label: "GCS 10–12", score: 2 },
  { label: "GCS 6–9", score: 3 }, { label: "GCS < 6", score: 4 },
];
const SOFA_RENAL = [
  { label: "Cr < 1.2", score: 0 }, { label: "Cr 1.2–1.9", score: 1 }, { label: "Cr 2.0–3.4", score: 2 },
  { label: "Cr 3.5–4.9 ou DU < 500", score: 3 }, { label: "Cr ≥ 5 ou DU < 200", score: 4 },
];

const SOFA_CATEGORIES = [
  { name: "Respiratório (P/F)", options: SOFA_RESP },
  { name: "Coagulação (Plaq ×10³)", options: SOFA_COAG },
  { name: "Hepático (Bili mg/dL)", options: SOFA_HEPAT },
  { name: "Cardiovascular", options: SOFA_CV },
  { name: "Neurológico (GCS)", options: SOFA_NEURO },
  { name: "Renal (Cr/DU)", options: SOFA_RENAL },
];

const sofaMortality = (s: number) =>
  s <= 1 ? "< 5%" : s <= 3 ? "~5%" : s <= 6 ? "~10%" : s <= 9 ? "15–20%" : s <= 12 ? "40–50%" : s <= 14 ? "50–60%" : "> 80%";

/* ── Child-Pugh ── */
const CP_BILI = [{ label: "< 2", score: 1 }, { label: "2–3", score: 2 }, { label: "> 3", score: 3 }];
const CP_ALB = [{ label: "> 3.5", score: 1 }, { label: "2.8–3.5", score: 2 }, { label: "< 2.8", score: 3 }];
const CP_INR = [{ label: "< 1.7", score: 1 }, { label: "1.7–2.3", score: 2 }, { label: "> 2.3", score: 3 }];
const CP_ASCITES = [{ label: "Ausente", score: 1 }, { label: "Ligeira", score: 2 }, { label: "Moderada/Grave", score: 3 }];
const CP_ENCEF = [{ label: "Nenhuma", score: 1 }, { label: "Grau I–II", score: 2 }, { label: "Grau III–IV", score: 3 }];

const childPughClass = (s: number) =>
  s <= 6 ? { cl: "A", surv: "100% a 1 ano", desc: "Cirrose compensada." }
  : s <= 9 ? { cl: "B", surv: "80% a 1 ano", desc: "Cirrose moderada." }
  : { cl: "C", surv: "45% a 1 ano", desc: "Cirrose descompensada." };

/* ── RESP Score interpretation ── */
const respClass = (s: number) => {
  if (s >= 6) return { cl: "I", surv: "92%", status: "normal" as const };
  if (s >= 3) return { cl: "II", surv: "76%", status: "normal" as const };
  if (s >= -1) return { cl: "III", surv: "57%", status: "warning" as const };
  if (s >= -5) return { cl: "IV", surv: "33%", status: "danger" as const };
  return { cl: "V", surv: "18%", status: "danger" as const };
};

/* ── SAVE Score interpretation ── */
const saveClass = (s: number) => {
  if (s >= 5) return { cl: "I", surv: "75%", status: "normal" as const };
  if (s >= 1) return { cl: "II", surv: "58%", status: "normal" as const };
  if (s >= -4) return { cl: "III", surv: "42%", status: "warning" as const };
  if (s >= -9) return { cl: "IV", surv: "30%", status: "danger" as const };
  return { cl: "V", surv: "18%", status: "danger" as const };
};

const RESP_DIAGNOSES_SCORES: Record<string, number> = {
  "Pneumonia viral": 3, "Pneumonia bacteriana": 3, "Asma": 11,
  "Trauma / Queimadura": 3, "Aspiração": 5, "Outro IRA aguda": 1,
  "SDRA não-pulmonar": 0, "Falência respiratória crónica": -3,
};

/* ── APACHE II ── */
const APACHE_TEMP = [
  { label: "36–38.4°C", score: 0 }, { label: "38.5–38.9 ou 34–35.9", score: 1 },
  { label: "39–40.9 ou 32–33.9", score: 2 }, { label: "≥ 41 ou 30–31.9", score: 3 }, { label: "≤ 29.9", score: 4 },
];
const APACHE_PAM = [
  { label: "70–109", score: 0 }, { label: "110–129 ou 50–69", score: 2 },
  { label: "130–159", score: 3 }, { label: "≥ 160 ou ≤ 49", score: 4 },
];
const APACHE_FC = [
  { label: "70–109", score: 0 }, { label: "110–139 ou 55–69", score: 2 },
  { label: "140–179 ou 40–54", score: 3 }, { label: "≥ 180 ou ≤ 39", score: 4 },
];
const APACHE_FR = [
  { label: "12–24", score: 0 }, { label: "10–11 ou 25–34", score: 1 },
  { label: "6–9", score: 2 }, { label: "35–49", score: 3 }, { label: "≥ 50 ou ≤ 5", score: 4 },
];
const APACHE_OX = [
  { label: "PaO₂ ≥ 70 ou A-a < 200", score: 0 }, { label: "A-a 200–349", score: 2 },
  { label: "A-a 350–499 ou PaO₂ 55–60", score: 3 }, { label: "A-a ≥ 500 ou PaO₂ < 55", score: 4 },
];
const APACHE_PH = [
  { label: "7.33–7.49", score: 0 }, { label: "7.50–7.59 ou 7.25–7.32", score: 1 },
  { label: "7.60–7.69 ou 7.15–7.24", score: 3 }, { label: "≥ 7.70 ou < 7.15", score: 4 },
];
const APACHE_NA = [
  { label: "130–149", score: 0 }, { label: "150–154 ou 120–129", score: 1 },
  { label: "155–159 ou 111–119", score: 2 }, { label: "≥ 160 ou ≤ 110", score: 4 },
];
const APACHE_K = [
  { label: "3.5–5.4", score: 0 }, { label: "5.5–5.9 ou 3.0–3.4", score: 1 },
  { label: "6.0–6.9 ou 2.5–2.9", score: 2 }, { label: "≥ 7.0 ou < 2.5", score: 4 },
];
const APACHE_CR_ACUTE = [
  { label: "< 0.6", score: 2 }, { label: "0.6–1.4", score: 0 }, { label: "1.5–1.9", score: 2 },
  { label: "2.0–3.4", score: 3 }, { label: "≥ 3.5", score: 4 },
];
const APACHE_HCT = [
  { label: "30–45.9%", score: 0 }, { label: "46–49.9 ou 20–29.9", score: 2 },
  { label: "50–59.9", score: 3 }, { label: "≥ 60 ou < 20", score: 4 },
];
const APACHE_WBC = [
  { label: "3–14.9", score: 0 }, { label: "15–19.9 ou 1–2.9", score: 1 },
  { label: "20–39.9", score: 2 }, { label: "≥ 40 ou < 1", score: 4 },
];
const APACHE_GCS_SCORE = [
  { label: "15 (0 pts)", score: 0 }, { label: "13–14 (1–2 pts)", score: 2 },
  { label: "10–12 (3–5 pts)", score: 3 }, { label: "7–9 (6–8 pts)", score: 4 },
  { label: "3–6 (9–12 pts)", score: 6 },
];
const APACHE_AGE = [
  { label: "< 45", score: 0 }, { label: "45–54", score: 2 }, { label: "55–64", score: 3 },
  { label: "65–74", score: 5 }, { label: "≥ 75", score: 6 },
];
const APACHE_CHRONIC = [
  { label: "Nenhuma", score: 0 }, { label: "Pós-op electivo", score: 2 },
  { label: "Não-operado ou pós-op urgente", score: 5 },
];

const APACHE_CATEGORIES = [
  { name: "Temperatura", options: APACHE_TEMP },
  { name: "PAM (mmHg)", options: APACHE_PAM },
  { name: "FC (bpm)", options: APACHE_FC },
  { name: "FR (rpm)", options: APACHE_FR },
  { name: "Oxigenação", options: APACHE_OX },
  { name: "pH arterial", options: APACHE_PH },
  { name: "Sódio (mEq/L)", options: APACHE_NA },
  { name: "Potássio (mEq/L)", options: APACHE_K },
  { name: "Creatinina (mg/dL)", options: APACHE_CR_ACUTE },
  { name: "Hematócrito (%)", options: APACHE_HCT },
  { name: "Leucócitos (×10³)", options: APACHE_WBC },
  { name: "GCS (15 − GCS)", options: APACHE_GCS_SCORE },
  { name: "Idade", options: APACHE_AGE },
  { name: "Doença crónica", options: APACHE_CHRONIC },
];

const apacheMortality = (s: number) =>
  s <= 4 ? "~4%" : s <= 9 ? "~8%" : s <= 14 ? "~15%" : s <= 19 ? "~25%" : s <= 24 ? "~40%" : s <= 29 ? "~55%" : s <= 34 ? "~73%" : "> 85%";

/* ── SAPS II ── */
const SAPS_AGE = [
  { label: "< 40", score: 0 }, { label: "40–59", score: 7 }, { label: "60–69", score: 12 },
  { label: "70–74", score: 15 }, { label: "75–79", score: 16 }, { label: "≥ 80", score: 18 },
];
const SAPS_FC = [
  { label: "70–119", score: 0 }, { label: "120–159 ou 40–69", score: 4 },
  { label: "≥ 160 ou < 40", score: 7 },
];
const SAPS_PAS = [
  { label: "100–199", score: 0 }, { label: "≥ 200", score: 2 },
  { label: "70–99", score: 5 }, { label: "< 70", score: 13 },
];
const SAPS_TEMP = [
  { label: "< 39°C", score: 0 }, { label: "≥ 39°C", score: 3 },
];
const SAPS_PF = [
  { label: "≥ 200 ou sem VM", score: 0 }, { label: "100–199 c/ VM", score: 6 },
  { label: "< 100 c/ VM", score: 11 },
];
const SAPS_DU = [
  { label: "≥ 1000 mL/d", score: 0 }, { label: "500–999", score: 4 }, { label: "< 500", score: 11 },
];
const SAPS_UREA = [
  { label: "< 28 mg/dL", score: 0 }, { label: "28–83", score: 6 }, { label: "≥ 84", score: 10 },
];
const SAPS_WBC = [
  { label: "1–19.9", score: 0 }, { label: "≥ 20 ou < 1", score: 3 },
];
const SAPS_K = [
  { label: "3–4.9", score: 0 }, { label: "< 3 ou ≥ 5", score: 3 },
];
const SAPS_NA = [
  { label: "125–144", score: 0 }, { label: "≥ 145 ou < 125", score: 5 },
];
const SAPS_HCO3 = [
  { label: "≥ 20", score: 0 }, { label: "15–19", score: 3 }, { label: "< 15", score: 6 },
];
const SAPS_BILI = [
  { label: "< 4 mg/dL", score: 0 }, { label: "4–5.9", score: 4 }, { label: "≥ 6", score: 9 },
];
const SAPS_GCS = [
  { label: "14–15", score: 0 }, { label: "11–13", score: 5 }, { label: "9–10", score: 7 },
  { label: "6–8", score: 13 }, { label: "< 6", score: 26 },
];
const SAPS_CHRONIC = [
  { label: "Nenhuma", score: 0 }, { label: "Neoplasia metastizada", score: 9 },
  { label: "Neoplasia hemato", score: 10 }, { label: "SIDA", score: 17 },
];
const SAPS_ADMISSION = [
  { label: "Cirurgia programada", score: 0 }, { label: "Médico", score: 6 },
  { label: "Cirurgia urgente", score: 8 },
];

const SAPS_CATEGORIES = [
  { name: "Idade", options: SAPS_AGE },
  { name: "FC (bpm)", options: SAPS_FC },
  { name: "PAS (mmHg)", options: SAPS_PAS },
  { name: "Temperatura", options: SAPS_TEMP },
  { name: "P/F (se VM)", options: SAPS_PF },
  { name: "Diurese (mL/dia)", options: SAPS_DU },
  { name: "Ureia (mg/dL)", options: SAPS_UREA },
  { name: "Leucócitos (×10³)", options: SAPS_WBC },
  { name: "Potássio (mEq/L)", options: SAPS_K },
  { name: "Sódio (mEq/L)", options: SAPS_NA },
  { name: "HCO₃ (mEq/L)", options: SAPS_HCO3 },
  { name: "Bilirrubina (mg/dL)", options: SAPS_BILI },
  { name: "GCS", options: SAPS_GCS },
  { name: "Doença crónica", options: SAPS_CHRONIC },
  { name: "Tipo de admissão", options: SAPS_ADMISSION },
];

const saps2Mortality = (s: number) =>
  s <= 29 ? "< 10%" : s <= 40 ? "~10–25%" : s <= 52 ? "~25–50%" : s <= 64 ? "~50–75%" : "> 75%";

/* ── NEWS2 ── */
const NEWS_FR = [
  { label: "12–20", score: 0 }, { label: "9–11", score: 1 }, { label: "21–24", score: 2 }, { label: "≤ 8 ou ≥ 25", score: 3 },
];
const NEWS_SPO2 = [
  { label: "≥ 96%", score: 0 }, { label: "94–95%", score: 1 }, { label: "92–93%", score: 2 }, { label: "≤ 91%", score: 3 },
];
const NEWS_AIR = [
  { label: "Ar ambiente", score: 0 }, { label: "O₂ suplementar", score: 2 },
];
const NEWS_TEMP = [
  { label: "36.1–38.0", score: 0 }, { label: "35.1–36.0 ou 38.1–39.0", score: 1 },
  { label: "≥ 39.1 ou ≤ 35.0", score: 2 }, { label: "≤ 35.0", score: 3 },
];
const NEWS_PAS = [
  { label: "111–219", score: 0 }, { label: "101–110", score: 1 }, { label: "91–100", score: 2 },
  { label: "≤ 90 ou ≥ 220", score: 3 },
];
const NEWS_FC = [
  { label: "51–90", score: 0 }, { label: "41–50 ou 91–110", score: 1 },
  { label: "111–130", score: 2 }, { label: "≤ 40 ou ≥ 131", score: 3 },
];
const NEWS_CONSC = [
  { label: "Alerta", score: 0 }, { label: "CVPU (não-alerta)", score: 3 },
];

const NEWS_CATEGORIES = [
  { name: "FR (rpm)", options: NEWS_FR },
  { name: "SpO₂ (%)", options: NEWS_SPO2 },
  { name: "O₂ suplementar", options: NEWS_AIR },
  { name: "Temperatura (°C)", options: NEWS_TEMP },
  { name: "PAS (mmHg)", options: NEWS_PAS },
  { name: "FC (bpm)", options: NEWS_FC },
  { name: "Consciência", options: NEWS_CONSC },
];

const newsRisk = (s: number) =>
  s <= 4 ? { level: "Baixo", status: "normal" as const, desc: "Avaliação por enfermeiro. Monitorização de rotina." }
  : s <= 6 ? { level: "Médio", status: "warning" as const, desc: "Resposta urgente. Avaliar pelo médico." }
  : { level: "Alto", status: "danger" as const, desc: "Resposta emergente. Equipa de emergência / UCI." };

/* ── Shared Score Selector ── */
const ScoreSelector = ({ cat, value, onSelect }: {
  cat: { name: string; options: { label: string; score: number }[] };
  value: number;
  onSelect: (score: number) => void;
}) => (
  <div>
    <p className="text-[10px] text-muted-foreground font-semibold mb-1">{cat.name}</p>
    <div className="flex flex-wrap gap-1">
      {cat.options.map((opt) => (
        <button key={opt.score + opt.label} onClick={() => onSelect(opt.score)}
          className={`px-2 py-1 rounded text-[9px] font-mono transition-all ${
            value === opt.score
              ? opt.score === 0 ? "bg-primary/20 text-primary border border-primary/30"
                : opt.score <= 2 ? "bg-warning/20 text-warning border border-warning/30"
                : "bg-destructive/20 text-destructive border border-destructive/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}>
          {opt.label} ({opt.score})
        </button>
      ))}
    </div>
  </div>
);

const PrognosticoTab = () => {
  const { creatinina, albumina, bilirrubina, inr, plaquetas, gcsTotal, pamCardio, pfRatio, idade, imc, ecmoType, ecmoParams, lactato } = usePatient();

  const cr = parseFloat(creatinina) || 0;
  const alb = parseFloat(albumina) || 0;
  const bili = parseFloat(bilirrubina) || 0;
  const inrVal = parseFloat(inr) || 0;
  const plaq = parseFloat(plaquetas) || 0;
  const pamVal = parseFloat(pamCardio) || 0;
  const idadeVal = parseFloat(idade) || 0;
  const imcVal = imc || 0;
  const lac = parseFloat(lactato) || 0;

  // ── SOFA auto-calculation ──
  const autoSofaScores = useMemo(() => {
    const scores: (number | null)[] = [null, null, null, null, null, null];
    if (pfRatio !== null) {
      if (pfRatio >= 400) scores[0] = 0;
      else if (pfRatio >= 300) scores[0] = 1;
      else if (pfRatio >= 200) scores[0] = 2;
      else if (pfRatio >= 100) scores[0] = 3;
      else scores[0] = 4;
    }
    if (plaq > 0) {
      if (plaq >= 150) scores[1] = 0;
      else if (plaq >= 100) scores[1] = 1;
      else if (plaq >= 50) scores[1] = 2;
      else if (plaq >= 20) scores[1] = 3;
      else scores[1] = 4;
    }
    if (bili > 0) {
      if (bili < 1.2) scores[2] = 0;
      else if (bili <= 1.9) scores[2] = 1;
      else if (bili <= 5.9) scores[2] = 2;
      else if (bili <= 11.9) scores[2] = 3;
      else scores[2] = 4;
    }
    if (pamVal > 0 && pamVal >= 70) scores[3] = 0;
    else if (pamVal > 0 && pamVal < 70) scores[3] = 1;
    if (gcsTotal === 15) scores[4] = 0;
    else if (gcsTotal >= 13) scores[4] = 1;
    else if (gcsTotal >= 10) scores[4] = 2;
    else if (gcsTotal >= 6) scores[4] = 3;
    else scores[4] = 4;
    if (cr > 0) {
      if (cr < 1.2) scores[5] = 0;
      else if (cr <= 1.9) scores[5] = 1;
      else if (cr <= 3.4) scores[5] = 2;
      else if (cr <= 4.9) scores[5] = 3;
      else scores[5] = 4;
    }
    return scores;
  }, [pfRatio, plaq, bili, pamVal, gcsTotal, cr]);

  const [sofaScores, setSofaScores] = usePersistedState<number[]>("prog-sofa", [0, 0, 0, 0, 0, 0]);
  const [sofaManualOverride, setSofaManualOverride] = usePersistedState<boolean[]>("prog-sofaOverride", [false, false, false, false, false, false]);

  useEffect(() => {
    setSofaScores(prev => prev.map((prevScore, i) => {
      if (sofaManualOverride[i]) return prevScore;
      return autoSofaScores[i] ?? prevScore;
    }));
  }, [autoSofaScores, sofaManualOverride, setSofaScores]);

  const sofaTotal = useMemo(() => sofaScores.reduce((a, b) => a + b, 0), [sofaScores]);

  const handleSofaSelect = (catIdx: number, score: number) => {
    const next = [...sofaScores]; next[catIdx] = score; setSofaScores(next);
    const overrides = [...sofaManualOverride]; overrides[catIdx] = true; setSofaManualOverride(overrides);
  };

  // ── Child-Pugh ──
  const [cpBili, setCpBili] = usePersistedState("prog-cpBili", 1);
  const [cpAlb, setCpAlb] = usePersistedState("prog-cpAlb", 1);
  const [cpInr, setCpInr] = usePersistedState("prog-cpInr", 1);
  const [cpAscites, setCpAscites] = usePersistedState("prog-cpAscites", 1);
  const [cpEncef, setCpEncef] = usePersistedState("prog-cpEncef", 1);

  useEffect(() => { if (bili > 0) setCpBili(bili < 2 ? 1 : bili <= 3 ? 2 : 3); }, [bili, setCpBili]);
  useEffect(() => { if (alb > 0) setCpAlb(alb > 3.5 ? 1 : alb >= 2.8 ? 2 : 3); }, [alb, setCpAlb]);
  useEffect(() => { if (inrVal > 0) setCpInr(inrVal < 1.7 ? 1 : inrVal <= 2.3 ? 2 : 3); }, [inrVal, setCpInr]);

  const cpTotal = cpBili + cpAlb + cpInr + cpAscites + cpEncef;
  const cpResult = childPughClass(cpTotal);

  // ── MELD ──
  const meld = useMemo(() => {
    const b = Math.max(bili || 1, 1);
    const c = Math.max(cr || 1, 1);
    const i = Math.max(inrVal || 1, 1);
    if (!bili && !cr && !inrVal) return null;
    const raw = 3.78 * Math.log(b) + 11.2 * Math.log(i) + 9.57 * Math.log(c) + 6.43;
    return Math.round(Math.min(40, Math.max(6, raw)));
  }, [bili, cr, inrVal]);

  const meldMortality = (m: number) =>
    m <= 9 ? "1.9%" : m <= 19 ? "6.0%" : m <= 29 ? "19.6%" : m <= 39 ? "52.6%" : "71.3%";

  // ── RESP Score (VV ECMO) ──
  const respScore = useMemo(() => {
    if (ecmoType !== "VV") return null;
    let s = 0;
    if (idadeVal >= 50 && idadeVal <= 59) s -= 2;
    else if (idadeVal >= 60) s -= 3;
    if (ecmoParams.immunocompromised) s -= 2;
    const mvDays = parseFloat(ecmoParams.mvDays) || 0;
    if (mvDays < 2) s += 3;
    else if (mvDays <= 7) s += 1;
    s += RESP_DIAGNOSES_SCORES[ecmoParams.diagnosis] || 0;
    if (ecmoParams.cnsFailure) s -= 7;
    if (ecmoParams.acuteNonPulm) s -= 3;
    if (ecmoParams.nmba) s += 1;
    if (ecmoParams.no) s -= 1;
    if (ecmoParams.hco3Infusion) s -= 2;
    if (ecmoParams.cardiacArrest) s -= 2;
    const paco2 = parseFloat(ecmoParams.paco2) || 0;
    if (paco2 >= 75) s -= 1;
    const pip = parseFloat(ecmoParams.pip) || 0;
    if (pip >= 42) s -= 1;
    return s;
  }, [ecmoType, idadeVal, ecmoParams]);

  // ── PRESERVE Score (VV ECMO) ──
  const preserveScore = useMemo(() => {
    if (ecmoType !== "VV") return null;
    let s = 0;
    if (idadeVal >= 45 && idadeVal < 55) s += 2;
    else if (idadeVal >= 55 && idadeVal < 65) s += 3;
    else if (idadeVal >= 65) s += 4;
    if (imcVal >= 30) s += 2;
    if (ecmoParams.immunocompromised) s += 3;
    const mvDays = parseFloat(ecmoParams.mvDays) || 0;
    if (mvDays > 6) s += 3;
    else if (mvDays > 2) s += 1;
    const peep = parseFloat(ecmoParams.peep) || 0;
    if (peep >= 10) s += 1;
    const pip = parseFloat(ecmoParams.pip) || 0;
    if (pip >= 30) s += 1;
    const sofaNonResp = sofaScores.slice(1).reduce((a, b) => a + b, 0);
    if (sofaNonResp >= 12) s += 4;
    else if (sofaNonResp >= 9) s += 3;
    else if (sofaNonResp >= 6) s += 2;
    else if (sofaNonResp >= 3) s += 1;
    return s;
  }, [ecmoType, idadeVal, imcVal, ecmoParams, sofaScores]);

  // ── SAVE Score (VA ECMO) ──
  const saveScore = useMemo(() => {
    if (ecmoType !== "VA") return null;
    let s = 0;
    if (ecmoParams.myocarditis) s += 3;
    if (ecmoParams.refractoryVT) s += 2;
    if (ecmoParams.postTransplant) s -= 3;
    if (ecmoParams.congenitalHD) s -= 3;
    if (idadeVal >= 18 && idadeVal <= 38) s += 7;
    else if (idadeVal >= 39 && idadeVal <= 52) s += 4;
    else if (idadeVal >= 53 && idadeVal <= 62) s += 3;
    if (imcVal >= 25 && imcVal <= 40) s += 1;
    s -= ecmoParams.acuteOrganFailure * 3;
    const dbp = parseFloat(ecmoParams.diastolicBP) || 0;
    if (dbp >= 40 && dbp < 75) s += 3;
    const hco3 = parseFloat(ecmoParams.hco3) || 0;
    if (hco3 < 15) s -= 3;
    else if (hco3 < 22) s -= 1;
    if (lac > 8) s -= 3;
    else if (lac > 4) s -= 2;
    else if (lac > 2) s -= 1;
    const pipSave = parseFloat(ecmoParams.peakInspPressure) || 0;
    if (pipSave > 20) s -= 1;
    const intH = parseFloat(ecmoParams.intubationHours) || 0;
    if (intH > 10) s -= 2;
    if (ecmoParams.cardiacArrest) s -= 2;
    if (cr > 1.5) s -= 3;
    return s;
  }, [ecmoType, ecmoParams, idadeVal, imcVal, lac, cr]);

  // ── APACHE II ──
  const [apacheScores, setApacheScores] = usePersistedState<number[]>("prog-apache", new Array(14).fill(0));
  const apacheTotal = useMemo(() => apacheScores.reduce((a, b) => a + b, 0), [apacheScores]);
  const handleApacheSelect = (idx: number, score: number) => {
    const next = [...apacheScores]; next[idx] = score; setApacheScores(next);
  };

  // ── SAPS II ──
  const [sapsScores, setSapsScores] = usePersistedState<number[]>("prog-saps", new Array(15).fill(0));
  const sapsTotal = useMemo(() => sapsScores.reduce((a, b) => a + b, 0), [sapsScores]);
  const handleSapsSelect = (idx: number, score: number) => {
    const next = [...sapsScores]; next[idx] = score; setSapsScores(next);
  };

  // ── NEWS2 ──
  const [newsScores, setNewsScores] = usePersistedState<number[]>("prog-news", new Array(7).fill(0));
  const newsTotal = useMemo(() => newsScores.reduce((a, b) => a + b, 0), [newsScores]);
  const handleNewsSelect = (idx: number, score: number) => {
    const next = [...newsScores]; next[idx] = score; setNewsScores(next);
  };
  const newsResult = newsRisk(newsTotal);

  const SofaScoreSelector = ({ catIdx, cat }: { catIdx: number; cat: typeof SOFA_CATEGORIES[0] }) => {
    const isAuto = autoSofaScores[catIdx] !== null && !sofaManualOverride[catIdx];
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[10px] text-muted-foreground font-semibold">{cat.name}</p>
          {isAuto && <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary">auto</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {cat.options.map((opt) => (
            <button key={opt.score + opt.label} onClick={() => handleSofaSelect(catIdx, opt.score)}
              className={`px-2 py-1 rounded text-[9px] font-mono transition-all ${
                sofaScores[catIdx] === opt.score
                  ? opt.score === 0 ? "bg-primary/20 text-primary border border-primary/30"
                    : opt.score <= 2 ? "bg-warning/20 text-warning border border-warning/30"
                    : "bg-destructive/20 text-destructive border border-destructive/30"
                  : "bg-muted text-muted-foreground border border-border"
              }`}>
              {opt.label} ({opt.score})
            </button>
          ))}
        </div>
      </div>
    );
  };

  const CpSelector = ({ label, options, value, set, isAuto }: { label: string; options: { label: string; score: number }[]; value: number; set: (v: number) => void; isAuto?: boolean }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[10px] text-muted-foreground font-semibold">{label}</p>
        {isAuto && <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary">auto</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button key={opt.score + opt.label} onClick={() => set(opt.score)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              value === opt.score ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"
            }`}>{opt.label} ({opt.score})</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionDivider title="Scores de Gravidade" />

      {/* SOFA Score */}
      <CollapsibleSection title="SOFA Score" badge={`${sofaTotal} pts`}
        info={<InfoTooltip reference="Vincent et al. Crit Care Med 1996" interpretation="0–24 pontos. Auto-preenche dos dados inseridos nos outros separadores. Δ SOFA ≥ 2 = critério Sepsis-3." />}>
        <div className="space-y-3">
          {SOFA_CATEGORIES.map((cat, catIdx) => (
            <SofaScoreSelector key={cat.name} catIdx={catIdx} cat={cat} />
          ))}
        </div>
        <div className="mt-4">
          <CalcResult label="SOFA Total" value={sofaTotal.toString()} unit="pontos"
            status={sofaTotal >= 12 ? "danger" : sofaTotal >= 6 ? "warning" : "normal"} />
          <Interpretation
            status={sofaTotal >= 12 ? "danger" : sofaTotal >= 6 ? "warning" : "normal"}
            text={`SOFA ${sofaTotal} — Mortalidade: ${sofaMortality(sofaTotal)}. ${sofaTotal >= 2 ? "Δ SOFA ≥ 2 = Sepsis-3." : ""}`}
          />
        </div>
      </CollapsibleSection>

      {/* APACHE II */}
      <CollapsibleSection title="APACHE II" badge={`${apacheTotal} pts`}
        info={<InfoTooltip reference="Knaus et al. Crit Care Med 1985" interpretation="Acute Physiology and Chronic Health Evaluation II. 0–71 pontos. Calculado nas primeiras 24h de UCI. Melhor preditor de mortalidade hospitalar em populações UCI gerais." />}>
        <div className="space-y-3">
          {APACHE_CATEGORIES.map((cat, idx) => (
            <ScoreSelector key={cat.name} cat={cat} value={apacheScores[idx]} onSelect={(s) => handleApacheSelect(idx, s)} />
          ))}
        </div>
        <div className="mt-4">
          <CalcResult label="APACHE II" value={apacheTotal.toString()} unit="pontos"
            status={apacheTotal >= 25 ? "danger" : apacheTotal >= 15 ? "warning" : "normal"} />
          <Interpretation
            status={apacheTotal >= 25 ? "danger" : apacheTotal >= 15 ? "warning" : "normal"}
            text={`APACHE II ${apacheTotal} — Mortalidade hospitalar estimada: ${apacheMortality(apacheTotal)}.`}
          />
        </div>
      </CollapsibleSection>

      {/* SAPS II */}
      <CollapsibleSection title="SAPS II" badge={`${sapsTotal} pts`}
        info={<InfoTooltip reference="Le Gall et al. JAMA 1993" interpretation="Simplified Acute Physiology Score II. Calculado nas primeiras 24h. Score 0–163. Preditor de mortalidade hospitalar validado internacionalmente." />}>
        <div className="space-y-3">
          {SAPS_CATEGORIES.map((cat, idx) => (
            <ScoreSelector key={cat.name} cat={cat} value={sapsScores[idx]} onSelect={(s) => handleSapsSelect(idx, s)} />
          ))}
        </div>
        <div className="mt-4">
          <CalcResult label="SAPS II" value={sapsTotal.toString()} unit="pontos"
            status={sapsTotal >= 52 ? "danger" : sapsTotal >= 30 ? "warning" : "normal"} />
          <Interpretation
            status={sapsTotal >= 52 ? "danger" : sapsTotal >= 30 ? "warning" : "normal"}
            text={`SAPS II ${sapsTotal} — Mortalidade hospitalar estimada: ${saps2Mortality(sapsTotal)}.`}
          />
        </div>
      </CollapsibleSection>

      {/* NEWS2 */}
      <CollapsibleSection title="NEWS2" badge={`${newsTotal} pts`}
        info={<InfoTooltip reference="Royal College of Physicians 2017" interpretation="National Early Warning Score 2. Detecção precoce de deterioração clínica. Score ≥ 5 = resposta urgente. Score ≥ 7 = emergência / considerar UCI." />}>
        <div className="space-y-3">
          {NEWS_CATEGORIES.map((cat, idx) => (
            <ScoreSelector key={cat.name} cat={cat} value={newsScores[idx]} onSelect={(s) => handleNewsSelect(idx, s)} />
          ))}
        </div>
        <div className="mt-4">
          <CalcResult label="NEWS2" value={newsTotal.toString()} unit={`Risco ${newsResult.level}`}
            status={newsResult.status} />
          <Interpretation status={newsResult.status}
            text={`NEWS2 ${newsTotal} — Risco ${newsResult.level}. ${newsResult.desc}`}
          />
        </div>
      </CollapsibleSection>

      {/* ═══ ECMO SCORES ═══ */}
      {(ecmoType === "VV" || ecmoType === "VA") && <SectionDivider title="Scores ECMO" />}

      {ecmoType === "VV" && (
        <>
          <CollapsibleSection title="RESP Score — ECMO VV" badge={respScore !== null ? `${respScore} pts` : undefined}
            info={<InfoTooltip reference="Schmidt et al. Am J Respir Crit Care Med 2014" interpretation="Preditor de sobrevida hospitalar em ECMO VV. Classe I (≥6): 92% | II (3–5): 76% | III (-1 a 2): 57% | IV (-5 a -2): 33% | V (≤-6): 18%." />}>
            {respScore !== null ? (() => {
              const r = respClass(respScore);
              return (
                <>
                  <CalcResult label="RESP Score" value={respScore.toString()} unit={`Classe ${r.cl}`} status={r.status} />
                  <Interpretation status={r.status} text={`RESP ${respScore} — Classe ${r.cl}. Sobrevida hospitalar estimada: ${r.surv}.`} />
                  <div className="bg-muted/30 rounded-lg p-2.5 border border-border mt-2 space-y-1">
                    <p className="text-[9px] font-semibold text-muted-foreground">Componentes auto-preenchidos:</p>
                    <p className="text-[9px] text-muted-foreground">Idade: {idadeVal || "—"} · Diagnóstico: {ecmoParams.diagnosis || "—"} · VM pré-ECMO: {ecmoParams.mvDays || "—"} dias</p>
                  </div>
                </>
              );
            })() : <Interpretation status="warning" text="Preencha os parâmetros ECMO VV no separador Cardiovascular." />}
          </CollapsibleSection>

          <CollapsibleSection title="PRESERVE Score — ECMO VV" badge={preserveScore !== null ? `${preserveScore} pts` : undefined}
            info={<InfoTooltip reference="Schmidt et al. Intensive Care Med 2015" interpretation="Preditor de mortalidade a 6 meses em ECMO VV. 0–2: ~90% sobrevida. 3–4: ~75%. 5–6: ~50%. 7–8: ~30%. ≥9: ~20%." />}>
            {preserveScore !== null ? (
              <>
                <CalcResult label="PRESERVE" value={preserveScore.toString()} unit="pontos"
                  status={preserveScore >= 7 ? "danger" : preserveScore >= 5 ? "warning" : "normal"} />
                <Interpretation
                  status={preserveScore >= 7 ? "danger" : preserveScore >= 5 ? "warning" : "normal"}
                  text={preserveScore <= 2 ? `PRESERVE ${preserveScore} — Prognóstico favorável (~90% sobrevida 6m).`
                    : preserveScore <= 4 ? `PRESERVE ${preserveScore} — Prognóstico intermédio (~75% sobrevida 6m).`
                    : preserveScore <= 6 ? `PRESERVE ${preserveScore} — Prognóstico reservado (~50% sobrevida 6m).`
                    : `PRESERVE ${preserveScore} — Mau prognóstico (< 30% sobrevida 6m).`}
                />
              </>
            ) : <Interpretation status="warning" text="Preencha os parâmetros ECMO VV no separador Cardiovascular." />}
          </CollapsibleSection>
        </>
      )}

      {ecmoType === "VA" && (
        <CollapsibleSection title="SAVE Score — ECMO VA" badge={saveScore !== null ? `${saveScore} pts` : undefined}
          info={<InfoTooltip reference="Schmidt et al. Eur Heart J 2015" interpretation="Preditor de sobrevida hospitalar em ECMO VA. Classe I (≥5): 75% | II (1–4): 58% | III (-4 a 0): 42% | IV (-9 a -5): 30% | V (≤-10): 18%." />}>
          {saveScore !== null ? (() => {
            const sv = saveClass(saveScore);
            return (
              <>
                <CalcResult label="SAVE Score" value={saveScore.toString()} unit={`Classe ${sv.cl}`} status={sv.status} />
                <Interpretation status={sv.status} text={`SAVE ${saveScore} — Classe ${sv.cl}. Sobrevida hospitalar estimada: ${sv.surv}.`} />
              </>
            );
          })() : <Interpretation status="warning" text="Preencha os parâmetros ECMO VA no separador Cardiovascular." />}
        </CollapsibleSection>
      )}

      <SectionDivider title="Scores Hepáticos" />

      {/* Child-Pugh */}
      <CollapsibleSection title="Child-Pugh Score" badge={`Classe ${cpResult.cl}`}
        info={<InfoTooltip reference="Child-Turcotte-Pugh" interpretation="Classe A (5-6), B (7-9), C (10-15)." />}>
        <div className="space-y-3">
          <CpSelector label="Bilirrubina (mg/dL)" options={CP_BILI} value={cpBili} set={setCpBili} isAuto={bili > 0} />
          <CpSelector label="Albumina (g/dL)" options={CP_ALB} value={cpAlb} set={setCpAlb} isAuto={alb > 0} />
          <CpSelector label="INR" options={CP_INR} value={cpInr} set={setCpInr} isAuto={inrVal > 0} />
          <CpSelector label="Ascite" options={CP_ASCITES} value={cpAscites} set={setCpAscites} />
          <CpSelector label="Encefalopatia" options={CP_ENCEF} value={cpEncef} set={setCpEncef} />
        </div>
        <div className="mt-4">
          <CalcResult label="Child-Pugh" value={`${cpTotal} — Classe ${cpResult.cl}`} unit=""
            status={cpResult.cl === "C" ? "danger" : cpResult.cl === "B" ? "warning" : "normal"} />
          <Interpretation status={cpResult.cl === "C" ? "danger" : cpResult.cl === "B" ? "warning" : "normal"}
            text={`${cpResult.desc} Sobrevida: ${cpResult.surv}.`} />
        </div>
      </CollapsibleSection>

      {/* MELD */}
      <CollapsibleSection title="MELD Score" badge={meld !== null ? `${meld} pts` : undefined}
        info={<InfoTooltip formula="3.78×ln(Bili) + 11.2×ln(INR) + 9.57×ln(Cr) + 6.43" interpretation="Mortalidade a 3 meses em cirrose." />}>
        <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 mb-3">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">Bilirrubina {bili > 0 && <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary">auto</span>}</span>
            <span className="font-mono text-foreground">{bili > 0 ? `${bili.toFixed(1)} mg/dL` : "—"}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">INR {inrVal > 0 && <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary">auto</span>}</span>
            <span className="font-mono text-foreground">{inrVal > 0 ? inrVal.toFixed(2) : "—"}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">Creatinina {cr > 0 && <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary">auto</span>}</span>
            <span className="font-mono text-foreground">{cr > 0 ? `${cr.toFixed(2)} mg/dL` : "—"}</span>
          </div>
        </div>
        {meld !== null ? (
          <>
            <CalcResult label="MELD" value={meld.toString()} unit="pontos"
              status={meld >= 30 ? "danger" : meld >= 20 ? "warning" : "normal"} />
            <Interpretation status={meld >= 30 ? "danger" : meld >= 20 ? "warning" : "normal"}
              text={`MELD ${meld} — Mortalidade 3m: ${meldMortality(meld)}. ${meld >= 15 ? "Considerar transplante." : ""}`} />
          </>
        ) : (
          <Interpretation status="warning" text="Preencha bilirrubina, INR e creatinina para calcular." />
        )}
      </CollapsibleSection>
    </div>
  );
};

export default PrognosticoTab;
