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
import FluidBalance from "../FluidBalance";
import IonReplacementCalc from "../calculators/IonReplacementCalc";

const RENAL_EXAM: { category: string; items: string[] }[] = [
  { category: "Diurese", items: ["Anúria (< 50 mL/24h)", "Oligúria (< 400 mL/24h)", "Poliúria", "Hematúria", "Urina espumosa", "Urina concentrada", "Colúria"] },
  { category: "Edema", items: ["Edema palpebral", "Edema facial", "Edema membros inferiores", "Edema sacro", "Anasarca", "Edema escrotal"] },
  { category: "Sinais Urémicos", items: ["Prurido", "Náuseas/Vómitos", "Asterixis", "Pericardite urémica", "Encefalopatia urémica", "Hálito urémico"] },
  { category: "Abdómen", items: ["Globo vesical", "Dor em flancos", "Murphy renal +", "Nefromegália"] },
  { category: "Acessos TSFR", items: ["Cateter diálise jugular", "Cateter diálise femoral", "FAV funcionante", "Prótese vascular", "Sinais infeção cateter"] },
];

interface RenalDrug {
  name: string;
  normalDose: string;
  adjustments: { clCrRange: string; min: number; max: number; dose: string }[];
  rrtDose: string;
  notes: string;
}

const RENAL_DRUGS: RenalDrug[] = [
  { name: "Enoxaparina (profilática)", normalDose: "40 mg SC 1×/dia",
    adjustments: [{ clCrRange: "≥ 30", min: 30, max: 999, dose: "40 mg SC 1×/dia" }, { clCrRange: "< 30", min: 0, max: 30, dose: "20 mg SC 1×/dia" }],
    rrtDose: "20 mg SC 1×/dia ou HNF", notes: "Monitorizar anti-Xa se IR grave, obesidade ou peso < 50 kg." },
  { name: "Morfina", normalDose: "2–5 mg IV 4/4h",
    adjustments: [{ clCrRange: "≥ 50", min: 50, max: 999, dose: "2–5 mg IV 4/4h" }, { clCrRange: "30–49", min: 30, max: 50, dose: "↓ 25%. 6/6h" }, { clCrRange: "< 30", min: 0, max: 30, dose: "↓ 50%. Evitar — M6G" }],
    rrtDose: "Evitar. Preferir fentanil.", notes: "Acúmulo M6G." },
  { name: "Gabapentina", normalDose: "300–600 mg 8/8h",
    adjustments: [{ clCrRange: "≥ 60", min: 60, max: 999, dose: "300–600 mg 8/8h" }, { clCrRange: "30–59", min: 30, max: 60, dose: "200–300 mg 12/12h" }, { clCrRange: "15–29", min: 15, max: 30, dose: "100–300 mg 1×/dia" }, { clCrRange: "< 15", min: 0, max: 15, dose: "100–300 mg dias alternados" }],
    rrtDose: "200–300 mg pós-HD", notes: "Excreção renal exclusiva." },
  { name: "Pregabalina", normalDose: "75–150 mg 12/12h",
    adjustments: [{ clCrRange: "≥ 60", min: 60, max: 999, dose: "75–150 mg 12/12h" }, { clCrRange: "30–59", min: 30, max: 60, dose: "75 mg 12/12h" }, { clCrRange: "15–29", min: 15, max: 30, dose: "25–75 mg 1×/dia" }, { clCrRange: "< 15", min: 0, max: 15, dose: "25–75 mg dias alternados" }],
    rrtDose: "25–75 mg pós-HD", notes: "Excreção renal." },
  { name: "Levetiracetam", normalDose: "500–1500 mg 12/12h",
    adjustments: [{ clCrRange: "≥ 80", min: 80, max: 999, dose: "500–1500 mg 12/12h" }, { clCrRange: "50–79", min: 50, max: 80, dose: "500–1000 mg 12/12h" }, { clCrRange: "30–49", min: 30, max: 50, dose: "250–750 mg 12/12h" }, { clCrRange: "< 30", min: 0, max: 30, dose: "250–500 mg 12/12h" }],
    rrtDose: "500–1000 mg pós-HD", notes: "Seguro." },
  { name: "Metformina", normalDose: "500–1000 mg 12/12h",
    adjustments: [{ clCrRange: "≥ 45", min: 45, max: 999, dose: "Dose habitual" }, { clCrRange: "30–44", min: 30, max: 45, dose: "↓ 50%" }, { clCrRange: "< 30", min: 0, max: 30, dose: "CONTRAINDICADA" }],
    rrtDose: "CONTRAINDICADA", notes: "Risco de acidose láctica." },
];

