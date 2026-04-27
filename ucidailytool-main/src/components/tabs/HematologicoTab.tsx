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

const HEMATO_EXAM: { category: string; items: string[] }[] = [
  { category: "Pele / Mucosas", items: ["Palidez", "Icterícia", "Petéquias", "Equimoses", "Púrpura", "Hematomas espontâneos", "Mucosas descoradas"] },
  { category: "Hemorragia", items: ["Epistaxe", "Gengivorragia", "Hemoptise", "Hematúria", "Melenas", "Hemorragia em locais de punção", "Hemorragia pós-operatória"] },
  { category: "Trombose", items: ["Edema unilateral MI", "Dor gemelar", "Homans +", "Sinais de TEP", "Trombose cateter", "Coagulação de filtro TSFR"] },
  { category: "Linfático", items: ["Adenopatias cervicais", "Adenopatias axilares", "Adenopatias inguinais", "Esplenomegália"] },
  { category: "Transfusões", items: ["Reação transfusional", "CE transfundidos", "PFC transfundido", "Plaquetas transfundidas", "Fibrinogénio administrado", "Protocolo transfusão maciça"] },
];

interface Antidote {
  agent: string;
  reversal: string;
  dose: string;
  notes: string;
}

const ANTIDOTES: Antidote[] = [
  { agent: "Heparina Não Fracionada", reversal: "Protamina", dose: "1 mg por 100 UI de HNF (última 2–3h)", notes: "Máx 50 mg. Risco de hipotensão e bradicardia." },
  { agent: "Enoxaparina", reversal: "Protamina", dose: "1 mg por 1 mg enoxaparina (se < 8h). Reversão parcial (~60%).", notes: "Se > 8h: 0.5 mg por mg." },
  { agent: "Dabigatrano", reversal: "Idarucizumab", dose: "5 g IV (2×2.5g)", notes: "Reversão completa e imediata. Específico." },
  { agent: "Rivaroxabano / Apixabano", reversal: "Andexanet Alfa", dose: "Dose alta ou baixa conforme última dose e timing", notes: "Alternativa: CCP 4F 25–50 UI/kg." },
  { agent: "Varfarina", reversal: "Vitamina K + CCP", dose: "Vit K 5–10 mg IV lenta + CCP 4F 25–50 UI/kg", notes: "Vit K demora 6–24h. CCP para reversão imediata." },
];

// aPTT-based HNF titration protocol (25000 U / 50 mL = 500 U/mL)
const HNF_PROTOCOL = [
  { aptt: "< 35", action: "Bólus 80 UI/kg + ↑ perfusão 4 UI/kg/h", color: "text-destructive" },
  { aptt: "35–45", action: "Bólus 40 UI/kg + ↑ perfusão 2 UI/kg/h", color: "text-warning" },
  { aptt: "46–70", action: "Sem alteração — Terapêutico", color: "text-primary" },
  { aptt: "71–90", action: "↓ perfusão 2 UI/kg/h", color: "text-warning" },
  { aptt: "> 90", action: "PARAR perfusão 1h, depois ↓ 3 UI/kg/h", color: "text-destructive" },
];

// Anticoagulant dosing
interface AnticoagulantDosing {
  name: string;
  indications: { indication: string; dose: string }[];
  monitoring: string;
  notes: string;
}