const RenalTab = () => {
  const {
    pesoAtual, creatinina, setCreatinina, creatininaBasal, setCreatininaBasal,
    clCr, clCrStage, akiStage, onRRT, setOnRRT, rrtType, setRrtType, pesoReferencia,
  } = usePatient();
  const peso = parseFloat(pesoAtual) || 0;

  const [urine24h, setUrine24h] = usePersistedState("renal-urine24h", "");
  const [qb, setQb] = usePersistedState("renal-qb", "");
  const [qd, setQd] = usePersistedState("renal-qd", "");
  const [qpre, setQpre] = usePersistedState("renal-qpre", "");
  const [qpost, setQpost] = usePersistedState("renal-qpost", "");
  const [uf, setUf] = usePersistedState("renal-uf", "");
  const [caSys, setCaSys] = usePersistedState("renal-caSys", "");
  const [caPost, setCaPost] = usePersistedState("renal-caPost", "");
  const [caTotal, setCaTotal] = usePersistedState("renal-caTotal", "");
  const [caIonized, setCaIonized] = usePersistedState("renal-caIon", "");
  const [tmp, setTmp] = usePersistedState("renal-tmp", "");

  const [urineHours, setUrineHours] = usePersistedState("renal-urine-hours", "24");

  const urinePerHour = useMemo(() => { 
    const u = parseFloat(urine24h); 
    const h = parseFloat(urineHours) || 24;
    return u ? u / h : null; 
  }, [urine24h, urineHours]);
  const urinePerKgH = useMemo(() => urinePerHour && peso ? urinePerHour / peso : null, [urinePerHour, peso]);

  const kdigo = useMemo(() => {
    if (!urinePerKgH) return null;
    if (urinePerKgH < 0.3) return { stage: "KDIGO 3", text: "Oligúria grave (<0.3). Considerar TSFR." };
    if (urinePerKgH < 0.5) return { stage: "KDIGO 2", text: "Oligúria (<0.5). Avaliar volemia." };
    return { stage: "Normal", text: "DU ≥ 0.5 mL/kg/h." };
  }, [urinePerKgH]);

  const effluentDose = useMemo(() => {
    const total = (parseFloat(qd) || 0) + (parseFloat(qpre) || 0) + (parseFloat(qpost) || 0) + (parseFloat(uf) || 0);
    return total && peso ? total / peso : null;
  }, [qd, qpre, qpost, uf, peso]);

  const caRatio = useMemo(() => {
    const t = parseFloat(caTotal); const i = parseFloat(caIonized);
    return t && i ? t / i : null;
  }, [caTotal, caIonized]);

  const getDrugDose = (drug: RenalDrug): string => {
    if (onRRT) return drug.rrtDose;
    if (clCr === null) return drug.normalDose;
    const adj = drug.adjustments.find(a => clCr >= a.min && clCr < a.max);
    return adj?.dose ?? drug.normalDose;
  };

  return (
    <div className="space-y-4">
      <SectionDivider title="Exame Físico" />
      <ExamChecklist storageKey="renal" title="Exame Renal / Urinário" categories={RENAL_EXAM} />

      <SectionDivider title="Função Renal" />

      {/* Creatinina & Função Renal */}
      <CollapsibleSection title="Função Renal"
        badge={clCr !== null ? `ClCr ${clCr.toFixed(0)}` : undefined}
        info={<InfoTooltip formula="ClCr = ((140−Idade)×Peso) / (72×Cr)" reference="Cockcroft-Gault" />}>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <CalcField label="Creatinina Atual" value={creatinina} onChange={(e) => setCreatinina(e.target.value)} unit="mg/dL" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Valor mais recente</p>
          </div>
          <div>
            <CalcField label="Creatinina Basal" value={creatininaBasal} onChange={(e) => setCreatininaBasal(e.target.value)} unit="mg/dL" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Valor pré-admissão / habitual</p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 border border-border mb-3">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">ClCr (Cockcroft-Gault)</span>
            <span className={`font-mono font-medium ${clCr !== null && clCr < 30 ? "text-destructive" : clCr !== null && clCr < 60 ? "text-warning" : "text-foreground"}`}>
              {clCr !== null ? `${clCr.toFixed(1)} mL/min` : "—"}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Estágio DRC</span>
            <span className="font-mono text-foreground">{clCrStage ?? "—"}</span>
          </div>
        </div>

        {akiStage && (
          <Interpretation
            status={akiStage.includes("AKIN 3") ? "danger" : akiStage.includes("AKIN") && !akiStage.includes("Sem") ? "warning" : "normal"}
            text={akiStage}
          />
        )}

        {clCr !== null && clCr < 30 && !onRRT && (
          <AlertBanner text={`ClCr ${clCr.toFixed(1)} — DRC G4-G5. Ajuste rigoroso de fármacos.`} level="danger" />
        )}
      </CollapsibleSection>

      {/* TSFR */}
      <CollapsibleSection title="TSFR — Substituição da Função Renal"
        info={<InfoTooltip interpretation="Configuração e monitorização de técnica contínua ou intermitente." />}>
        
        <div className="bg-muted/30 rounded-lg p-2.5 border border-border text-[10px] text-muted-foreground mb-4 mt-1">
          <p className="font-semibold text-primary mb-1">Critérios de Início (Urgentização - AEIOU):</p>
          <ul className="list-disc pl-3 mb-2 space-y-0.5">
            <li><strong>A</strong>cidemia: pH {`<`} 7.1 refratária.</li>
            <li><strong>E</strong>letrólitos: Potássio {`>`} 6.5 mEq/L ou com alt. ECG.</li>
            <li><strong>I</strong>ntoxicação: Lítio, metanol, etilenoglicol, salicilatos.</li>
            <li><strong>O</strong>verload (Sobrecarga hídrica): Edema pulmonar refratário a diuréticos.</li>
            <li><strong>U</strong>remia: Encefalopatia, pericardite ou hemorragia urémica.</li>
          </ul>
          <p className="font-semibold text-primary mb-1 border-t border-border/50 pt-2">Critérios de Desmame / Período de 'Wash-out':</p>
          <ul className="list-disc pl-3 space-y-0.5">
            <li>Retoma da diurese: Spontânea {`>`} 400 mL/dia ou {`>`} 1000 mL/dia com diuréticos.</li>
            <li>Melhoria do clearance espontâneo de creatinina (ClCr {`>`} 15-20 mL/min).</li>
            <li>Estabilidade hídrica, sem hipercalemia rebote nos testes de pausa térmica/dialítica (off-RRT test).</li>
          </ul>
        </div>
        
        <div className="flex items-center justify-end mb-3">
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={onRRT} onChange={(e) => setOnRRT(e.target.checked)} className="accent-primary" />
            TSFR Ativa
          </label>
        </div>

        {onRRT && (
          <>
            <select value={rrtType} onChange={(e) => setRrtType(e.target.value)} className="calc-input py-1 text-[11px] mb-3 w-auto">
              <option value="CVVHDF">CVVHDF</option><option value="CVVHD">CVVHD</option>
              <option value="CVVH">CVVH</option><option value="HD_intermitente">HD Intermitente</option>
              <option value="SLED">SLED</option>
            </select>

            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-[10px] text-muted-foreground font-semibold">Dose de Efluente</p>
                <InfoTooltip formula="(Qd + Qpre + Qpost + UF) / Peso" reference="Alvo: 20–25 mL/kg/h" />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <CalcField label="Qb" value={qb} onChange={(e) => setQb(e.target.value)} unit="mL/h" />
                <CalcField label="Qd" value={qd} onChange={(e) => setQd(e.target.value)} unit="mL/h" />
                <CalcField label="Qpre" value={qpre} onChange={(e) => setQpre(e.target.value)} unit="mL/h" />
                <CalcField label="Qpost" value={qpost} onChange={(e) => setQpost(e.target.value)} unit="mL/h" />
                <CalcField label="UF" value={uf} onChange={(e) => setUf(e.target.value)} unit="mL/h" />
              </div>
              {effluentDose !== null && (
                <>
                  <CalcResult label="Dose Efluente" value={effluentDose.toFixed(1)} unit="mL/kg/h"
                    status={effluentDose >= 20 && effluentDose <= 25 ? "normal" : "warning"} />
                  {effluentDose >= 20 && effluentDose <= 25 && <Interpretation status="normal" text={`${effluentDose.toFixed(1)} mL/kg/h — Alvo adequado.`} />}
                  {effluentDose < 20 && <AlertBanner text={`${effluentDose.toFixed(1)} — Abaixo do alvo (< 20).`} level="warning" />}
                  {effluentDose > 25 && <AlertBanner text={`${effluentDose.toFixed(1)} — Acima do alvo. Sem benefício.`} />}
                </>
              )}
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-muted-foreground font-semibold mb-2">Citrato</p>
              <div className="grid grid-cols-2 gap-2">
                <CalcField label="Ca²⁺ sistémico" value={caSys} onChange={(e) => setCaSys(e.target.value)} unit="mmol/L" />
                <CalcField label="Ca²⁺ pós-filtro" value={caPost} onChange={(e) => setCaPost(e.target.value)} unit="mmol/L" />
                <CalcField label="Ca total" value={caTotal} onChange={(e) => setCaTotal(e.target.value)} unit="mg/dL" />
                <CalcField label="Ca ionizado" value={caIonized} onChange={(e) => setCaIonized(e.target.value)} unit="mmol/L" />
              </div>
              {caPost && parseFloat(caPost) > 0.35 && <AlertBanner text={`Ca²⁺ pós-filtro ${caPost} (> 0.35) — ↑ citrato.`} level="warning" />}
              {caRatio !== null && caRatio > 2.5 && <AlertBanner text={`Rácio Ca total/ionizado = ${caRatio.toFixed(2)} (> 2.5) — TOXICIDADE citrato!`} level="danger" />}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <CalcField label="TMP" value={tmp} onChange={(e) => setTmp(e.target.value)} unit="mmHg" />
                {tmp && parseFloat(tmp) > 200 && <AlertBanner text={`TMP ${tmp} (> 200) — Coagulação do filtro.`} level="danger" />}
              </div>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Débito Urinário */}
      <CollapsibleSection title="Débito Urinário"
        info={<InfoTooltip formula="DU = Volume / Horas / Peso" reference="≥ 0.5 mL/kg/h" />}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <CalcField label="Volume Diurese" value={urine24h} onChange={(e) => setUrine24h(e.target.value)} unit="mL" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Volume recolhido</p>
          </div>
          <div>
            <CalcField label="Horas colheita" value={urineHours} onChange={(e) => setUrineHours(e.target.value)} unit="h" />
            <p className="text-[8px] text-muted-foreground mt-0.5">Duração (ex: 8h, 24h)</p>
          </div>
        </div>
        {urinePerHour !== null && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <CalcResult label="mL/h" value={urinePerHour.toFixed(1)} unit="mL/h" />
            <CalcResult label="mL/kg/h" value={urinePerKgH?.toFixed(2) ?? null} unit="mL/kg/h"
              status={urinePerKgH ? (urinePerKgH < 0.3 ? "danger" : urinePerKgH < 0.5 ? "warning" : "normal") : undefined} />
          </div>
        )}
        {kdigo && <Interpretation status={urinePerKgH! < 0.3 ? "danger" : urinePerKgH! < 0.5 ? "warning" : "normal"} text={`${kdigo.stage} — ${kdigo.text}`} />}
      </CollapsibleSection>
      <SectionDivider title="Terapêutica e Equilíbrio Hidroeletrolítico" />
      
      <IonReplacementCalc />

      {/* Drug adjustments */}
      <CollapsibleSection title="Ajuste de Fármacos à Função Renal"
        info={<InfoTooltip interpretation="Excluindo antibióticos (ver Infeção). Ajuste automático ao ClCr." />}>
        <div className="space-y-1.5">
          {RENAL_DRUGS.map((drug) => {
            const dose = getDrugDose(drug);
            const isAdjusted = dose !== drug.normalDose;
            return (
              <div key={drug.name} className={`rounded-lg border px-3 py-2 ${isAdjusted ? "border-warning/25 bg-warning/5" : "border-border bg-muted/30"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-foreground">{drug.name}</span>
                  <span className={`text-[10px] font-mono ${isAdjusted ? "text-warning" : "text-primary"}`}>
                    {isAdjusted ? "⚠️ AJUSTADO" : "✓"}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-primary mt-0.5">{dose}</p>
                <p className="text-[9px] text-muted-foreground">{drug.notes}</p>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      <SectionDivider title="Balanço Hídrico" />
      <FluidBalance />

    </div>
  );
};

export default RenalTab;