const ANTICOAGULANTS: AnticoagulantDosing[] = [
  {
    name: "Heparina Não Fracionada (HNF)",
    indications: [
      { indication: "TEV / TEP", dose: "Bólus 80 UI/kg IV, depois perfusão 18 UI/kg/h. Seringa: 25000 UI / 50 mL (500 UI/mL)." },
      { indication: "SCA / Angina instável", dose: "Bólus 60 UI/kg (máx 4000 UI) + perfusão 12 UI/kg/h (máx 1000 UI/h)." },
      { indication: "Anticoagulação em TSFR", dose: "500–1000 UI/h sem bólus. Ajustar a aPTT." },
    ],
    monitoring: "aPTT 6/6h. Alvo: 46–70 seg (1.5–2.5× controlo).",
    notes: "Trombocitopenia induzida (HIT): plaquetas 2×/semana. Reversão: protamina."
  },
  {
    name: "Dabigatrano (Pradaxa)",
    indications: [
      { indication: "FA não valvular", dose: "150 mg PO 12/12h (110 mg se ≥ 80 anos ou ClCr 30–50)." },
      { indication: "TEV tratamento", dose: "150 mg PO 12/12h após 5–10 dias de anticoagulação parentérica." },
    ],
    monitoring: "Sem monitorização de rotina. TCT ou dTT se necessário.",
    notes: "CI: ClCr < 30. Reversão: idarucizumab 5g. Não tomar com antiácidos."
  },
  {
    name: "Rivaroxabano (Xarelto)",
    indications: [
      { indication: "FA não valvular", dose: "20 mg PO 1×/dia com refeição (15 mg se ClCr 15–49)." },
      { indication: "TEV tratamento", dose: "15 mg PO 12/12h × 21 dias, depois 20 mg 1×/dia." },
      { indication: "Profilaxia TEV (cirurgia)", dose: "10 mg PO 1×/dia." },
    ],
    monitoring: "Sem monitorização de rotina. Anti-Xa calibrado se necessário.",
    notes: "CI: ClCr < 15. Reversão: andexanet alfa ou CCP 4F 25–50 UI/kg."
  },
  {
    name: "Apixabano (Eliquis)",
    indications: [
      { indication: "FA não valvular", dose: "5 mg PO 12/12h (2.5 mg se ≥ 80 anos + peso ≤ 60 kg + Cr ≥ 1.5)." },
      { indication: "TEV tratamento", dose: "10 mg PO 12/12h × 7 dias, depois 5 mg 12/12h." },
      { indication: "Profilaxia TEV (cirurgia)", dose: "2.5 mg PO 12/12h." },
    ],
    monitoring: "Sem monitorização de rotina. Anti-Xa calibrado se necessário.",
    notes: "Perfil hemorrágico favorável. Reversão: andexanet alfa ou CCP 4F."
  },
  {
    name: "Varfarina (Marevan)",
    indications: [
      { indication: "FA valvular / mecânica", dose: "Iniciar 5 mg/dia. Titular pelo INR." },
      { indication: "TEV tratamento", dose: "Overlap com HNF/enoxaparina ≥ 5 dias até INR 2–3." },
      { indication: "Prótese mecânica", dose: "INR alvo 2.5–3.5 (conforme válvula e posição)." },
    ],
    monitoring: "INR diário até estabilizar, depois semanal/mensal. Alvo: 2.0–3.0 (ou 2.5–3.5).",
    notes: "Interações alimentares (Vit K) e medicamentosas extensas. Reversão: Vit K + CCP."
  },
];

const HematologicoTab = () => {
  const { pesoAtual, clCr, onRRT, plaquetas, setPlaquetas, inr, setInr } = usePatient();
  const peso = parseFloat(pesoAtual) || 0;

  const [mode, setMode] = usePersistedState<"profilatica" | "terapeutica">("hemato-mode", "profilatica");
  const [antiXa, setAntiXa] = usePersistedState("hemato-antiXa", "");

  // aPTT for HNF protocol
  const [aptt, setAptt] = usePersistedState("hemato-aptt", "");

  const plaqVal = parseFloat(plaquetas) || 0;
  const inrVal = parseFloat(inr) || 0;

  const enoxDose = useMemo(() => {
    if (onRRT) return mode === "profilatica" ? "20 mg SC 1×/dia ou HNF" : "Preferir HNF em perfusão";
    if (clCr === null) return null;
    if (mode === "profilatica") return clCr >= 30 ? "40 mg SC 1×/dia" : "20 mg SC 1×/dia";
    return clCr >= 30 ? `${peso ? (peso * 1).toFixed(0) : "?"} mg SC 12/12h (1 mg/kg)` : `${peso ? (peso * 1).toFixed(0) : "?"} mg SC 1×/dia (1 mg/kg)`;
  }, [clCr, peso, onRRT, mode]);

  const antiXaVal = parseFloat(antiXa) || 0;
  const antiXaStatus = useMemo(() => {
    if (!antiXaVal) return null;
    if (mode === "profilatica") {
      if (antiXaVal < 0.2) return "warning";
      if (antiXaVal <= 0.5) return "normal";
      return "danger";
    }
    if (antiXaVal < 0.5) return "warning";
    if (antiXaVal <= 1.0) return "normal";
    return "danger";
  }, [antiXaVal, mode]);

  // HNF dose calculation
  const hnfBolus80 = peso ? (peso * 80).toFixed(0) : "?";
  const hnfRate18 = peso ? (peso * 18 / 500).toFixed(1) : "?"; // mL/h from 500 UI/mL

  return (
    <div className="space-y-4">
      <SectionDivider title="Exame Físico" />
      <ExamChecklist storageKey="hemato" title="Exame Hematológico" categories={HEMATO_EXAM} />

      <SectionDivider title="Monitorização" />

      {/* Plaquetas e INR */}
      <CollapsibleSection title="Monitorização Laboratorial"
        info={<InfoTooltip interpretation="Plaquetas e INR partilhados com outros separadores (SOFA, Child-Pugh, HAS-BLED)." />}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <CalcField label="Plaquetas" value={plaquetas} onChange={setPlaquetas} unit="×10³/µL" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Normal: 150–400. &lt; 100: trombocitopenia</p>
          </div>
          <div>
            <CalcField label="INR" value={inr} onChange={setInr} unit="" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Normal: 0.9–1.1. Alvo AVK: 2.0–3.0</p>
          </div>
        </div>
        {plaqVal > 0 && plaqVal < 50 && (
          <AlertBanner text={`Plaquetas ${plaqVal} — Trombocitopenia grave. Risco hemorrágico. Avaliar transfusão se < 10 ou < 50 se procedimento.`} level="danger" />
        )}
        {plaqVal >= 50 && plaqVal < 100 && (
          <Interpretation status="warning" text={`Plaquetas ${plaqVal} — Moderada. CI procedimentos invasivos major.`} />
        )}
        {inrVal > 0 && inrVal > 1.5 && (
          <Interpretation status={inrVal > 2.5 ? "danger" : "warning"} text={`INR ${inrVal.toFixed(2)} — ${inrVal > 2.5 ? "Risco hemorrágico. Vit K / CCP?" : "Elevado. Monitorizar."}`} />
        )}
      </CollapsibleSection>

      {/* Enoxaparin */}
      <CollapsibleSection title="Enoxaparina — Ajuste Renal"
        info={<InfoTooltip reference="Ajuste automático ao ClCr" interpretation="ClCr < 30: reduzir. TSFR: preferir HNF." />}>
        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 border border-border mb-3">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">ClCr</span>
            <span className="font-mono text-foreground">{clCr !== null ? `${clCr.toFixed(1)} mL/min` : "—"}</span>
          </div>
          {onRRT && (
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">TSFR</span>
              <span className="font-mono text-primary">Ativa</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={() => setMode("profilatica")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${mode === "profilatica" ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>Profilática</button>
          <button onClick={() => setMode("terapeutica")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${mode === "terapeutica" ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>Terapêutica</button>
        </div>

        {(onRRT || (clCr !== null && clCr < 30)) && <AlertBanner text="⚠️ Ajuste à função renal aplicado." />}
        <CalcResult label="Dose Recomendada" value={enoxDose} unit="" />
        {peso > 100 && <AlertBanner text="Peso > 100 kg — Monitorizar anti-Xa." />}
        {peso > 0 && peso < 50 && <AlertBanner text="Peso < 50 kg — Monitorizar anti-Xa." />}

        <div className="mt-4">
          <div className="flex items-center">
            <label className="calc-label mb-0">Anti-Xa (4h pós-dose)</label>
            <InfoTooltip reference={`Profilático: 0.2–0.5 | Terapêutico: 0.5–1.0 UI/mL`} />
          </div>
          <CalcField label="" value={antiXa} onChange={setAntiXa} unit="UI/mL" />
          {antiXaStatus && (
            <Interpretation
              status={antiXaStatus === "danger" ? "danger" : antiXaStatus === "warning" ? "warning" : "normal"}
              text={
                mode === "profilatica"
                  ? antiXaVal < 0.2 ? `Anti-Xa ${antiXaVal.toFixed(2)} — Subterapêutico.`
                    : antiXaVal <= 0.5 ? `Anti-Xa ${antiXaVal.toFixed(2)} — Profilático adequado (0.2–0.5).`
                    : `Anti-Xa ${antiXaVal.toFixed(2)} — Acima da faixa. Risco hemorrágico.`
                  : antiXaVal < 0.5 ? `Anti-Xa ${antiXaVal.toFixed(2)} — Subterapêutico.`
                    : antiXaVal <= 1.0 ? `Anti-Xa ${antiXaVal.toFixed(2)} — Terapêutico (0.5–1.0).`
                    : `Anti-Xa ${antiXaVal.toFixed(2)} — Supraterapêutico. Suspender.`
              }
            />
          )}
        </div>
      </CollapsibleSection>
      <SectionDivider title="Anticoagulação" />

      {/* ═══ PROTOCOLO HNF aPTT ═══ */}
      <CollapsibleSection title="Protocolo HNF — Ajuste por aPTT"
        info={<InfoTooltip reference="Seringa: 25000 UI / 50 mL (500 UI/mL)" interpretation="Protocolo de titulação de HNF em perfusão contínua baseado no aPTT. Alvo: 46–70 seg (1.5–2.5× controlo). Colher aPTT 6h após cada alteração." />}>
        <div className="bg-muted/30 rounded-lg p-2.5 border border-border mb-3">
          <p className="text-[10px] font-semibold text-foreground mb-1">Início de perfusão (TEV/TEP)</p>
          <p className="text-[10px] font-mono text-primary">Bólus: 80 UI/kg ({hnfBolus80} UI) → {peso ? (parseFloat(hnfBolus80) / 500).toFixed(1) : "?"} mL</p>
          <p className="text-[10px] font-mono text-primary">Perfusão: 18 UI/kg/h → {hnfRate18} mL/h</p>
          <p className="text-[9px] text-muted-foreground mt-1">aPTT 6h após início. Ajustar conforme tabela abaixo.</p>
        </div>

        <CalcField label="aPTT actual" value={aptt} onChange={setAptt} unit="seg" />

        <div className="space-y-1.5 mt-3">
          {HNF_PROTOCOL.map((row) => {
            const apttVal = parseFloat(aptt);
            const isActive = apttVal > 0 && (
              (row.aptt === "< 35" && apttVal < 35) ||
              (row.aptt === "35–45" && apttVal >= 35 && apttVal <= 45) ||
              (row.aptt === "46–70" && apttVal >= 46 && apttVal <= 70) ||
              (row.aptt === "71–90" && apttVal >= 71 && apttVal <= 90) ||
              (row.aptt === "> 90" && apttVal > 90)
            );
            return (
              <div key={row.aptt} className={`rounded-lg border px-3 py-2 transition-all ${
                isActive ? "border-primary/40 bg-primary/10 ring-1 ring-primary/20" : "border-border bg-muted/30"
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono font-semibold text-foreground">aPTT {row.aptt} seg</span>
                  {isActive && <span className="text-[9px] font-semibold text-primary">← ACTUAL</span>}
                </div>
                <p className={`text-[10px] font-mono mt-0.5 ${row.color}`}>{row.action}</p>
                {isActive && peso > 0 && row.aptt !== "46–70" && (
                  <p className="text-[9px] text-muted-foreground mt-1 font-mono">
                    {row.aptt === "< 35" && `Bólus: ${(peso * 80).toFixed(0)} UI (${(peso * 80 / 500).toFixed(1)} mL) | ↑ ${(peso * 4 / 500).toFixed(2)} mL/h`}
                    {row.aptt === "35–45" && `Bólus: ${(peso * 40).toFixed(0)} UI (${(peso * 40 / 500).toFixed(1)} mL) | ↑ ${(peso * 2 / 500).toFixed(2)} mL/h`}
                    {row.aptt === "71–90" && `↓ ${(peso * 2 / 500).toFixed(2)} mL/h`}
                    {row.aptt === "> 90" && `PARAR 1h, depois ↓ ${(peso * 3 / 500).toFixed(2)} mL/h`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* ═══ POSOLOGIA ANTICOAGULANTES ═══ */}
      <CollapsibleSection title="Posologia — Anticoagulantes"
        info={<InfoTooltip interpretation="Doses por indicação clínica. Inclui HNF, DOACs e varfarina." />}>
        <div className="space-y-3">
          {ANTICOAGULANTS.map((drug) => (
            <div key={drug.name} className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-[11px] font-semibold text-foreground mb-2">{drug.name}</p>
              <div className="space-y-1.5">
                {drug.indications.map((ind, i) => (
                  <div key={i} className="bg-muted/40 rounded px-2.5 py-1.5 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground">{ind.indication}</p>
                    <p className="text-[10px] font-mono text-primary mt-0.5">{ind.dose}</p>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-2">📊 {drug.monitoring}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">💊 {drug.notes}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>
      <SectionDivider title="Reversão de Anticoagulação" />

      {/* Antidotes */}
      <CollapsibleSection title="Antídotos — Agentes de Reversão"
        info={<InfoTooltip interpretation="Reversão de anticoagulação em hemorragia ou procedimento urgente." />}>
        <div className="space-y-2">
          {ANTIDOTES.map((a) => (
            <div key={a.agent} className="rounded-lg border border-border bg-muted/30 p-2.5">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-foreground">{a.agent}</span>
                <span className="text-[10px] font-mono text-primary">{a.reversal}</span>
              </div>
              <p className="text-[10px] font-mono text-primary mt-1">{a.dose}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{a.notes}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

    </div>
  );
};

export default HematologicoTab;
